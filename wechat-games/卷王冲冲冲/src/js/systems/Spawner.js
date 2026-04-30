/**
 * Spawner — 竖版生成器
 * 3列跑道，障碍从上方生成
 */
const { Obstacle } = require('../entities/Obstacle.js');
const { PowerUp } = require('../entities/PowerUp.js');

const OBSTACLE_POOL = ['boss', 'meeting', 'overtime', 'overtime', 'layoff'];
const POWERUP_POOL = ['coffee', 'fish', 'salary'];

class Spawner {
  constructor(canvasWidth, canvasHeight, imageManager) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this._imgMgr = imageManager;
    this.laneCount = 3;
    this.columnWidth = canvasWidth / this.laneCount;  // 列宽

    this.obstacleTimer = 0;
    this.obstacleInterval = 1500;    // 初始1.5秒一个障碍
    this.obstacleMinInterval = 600;
    this.powerUpTimer = 0;
    this.powerUpInterval = 5000;
    this.powerUpMinInterval = 3000;

    this.totalSpawned = 0;
    this.lastObstacleCol = -1;
  }

  /** 获取列的X中心坐标 */
  getColumnX(col) {
    return col * this.columnWidth + this.columnWidth / 2;
  }

  update(dt, gameSpeed) {
    const dtMs = dt * 1000;
    const spawned = { obstacles: [], powerUps: [] };

    // 难度递增
    const diff = 1 + Math.floor(this.totalSpawned / 8);
    this.obstacleInterval = Math.max(this.obstacleMinInterval, 1500 - diff * 80);
    this.powerUpInterval = Math.max(this.powerUpMinInterval, 5000 - diff * 100);

    // 障碍物
    this.obstacleTimer += dtMs;
    if (this.obstacleTimer >= this.obstacleInterval) {
      this.obstacleTimer -= this.obstacleInterval;
      const obs = this._spawnObstacle();
      if (obs) spawned.obstacles.push(obs);
    }

    // 道具
    this.powerUpTimer += dtMs;
    if (this.powerUpTimer >= this.powerUpInterval) {
      this.powerUpTimer -= this.powerUpInterval;
      const pu = this._spawnPowerUp();
      if (pu) spawned.powerUps.push(pu);
    }

    return spawned;
  }

  _spawnObstacle() {
    // 避开上一列
    let col;
    if (this.lastObstacleCol === -1) {
      col = Math.floor(Math.random() * 3);
    } else {
      const available = [0,1,2].filter(c => c !== this.lastObstacleCol);
      col = available[Math.floor(Math.random() * available.length)];
    }
    this.lastObstacleCol = col;

    const typeKey = OBSTACLE_POOL[Math.floor(Math.random() * OBSTACLE_POOL.length)];
    const ox = this.getColumnX(col);
    const oy = -50;

    const obs = new Obstacle();
    obs.init(ox, oy, col, typeKey);
    obs._imgMgr = this._imgMgr;
    this.totalSpawned++;
    return obs;
  }

  _spawnPowerUp() {
    const col = Math.floor(Math.random() * 3);
    const typeKey = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];

    const px = this.getColumnX(col);
    const py = -50;

    const pu = new PowerUp();
    pu.init(px, py, col, typeKey);
    pu._imgMgr = this._imgMgr;
    return pu;
  }

  reset() {
    this.obstacleTimer = 0;
    this.obstacleInterval = 1500;
    this.powerUpTimer = 0;
    this.powerUpInterval = 5000;
    this.totalSpawned = 0;
    this.lastObstacleCol = -1;
  }
}

module.exports = Spawner;
