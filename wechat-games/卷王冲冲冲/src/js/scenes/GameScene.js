/**
 * GameScene.js — 竖版向上跑酷
 * 3列跑道，障碍从上方来，玩家在底部躲闪
 */
const Player = require('../entities/Player.js');
const Spawner = require('../systems/Spawner.js');

class GameScene {
  constructor(game) {
    this.game = game;
    this.player = null;
    this.spawner = null;
    this.obstacles = [];
    this.powerUps = [];
    this.score = 0;
    this.distance = 0;
    this.speed = 150;           // 初始速度 px/s
    this.maxSpeed = 400;        // 最大速度
    this.combo = 0;
    this.lives = 3;
    this.state = 'playing';
        this._backBtn = { x: 8, y: 6, w: 56, h: 30 };
    this._flashTimer = 0;       // 受击闪屏
  }

  enter(params = {}) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    // 3列跑道 x 坐标
    const colW = w / 3;
    const x0 = colW * 0.5;
    const x1 = colW * 1.5;
    const x2 = colW * 2.5;

    this.player = new Player(x1, h * 0.75, [x0, x1, x2], 1);
    this.player.game = this.game;
    this.spawner = new Spawner(w, h, this.game.imageManager);
    this.obstacles = [];
    this.powerUps = [];
    this.score = 0;
    this.distance = 0;
    this.speed = 200;
    this.combo = 0;
    this.lives = this.game.gameData.lives || 3;
    this.state = 'playing';
      }

  update(dt) {
    if (this.state !== 'playing') return;

    // 速度递增 (每秒+5，上限600)
    this.speed = Math.min(this.maxSpeed, this.speed + dt * 3);
    this.distance += this.speed * dt;

    // 背景滚动（向下 = 画面向上）
    // 背景静态不滚动

    // 玩家更新
    this.player.update(dt);

    // 障碍&道具生成
    const spawned = this.spawner.update(dt, this.speed);
    if (spawned.obstacles) this.obstacles.push(...spawned.obstacles);
    if (spawned.powerUps) this.powerUps.push(...spawned.powerUps);

    // 障碍物移动（从上到下）+ 碰撞
    this.obstacles = this.obstacles.filter(o => {
      o.y += this.speed * dt;
      if (o.y > this.game.canvasHeight + o.height) {
        this.combo = 0; // 未碰撞通过不加连击，但错过重置
        return false;
      }
      if (!this.player.invincible && this._checkCollision(o)) {
        this._onHit();
      }
      return true;
    });

    // 道具移动+收集
    this.powerUps = this.powerUps.filter(p => {
      p.y += this.speed * dt;
      if (p.y > this.game.canvasHeight + p.height) return false;
      if (this._checkCollision(p)) {
        this._onCollect(p);
        return false;
      }
      return true;
    });

    // 分数
    this.score = Math.floor(this.distance / 10);

    // 受击闪屏衰减
    if (this._flashTimer > 0) this._flashTimer -= dt;
  }

  render(ctx) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    this._drawBackground(ctx);
    this.obstacles.forEach(o => o.render(ctx));
    this.powerUps.forEach(p => p.render(ctx));
    this.player.render(ctx);
    this._drawHUD(ctx);
    if (this.state === 'over') this._drawGameOver(ctx);
    if (this._flashTimer > 0) {
      ctx.fillStyle = `rgba(255,0,0,${this._flashTimer * 2})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /** 静态背景 (根据速度切换场景) */
  _drawBackground(ctx) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    const IMG = this.game.imageManager;
    // 根据速度切换背景: <200=办公室, <300=地铁, <400=大厅, >=400=天台
    let bgKey = '21_bg_office_day.png';
    if (this.speed > 350) bgKey = '25_bg_desk.png';
    else if (this.speed > 250) bgKey = '23_bg_subway.png';
    else if (this.speed > 180) bgKey = '22_bg_office_night.png';
    const bgImg = IMG ? IMG.get(bgKey) : null;

    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      // 纯色回退
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(0.5, '#764ba2');
      grad.addColorStop(1, '#667eea');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 跑道列分隔线
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([15, 25]);
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) {
      const x = (w / 3) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  _drawHUD(ctx) {
    const w = this.game.canvasWidth;
    const IMG = this.game.imageManager;

    // 顶部面板背景
    const panel = IMG ? IMG.get('34_panel_top.png') : null;
    if (panel) {
      ctx.drawImage(panel, 0, 0, w, 56);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, 56);
    }

    // 返回按钮
    const bb = this._backBtn;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this._drawRoundRect(ctx, bb.x, bb.y, bb.w, bb.h, 6);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('← 返回', bb.x+bb.w/2, bb.y+bb.h/2+4);

    // 金币图标+数值
    const coinIcon = IMG ? IMG.get('26_ui_coin.png') : null;
    if (coinIcon) ctx.drawImage(coinIcon, w*0.25, 2, 24, 24);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${this.game.gameData.coins||0}`, w*0.25+28, 20);

    // 能量图标
    const energyIcon = IMG ? IMG.get('27_ui_energy.png') : null;
    if (energyIcon) ctx.drawImage(energyIcon, w*0.52, 2, 24, 24);
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${Math.floor(this.speed)}`, w*0.52+28, 20);

    // 分数
    ctx.fillStyle = '#FFF'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${this.score}`, w/2, 44);

    // 生命
    ctx.textAlign = 'left'; ctx.font = '13px sans-serif'; ctx.fillStyle = '#FFF';
    ctx.fillText(`❤️x${this.lives} 连击:${this.combo}`, 10, 75);
  }

  _drawGameOver(ctx) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏢 被优化了!', w/2, h/2 - 30);
    ctx.font = '18px sans-serif';
    ctx.fillText(`得分: ${this.score}`, w/2, h/2 + 15);
  }

  _checkCollision(obj) {
    const p = this.player.getHitbox();
    const margin = 12; // 宽容碰撞边距
    const ox = obj.x - obj.width/2 + margin;
    const oy = obj.y - obj.height/2 + margin;
    const ow = obj.width - margin*2;
    const oh = obj.height - margin*2;
    return p.x < ox + ow && p.x + p.width > ox &&
           p.y < oy + oh && p.y + p.height > oy;
  }

  _onHit() {
    this.lives--;
    this.combo = 0;
    this._flashTimer = 0.15;
    if (this.lives <= 0) {
      this.state = 'over';
      this.game.gameData.score = this.score;
      this.game.gameData.maxSpeed = Math.floor(this.speed);
      setTimeout(() => this.game.switchScene('result', { score: this.score }), 1500);
    } else {
      this.player.becomeInvincible(1.5);
    }
  }

  _onCollect(powerUp) {
    this.combo++;
    switch (powerUp.type.type) {
      case 'coffee': this.speed = Math.min(this.maxSpeed, this.speed + 30); break;
      case 'fish': this.score += 50 * this.combo; break;
      case 'salary': this.game.gameData.coins += 10; break;
    }
  }

  _drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    ctx.fill();
  }

  handleTouch(e) {
    if (this.state === 'over') return;
    if (e.type !== 'touchstart') return;
    const tx = e.touches[0].clientX, ty = e.touches[0].clientY;

    // 返回按钮
    const bb = this._backBtn;
    if (tx >= bb.x && tx <= bb.x+bb.w && ty >= bb.y && ty <= bb.y+bb.h) {
      this.game.switchScene('menu'); return;
    }

    // 3列：点左1/3→左列，中1/3→中列，右1/3→右列
    const colW = this.game.canvasWidth / 3;
    const lane = Math.min(2, Math.floor(tx / colW));
    if (this.player.switchLane) this.player.switchLane(lane);
  }
}

module.exports = GameScene;
