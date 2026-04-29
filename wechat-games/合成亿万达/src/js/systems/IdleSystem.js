/**
 * IdleSystem.js — 挂机系统
 * 在线/离线收益计算
 */

class IdleSystem {
  constructor(game) {
    this.game = game;
    this.onlineTimer = 0;       // 在线累计计时（秒）
    this.onlineAccumulator = 0; // 在线收益累加器
  }

  /**
   * 计算每秒收益
   * 基于当前总身价 × 挂机系数
   * @returns {number} 每秒金币收益
   */
  getCoinsPerSecond() {
    const gd = this.game.gameData;
    // 基础收益：身价的 0.1%
    const baseRate = 0.001;
    // 加速器加成：每个加速器 +50%
    const acceleratorBonus = 1 + gd.accelerators * 0.5;
    // 等级加成：每级 +5%
    const levelBonus = 1 + (gd.level - 1) * 0.05;

    const worth = Math.max(gd.totalWorth, 1);
    return Math.floor(worth * baseRate * acceleratorBonus * levelBonus);
  }

  /**
   * 计算离线收益
   * @param {number} offlineSeconds - 离线秒数
   * @returns {number} 离线金币收益
   */
  calculateOfflineEarnings(offlineSeconds) {
    if (offlineSeconds <= 0) return 0;

    // 离线收益 = 在线收益的50%
    const cps = this.getCoinsPerSecond();
    // 最大离线收益：8小时
    const cappedSeconds = Math.min(offlineSeconds, 8 * 3600);

    return Math.floor(cps * cappedSeconds * 0.5);
  }

  /**
   * 每帧更新（由主循环调用）
   * @param {number} dt - 帧间隔秒数
   */
  update(dt) {
    this.onlineAccumulator += dt;

    // 每秒发放在线收益
    if (this.onlineAccumulator >= 1.0) {
      const cps = this.getCoinsPerSecond();
      this.game.gameData.coins += cps;
      this.onlineAccumulator -= 1.0;
      this.onlineTimer += 1;
    }
  }

  /**
   * 处理离线收益
   * @returns {{ hasOffline: boolean, earnings: number, seconds: number }}
   */
  processOfflineEarnings() {
    const gd = this.game.gameData;
    const now = Date.now();
    const lastTime = gd.lastOnlineTime || now;
    const offlineMs = now - lastTime;

    // 离线超过60秒才触发离线收益
    if (offlineMs < 60000) {
      gd.lastOnlineTime = now;
      return { hasOffline: false, earnings: 0, seconds: 0 };
    }

    const offlineSeconds = Math.floor(offlineMs / 1000);
    const earnings = this.calculateOfflineEarnings(offlineSeconds);

    if (earnings > 0) {
      gd.coins += earnings;
    }
    gd.lastOnlineTime = now;

    return {
      hasOffline: true,
      earnings,
      seconds: offlineSeconds
    };
  }

  /**
   * 保存在线时间（退出时调用）
   */
  saveLastOnlineTime() {
    this.game.gameData.lastOnlineTime = Date.now();
  }

  /**
   * 格式化收益文本
   */
  static formatEarnings(coins) {
    if (coins >= 1e16) return `${(coins / 1e16).toFixed(1)}亿亿`;
    if (coins >= 1e12) return `${(coins / 1e12).toFixed(1)}万亿`;
    if (coins >= 1e8) return `${(coins / 1e8).toFixed(1)}亿`;
    if (coins >= 1e4) return `${(coins / 1e4).toFixed(1)}万`;
    return coins.toString();
  }
}

module.exports = IdleSystem;
