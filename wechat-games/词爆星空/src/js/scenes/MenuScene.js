/**
 * js/scenes/MenuScene.js — 主菜单场景
 * 显示游戏标题、开始按钮、资源栏、商店/排行榜入口
 */
const Scene = require('../core/Scene.js');

class MenuScene extends Scene {
  constructor(game) {
    super(game);
    this._buttons = []; // 按钮列表 [{x, y, w, h, text, action, color}]
    this._titleAnim = 0; // 标题动画进度 0~1（脉冲效果）
  }

  enter() {
    // 初始化按钮布局（基于设计稿750×1334，使用dw/dh转换）
    const { dw, dh, screenWidth, screenHeight } = this.game;

    // 清空按钮列表，重新构建
    this._buttons = [];

    // "开始游戏"按钮 — 主CTA，居中 390 屏宽
    this._buttons.push({
      id: 'start',
      x: dw(35),
      y: dh(580),
      w: dw(320),
      h: dh(88),
      text: '开始游戏',
      color: '#FF6B35',     // 暖橙色
      action: () => this._onStartGame()
    });

    // "商店"按钮 — 左下
    this._buttons.push({
      id: 'shop',
      x: dw(30),
      y: dh(740),
      w: dw(160),
      h: dh(72),
      text: '🏪 商店',
      color: '#4ECDC4',     // 青色
      action: () => this._onOpenShop()
    });

    // "排行榜"按钮 — 右下，与商店对称
    this._buttons.push({
      id: 'rank',
      x: dw(200),
      y: dh(740),
      w: dw(160),
      h: dh(72),
      text: '🏆 排行',
      color: '#FFE66D',     // 金色
      action: () => this._onOpenRank()
    });

    // 检查体力是否足够
    if (this.game.gameData.energy < this.game.GAME_CONFIG.energyCost) {
      console.warn('[菜单] 体力不足，弹窗提示');
      // 实际项目中此处弹出体力不足提示
    }
  }

  update(dt) {
    // 标题动画：正弦波脉冲（0→1→0，周期约2秒）
    this._titleAnim += dt * 1.5;
    if (this._titleAnim > Math.PI * 2) {
      this._titleAnim -= Math.PI * 2; // 循环
    }
  }

  render(ctx) {
    const { dw, dh, screenWidth, screenHeight, safeArea } = this.game;

    // === 背景渐变 ===
    const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
    gradient.addColorStop(0, '#0F0C29');   // 深紫黑
    gradient.addColorStop(0.5, '#302B63'); // 中紫
    gradient.addColorStop(1, '#24243E');   // 深蓝紫
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // === 装饰星星（背景点缀） ===
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const stars = [
      [40, 100], [350, 80], [80, 300], [310, 250],
      [50, 500], [340, 450], [180, 150], [200, 380]
    ];
    stars.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(dw(sx), dh(sy), dw(3), 0, Math.PI * 2);
      ctx.fill();
    });

    // === 游戏标题 "词爆星空" ===
    const titlePulse = 1 + Math.sin(this._titleAnim) * 0.05; // ±5%缩放脉冲
    ctx.save();
    ctx.translate(screenWidth / 2, dh(280)); // 标题中心位置
    ctx.scale(titlePulse, titlePulse);

    // 标题文字带发光效果
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = dw(30);
    ctx.fillStyle = '#FFD700'; // 金色
    // 使用系统默认中文字体
    ctx.font = `bold ${dw(72)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('词爆星空', 0, 0);

    // 副标题
    ctx.shadowBlur = dw(10);
    ctx.fillStyle = '#FFE66D';
    ctx.font = `${dw(28)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('拼字成词，引爆星空', 0, dh(70));
    ctx.restore();

    // === 资源栏：金币/钻石/体力 ===
    const resourceY = dh(420);
    const resources = [
      { icon: '🪙', value: this.game.gameData.coins, x: dw(85) },
      { icon: '💎', value: this.game.gameData.diamonds, x: dw(195) },
      { icon: '⚡', value: this.game.gameData.energy, x: dw(305) }
    ];
    ctx.font = `${dw(24)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    resources.forEach(({ icon, value, x }) => {
      // 半透明背景卡片（缩小以适应三等分布局）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this._roundRect(ctx, x - dw(50), resourceY - dh(22), dw(100), dh(44), dw(12));
      ctx.fill();
      // 图标 + 数值
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${icon} ${value}`, x, resourceY);
    });

    // === 按钮渲染 ===
    this._buttons.forEach((btn) => {
      this._drawButton(ctx, btn);
    });

    // === 底部提示文字 ===
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = `${dw(20)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`关卡 ${this.game.gameData.level}  |  最高分 ${this.game.gameData.bestScore}`, screenWidth / 2, dh(820));
  }

  /**
   * 绘制圆角按钮
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} btn - 按钮对象
   */
  _drawButton(ctx, btn) {
    const { x, y, w, h, text, color } = btn;

    // 按钮阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = this.game.dw(10);
    ctx.shadowOffsetY = this.game.dh(4);

    // 按钮主体
    ctx.fillStyle = color;
    this._roundRect(ctx, x, y, w, h, this.game.dh(16));
    ctx.fill();

    // 清除阴影避免影响文字
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 高光条（顶部白色半透明）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this._roundRect(ctx, x + this.game.dw(6), y + this.game.dh(4), w - this.game.dw(12), h / 2, this.game.dh(12));
    ctx.fill();

    // 按钮文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${this.game.dw(32)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  /**
   * 绘制圆角矩形路径
   */
  _roundRect(ctx, x, y, w, h, r) {
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
  }

  onTouchEnd(pos) {
    // 检测点击哪个按钮
    for (const btn of this._buttons) {
      if (pos.x >= btn.x && pos.x <= btn.x + btn.w &&
          pos.y >= btn.y && pos.y <= btn.y + btn.h) {
        // 命中按钮，执行回调
        if (typeof btn.action === 'function') {
          btn.action();
        }
        return; // 只触发第一个命中的按钮
      }
    }
  }

  // ==================== 按钮回调 ====================

  /** "开始游戏" — 扣除体力并进入游戏场景 */
  _onStartGame() {
    const { gameData, GAME_CONFIG } = this.game;
    // 体力检查
    if (gameData.energy < GAME_CONFIG.energyCost) {
      wx.showToast({ title: '体力不足，请稍后再来', icon: 'none', duration: 2000 });
      return;
    }
    // 扣除体力
    gameData.energy -= GAME_CONFIG.energyCost;
    // 重置当前局数据
    gameData.score = 0;
    gameData.combo = 0;

    try {
      const GameScene = require('./GameScene.js');
      this.game.switchScene(new GameScene(this.game));
    } catch (error) {
      console.error('[菜单] 加载游戏场景失败:', error);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  }

  /** "商店"入口 */
  _onOpenShop() {
    // TODO: 切换到商店场景（暂以Toast占位）
    wx.showToast({ title: '商店功能开发中', icon: 'none', duration: 1500 });
  }

  /** "排行榜"入口 */
  _onOpenRank() {
    // 调用微信开放数据域展示排行榜
    try {
      wx.showToast({ title: '排行榜功能开发中', icon: 'none', duration: 1500 });
    } catch (error) {
      console.error('[菜单] 打开排行榜失败:', error);
    }
  }
}

module.exports = MenuScene;
