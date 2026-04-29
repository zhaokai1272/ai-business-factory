/**
 * ResultScene.js — 成就展示场景
 * 显示最高合成等级、总身价、分享功能
 */

const Scene = require('../core/Scene');
const IdleSystem = require('../systems/IdleSystem');

class ResultScene extends Scene {
  constructor(game) {
    super(game);

    this.highestLevel = 1;
    this.highestName = '';
    this.totalWorth = 0;
    this.totalMerges = 0;
    this.playTime = 0;

    // 分享卡片
    this.cardAlpha = 0;
    this.cardScale = 0.8;
  }

  onEnter(data = {}) {
    super.onEnter(data);

    this.highestLevel = data.highestLevel || this.game.gameData.highestLevel || 1;
    this.highestName = data.highestName || '';
    this.totalWorth = data.totalWorth || this.game.gameData.totalWorth || 0;
    this.totalMerges = data.totalMerges || this.game.gameData.totalMerges || 0;
    this.playTime = data.playTime || 0;

    this.cardAlpha = 0;
    this.cardScale = 0.8;
  }

  update(dt) {
    if (!this.active) return;

    const dtSec = dt / 1000;

    // 卡片渐入动画
    this.cardAlpha += (1 - this.cardAlpha) * 5 * dtSec;
    this.cardScale += (1 - this.cardScale) * 4 * dtSec;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 背景
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1a0a2e');
    bgGrad.addColorStop(0.5, '#0a0a1e');
    bgGrad.addColorStop(1, '#0a0a2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 粒子背景装饰
    this._renderParticles();

    // 成就卡片
    this._renderAchievementCard(w, h);

    // 按钮
    this._renderButtons(w, h);
  }

  _renderParticles() {
    // 庆祝粒子 - 使用时间生成伪随机
    const ctx = this.ctx;
    const t = Date.now() / 1000;
    for (let i = 0; i < 20; i++) {
      const seed = i * 137.508;
      const x = (Math.sin(t * 0.7 + seed) * 0.4 + 0.5) * this.width;
      const y = (Math.cos(t * 0.5 + seed) * 0.3 + 0.7) * this.height;
      const alpha = 0.3 + 0.3 * Math.sin(t * 2 + seed);
      const size = 2 + Math.abs(Math.sin(t + seed)) * 3;

      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderAchievementCard(w, h) {
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = this.cardAlpha;

    const cardW = w * 0.85;
    const cardH = h * 0.6;
    const cardX = (w - cardW) / 2;
    const cardY = h * 0.12;
    const scale = this.cardScale;

    ctx.translate(w / 2, cardY + cardH / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -(cardY + cardH / 2));

    // 卡片背景
    ctx.fillStyle = 'rgba(40, 20, 60, 0.9)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    this.drawRoundRect(cardX, cardY, cardW, cardH, 24);
    ctx.stroke();

    // 皇冠图标
    this.drawText('👑', w / 2, cardY + 40, '36px "PingFang SC", sans-serif', '#FFD700');

    // 标题
    this.drawText('合成成就', w / 2, cardY + 85, 'bold 28px "PingFang SC", sans-serif', '#FFD700');

    // 最高合成等级
    const levelY = cardY + 130;
    this.drawText('最高合成', w / 2, levelY, '14px "PingFang SC", sans-serif', 'rgba(255,255,255,0.5)');
    this.drawText(`Lv.${this.highestLevel} ${this.highestName}`,
      w / 2, levelY + 30, 'bold 24px "PingFang SC", sans-serif', '#FF6347');

    // 总身价
    const worthY = levelY + 70;
    this.drawText('当前总身价', w / 2, worthY, '14px "PingFang SC", sans-serif', 'rgba(255,255,255,0.5)');
    this.drawText(IdleSystem.formatEarnings(this.totalWorth),
      w / 2, worthY + 30, 'bold 22px "PingFang SC", sans-serif', '#FFD700');

    // 合成次数
    const mergeY = worthY + 65;
    this.drawText(`合成次数: ${this.totalMerges}`,
      w / 2, mergeY, '14px "PingFang SC", sans-serif', 'rgba(255,255,255,0.6)');

    // 游玩时间
    this.drawText(`游玩时间: ${this._formatTime(this.playTime)}`,
      w / 2, mergeY + 28, '14px "PingFang SC", sans-serif', 'rgba(255,255,255,0.6)');

    ctx.restore();
  }

  _renderButtons(w, h) {
    const ctx = this.ctx;
    const btnW = w * 0.55;
    const btnH = 50;
    const gap = 16;

    // 分享按钮
    const shareY = h * 0.78;
    ctx.fillStyle = '#FFD700';
    this.drawRoundRect((w - btnW) / 2, shareY, btnW, btnH, btnH / 2);
    this.drawText('📤 分享成就', w / 2, shareY + btnH / 2,
      'bold 18px "PingFang SC", sans-serif', '#333');

    // 继续按钮
    const continueY = shareY + btnH + gap;
    ctx.fillStyle = '#4169E1';
    this.drawRoundRect((w - btnW) / 2, continueY, btnW, btnH, btnH / 2);
    this.drawText('返回主菜单', w / 2, continueY + btnH / 2,
      'bold 18px "PingFang SC", sans-serif', '#fff');

    // 存储按钮位置
    this._shareBtn = { x: (w - btnW) / 2, y: shareY, w: btnW, h: btnH };
    this._menuBtn = { x: (w - btnW) / 2, y: continueY, w: btnW, h: btnH };
  }

  onTouchStart(x, y) {
    if (this._shareBtn &&
        x >= this._shareBtn.x && x <= this._shareBtn.x + this._shareBtn.w &&
        y >= this._shareBtn.y && y <= this._shareBtn.y + this._shareBtn.h) {
      this._onShare();
      return;
    }
    if (this._menuBtn &&
        x >= this._menuBtn.x && x <= this._menuBtn.x + this._menuBtn.w &&
        y >= this._menuBtn.y && y <= this._menuBtn.y + this._menuBtn.h) {
      this._onBackToMenu();
      return;
    }
  }

  _onShare() {
    // 微信分享
    if (typeof wx !== 'undefined' && wx.shareAppMessage) {
      wx.shareAppMessage({
        title: `我合成了${this.highestName}！总身价${IdleSystem.formatEarnings(this.totalWorth)}`,
        imageUrl: '',
        success: () => {
          // 分享成功奖励
          this.game.gameData.diamonds += 5;
        }
      });
    }
  }

  _onBackToMenu() {
    this.switchTo(require('./MenuScene'));
  }

  _formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}小时${m}分钟`;
    if (m > 0) return `${m}分钟${s}秒`;
    return `${s}秒`;
  }
}

module.exports = ResultScene;
