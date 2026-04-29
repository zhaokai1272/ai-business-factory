/**
 * 缓动函数库 — Easing Functions
 * 用于合成动画、弹跳、金币飞行等效果
 */

const Easing = {
  /**
   * easeOutBack — 回弹缓出
   * 用于合成弹跳动画
   */
  easeOutBack(t, s = 1.70158) {
    return (t -= 1) * t * ((s + 1) * t + s) + 1;
  },

  /**
   * easeOutElastic — 弹性缓出
   * 用于金币爆发动画
   */
  easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 1) * (2 * Math.PI) / 0.3) + 1;
  },

  /**
   * easeOutBounce — 弹跳缓出
   */
  easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  /**
   * easeInOutQuad — 二次缓入缓出
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  /**
   * easeOutQuad — 二次缓出
   * 用于UI元素淡入
   */
  easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  },

  /**
   * easeInOutCubic — 三次缓入缓出
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  /**
   * linear — 线性
   */
  linear(t) {
    return t;
  },

  /**
   * lerp — 线性插值
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  /**
   * clamp — 值钳制
   */
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
};

module.exports = Easing;
