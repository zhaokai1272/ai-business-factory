/**
 * GameScene.js — 竖版跑酷 (可玩性优先)
 * 核心循环: 躲避→收集→连击→死亡→再来一局
 */
const Player = require('../entities/Player.js');
const Spawner = require('../systems/Spawner.js');

class GameScene {
  constructor(game) {
    this.game = game; this.player = null; this.spawner = null;
    this.obstacles = []; this.powerUps = [];
    this.score = 0; this.distance = 0; this.speed = 180; this.maxSpeed = 500;
    this.combo = 0; this.maxCombo = 0; this.lives = 3;
    this.state = 'playing'; this._backBtn = {x:6,y:4,w:50,h:28};
    this._flashAlpha = 0; this._pops = []; this._coins = 0;
    this._dodgeCount = 0; this._collectCount = 0;
    this._shakeX = 0; this._shakeY = 0;
  }

  enter() {
    const w=this.game.canvasWidth, h=this.game.canvasHeight;
    const cw=w/3;
    this.player = new Player(cw*1.5, h*0.72, [cw*0.5,cw*1.5,cw*2.5], 1);
    this.player.game = this.game;
    this.spawner = new Spawner(w, h, this.game.imageManager);
    this.obstacles=[]; this.powerUps=[]; this._pops=[]; this._coins=0;
    this.score=0; this.distance=0; this.speed=180; this.combo=0; this.maxCombo=0;
    this.lives=3; this.state='playing'; this._flashAlpha=0;
    this._dodgeCount=0; this._collectCount=0; this._shakeX=0; this._shakeY=0;
  }

  update(dt) {
    if (this.state!=='playing') return;
    const IMG = this.game.imageManager;

    // 速度曲线: 0-15秒温和, 15-45秒加速, 45秒后极速
    const t = this.distance / Math.max(this.speed, 1);
    if (t < 15) this.speed = 180 + t * 4;
    else if (t < 45) this.speed = 240 + (t-15) * 6;
    else this.speed = Math.min(this.maxSpeed, 420 + (t-45) * 3);
    this.distance += this.speed * dt;

    this.player.update(dt);
    this._shakeX *= 0.9; this._shakeY *= 0.9;

    // 生成
    const sp = this.spawner.update(dt, this.speed);
    if (sp.obstacles) this.obstacles.push(...sp.obstacles);
    if (sp.powerUps) this.powerUps.push(...sp.powerUps);

    // 障碍
    for (let i=this.obstacles.length-1; i>=0; i--) {
      const o = this.obstacles[i];
      o.y += this.speed * dt;
      if (o.y > this.game.canvasHeight+80) { this.obstacles.splice(i,1); this._dodgeCount++; continue; }
      if (!this.player.invincible && this._hit(o)) { this._onHit(o); break; }
    }

    // 道具
    for (let i=this.powerUps.length-1; i>=0; i--) {
      const p = this.powerUps[i];
      p.y += this.speed * dt;
      if (p.y > this.game.canvasHeight+60) { this.powerUps.splice(i,1); continue; }
      if (this._hit(p)) { this._onCollect(p); this.powerUps.splice(i,1); }
    }

    this.score = Math.floor(this.distance / 5);
    if (this._flashAlpha>0) this._flashAlpha -= dt*3;
    for (let i=this._pops.length-1; i>=0; i--) {
      this._pops[i].y -= 80*dt; this._pops[i].life -= dt;
      if (this._pops[i].life<=0) this._pops.splice(i,1);
    }
  }

  render(ctx) {
    const w=this.game.canvasWidth, h=this.game.canvasHeight, IMG=this.game.imageManager;
    ctx.save();
    if (this._shakeX||this._shakeY) ctx.translate(this._shakeX, this._shakeY);

    // 背景
    let bg='21_bg_office_day.png';
    if (this.speed>420) bg='25_bg_desk.png';
    else if (this.speed>320) bg='23_bg_subway.png';
    else if (this.speed>240) bg='22_bg_office_night.png';
    const bgi=IMG.get(bg); if(bgi) ctx.drawImage(bgi,0,0,w,h);
    else { ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,w,h); }

    // 障碍物
    for (const o of this.obstacles) {
      const k = {boss:'12_obstacle_boss.png',meeting:'11_obstacle_meeting.png',overtime:'13_obstacle_overtime.png',layoff:'14_obstacle_deadline.png'}[o.type.type];
      const img = IMG.get(k||'13_obstacle_overtime.png');
      if (img) ctx.drawImage(img, o.x-o.width/2, o.y-o.height/2, o.width, o.height);
    }

    // 道具
    for (const p of this.powerUps) {
      const k = {coffee:'16_powerup_coffee.png',shield:'17_powerup_shield.png',magnet:'18_powerup_magnet.png',speed:'19_powerup_speed.png',double:'20_powerup_double.png'}[p.type.type];
      const img = IMG.get(k||'16_powerup_coffee.png');
      if (img) {
        const bob = Math.sin(Date.now()*0.005+p.x)*3;
        ctx.drawImage(img, p.x-p.width/2, p.y-p.height/2+bob, p.width, p.height);
      }
    }

    // 玩家
    this.player.render(ctx);

    ctx.restore();

    // HUD
    const panel=IMG.get('34_panel_top.png');
    if(panel) ctx.drawImage(panel,0,0,w,48);
    else { ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,w,48); }

    // 返回
    ctx.fillStyle='rgba(0,0,0,0.5)'; this._rr(ctx,this._backBtn.x,this._backBtn.y,this._backBtn.w,this._backBtn.h,5);
    ctx.fillStyle='#fff'; ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('←',this._backBtn.x+this._backBtn.w/2,this._backBtn.y+this._backBtn.h/2+4);

    // 分数大字
    ctx.fillStyle='#fff'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
    ctx.fillText(`${this.score}`, w/2, 32);

    // 金币+连击
    ctx.textAlign='left'; ctx.fillStyle='#FFD700'; ctx.font='bold 12px sans-serif';
    ctx.fillText(`💰${this._coins}`, 10, 32);
    if(this.combo>1){ ctx.textAlign='right'; ctx.fillStyle='#FF6347'; ctx.font='bold 13px sans-serif'; ctx.fillText(`🔥${this.combo}x`,w-10,32); }

    // 弹出文字
    for (const sp of this._pops) {
      ctx.save(); ctx.globalAlpha=Math.min(1,sp.life); ctx.fillStyle=sp.color;
      ctx.font=`bold ${sp.size}px sans-serif`; ctx.textAlign='center'; ctx.fillText(sp.text,sp.x,sp.y); ctx.restore();
    }

    // 闪红
    if(this._flashAlpha>0){ ctx.fillStyle=`rgba(255,0,0,${this._flashAlpha})`; ctx.fillRect(0,0,w,h); }

    // 死亡
    if(this.state==='over') this._drawOver(ctx);
  }

  _drawOver(ctx) {
    const w=this.game.canvasWidth, h=this.game.canvasHeight;

    // 暗色遮罩
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(0,0,w,h);

    // 段位
    const rank = this._getRank();
    ctx.fillStyle='#FFD700'; ctx.font='bold 26px sans-serif'; ctx.textAlign='center';
    ctx.fillText(rank, w/2, h*0.15);

    // 分数
    ctx.fillStyle='#fff'; ctx.font='bold 42px sans-serif';
    ctx.fillText(`${this.score}`, w/2, h*0.28);

    // 统计
    ctx.fillStyle='#ccc'; ctx.font='14px sans-serif';
    const stats = [
      `🏃 距离: ${Math.floor(this.distance)}m  ⚡ 极速: ${Math.floor(this.speed)}km/h`,
      `🔥 最大连击: ${this.maxCombo}x  💰 金币: ${this._coins}`,
      `👻 躲避: ${this._dodgeCount}次  🎁 收集: ${this._collectCount}次`
    ];
    for (let i=0; i<stats.length; i++) ctx.fillText(stats[i], w/2, h*0.38+i*22);

    // 高分对比
    const prev = this.game.gameData.highScore || 0;
    const isNew = this.score > prev;
    if (isNew) { this.game.gameData.highScore = this.score; ctx.fillStyle='#FFD700'; ctx.font='bold 16px sans-serif'; ctx.fillText('🏆 新纪录!', w/2, h*0.58); }
    else { ctx.fillStyle='#aaa'; ctx.font='13px sans-serif'; ctx.fillText(`历史最佳: ${prev}`, w/2, h*0.58); }

    // 按钮
    const btnW=w*0.55, btnH=44, bx=(w-btnW)/2;
    // 广告复活
    ctx.fillStyle='#e74c3c'; this._rr(ctx,bx,h*0.63,btnW,btnH,btnH/2);
    ctx.fillStyle='#fff'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
    ctx.fillText('📺 看广告复活', w/2, h*0.63+btnH/2+5);

    // 再来一局
    ctx.fillStyle='#3498db'; this._rr(ctx,bx,h*0.63+btnH+12,btnW,btnH,btnH/2);
    ctx.fillText('🔄 再来一局', w/2, h*0.63+btnH*1.5+17);

    // 金币入账
    this.game.gameData.coins += this._coins;
  }

  _getRank() {
    const s=this.score;
    if(s>=10000) return '👑 资本本资';
    if(s>=5000) return '💼 总监';
    if(s>=2500) return '👔 经理';
    if(s>=1000) return '🧑‍💻 骨干';
    if(s>=500) return '📋 专员';
    if(s>=200) return '🎓 实习生';
    return '📄 简历待投';
  }

  _hit(obj) {
    const p=this.player.getHitbox(), m=8;
    const ox=obj.x-obj.width/2+m, oy=obj.y-obj.height/2+m;
    return p.x<ox+obj.width-m*2 && p.x+p.width>ox && p.y<oy+obj.height-m*2 && p.y+p.height>oy;
  }

  _onHit(o) {
    this.lives--; this.maxCombo=Math.max(this.maxCombo, this.combo); this.combo=0;
    this._flashAlpha=0.5; this._shakeX=(Math.random()-0.5)*12; this._shakeY=(Math.random()-0.5)*8;
    if(this.lives<=0) {
      this.state='over'; this.game.gameData.score=this.score; this.game.gameData.maxSpeed=Math.floor(this.speed);
    } else {
      this.player.becomeInvincible(1.5);
      this._pops.push({x:this.player.x, y:this.player.y-30, text:'-1❤', color:'#e74c3c', size:22, life:1});
    }
  }

  _onCollect(pu) {
    this.combo++; this.maxCombo=Math.max(this.maxCombo, this.combo); this._collectCount++;
    const t=pu.type.type;
    if(t==='coffee'){ this.speed=Math.min(this.maxSpeed,this.speed+20); this._pops.push({x:pu.x,y:pu.y,text:'⚡',color:'#3498db',size:24,life:0.8}); }
    else if(t==='speed'){ this.speed=Math.min(this.maxSpeed,this.speed+35); this._pops.push({x:pu.x,y:pu.y,text:'⚡⚡',color:'#3498db',size:26,life:0.9}); }
    else if(t==='shield'){ this.player.becomeInvincible(2.5); this._pops.push({x:pu.x,y:pu.y,text:'🛡',color:'#2ecc71',size:26,life:1}); }
    else if(t==='magnet'){ this._coins+=3; this._pops.push({x:pu.x,y:pu.y,text:'+3💰',color:'#FFD700',size:18,life:0.8}); }
    else if(t==='double'){ this._coins+=6; this._pops.push({x:pu.x,y:pu.y,text:'x2💰',color:'#FFD700',size:20,life:0.9}); }
    if(this.combo>=5&&this.combo%5===0) this._pops.push({x:pu.x,y:pu.y-20,text:`${this.combo}连击!`,color:'#FF6347',size:20+Math.min(this.combo,20),life:1.2});
  }

  _rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath(); ctx.fill(); }

  handleTouch(e) {
    if (this.state==='over') {
      const ty=e.touches[0].clientY, h=this.game.canvasHeight;
      if(ty>h*0.63&&ty<h*0.63+44) { this._tryRevive(); return; } // 复活
      this.game.switchScene('game'); return; // 再来一局
    }
    if(e.type!=='touchstart') return;
    const tx=e.touches[0].clientX, ty=e.touches[0].clientY;
    if(tx>=this._backBtn.x&&tx<=this._backBtn.x+this._backBtn.w&&ty>=this._backBtn.y&&ty<=this._backBtn.y+this._backBtn.h){ this.game.switchScene('menu'); return; }
    const col=Math.min(2,Math.floor(tx/(this.game.canvasWidth/3)));
    if(this.player.switchLane) this.player.switchLane(col);
  }

  _tryRevive() {
    if(typeof wx!=='undefined'&&wx.createRewardedVideoAd){
      try{
        const ad=wx.createRewardedVideoAd({adUnitId:'adunit-58e45f7d3183d214'});
        ad.onClose(res=>{ if(res&&res.isEnded){ this.lives=1; this.state='playing'; this.player.becomeInvincible(2); } });
        ad.load().then(()=>ad.show()).catch(()=>{ this.lives=1; this.state='playing'; });
      }catch(e){ this.game.switchScene('game'); }
    } else { this.game.switchScene('game'); }
  }
}
module.exports = GameScene;
