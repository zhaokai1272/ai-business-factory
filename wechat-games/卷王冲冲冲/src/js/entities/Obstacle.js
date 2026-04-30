/**
 * Obstacle.js — 障碍物实体(纯数据,渲染在GameScene)
 */
const OBSTACLE_TYPES = {
  BOSS:    { type:'boss',     width:60, height:70, speed:1.0 },
  MEETING: { type:'meeting',  width:65, height:50, speed:0.9 },
  OVERTIME:{ type:'overtime', width:55, height:55, speed:1.1 },
  LAYOFF:  { type:'layoff',   width:50, height:60, speed:1.0 },
};

class Obstacle {
  constructor() { this.x=0; this.y=0; this.width=50; this.height=50; this.type=OBSTACLE_TYPES.OVERTIME; this.lane=0; this._imgMgr=null; }
  init(x, y, lane, typeKey) {
    this.x=x; this.y=y; this.lane=lane;
    this.type=OBSTACLE_TYPES[typeKey]||OBSTACLE_TYPES.OVERTIME;
    this.width=this.type.width; this.height=this.type.height;
    return this;
  }
  getHitbox() {
    const m=8;
    return { x:this.x-this.width/2+m, y:this.y-this.height/2+m, width:this.width-m*2, height:this.height-m*2 };
  }
  reset() { this.x=-200; this.y=0; }
}
module.exports = { Obstacle, OBSTACLE_TYPES };
