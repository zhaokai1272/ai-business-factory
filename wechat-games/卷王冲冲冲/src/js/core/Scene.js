/**
 * 场景基类 - 所有场景的抽象基类
 * 提供生命周期钩子和场景切换机制
 */
class Scene {
  /**
   * @param {Object} game - 游戏主实例引用
   */
  constructor(game) {
    this.game = game; // 游戏主实例
    this.ctx = game.ctx; // Canvas上下文(快捷引用)
    this.canvas = game.canvas; // Canvas元素
    this.canvasWidth = game.canvasWidth; // 画布宽度
    this.canvasHeight = game.canvasHeight; // 画布高度
    this.active = false; // 场景是否活跃
    this.entered = false; // 是否已完成enter
  }

  /**
   * 场景进入时调用(初始化资源)
   */
  enter() {
    this.active = true;
    this.entered = true;
  }

  /**
   * 场景退出时调用(清理资源)
   */
  exit() {
    this.active = false;
    this.entered = false;
  }

  /**
   * 场景暂停时调用
   */
  pause() {
    // 子类可重写
  }

  /**
   * 场景恢复时调用
   */
  resume() {
    // 子类可重写
  }

  /**
   * 每帧更新(由主循环调用)
   * @param {number} deltaTime - 帧间隔时间(ms)
   */
  update(deltaTime) {
    // 子类实现
  }

  /**
   * 每帧渲染(由主循环调用)
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // 子类实现
  }

  /**
   * 处理触摸事件
   * @param {Object} event - 触摸事件对象
   * @returns {boolean} 是否消费了事件
   */
  handleTouch(event) {
    return false; // 默认不消费
  }

  /**
   * 切换到指定场景
   * @param {string} sceneName - 场景名称('menu'|'game'|'result')
   * @param {Object} params - 传递给目标场景的参数
   */
  switchTo(sceneName, params = {}) {
    this.game.switchScene(sceneName, params);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Scene;
}
