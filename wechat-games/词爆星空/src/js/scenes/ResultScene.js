/**
 * js/scenes/ResultScene.js — 结算场景
 * 显示得分+评价等级、"再来一局"/"分享"/"看广告翻倍"按钮
 */
const Scene = require('../core/Scene.js');

class ResultScene extends Scene {
  /**
   * @param {Object} game - 游戏上下文
   * @param {Object} result - 对局结果数据
   * @param {number} result.score - 本局得分
   * @param {number} result.wordsFound - 找到的词汇数
   * @param {number} result.maxCombo - 本局最高连击
   */
  constructor(game, result) {
    super(game);
    this._result = result;       // 对局结果
    this._buttons = [];          // 按钮列表
    this._starAnimProgress = 0;  // 星级展示动画进度
    this._starCount = 0;         // 评价星级（1~5）
    this._doubled = false;       // 是否已翻倍
    this._entranceAnim = 0;      // 入场动画进度
  }

  enter() {
    console.log(`[结算] 得分:${this._result.score} 词汇:${this._result.wordsFound} 最高连击:${this._result.maxCombo}`);

    // 计算评价等级（1~5星）
    this._starCount = this._calcRating(this._result.score);

    // 入场动画从0开始
    this._entranceAnim = 0;
    this._starAnimProgress = 0;
    this._doubled = false;

    // 构建按钮
    this._buildButtons();
  }

  /**
   * 根据分数计算星级评价
   * @param {number} score
   * @returns {number} 1~5星
   */
  _calcRating(score) {
    if (score >= 500) return 5;      // 500+分：5星
    if (score >= 300) return 4;      // 300+分：4星
    if (score >= 150) return 3;      // 150+分：3星
    if (score >= 50) return 2;       // 50+分：2星
    return 1;                        // 其他：1星
  }

  /** 构建按钮布局 */
  _buildButtons() {
    const { dw, dh, screenWidth } = this.game;
    this._buttons = [];

    // "再来一局"按钮
    this._buttons.push({
      id: 'retry',
      x: dw(130),
      y: dh(900),
      w: dw(490),
      h: dh(80),
      text: '🔄 再来一局',
      color: '#FF6B35',
      action: () => this._onRetry()
    });

    // "分享"按钮
    this._buttons.push({
      id: 'share',
      x: dw(130),
      y: dh(1000),
      w: dw(230),
      h: dh(64),
      text: '📤 分享',
      color: '#4ECDC4',
      action: () => this._onShare()
    });

    // "看广告翻倍"按钮
    this._buttons.push({
      id: 'adDouble',
      x: dw(390),
      y: dh(1000),
      w: dw(230),
      h: dh(64),
      text: this._doubled ? '✅ 已翻倍' : '🎬 翻倍',
      color: this._doubled ? '#888888' : '#FFE66D',
      action: () => this._onWatchAd()
    });
  }

  update(dt) {
    // 入场动画（0→1，约0.6秒完成）
    if (this._entranceAnim < 1) {
      this._entranceAnim = Math.min(1, this._entranceAnim + dt * 1.8);
    }
    // 星级逐个弹出（在入场后开始）
    if (this._entranceAnim >= 0.5 && this._starAnimProgress < this._starCount) {
      this._starAnimProgress += dt * 2.5; // 每0.4秒弹出一颗星
      if (this._starAnimProgress > this._starCount) {
        this._starAnimProgress = this._starCount;
      }
    }
  }

  render(ctx) {
    const { dw, dh, screenWidth, screenHeight, safeArea } = this.game;

    // === 背景 ===
    const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0d0d2b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 入场动画：从下方滑入
    const entranceOffset = (1 - this._entranceAnim) * dh(200);
    ctx.save();
    ctx.translate(0, entranceOffset);
    ctx.globalAlpha = this._entranceAnim;

    // === 标题"本局结束" ===
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = dw(20);
    ctx.font = `bold ${dw(48)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('本局结束', screenWidth / 2, dh(120));
    ctx.shadowBlur = 0;

    // === 评价星级 ===
    const starY = dh(200);
    const starSize = dw(56);
    const starGap = dw(16);
    const totalStarWidth = starSize * 5 + starGap * 4;
    const starStartX = (screenWidth - totalStarWidth) / 2;

    for (let i = 0; i < 5; i++) {
      const sx = starStartX + i * (starSize + starGap);
      const filled = i < Math.floor(this._starAnimProgress);
      const partial = i === Math.floor(this._starAnimProgress)
        ? this._starAnimProgress - Math.floor(this._starAnimProgress)
        : 0;

      ctx.font = `${dw(48)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (filled) {
        // 金色实心星
        ctx.fillStyle = '#FFD700';
        ctx.fillText('⭐', sx + starSize / 2, starY);
      } else if (partial > 0) {
        // 半星效果：先用灰色底再用裁剪金色
        ctx.fillStyle = '#555555';
        ctx.fillText('⭐', sx + starSize / 2, starY);
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx, starY - starSize / 2, starSize * partial, starSize);
        ctx.clip();
        ctx.fillStyle = '#FFD700';
        ctx.fillText('⭐', sx + starSize / 2, starY);
        ctx.restore();
      } else {
        // 灰色空心星
        ctx.fillStyle = '#555555';
        ctx.fillText('⭐', sx + starSize / 2, starY);
      }
    }

    // === 评价文字 ===
    const ratings = ['继续加油！', '初露锋芒', '渐入佳境', '词汇达人', '词霸天下！'];
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${dw(32)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(ratings[this._starCount - 1] || '继续加油！', screenWidth / 2, dh(280));

    // === 得分大数字 ===
    const displayScore = this._doubled ? this._result.score * 2 : this._result.score;
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${dw(80)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`${displayScore}`, screenWidth / 2, dh(380));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `${dw(24)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('得分', screenWidth / 2, dh(430));

    // 翻倍标记
    if (this._doubled) {
      ctx.fillStyle = '#FFE66D';
      ctx.font = `bold ${dw(22)}px "PingFang SC", sans-serif`;
      ctx.fillText('(已翻倍 ×2)', screenWidth / 2, dh(460));
    }

    // === 分隔线 ===
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = dw(1);
    ctx.beginPath();
    ctx.moveTo(dw(100), dh(500));
    ctx.lineTo(screenWidth - dw(100), dh(500));
    ctx.stroke();

    // === 统计数据行 ===
    const stats = [
      { label: '找到词汇', value: `${this._result.wordsFound} 个` },
      { label: '最高连击', value: `×${this._result.maxCombo}` },
      { label: '历史最高', value: `${this.game.gameData.bestScore}` }
    ];
    const statY = dh(560);
    const statWidth = screenWidth / 3;

    stats.forEach((stat, i) => {
      const sx = statWidth * i;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = `${dw(22)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(stat.label, sx + statWidth / 2, statY);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${dw(36)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(stat.value, sx + statWidth / 2, statY + dh(44));
    });

    // === 体力恢复提示 ===
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `${dw(22)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`剩余体力: ⚡ ${this.game.gameData.energy}`, screenWidth / 2, dh(680));

    // === 按钮 ===
    this._buttons.forEach((btn) => {
      this._drawButton(ctx, btn);
    });

    ctx.restore();
  }

  /** 绘制圆角按钮 */
  _drawButton(ctx, btn) {
    const { dw, dh } = this.game;
    const { x, y, w, h, text, color } = btn;

    // 阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = dw(8);
    ctx.shadowOffsetY = dh(3);

    // 按钮主体
    ctx.fillStyle = color;
    this._roundRect(ctx, x, y, w, h, dh(14));
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 高光
    if (color !== '#888888') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this._roundRect(ctx, x + dw(4), y + dh(3), w - dw(8), h / 2, dh(10));
      ctx.fill();
    }

    // 文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${dw(28)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  // ==================== 触摸事件 ====================

  onTouchEnd(pos) {
    for (const btn of this._buttons) {
      if (pos.x >= btn.x && pos.x <= btn.x + btn.w &&
          pos.y >= btn.y && pos.y <= btn.y + btn.h) {
        if (typeof btn.action === 'function') {
          btn.action();
        }
        return;
      }
    }
  }

  // ==================== 按钮回调 ====================

  /** 再来一局 */
  _onRetry() {
    const { gameData, GAME_CONFIG } = this.game;
    // 体力检查
    if (gameData.energy < GAME_CONFIG.energyCost) {
      wx.showToast({ title: '体力不足，请稍后再来', icon: 'none', duration: 2000 });
      return;
    }
    gameData.energy -= GAME_CONFIG.energyCost;
    gameData.score = 0;
    gameData.combo = 0;

    try {
      const GameScene = require('./GameScene.js');
      this.game.switchScene(new GameScene(this.game));
    } catch (error) {
      console.error('[结算] 加载游戏场景失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  }

  /** 分享 */
  _onShare() {
    try {
      wx.shareAppMessage({
        title: `我在词爆星空中获得了${this._result.score}分！快来挑战我吧！`,
        imageUrl: '', // TODO: 生成分享图
        success: () => {
          wx.showToast({ title: '分享成功！', icon: 'success' });
        },
        fail: (err) => {
          console.warn('[结算] 分享取消或失败:', err);
        }
      });
    } catch (error) {
      console.error('[结算] 分享调用失败:', error);
    }
  }

  /** 看广告翻倍 */
  _onWatchAd() {
    if (this._doubled) {
      wx.showToast({ title: '已经翻倍过了~', icon: 'none' });
      return;
    }

    // 创建激励视频广告（需先在微信后台申请广告位ID）
    try {
      const videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-xxxxxxxxxxxxx' // 替换为真实广告位ID（微信后台→流量主→广告管理）
      });

      // 监听广告加载
      videoAd.onLoad(() => {
        console.log('[广告] 激励视频加载成功');
      });

      videoAd.onError((err) => {
        console.error('[广告] 激励视频错误:', err);
        // 降级方案：直接给翻倍
        this._applyDouble();
        wx.showToast({ title: '广告加载失败，直接翻倍！', icon: 'none' });
      });

      videoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 广告完整播放，给翻倍
          this._applyDouble();
          wx.showToast({ title: '分数已翻倍！×2', icon: 'success' });
        } else {
          wx.showToast({ title: '需看完广告才能翻倍哦', icon: 'none' });
        }
        videoAd.destroy(); // 销毁广告实例
      });

      // 展示广告
      videoAd.show().catch((err) => {
        console.error('[广告] 展示失败:', err);
        // 失败降级
        this._applyDouble();
        videoAd.destroy();
      });
    } catch (error) {
      console.error('[广告] 创建广告失败:', error);
      // 降级：模拟翻倍
      this._applyDouble();
    }
  }

  /** 应用分数翻倍 */
  _applyDouble() {
    if (this._doubled) return;
    this._doubled = true;
    const doubled = this._result.score;
    this.game.gameData.score += doubled; // 加上翻倍的分数
    this._result.score *= 2;
    // 重新计算星级
    this._starCount = this._calcRating(this._result.score);
    // 更新按钮状态
    this._buildButtons();
    console.log(`[结算] 分数已翻倍: ${this._result.score}`);
  }

  // ==================== 工具方法 ====================

  /** 圆角矩形路径 */
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

  exit() {
    console.log('[结算] 结算场景退出');
  }
}

module.exports = ResultScene;
