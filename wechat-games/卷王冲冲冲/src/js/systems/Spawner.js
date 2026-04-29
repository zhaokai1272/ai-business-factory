/**
 * 生成器系统 - 控制障碍物和道具的生成节奏
 * 基于时间间隔生成，随游戏进程难度递增
 */

// 障碍物类型池(用于随机选择)
const OBSTACLE_POOL = ['boss', 'meeting', 'overtime', 'overtime', 'layoff']; // 加班权重更高
const POWERUP_POOL = ['coffee', 'fish', 'salary'];

class Spawner {
  /**
   * @param {ObjectPool} obstaclePool - 障碍物对象池
   * @param {ObjectPool} powerUpPool - 道具对象池
   * @param {Object} gameData - 全局游戏数据
   * @param {number} canvasWidth - 画布宽度
   * @param {number} canvasHeight - 画布高度
   */
  constructor(obstaclePool, powerUpPool, gameData, canvasWidth, canvasHeight) {
    this.obstaclePool = obstaclePool; // 障碍物池
    this.powerUpPool = powerUpPool; // 道具池
    this.gameData = gameData; // 全局数据
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 跑道参数
    this.laneCount = 3; // 3条跑道
    this.laneHeight = canvasHeight / this.laneCount; // 每条跑道高度

    // 障碍物生成计时
    this.obstacleTimer = 0; // 距下次生成障碍物的计时器
    this.obstacleInterval = 1500; // 初始生成间隔(ms)
    this.obstacleMinInterval = 400; // 最小生成间隔(难度上限)

    // 道具生成计时
    this.powerUpTimer = 0; // 距下次生成道具的计时器
    this.powerUpInterval = 5000; // 初始道具间隔(ms)
    this.powerUpMinInterval = 2000; // 最小道具间隔

    // 已生成计数(用于难度递增)
    this.totalSpawned = 0;
    this.difficultyLevel = 1; // 难度等级

    // 上次障碍物所在跑道(避免连续同跑道)
    this.lastObstacleLane = -1;
    // 最少间隔跑道数(确保不同障碍物间有足够间隙)
    this.minLaneGap = 0;
  }

  /**
   * 获取指定跑道中心Y坐标
   * @param {number} lane - 跑道索引
   * @returns {number}
   */
  getLaneY(lane) {
    return lane * this.laneHeight + this.laneHeight / 2;
  }

  /**
   * 更新生成器(每帧调用)
   * @param {number} deltaTime - 帧间隔(ms)
   */
  update(deltaTime) {
    // === 难度递增 ===
    // 每生成10个障碍物提升难度
    this.difficultyLevel = 1 + Math.floor(this.totalSpawned / 10);
    // 间隔随难度递减
    this.obstacleInterval = Math.max(
      this.obstacleMinInterval,
      1500 - (this.difficultyLevel - 1) * 80
    );
    this.powerUpInterval = Math.max(
      this.powerUpMinInterval,
      5000 - (this.difficultyLevel - 1) * 150
    );

    // === 障碍物生成 ===
    this.obstacleTimer += deltaTime;
    if (this.obstacleTimer >= this.obstacleInterval) {
      this.obstacleTimer -= this.obstacleInterval;
      // 随机微调间隔(±20%)增加不可预测性
      this.obstacleTimer += (Math.random() - 0.5) * this.obstacleInterval * 0.4;
      this.spawnObstacle();
    }

    // === 道具生成 ===
    this.powerUpTimer += deltaTime;
    if (this.powerUpTimer >= this.powerUpInterval) {
      this.powerUpTimer -= this.powerUpInterval;
      // 随机微调
      this.powerUpTimer += (Math.random() - 0.5) * this.powerUpInterval * 0.3;
      this.spawnPowerUp();
    }
  }

  /**
   * 生成一个障碍物
   */
  spawnObstacle() {
    // === 选择跑道(避免与上次重复) ===
    let lane;
    if (this.lastObstacleLane === -1) {
      // 首次：随机
      lane = Math.floor(Math.random() * this.laneCount);
    } else {
      // 后续：排除上次跑道
      const available = [];
      for (let i = 0; i < this.laneCount; i++) {
        if (i !== this.lastObstacleLane) available.push(i);
      }
      lane = available[Math.floor(Math.random() * available.length)];
    }

    // === 检查同跑道是否有障碍物太近 ===
    const activeObstacles = this.obstaclePool.getActive();
    const minGapX = 200 + this.gameData.speed * 5; // 最小间距(随速度增大)
    for (let i = 0; i < activeObstacles.length; i++) {
      const obs = activeObstacles[i];
      if (obs.lane === lane && obs.x > this.canvasWidth - minGapX) {
        // 该跑道右侧有障碍物太近，尝试换跑道
        const altLanes = [0, 1, 2].filter(
          (l) => l !== lane && l !== this.lastObstacleLane
        );
        if (altLanes.length > 0) {
          lane = altLanes[Math.floor(Math.random() * altLanes.length)];
        }
      }
    }

    this.lastObstacleLane = lane;

    // === 随机选择类型 ===
    const typeKey = OBSTACLE_POOL[Math.floor(Math.random() * OBSTACLE_POOL.length)];

    // === 从对象池获取 ===
    const obstacle = this.obstaclePool.acquire();

    // === 初始化 ===
    const y = this.getLaneY(lane);
    // X从屏幕右侧外进入
    const x = this.canvasWidth + 60 + Math.random() * 100;
    obstacle.init(x, y, lane, typeKey);

    this.totalSpawned++;
  }

  /**
   * 生成一个道具
   */
  spawnPowerUp() {
    // === 随机选择跑道 ===
    const lane = Math.floor(Math.random() * this.laneCount);

    // === 检查该跑道是否已有道具 ===
    const activePowerUps = this.powerUpPool.getActive();
    for (let i = 0; i < activePowerUps.length; i++) {
      if (activePowerUps[i].lane === lane) {
        return; // 该跑道已有道具，跳过
      }
    }

    // === 随机类型(涨薪概率较低) ===
    const typeKey = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];

    // === 从对象池获取 ===
    const powerUp = this.powerUpPool.acquire();

    // === 初始化 ===
    const y = this.getLaneY(lane);
    const x = this.canvasWidth + 60 + Math.random() * 80;
    powerUp.init(x, y, lane, typeKey);
  }

  /**
   * 重置生成器状态(新游戏)
   */
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

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Spawner;
}
