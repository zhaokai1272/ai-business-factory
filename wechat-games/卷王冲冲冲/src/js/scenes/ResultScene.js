/**
 * ResultScene.js — 卷王冲冲冲 结算场景
 * 展示分数、评价、复活/分享选项
 */

class ResultScene {
  constructor(game) {
    this.game = game;
    this.score = 0;
    this.rank = '';
    this.showRevive = true;
  }

  enter(params = {}) {
    this.score = params.score || 0;
    this.showRevive = params.canRevive !== false;
    this._calcRank();
  }

  /** 计算段位评价 */
  _calcRank() {
    const s = this.score;
    if (s >= 10000) this.rank = '👑 资本本资';
    else if (s >= 5000) this.rank = '💼 总监';
    else if (s >= 2000) this.rank = '👔 经理';
    else if (s >= 1000) this.rank = '🧑‍💻 骨干';
    else if (s >= 500) this.rank = '📋 专员';
    else if (s >= 200) this.rank = '🎓 实习生';
    else this.rank = '📄 简历待投';
  }

  render(ctx) {
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    const cx = w / 2;

    // 背景
    ctx.fillStyle = '#2C2C54';
    ctx.fillRect(0, 0, w, h);

    // 标题
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💼 今日战绩', cx, h * 0.15);

    // 段位
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(this.rank, cx, h * 0.25);

    // 分数
    ctx.font = '48px bold sans-serif';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${this.score}`, cx, h * 0.38);

    // 统计
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#AAA';
    const dist = this.score; // 距离=分数
    ctx.fillText(`奔跑距离: ${dist}m  |  最高速度: ${Math.floor(this.game.gameData.maxSpeed || 20)}km/h`, cx, h * 0.48);

    // 梗图文案
    const jokes = [
      '🏃 "只要我跑得够快，DDL就追不上我"',
      '☕ "咖啡续命中，勿扰"',
      '📋 "今天的会议，明天的需求"',
      '✂️ "N+1？不存在的，我N+无限续杯"'
    ];
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '16px sans-serif';
    ctx.fillText(jokes[Math.floor(Math.random() * jokes.length)], cx, h * 0.56);

    // 按钮区域
    const btnW = w * 0.7, btnH = 50, btnX = cx - btnW / 2;
    
    // 复活按钮
    if (this.showRevive) {
      ctx.fillStyle = '#FF6B6B';
      this._drawRoundRect(ctx, btnX, h * 0.65, btnW, btnH, 12);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(this._adLoading ? '📺 加载中...' : '📺 看广告复活', cx, h * 0.65 + 32);
    }

    // 再来一局
    ctx.fillStyle = '#4834D4';
    this._drawRoundRect(ctx, btnX, h * 0.75, btnW, btnH, 12);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('🔄 再来一局', cx, h * 0.75 + 32);

    // 分享按钮
    ctx.fillStyle = '#2ED573';
    this._drawRoundRect(ctx, btnX, h * 0.85, btnW, btnH, 12);
    ctx.fillStyle = '#FFF';
    ctx.fillText('📤 分享战绩', cx, h * 0.85 + 32);
  }

  _drawRoundRect(ctx, x, y, w, h, r) {
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
    ctx.fill();
  }

  handleTouch(e) {
    if (e.type !== 'touchstart') return;
    const { clientX, clientY } = e.touches[0];
    const w = this.game.canvasWidth, h = this.game.canvasHeight;
    const cx = w / 2, btnW = w * 0.7, btnX = cx - btnW / 2;

    // 复活按钮
    if (this.showRevive && clientY > h * 0.65 && clientY < h * 0.65 + 50) {
      this._watchAdForRevive();
      return;
    }
    // 再来一局
    if (clientY > h * 0.75 && clientY < h * 0.75 + 50) {
      this.game.switchScene('game');
      return;
    }
    // 分享
    if (clientY > h * 0.85 && clientY < h * 0.85 + 50) {
      this._doShare();
      return;
    }
  }



  /** 初始化广告（延迟到首次需要时） */
  _initAd() {
    if (this._videoAd) return;
    if (typeof wx === 'undefined') return;
    try {
      this._videoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-58e45f7d3183d214' });
      this._videoAd.onLoad(() => { this._adLoading = false; });
      this._videoAd.onError(() => { this._adLoading = false; });
      this._videoAd.onClose(res => {
        if (res && res.isEnded) {
          this.game.gameData.lives = 3;
          this.game.switchScene('game');
        }
      });
      this._adLoading = true;
      this._videoAd.load();
    } catch(e) {
      this._adLoading = false;
    }
  }

  /** 看广告复活 */
  _watchAdForRevive() {
    this._initAd();
    if (this._videoAd) {
      this._videoAd.show().catch(() => {
        this._videoAd.load().then(() => this._videoAd.show()).catch(() => {
          // 广告不可用，降级：免费复活1次
          this.game.gameData.lives = 1;
          this.game.switchScene('game');
        });
      });
    } else {
      // 无广告环境，直接复活
      this.game.gameData.lives = 1;
      this.game.switchScene('game');
    }
  }

  /** 微信分享 */
  _doShare() {
    if (typeof wx !== 'undefined' && wx.shareAppMessage) {
      wx.shareAppMessage({
        title: `我在卷王冲冲冲跑了${this.score}分！${this.rank}`,
        imageUrl: '',
        success: () => {
          this.game.gameData.diamonds = (this.game.gameData.diamonds || 0) + 3;
          if (typeof wx !== 'undefined') wx.showToast({title:'分享成功，+3💎',icon:'success'});
        }
      });
    } else {
      this.game.switchScene('menu');
    }
  }
}

module.exports = ResultScene;
