/**
 * js/core/Scene.js — 场景基类
 * 所有游戏场景必须继承此类，实现生命周期方法
 */
class Scene {
  /**
   * @param {Object} game - 游戏上下文对象
   * @param {Object} game.gameData - 全局游戏数据
   * @param {Function} game.switchScene - 场景切换方法
   * @param {Object} game.GAME_CONFIG - 游戏配置常量
   * @param {Function} game.dw - 设计宽度转实际像素
   * @param {Function} game.dh - 设计高度转实际像素
   * @param {number} game.screenWidth - 屏幕宽度
   * @param {number} game.screenHeight - 屏幕高度
   * @param {Object} game.safeArea - 刘海屏安全区域
   */
  constructor(game) {
    this.game = game; // 保存游戏上下文引用
  }

  /** 场景进入时调用，用于初始化资源、重置状态 */
  enter() {}

  /**
   * 每帧更新逻辑
   * @param {number} dt - 距离上一帧的时间间隔（秒）
   */
  update(dt) {}

  /**
   * 每帧渲染逻辑
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
   */
  render(ctx) {}

  /** 场景退出时调用，用于清理资源、移除事件监听 */
  exit() {}

  /**
   * 触摸开始事件
   * @param {{x: number, y: number}} pos - 触摸坐标（逻辑像素）
   * @param {Object} e - 原始触摸事件对象
   */
  onTouchStart(pos, e) {}

  /**
   * 触摸移动事件
   * @param {{x: number, y: number}} pos - 触摸坐标（逻辑像素）
   * @param {Object} e - 原始触摸事件对象
   */
  onTouchMove(pos, e) {}

  /**
   * 触摸结束事件
   * @param {{x: number, y: number}} pos - 触摸坐标（逻辑像素）
   * @param {Object} e - 原始触摸事件对象
   */
  onTouchEnd(pos, e) {}
}

// CommonJS 导出（微信小游戏环境）
module.exports = Scene;
