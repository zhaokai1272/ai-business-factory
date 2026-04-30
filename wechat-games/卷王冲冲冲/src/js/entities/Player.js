/**
 * 玩家类 - 打工人角色
 * 在3条跑道间切换，拥有碰撞体和无敌状态
 * 
 * 构造函数: Player(x, y, laneYs, initialLane)
 *   - x: 初始X坐标
 *   - y: 初始Y坐标  
 *   - laneYs: [y0, y1, y2] 三条跑道Y坐标
 *   - initialLane: 初始跑道索引
 */

class Player {
  constructor(x, y, laneYs, initialLane) {
    // 位置
    this.x = x;
    this.y = y;
    this.game = null; // set by GameScene
    
    // 跑道系统
    this.laneXs = laneYs;       // 三条跑道X坐标数组(兼容旧名)
    this.lane = initialLane;    // 当前跑道索引
    this.laneCount = laneYs.length;
    this.laneWidth = laneYs[1] - laneYs[0]; // 跑道间距
    
    // 玩家尺寸
    this.width = 50;
    this.height = 60;

    // 碰撞体
    this.hitbox = {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };

    // 无敌状态
    this.invincible = false;
    this.invincibleTimer = 0;       // ms
    this.invincibleBlinkInterval = 100;
    this.invincibleBlinkTimer = 0;
    this.visible = true;

    // 跑道切换动画
    this.switching = false;
    this.switchFromY = 0;
    this.switchToY = 0;
    this.switchDuration = 200;      // ms
    this.switchTimer = 0;

    // 视觉效果
    this.scale = 1;
    this.alpha = 1;
    this.trail = [];
    this.trailMax = 5;
    this.animFrame = 0;
    this.animTimer = 0;
    this.animInterval = 150;
  }

  /** 获取碰撞体（供 GameScene 碰撞检测调用） */
  getHitbox() {
    this.hitbox.x = this.x - this.width / 2;
    this.hitbox.y = this.y - this.height / 2;
    return this.hitbox;
  }

  /** 获取指定跑道索引的Y坐标 */
  getLaneY(laneIndex) {
    return this.laneXs[laneIndex];
  }

  /** 切换到指定跑道 */
  switchLane(targetLane) {
    if (targetLane < 0 || targetLane >= this.laneCount) return;
    if (targetLane === this.lane && !this.switching) return;

    this.switching = true;
    this.switchFromX = this.x;
    this.switchToX = this.laneXs[targetLane];
    this.switchTimer = 0;
    this.lane = targetLane;
  }

  /** 激活无敌状态（GameScene 调用） */
  becomeInvincible(seconds) {
    this.invincible = true;
    this.invincibleTimer = seconds * 1000;
    this.invincibleBlinkTimer = 0;
    this.visible = true;
  }

  /** 玩家受到伤害 */
  takeDamage() {
    if (this.invincible) return false;
    this.scale = 0.8;
    this.becomeInvincible(1.5);
    return true;
  }

  /** 每帧更新 (dt: 秒) */
  update(dt) {
    const dtMs = dt * 1000; // 转为毫秒

    // 跑道切换动画(水平)
    if (this.switching) {
      this.switchTimer += dtMs;
      const progress = Math.min(this.switchTimer / this.switchDuration, 1);
      // easeInOut
      const t = progress < 0.5 ? 2*progress*progress : -1+(4-2*progress)*progress;
      this.x = this.switchFromX + (this.switchToX - this.switchFromX) * t;
      if (progress >= 1) {
        this.switching = false;
        this.x = this.switchToX;
      }
    }

    // 无敌状态
    if (this.invincible) {
      this.invincibleTimer -= dtMs;
      this.invincibleBlinkTimer += dtMs;
      if (this.invincibleBlinkTimer >= this.invincibleBlinkInterval) {
        this.invincibleBlinkTimer -= this.invincibleBlinkInterval;
        this.visible = !this.visible;
      }
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.visible = true;
        this.scale = 1;
      }
    }

    // 缩放恢复
    if (this.scale < 1 && !this.invincible) {
      this.scale += dt * 2;
      if (this.scale > 1) this.scale = 1;
    }

    // 动画帧
    this.animTimer += dtMs;
    if (this.animTimer >= this.animInterval) {
      this.animTimer -= this.animInterval;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // 更新碰撞体
    this.hitbox.x = this.x - this.width / 2;
    this.hitbox.y = this.y - this.height / 2;

    // 残影
    if (this.trail.length > 0 || this.animFrame % 2 === 0) {
      this.trail.push({ x: this.x, y: this.y, alpha: 0.4, life: 200 });
      while (this.trail.length > this.trailMax) this.trail.shift();
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dtMs;
      this.trail[i].x -= 2 * dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
  }

  render(ctx) {
    if (!this.visible && this.invincible) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    // 残影
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      ctx.save();
      ctx.globalAlpha = (t.life / 200) * 0.3;
      this._drawBody(ctx, t.x - this.x, t.y - this.y, true);
      ctx.restore();
    }

    this._drawBody(ctx, 0, 0, false);
    ctx.restore();
  }

  _drawBody(ctx, ox, oy, isTrail) {
    const w = this.width, h = this.height;
    if (isTrail) {
      ctx.globalAlpha = 0.25;
      this._drawCharacter(ctx, ox, oy, w, h, true);
      ctx.globalAlpha = 1;
      return;
    }
    this._drawCharacter(ctx, ox, oy, w, h, false);

    // 无敌护盾
    if (this.invincible) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ox, oy, w * 0.8, 0, Math.PI * 2); ctx.stroke();
    }
  }

  /** 角色绘制(图片优先) */
  _drawCharacter(ctx, cx, cy, w, h, isGhost) {
    if (isGhost) { ctx.globalAlpha = 0.25; this._drawCanvasChar(ctx,cx,cy,w,h); ctx.globalAlpha = 1; return; }

    // 尝试图片
    const IMG = this.game ? this.game.imageManager : null;
    let imgKey = '05_player_run1.png';
    if (this.switching) imgKey = '08_player_jump.png';
    else if (this.invincible && Math.floor(Date.now()/200)%2) imgKey = '10_player_death.png';
    else if (this.animFrame === 0) imgKey = '05_player_run1.png';
    else if (this.animFrame === 1) imgKey = '06_player_run2.png';
    else imgKey = '07_player_run3.png';

    const img = IMG ? IMG.get(imgKey) : null;
    if (img) {
      ctx.drawImage(img, cx-w*0.9, cy-h*0.85, w*1.8, h*1.8);
    } else {
      this._drawCanvasChar(ctx, cx, cy, w, h);
    }
  }

  /** Canvas回退绘制 */
  _drawCanvasChar(ctx, cx, cy, w, h) {
    ctx.save();
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(cx, cy + h*0.45, w*0.35, h*0.08, 0, 0, Math.PI*2); ctx.fill();

    // 身体(西装+衬衫)
    const bodyGrad = ctx.createLinearGradient(cx, cy-h*0.2, cx, cy+h*0.3);
    bodyGrad.addColorStop(0, '#34495e'); bodyGrad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx-w*0.25, cy-h*0.05); ctx.lineTo(cx-w*0.35, cy+h*0.3);
    ctx.quadraticCurveTo(cx-w*0.35, cy+h*0.4, cx-w*0.1, cy+h*0.4);
    ctx.lineTo(cx+w*0.1, cy+h*0.4);
    ctx.quadraticCurveTo(cx+w*0.35, cy+h*0.4, cx+w*0.35, cy+h*0.3);
    ctx.lineTo(cx+w*0.25, cy-h*0.05);
    ctx.quadraticCurveTo(cx, cy-h*0.5, cx-w*0.25, cy-h*0.05);
    ctx.fill();
    ctx.strokeStyle = '#1a252f'; ctx.lineWidth = 1.5; ctx.stroke();

    // 领带
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(cx, cy-h*0.12); ctx.lineTo(cx-w*0.08, cy+h*0.15);
    ctx.lineTo(cx-w*0.02, cy+h*0.22); ctx.lineTo(cx+w*0.02, cy+h*0.22);
    ctx.lineTo(cx+w*0.08, cy+h*0.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.moveTo(cx, cy-h*0.12); ctx.lineTo(cx-w*0.04, cy+h*0.08);
    ctx.lineTo(cx+w*0.04, cy+h*0.08); ctx.closePath(); ctx.fill();

    // 头
    ctx.fillStyle = '#f5d6a0';
    ctx.beginPath(); ctx.arc(cx, cy-h*0.3, w*0.22, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 1; ctx.stroke();

    // 头发
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath(); ctx.arc(cx, cy-h*0.38, w*0.23, Math.PI, 0); ctx.fill();

    // 黑框眼镜
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx-w*0.08, cy-h*0.32, w*0.06, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx+w*0.08, cy-h*0.32, w*0.06, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-w*0.02, cy-h*0.32); ctx.lineTo(cx+w*0.02, cy-h*0.32); ctx.stroke();

    // 嘴
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy-h*0.22, w*0.06, 0.2*Math.PI, 0.8*Math.PI); ctx.stroke();

    // 腿+动画
    const legOff = Math.sin((this.animFrame*Math.PI)/2) * h*0.12;
    ctx.fillStyle = '#1a1a2e';
    // 左腿
    ctx.beginPath();
    ctx.moveTo(cx-w*0.1, cy+h*0.3); ctx.lineTo(cx-w*0.15, cy+h*0.52+legOff);
    ctx.lineTo(cx-w*0.02, cy+h*0.52+legOff); ctx.lineTo(cx+w*0.02, cy+h*0.3);
    ctx.closePath(); ctx.fill();
    // 右腿
    ctx.beginPath();
    ctx.moveTo(cx+w*0.02, cy+h*0.3); ctx.lineTo(cx+w*0.15, cy+h*0.52-legOff);
    ctx.lineTo(cx+w*0.22, cy+h*0.52-legOff); ctx.lineTo(cx+w*0.1, cy+h*0.3);
    ctx.closePath(); ctx.fill();

    // 鞋
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx-w*0.18, cy+h*0.48+legOff, w*0.2, h*0.08);
    ctx.fillRect(cx+w*0.1, cy+h*0.48-legOff, w*0.16, h*0.08);

    // 公文包
    ctx.fillStyle = '#795548';
    ctx.fillRect(cx+w*0.2, cy+h*0.05, w*0.18, h*0.2);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(cx+w*0.2, cy+h*0.05, w*0.18, h*0.04);

    // 黑眼圈(加班人特征)
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(cx-w*0.08,cy-h*0.34,w*0.05,h*0.03,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+w*0.08,cy-h*0.34,w*0.05,h*0.03,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  reset() {
    this.lane = 1;
    this.x = this.laneXs[1];
    this.switching = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.scale = 1;
    this.alpha = 1;
    this.trail = [];
    this.animFrame = 0;
    this.animTimer = 0;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}
