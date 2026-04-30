/**
 * GameScene.js — 竖版跑酷（全部真实图片渲染）
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
    this.speed = 180;
    this.maxSpeed = 450;
    this.combo = 0;
    this.lives = 3;
    this.state = 'playing';
    this._backBtn = { x: 6, y: 4, w: 50, h: 28 };
    this._flashAlpha = 0;
    this._scorePops = [];     // 得分弹出文字
    this._coinsEarned = 0;
  }

  enter(params = {}) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    const colW = w / 3;
    this.player = new Player(colW*1.5, h*0.72, [colW*0.5, colW*1.5, colW*2.5], 1);
    this.player.game = this.game;
    this.spawner = new Spawner(w, h, this.game.imageManager);
    this.obstacles = []; this.powerUps = []; this._scorePops = [];
    this.score = 0; this.distance = 0; this.speed = 180; this.combo = 0;
    this.lives = 3; this.state = 'playing'; this._coinsEarned = 0;
    this.game.gameData.lives = 3;
  }

  update(dt) {
    if (this.state !== 'playing') return;
    const IMG = this.game.imageManager;

    // 速度曲线: 前30秒缓慢增长, 之后加速
    const elapsed = this.distance / this.speed;
    this.speed = Math.min(this.maxSpeed, 180 + elapsed * 2.5);
    this.distance += this.speed * dt;

    this.player.update(dt);

    // 生成
    const spawned = this.spawner.update(dt, this.speed);
    if (spawned.obstacles) this.obstacles.push(...spawned.obstacles);
    if (spawned.powerUps) this.powerUps.push(...spawned.powerUps);

    // 障碍物移动+碰撞
    for (let i = this.obstacles.length-1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.y += this.speed * dt;
      if (o.y > this.game.canvasHeight + 80) { this.obstacles.splice(i,1); continue; }
      if (!this.player.invincible && this._hitTest(o)) {
        this._onHit(); break; // 一帧只触发一次
      }
    }

    // 道具移动+收集
    for (let i = this.powerUps.length-1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += this.speed * dt;
      if (p.y > this.game.canvasHeight + 60) { this.powerUps.splice(i,1); continue; }
      if (this._hitTest(p)) {
        this._onCollect(p);
        this.powerUps.splice(i,1);
      }
    }

    this.score = Math.floor(this.distance / 5);
    if (this._flashAlpha > 0) this._flashAlpha -= dt * 4;
    // 弹出文字衰减
    for (let i = this._scorePops.length-1; i >= 0; i--) {
      this._scorePops[i].y -= 60*dt;
      this._scorePops[i].life -= dt;
      if (this._scorePops[i].life <= 0) this._scorePops.splice(i,1);
    }
  }

  render(ctx) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    const IMG = this.game.imageManager;

    // 背景
    this._drawBg(ctx, IMG);

    // 障碍物
    for (const o of this.obstacles) {
      const imgKey = {boss:'12_obstacle_boss.png',meeting:'11_obstacle_meeting.png',overtime:'13_obstacle_overtime.png',layoff:'14_obstacle_deadline.png'}[o.type.type] || '13_obstacle_overtime.png';
      const img = IMG.get(imgKey);
      if (img) ctx.drawImage(img, o.x-o.width/2, o.y-o.height/2, o.width, o.height);
    }

    // 道具
    for (const p of this.powerUps) {
      const imgKey = {coffee:'16_powerup_coffee.png', shield:'17_powerup_shield.png', magnet:'18_powerup_magnet.png', speed:'19_powerup_speed.png', double:'20_powerup_double.png'}[p.type.type] || '16_powerup_coffee.png';
      const img = IMG.get(imgKey);
      if (img) ctx.drawImage(img, p.x-p.width/2, p.y-p.height/2, p.width, p.height);
    }

    // 玩家
    this.player.render(ctx);

    // HUD
    this._drawHUD(ctx, IMG);

    // 得分弹出
    for (const sp of this._scorePops) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, sp.life);
      ctx.fillStyle = sp.color;
      ctx.font = `bold ${sp.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(sp.text, sp.x, sp.y);
      ctx.restore();
    }

    // 受击闪红
    if (this._flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,0,0,${this._flashAlpha})`;
      ctx.fillRect(0,0,w,h);
    }

    // 游戏结束
    if (this.state === 'over') this._drawOver(ctx);
  }

  _drawBg(ctx, IMG) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    let key = '21_bg_office_day.png';
    if (this.speed > 380) key = '25_bg_desk.png';
    else if (this.speed > 300) key = '23_bg_subway.png';
    else if (this.speed > 220) key = '22_bg_office_night.png';
    const img = IMG.get(key);
    if (img) { ctx.drawImage(img, 0, 0, w, h); return; }
    // 紧急回退
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0,0,w,h);
  }

  _drawHUD(ctx, IMG) {
    const w = this.game.canvasWidth;
    // 顶栏背景
    const panel = IMG.get('34_panel_top.png');
    if (panel) ctx.drawImage(panel, 0, 0, w, 50);

    // 返回
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this._roundRect(ctx, this._backBtn.x, this._backBtn.y, this._backBtn.w, this._backBtn.h, 5);
    ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('←', this._backBtn.x+this._backBtn.w/2, this._backBtn.y+this._backBtn.h/2+4);

    // 金币
    const coin = IMG.get('26_ui_coin.png');
    if (coin) ctx.drawImage(coin, w*0.22, 2, 20, 20);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${this._coinsEarned}`, w*0.22+24, 18);

    // 分数居中
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${this.score}`, w/2, 36);

    // 速度
    ctx.font = '11px sans-serif'; ctx.fillStyle = '#FFD700';
    ctx.fillText(`${Math.floor(this.speed)}km/h`, w/2, 50);

    // 生命
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
    ctx.fillText(`❤x${this.lives}`, 10, 68);

    // 连击
    if (this.combo > 2) {
      ctx.textAlign = 'right'; ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${this.combo}x`, w-10, 68);
    }
  }

  _drawOver(ctx) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🏢 被优化了!', w/2, h/2-30);
    ctx.font = '18px sans-serif';
    ctx.fillText(`得分: ${this.score} 金币: ${this._coinsEarned}`, w/2, h/2+15);
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText('点击屏幕返回', w/2, h/2+45);
  }

  _hitTest(obj) {
    const p = this.player.getHitbox();
    const m = 10;
    const ox = obj.x - obj.width/2 + m;
    const oy = obj.y - obj.height/2 + m;
    return p.x < ox+obj.width-m*2 && p.x+p.width > ox &&
           p.y < oy+obj.height-m*2 && p.y+p.height > oy;
  }

  _onHit() {
    this.lives--; this.combo = 0; this._flashAlpha = 0.6;
    if (this.lives <= 0) {
      this.state = 'over';
      this.game.gameData.score = this.score;
      this.game.gameData.maxSpeed = Math.floor(this.speed);
      this.game.gameData.coins += this._coinsEarned;
    } else {
      this.player.becomeInvincible(1.8);
      this._scorePops.push({x:this.player.x, y:this.player.y-30, text:'-1❤', color:'#e74c3c', size:24, life:1.2});
    }
  }

  _onCollect(pu) {
    this.combo++;
    const t = pu.type.type;
    if (t === 'coffee') { this.speed = Math.min(this.maxSpeed, this.speed+25); this._scorePops.push({x:pu.x,y:pu.y,text:'⚡加速!',color:'#3498db',size:18,life:1}); }
    else if (t === 'speed') { this.speed = Math.min(this.maxSpeed, this.speed+40); this._scorePops.push({x:pu.x,y:pu.y,text:'⚡⚡',color:'#3498db',size:20,life:1}); }
    else if (t === 'shield') { this.player.becomeInvincible(3); this._scorePops.push({x:pu.x,y:pu.y,text:'🛡',color:'#2ecc71',size:22,life:1.2}); }
    else if (t === 'magnet') { this._coinsEarned += 5; this._scorePops.push({x:pu.x,y:pu.y,text:'+5💰',color:'#FFD700',size:18,life:1}); }
    else if (t === 'double') { this._coinsEarned += 10; this._scorePops.push({x:pu.x,y:pu.y,text:'x2💰',color:'#FFD700',size:20,life:1}); }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y,r); ctx.closePath(); ctx.fill();
  }

  handleTouch(e) {
    if (this.state === 'over') { this.game.switchScene('menu'); return; }
    if (e.type !== 'touchstart') return;
    const tx = e.touches[0].clientX, ty = e.touches[0].clientY;
    const bb = this._backBtn;
    if (tx>=bb.x && tx<=bb.x+bb.w && ty>=bb.y && ty<=bb.y+bb.h) { this.game.switchScene('menu'); return; }
    const col = Math.min(2, Math.floor(tx / (this.game.canvasWidth/3)));
    if (this.player.switchLane) this.player.switchLane(col);
  }
}
module.exports = GameScene;
