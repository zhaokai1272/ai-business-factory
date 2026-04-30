/**
 * PowerUp.js — 道具实体(纯数据,渲染在GameScene)
 */
const POWERUP_TYPES = {
  COFFEE: { type:'coffee', width:35, height:40, effect:'speed' },
  SHIELD: { type:'shield', width:38, height:38, effect:'invincible' },
  MAGNET: { type:'magnet', width:36, height:36, effect:'coins' },
  SPEED:  { type:'speed',  width:35, height:40, effect:'bigspeed' },
  DOUBLE: { type:'double', width:38, height:38, effect:'doublecoins' },
};

class PowerUp {
  constructor() { this.x=0; this.y=0; this.width=35; this.height=40; this.type=POWERUP_TYPES.COFFEE; this._imgMgr=null; }
  init(x, y, lane, typeKey) {
    this.x=x; this.y=y;
    this.type=POWERUP_TYPES[typeKey]||POWERUP_TYPES.COFFEE;
    this.width=this.type.width; this.height=this.type.height;
    return this;
  }
}
module.exports = { PowerUp, POWERUP_TYPES };
