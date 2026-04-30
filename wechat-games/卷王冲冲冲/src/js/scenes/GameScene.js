/**
 * GameScene.js — 卷王冲冲冲 核心游戏场景
 * 3跑道跑酷：玩家躲避障碍，收集道具
 */

const Player = require('../entities/Player.js');
const Spawner = require('../systems/Spawner.js');
const { easeOutQuad } = require('../utils/animation.js');

class GameScene {
  constructor(game) {
    this.game = game;
    this.player = null;
    this.spawner = null;
    this.obstacles = [];
    this.powerUps = [];
    this.score = 0;
    this.distance = 0;
    this.speed = 5;
    this.combo = 0;
    this.lives = 3;
    this.state = 'playing'; // playing | paused | over
    this.bgOffset = 0;
    this.bgOffset2 = 0;
    this.bgOffset3 = 0;
  }

  enter(params = {}) {
    this.game.gameData.lives = 3;
    const laneHeight = this.game.canvasHeight / 3;
    const y0 = laneHeight * 0.5;
    const y1 = laneHeight * 1.5;
    const y2 = laneHeight * 2.5;
    this.player = new Player(this.game.canvasWidth * 0.15, y1, [y0, y1, y2], 1);
    this.spawner = new Spawner(this.game.canvasWidth, this.game.canvasHeight);
    this.obstacles = [];
    this.powerUps = [];
    this.score = 0;
    this.distance = 0;
    this.speed = 5;
    this.combo = 0;
    this.lives = 3;
    this.state = 'playing';
    this.bgOffset = this.bgOffset2 = this.bgOffset3 = 0;
  }

  update(dt) {
    if (this.state !== 'playing') return;

    // 速度递增 (~1.2/s, 从5增至约77在60秒)
    this.speed += dt * 1.2;
    this.distance += this.speed * 60 * dt;

    // 视差滚动背景 (60* converts speed to px/s for dt in seconds)
    this.bgOffset = (this.bgOffset + this.speed * 18 * dt) % this.game.canvasWidth;
    this.bgOffset2 = (this.bgOffset2 + this.speed * 36 * dt) % this.game.canvasWidth;
    this.bgOffset3 = (this.bgOffset3 + this.speed * 60 * dt) % this.game.canvasWidth;

    // 玩家更新
    this.player.update(dt);

    // 生成器
    const spawned = this.spawner.update(dt, this.speed);
    if (spawned.obstacles) this.obstacles.push(...spawned.obstacles);
    if (spawned.powerUps) this.powerUps.push(...spawned.powerUps);

    // 障碍物移动+碰撞
    this.obstacles = this.obstacles.filter(o => {
      o.x -= this.speed * 3 * dt;  // px/frame, dt~1 at 60fps
      if (o.x < -o.width) {
        this.combo = 0;
        return false;
      }
      if (!this.player.invincible && this._checkCollision(o)) {
        this._onHit();
      }
      return true;
    });

    // 道具移动+收集
    this.powerUps = this.powerUps.filter(p => {
      p.x -= this.speed * 3 * dt;  // same speed as obstacles
      if (p.x < -p.width) return false;
      if (this._checkCollision(p)) {
        this._onCollect(p);
        return false;
      }
      return true;
    });

    // 分数基于距离
    this.score = Math.floor(this.distance);
  }

  render(ctx) {
    this._drawBackground(ctx);
    this.obstacles.forEach(o => o.render(ctx));
    this.powerUps.forEach(p => p.render(ctx));
    this.player.render(ctx);
    this._drawHUD(ctx);

    if (this.state === 'over') {
      this._drawGameOver(ctx);
    }
  }

  /** 视差滚动背景 */
  _drawBackground(ctx) {
    // 远景天空
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, this.game.canvasWidth, this.game.canvasHeight);

    // 远景楼（最慢）
    ctx.fillStyle = '#B0C4DE';
    for (let i = -1; i < 3; i++) {
      const x = i * this.game.canvasWidth - this.bgOffset;
      ctx.fillRect(x + 50, 100, 60, 300);
      ctx.fillRect(x + 200, 80, 80, 350);
    }

    // 近景楼（中等）
    ctx.fillStyle = '#A9A9A9';
    for (let i = -1; i < 3; i++) {
      const x = i * this.game.canvasWidth - this.bgOffset2;
      ctx.fillRect(x + 30, 200, 100, 200);
      ctx.fillRect(x + 180, 180, 90, 250);
    }

    // 地面（最快）
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, this.game.canvasHeight * 0.85, this.game.canvasWidth, this.game.canvasHeight * 0.15);
    // 跑道分隔线
    const laneH = this.game.canvasHeight / 3;
    ctx.strokeStyle = '#FFF';
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, laneH * i);
      ctx.lineTo(this.game.canvasWidth, laneH * i);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  /** 绘制HUD */
  _drawHUD(ctx) {
    const margin = 20;
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏃 ${this.score}`, margin, 30);
    ctx.fillText(`❤️ x${this.lives}`, margin, 55);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(this.speed * 10)}km/h`, this.game.canvasWidth - margin, 30);
    if (this.combo > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`${this.combo}x COMBO!`, this.game.canvasWidth - margin, 55);
    }
  }

  _drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.game.canvasWidth, this.game.canvasHeight);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏢 被优化了!', this.game.canvasWidth / 2, this.game.canvasHeight / 2 - 40);
    ctx.font = '20px sans-serif';
    ctx.fillText(`得分: ${this.score}`, this.game.canvasWidth / 2, this.game.canvasHeight / 2 + 10);
  }

  _checkCollision(obj) {
    const p = this.player.getHitbox();
    // obj.x/obj.y are CENTER coordinates, convert to top-left for AABB
    const ox = obj.x - obj.width / 2;
    const oy = obj.y - obj.height / 2;
    return p.x < ox + obj.width && p.x + p.width > ox &&
           p.y < oy + obj.height && p.y + p.height > oy;
  }

  _onHit() {
    this.lives--;
    this.combo = 0;
    if (this.lives <= 0) {
      this.state = 'over';
      this.game.gameData.score = this.score;
      this.game.gameData.distance = Math.floor(this.distance);
      setTimeout(() => this.game.switchScene('result', { score: this.score }), 1500);
    } else {
      this.player.becomeInvincible(2);
    }
  }

  _onCollect(powerUp) {
    this.combo++;
    switch (powerUp.type) {
      case 'coffee': this.speed += 1; break;
      case 'moyu': this.score += 50 * this.combo; break;
      case 'raise': this.game.gameData.coins += 10; break;
    }
  }

  handleTouch(e) {
    if (this.state === 'over') return;
    if (e.type === 'touchstart') {
      const y = e.touches[0].clientY;
      const laneH = this.game.canvasHeight / 3;
      const lane = Math.floor(y / laneH);
      this.player.switchLane(lane);
    }
  }
}

module.exports = GameScene;
