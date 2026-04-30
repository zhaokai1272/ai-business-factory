/**
 * Player.js — 全部使用真实图片渲染
 */
class Player {
  constructor(x, y, laneXs, initialLane) {
    this.x = x; this.y = y;
    this.laneXs = laneXs;
    this.lane = initialLane;
    this.laneCount = laneXs.length;
    this.width = 55; this.height = 70;
    this.hitbox = { x:0, y:0, width:40, height:60 };
    this.invincible = false;
    this.invincibleTimer = 0;
    this.switching = false;
    this.switchFromX = x;
    this.switchToX = x;
    this.switchDuration = 180;
    this.switchTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.animInterval = 120;
    this.game = null;
    this.scale = 1;
  }

  getHitbox() {
    this.hitbox.x = this.x - this.hitbox.width/2;
    this.hitbox.y = this.y - this.hitbox.height/2;
    return this.hitbox;
  }

  switchLane(targetLane) {
    if (targetLane<0 || targetLane>=this.laneCount) return;
    if (targetLane===this.lane && !this.switching) return;
    this.switching = true;
    this.switchFromX = this.x;
    this.switchToX = this.laneXs[targetLane];
    this.switchTimer = 0;
    this.lane = targetLane;
  }

  becomeInvincible(seconds) {
    this.invincible = true;
    this.invincibleTimer = seconds;
  }

  update(dt) {
    // 列切换动画
    if (this.switching) {
      this.switchTimer += dt;
      const t = Math.min(1, this.switchTimer / (this.switchDuration/1000));
      const ease = t<0.5 ? 2*t*t : -1+(4-2*t)*t;
      this.x = this.switchFromX + (this.switchToX-this.switchFromX)*ease;
      if (t>=1) { this.switching=false; this.x=this.switchToX; }
    }
    // 无敌
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) { this.invincible=false; this.scale=1; }
    }
    // 动画帧
    this.animTimer += dt*1000;
    if (this.animTimer >= this.animInterval) {
      this.animTimer -= this.animInterval;
      this.animFrame = (this.animFrame+1)%3;
    }
    this.hitbox.x = this.x - this.hitbox.width/2;
    this.hitbox.y = this.y - this.hitbox.height/2;
  }

  render(ctx) {
    if (this.invincible && Math.floor(Date.now()/150)%2===0) return; // 闪烁
    const IMG = this.game ? this.game.imageManager : null;
    if (!IMG) return;

    // 选图: 切换中→跳, 否则跑步帧
    let key = '05_player_run1.png';
    if (this.switching) key = '08_player_jump.png';
    else if (this.animFrame===0) key = '05_player_run1.png';
    else if (this.animFrame===1) key = '06_player_run2.png';
    else key = '07_player_run3.png';

    const img = IMG.get(key);
    if (!img) return;

    const iw = this.width*2.2, ih = this.height*2.2;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(img, -iw/2, -ih/2+8, iw, ih);

    // 无敌护盾
    if (this.invincible) {
      ctx.strokeStyle = 'rgba(255,215,0,0.7)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(0,0,this.width*0.8,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  reset() { this.lane=1; this.x=this.laneXs[1]; this.switching=false; this.invincible=false; this.animFrame=0; }
}
module.exports = Player;
