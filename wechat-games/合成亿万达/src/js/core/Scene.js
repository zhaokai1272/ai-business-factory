/**
 * Scene.js — 场景基类
 * 所有场景继承此类，实现统一生命周期
 */

class Scene {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.canvas = game.canvas;
    this.width = game.width;
    this.height = game.height;
    this.active = false;
  }

  /**
   * 场景进入时调用
   */
  onEnter(data) {
    this.active = true;
  }

  /**
   * 场景退出时调用
   */
  onExit() {
    this.active = false;
  }

  /**
   * 每帧更新
   * @param {number} dt - 帧间隔时间（毫秒）
   */
  update(dt) {
    // 子类实现
  }

  /**
   * 每帧渲染
   */
  render() {
    // 子类实现
  }

  /**
   * 触摸开始
   */
  onTouchStart(x, y) {
    // 子类实现
  }

  /**
   * 触摸移动
   */
  onTouchMove(x, y) {
    // 子类实现
  }

  /**
   * 触摸结束
   */
  onTouchEnd(x, y) {
    // 子类实现
  }

  /**
   * 场景切换便捷方法
   */
  switchTo(SceneClass, data) {
    this.game.switchScene(SceneClass, data);
  }

  /**
   * 获取屏幕中心点
   */
  get centerX() {
    return this.width / 2;
  }

  get centerY() {
    return this.height / 2;
  }

  /**
   * 绘制半透明遮罩
   */
  drawOverlay(alpha = 0.5) {
    this.ctx.save();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  /**
   * 绘制圆角矩形
   */
  drawRoundRect(x, y, w, h, r, fill = true) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  /**
   * 绘制文字（居中对齐）
   */
  drawText(text, x, y, font, color = '#fff', align = 'center') {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

module.exports = Scene;
