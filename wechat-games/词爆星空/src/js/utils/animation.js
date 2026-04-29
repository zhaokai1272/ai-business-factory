/**
 * js/utils/animation.js — 缓动函数 & 插值工具
 * 提供常用缓动函数和线性插值，用于UI动画、粒子效果等
 */

/**
 * 线性插值：从a到b按比例t进行插值
 * @param {number} a - 起始值
 * @param {number} b - 结束值
 * @param {number} t - 插值因子 [0, 1]
 * @returns {number} 插值结果
 */
function lerp(a, b, t) {
  return a + (b - a) * t; // 线性：a + Δ * t
}

/**
 * 将值限制在 [min, max] 范围内
 * @param {number} val - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val)); // 先取max保底，再取min封顶
}

/**
 * 将t限制在 [0, 1] 范围
 * @param {number} t - 输入值
 * @returns {number} [0, 1]之间的值
 */
function saturate(t) {
  return clamp(t, 0, 1); // 饱和处理
}

// ==================== 缓动函数（t ∈ [0, 1]） ====================
// 所有缓动函数使用幂函数实现，轻量且高效

/** 缓入：慢→快（从0开始加速） */
function easeIn(t) {
  return t * t; // 二次方缓入
}

/** 缓出：快→慢（减速到0） */
function easeOut(t) {
  return t * (2 - t); // 二次方缓出，等价于 1 - (1-t)²
}

/** 缓入缓出：慢→快→慢（两端慢中间快） */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // 分段：前半缓入，后半缓出
}

/** 弹性缓出（橡皮筋效果，结束时弹跳） */
function easeOutElastic(t) {
  if (t === 0 || t === 1) return t; // 边界直接返回
  const p = 0.3;                                        // 弹跳周期
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

/** 回退缓出（超过目标后回弹） */
function easeOutBack(t) {
  const s = 1.70158; // 回退强度系数
  return (t -= 1) * t * ((s + 1) * t + s) + 1;
}

/** 弹跳缓出（篮球落地弹跳效果） */
function easeOutBounce(t) {
  // 分段弹跳，每次弹跳高度递减
  if (t < 1 / 2.75) return 7.5625 * t * t;
  else if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  else if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  else return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

/** 强缓入（四次方，更极端的加速） */
function easeInQuart(t) {
  return t * t * t * t;
}

/** 强缓出（四次方，更极端的减速） */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

// CommonJS 导出
module.exports = {
  lerp,
  clamp,
  saturate,
  easeIn,
  easeOut,
  easeInOut,
  easeOutElastic,
  easeOutBack,
  easeOutBounce,
  easeInQuart,
  easeOutQuart
};
