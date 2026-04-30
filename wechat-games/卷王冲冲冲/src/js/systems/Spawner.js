/**
 * 生成器系统 v2 - 秒级dt + 直接创建实体（无对象池）
 * 控制障碍物和道具的生成节奏，随游戏进程难度递增
 */

const Obstacle = require('../entities/Obstacle.js');
const PowerUp = require('../entities/PowerUp.js');

// 类型池
const OBSTACLE_POOL = ['boss', 'meeting', 'overtime', 'overtime', 'layoff'];
const POWERUP_POOL = ['coffee', 'fish', 'salary'];

class Spawner {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.laneCount = 3;
    this.laneHeight = canvasHeight / this.laneCount;

    // 生成计时 (ms)
    this.obstacleTimer = 0;
    this.obstacleInterval = 1500;
    this.obstacleMinInterval = 400;
    this.powerUpTimer = 0;
    this.powerUpInterval = 5000;
    this.powerUpMinInterval = 2000;

    this.totalSpawned = 0;
    this.difficultyLevel = 1;
    this.lastObstacleLane = -1;
  }

  getLaneY(lane) {
    return lane * this.laneHeight + this.laneHeight / 2;
  }

  /**
   * @param {number} dt - 秒
   * @param {number} gameSpeed - 当前游戏速度
   * @returns {{obstacles: Array, powerUps: Array}}
   */
  update(dt, gameSpeed) {
    const dtMs = dt * 1000; // 转为毫秒用于内部计时
    const spawned = { obstacles: [], powerUps: [] };

    // 难度递增
    this.difficultyLevel = 1 + Math.floor(this.totalSpawned / 10);
    this.obstacleInterval = Math.max(this.obstacleMinInterval, 1500 - (this.difficultyLevel - 1) * 80);
    this.powerUpInterval = Math.max(this.powerUpMinInterval, 5000 - (this.difficultyLevel - 1) * 150);

    // 障碍物生成
    this.obstacleTimer += dtMs;
    if (this.obstacleTimer >= this.obstacleInterval) {
      this.obstacleTimer -= this.obstacleInterval;
      this.obstacleTimer += (Math.random() - 0.5) * this.obstacleInterval * 0.4;
      const obs = this._spawnObstacle(gameSpeed);
      if (obs) spawned.obstacles.push(obs);
    }

    // 道具生成
    this.powerUpTimer += dtMs;
    if (this.powerUpTimer >= this.powerUpInterval) {
      this.powerUpTimer -= this.powerUpInterval;
      this.powerUpTimer += (Math.random() - 0.5) * this.powerUpInterval * 0.3;
      const pu = this._spawnPowerUp();
      if (pu) spawned.powerUps.push(pu);
    }

    return spawned;
  }

  _spawnObstacle(gameSpeed) {
    let lane;
    if (this.lastObstacleLane === -1) {
      lane = Math.floor(Math.random() * this.laneCount);
    } else {
      const available = [0, 1, 2].filter(l => l !== this.lastObstacleLane);
      lane = available[Math.floor(Math.random() * available.length)];
    }
    this.lastObstacleLane = lane;

    const typeKey = OBSTACLE_POOL[Math.floor(Math.random() * OBSTACLE_POOL.length)];
    const y = this.getLaneY(lane);
    const x = this.canvasWidth + 60 + Math.random() * 100;

    const obs = new Obstacle();
    obs.init(x, y, lane, typeKey);
    this.totalSpawned++;
    return obs;
  }

  _spawnPowerUp() {
    const lane = Math.floor(Math.random() * this.laneCount);
    const typeKey = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];

    const y = this.getLaneY(lane);
    const x = this.canvasWidth + 60 + Math.random() * 80;

    const pu = new PowerUp();
    pu.init(x, y, lane, typeKey);
    return pu;
  }

  reset() {
    this.obstacleTimer = 0;
    this.obstacleInterval = 1500;
    this.powerUpTimer = 0;
    this.powerUpInterval = 5000;
    this.totalSpawned = 0;
    this.difficultyLevel = 1;
    this.lastObstacleLane = -1;
  }
}

module.exports = Spawner;
