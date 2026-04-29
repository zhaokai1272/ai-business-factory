/**
 * 广告管理器 — 微信激励视频广告封装
 * 统一管理多款游戏的广告实例
 * 
 * 使用方式:
 *   adManager.showRewardedVideo('revive', (reward) => { ... })
 * 
 * 广告类型: revive(复活), hint(提示), double(双倍), energy(体力), signin(签到), accelerate(加速)
 */

class AdManager {
  constructor() {
    // 广告单元ID映射（上线前在微信后台→流量主→广告管理中获取真实ID替换）
    this.adUnitIds = {
      revive: 'adunit-xxxxxxxxxxxxx',
      hint: 'adunit-xxxxxxxxxxxxx',
      double: 'adunit-xxxxxxxxxxxxx',
      energy: 'adunit-xxxxxxxxxxxxx',
      signin: 'adunit-xxxxxxxxxxxxx',
      accelerate: 'adunit-xxxxxxxxxxxxx'
    };

    // 广告实例缓存
    this.adInstances = {};

    // 每日观看计数
    this.dailyCount = {};

    // 配置
    this.config = {
      maxDailyAds: 25,        // 每日最大广告观看次数
      cooldownBetweenAds: 30, // 任意两条广告之间最小间隔(秒)
      lastAdTime: 0
    };

    // 从本地缓存加载每日计数
    this._loadDailyCount();
  }

  /** 加载每日计数 */
  _loadDailyCount() {
    try {
      const today = new Date().toDateString();
      const saved = wx.getStorageSync('adDailyCount');
      if (saved && saved.date === today) {
        this.dailyCount = saved.counts || {};
      } else {
        this.dailyCount = {};
        this._saveDailyCount();
      }
    } catch (e) {
      this.dailyCount = {};
    }
  }

  /** 保存每日计数 */
  _saveDailyCount() {
    try {
      wx.setStorageSync('adDailyCount', {
        date: new Date().toDateString(),
        counts: this.dailyCount
      });
    } catch (e) {}
  }

  /** 检查是否可以展示广告 */
  canShow(type) {
    const totalToday = Object.values(this.dailyCount).reduce((a, b) => a + b, 0);
    if (totalToday >= this.config.maxDailyAds) return false;

    const now = Date.now() / 1000;
    if (now - this.config.lastAdTime < this.config.cooldownBetweenAds) return false;

    return true;
  }

  /** 获取或创建广告实例 */
  _getAd(type) {
    if (!this.adInstances[type]) {
      const adUnitId = this.adUnitIds[type];
      if (!adUnitId) {
        console.warn(`[广告] 未找到广告单元ID: ${type}`);
        return null;
      }
      this.adInstances[type] = wx.createRewardedVideoAd({ adUnitId });

      // 监听广告错误
      this.adInstances[type].onError(err => {
        console.error(`[广告] ${type} 加载失败:`, err);
        // 降级：直接发放奖励不计广告
      });
    }
    return this.adInstances[type];
  }

  /**
   * 展示激励视频广告
   * @param {string} type - 广告类型
   * @param {function} onReward - 奖励回调
   * @param {function} onFail - 失败回调（可选）
   */
  showRewardedVideo(type, onReward, onFail) {
    if (!this.canShow(type)) {
      if (onFail) onFail({ reason: 'daily_limit' });
      return;
    }

    const ad = this._getAd(type);
    if (!ad) {
      if (onFail) onFail({ reason: 'ad_not_ready' });
      return;
    }

    // 设置奖励回调
    ad.onClose(res => {
      if (res && res.isEnded) {
        // 记录观看
        this.dailyCount[type] = (this.dailyCount[type] || 0) + 1;
        this.config.lastAdTime = Date.now() / 1000;
        this._saveDailyCount();
        if (onReward) onReward({ type });
      } else {
        if (onFail) onFail({ reason: 'user_cancelled' });
      }
    });

    // 展示广告
    ad.show().catch(() => {
      // 加载失败，预加载后重试
      ad.load().then(() => ad.show()).catch(err => {
        console.warn(`[广告] ${type} 展示失败:`, err);
        if (onFail) onFail({ reason: 'ad_load_failed' });
      });
    });
  }

  /** 预加载所有广告 */
  preloadAll() {
    Object.keys(this.adUnitIds).forEach(type => {
      const ad = this._getAd(type);
      if (ad) {
        ad.load().catch(() => {});
      }
    });
  }

  /** 获取今日观看统计 */
  getDailyStats() {
    const total = Object.values(this.dailyCount).reduce((a, b) => a + b, 0);
    return {
      total,
      remaining: this.config.maxDailyAds - total,
      byType: { ...this.dailyCount }
    };
  }
}

// 单例导出
module.exports = new AdManager();
