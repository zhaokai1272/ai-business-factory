/**
 * 缓动函数工具 - 提供各种贝塞尔曲线和标准缓动
 * 用于玩家切换跑道、UI弹出等动画效果
 */
const Easing = {
  /**
   * 线性缓动
   */
  linear: (t) => t,

  /**
   * 二次缓入
   */
  easeInQuad: (t) => t * t,

  /**
   * 二次缓出
   */
  easeOutQuad: (t) => t * (2 - t),

  /**
   * 二次缓入缓出
   */
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  /**
   * 三次缓入
   */
  easeInCubic: (t) => t * t * t,

  /**
   * 三次缓出
   */
  easeOutCubic: (t) => --t * t * t + 1,

  /**
   * 三次缓入缓出 - 用于跑道切换(带弹性感)
   */
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /**
   * 弹性缓出 - 用于道具弹入
   */
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3; // 弹性周期常数
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  /**
   * 回弹缓出 - 用于按钮点击
   */
  easeOutBack: (t) => {
    const c1 = 1.70158; // 回弹系数
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  /**
   * 弹跳缓出 - 用于分数跳字
   */
  easeOutBounce: (t) => {
    const n1 = 7.5625; // 弹跳系数
    const d1 = 2.75; // 弹跳基准
    if (t < 1 / d1) return n1 * t * t;
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    else return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  /**
   * 指数缓入 - 快速淡入
   */
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),

  /**
   * 指数缓出 - 快速淡出
   */
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

// 导出至全局(微信小游戏环境)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Easing;
}
