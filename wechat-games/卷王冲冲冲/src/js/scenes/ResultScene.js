/**
 * ResultScene.js — 结算钩子 (新纪录/段位/广告/分享)
 */
class ResultScene {
  constructor(game) { this.game=game; this.score=0; this.distance=0; this.speed=0; this.combo=0; this.coins=0; this.dodges=0; this.collects=0; this.rank=''; this.isNew=false; }

  enter(p={}) {
    const gd=this.game.gameData;
    this.score=p.score||gd.score||0; this.distance=p.distance||gd.distance||0;
    this.speed=p.maxSpeed||gd.maxSpeed||0; this.combo=p.maxCombo||0;
    this.coins=p.coins||0; this.dodges=p.dodges||0; this.collects=p.collects||0;
    this.isNew = this.score > (gd.highScore||0);
    if (this.isNew) gd.highScore = this.score;
    gd.coins += this.coins;
    this._setRank();
  }

  _setRank() {
    const s=this.score;
    if(s>=10000) this.rank='👑 资本本资';
    else if(s>=5000) this.rank='💼 总监';
    else if(s>=2500) this.rank='👔 经理';
    else if(s>=1000) this.rank='🧑‍💻 骨干';
    else if(s>=500) this.rank='📋 专员';
    else if(s>=200) this.rank='🎓 实习生';
    else this.rank='📄 简历待投';
  }

  render(ctx) {
    const w=this.game.canvasWidth, h=this.game.canvasHeight, cx=w/2;
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,w,h);

    // 段位
    ctx.fillStyle='#FFD700'; ctx.font='bold 28px sans-serif'; ctx.textAlign='center';
    ctx.fillText(this.rank, cx, h*0.12);

    // 新纪录
    if(this.isNew){ ctx.fillStyle='#FF6347'; ctx.font='bold 18px sans-serif'; ctx.fillText('🏆 新纪录!',cx,h*0.19); }

    // 分数
    ctx.fillStyle='#fff'; ctx.font='bold 48px sans-serif';
    ctx.fillText(`${this.score}`, cx, h*0.28);

    // 统计
    ctx.fillStyle='#ccc'; ctx.font='14px sans-serif';
    const stats=[
      `🏃 ${Math.floor(this.distance)}m  ⚡ ${this.speed}km/h  🔥 ${this.combo}x`,
      `👻 躲避${this.dodges}  🎁 收集${this.collects}  💰 +${this.coins}`
    ];
    stats.forEach((s,i)=>ctx.fillText(s,cx,h*0.36+i*20));

    // 按钮
    const bw=w*0.6, bh=46, bx=(w-bw)/2;
    // 广告复活
    ctx.fillStyle='#e74c3c'; this._rr(ctx,bx,h*0.50,bw,bh,bh/2);
    ctx.fillStyle='#fff'; ctx.font='bold 17px sans-serif';
    ctx.fillText('📺 看广告复活', cx, h*0.50+bh/2+6);

    // 再来
    ctx.fillStyle='#3498db'; this._rr(ctx,bx,h*0.50+bh+14,bw,bh,bh/2);
    ctx.fillText('🔄 再来一局', cx, h*0.50+bh*1.5+20);

    // 分享
    ctx.fillStyle='#2ecc71'; this._rr(ctx,bx,h*0.50+bh*2+28,bw,bh,bh/2);
    ctx.fillText('📤 分享战绩', cx, h*0.50+bh*2.5+34);

    // 底部文案
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='11px sans-serif';
    ctx.fillText(`金币余额: 💰${this.game.gameData.coins||0}`, cx, h-20);
  }

  _rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath(); ctx.fill(); }

  handleTouch(e) {
    if(e.type!=='touchstart') return;
    const ty=e.touches[0].clientY, h=this.game.canvasHeight;
    if(ty>h*0.50&&ty<h*0.50+46){ this._tryRevive(); return; }
    if(ty>h*0.50+60&&ty<h*0.50+106){ this.game.switchScene('game'); return; }
    if(ty>h*0.50+120&&ty<h*0.50+166){ this._share(); return; }
  }

  _tryRevive() {
    if(typeof wx!=='undefined'&&wx.createRewardedVideoAd){
      try{
        const ad=wx.createRewardedVideoAd({adUnitId:'adunit-58e45f7d3183d214'});
        ad.onClose(res=>{ if(res&&res.isEnded) this.game.switchScene('game',{revive:true}); });
        ad.load().then(()=>ad.show()).catch(()=>this.game.switchScene('game'));
      }catch(e){ this.game.switchScene('game'); }
    } else { this.game.switchScene('game'); }
  }

  _share() {
    if(typeof wx!=='undefined'&&wx.shareAppMessage){
      wx.shareAppMessage({title:`我跑${this.score}分!${this.rank}`,success:()=>{ this.game.gameData.diamonds+=3; }});
    }
  }
}
module.exports = ResultScene;
