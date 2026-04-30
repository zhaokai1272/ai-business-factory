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
    this.laneYs = laneYs;       // 三条跑道Y坐标数组
    this.lane = initialLane;    // 当前跑道索引
    this.laneCount = laneYs.length;
    this.laneHeight = laneYs[1] - laneYs[0]; // 跑道间距
    
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
    return this.laneYs[laneIndex];
  }

  /** 切换到指定跑道 */
  switchLane(targetLane) {
    if (targetLane < 0 || targetLane >= this.laneCount) return;
    if (targetLane === this.lane && !this.switching) return;

    this.switching = true;
    this.switchFromY = this.y;
    this.switchToY = this.laneYs[targetLane];
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

    // 跑道切换动画
    if (this.switching) {
      this.switchTimer += dtMs;
      const progress = Math.min(this.switchTimer / this.switchDuration, 1);
      this.y = this.switchFromY + (this.switchToY - this.switchFromY) * progress;
      if (progress >= 1) {
        this.switching = false;
        this.y = this.switchToY;
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
      // 残影用半透明简化绘制
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(ox - w * 0.3, oy - h * 0.1, w * 0.6, h * 0.5);
      ctx.fillStyle = '#f5d6a0';
      ctx.beginPath(); ctx.arc(ox, oy - h * 0.35, w * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    // 尝试使用真实图片
    const imgMgr = (typeof this.game !== 'undefined' && this.game.imageManager) ? this.game.imageManager : null;
    let imgName = '05_player_run1.png'; // default
    if (this.animFrame === 0) imgName = '05_player_run1.png';
    else if (this.animFrame === 1) imgName = '06_player_run2.png';
    else if (this.animFrame === 2) imgName = '07_player_run3.png';
    else imgName = '05_player_run1.png';

    const img = imgMgr ? imgMgr.get(imgName) : null;
    
    if (img && img.complete && img.width > 0) {
      // 用真实图片绘制
      const iw = w * 1.8, ih = h * 1.8;
      ctx.drawImage(img, ox - iw/2, oy - ih/2 + 5, iw, ih);
    } else {
      // 回退：Canvas绘制
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(ox - w * 0.3, oy - h * 0.1, w * 0.6, h * 0.5);
      ctx.fillStyle = '#f5d6a0';
      ctx.beginPath(); ctx.arc(ox, oy - h * 0.35, w * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(ox, oy - h * 0.15); ctx.lineTo(ox - w * 0.1, oy + h * 0.2);
      ctx.lineTo(ox + w * 0.1, oy + h * 0.2); ctx.closePath(); ctx.fill();
      const legOff = Math.sin((this.animFrame * Math.PI) / 2) * h * 0.15;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(ox - w * 0.15, oy + h * 0.35, w * 0.12, h * 0.25 + legOff);
      ctx.fillRect(ox + w * 0.03, oy + h * 0.35, w * 0.12, h * 0.25 - legOff);
    }

    // 无敌护盾
    if (this.invincible) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ox, oy, w * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  reset() {
    this.lane = 1;
    this.y = this.laneYs[1];
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
