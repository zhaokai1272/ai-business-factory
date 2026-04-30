/**
 * MenuScene.js — 主菜单场景
 * 展示总身价、离线收益弹窗、入口按钮
 */

const Scene = require('../core/Scene');
const IdleSystem = require('../systems/IdleSystem');

class MenuScene extends Scene {
  constructor(game) {
    super(game);

    // 身价数字动画
    this.displayedWorth = 0;
    this.worthTarget = 0;
    this.worthAnimSpeed = 0;

    // 离线收益弹窗
    this.showOfflinePopup = false;
    this.offlineEarnings = 0;
    this.offlineSeconds = 0;
    this.popupAlpha = 0;
    this.popupTargetAlpha = 0;

    // 背景星星
    this.stars = [];
    this._initStars();

    // 按钮区域
    this.buttons = [];
  }

  _initStars() {
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 3
      });
    }
  }

  onEnter(data) {
    super.onEnter(data);

    // 处理离线收益
    const offline = this.game.idleSystem.processOfflineEarnings();
    if (offline.hasOffline) {
      this.showOfflinePopup = true;
      this.offlineEarnings = offline.earnings;
      this.offlineSeconds = offline.seconds;
      this.popupAlpha = 0;
      this.popupTargetAlpha = 1;
    } else {
      this.showOfflinePopup = false;
      this.popupAlpha = 0;
      this.popupTargetAlpha = 0;
    }

    // 设置身价动画目标
    this.worthTarget = this.game.gameData.totalWorth;
    if (this.displayedWorth === 0) {
      this.displayedWorth = this.worthTarget;
    }

    // 构建按钮区域（Canvas坐标）
    this._buildButtons();

    // 弹窗状态
    this._popupOpen = null;
    this._shopItems = [];
    this._rankData = [];
  }

  _buildButtons() {
    const w = this.width;
    const h = this.height;
    const btnW = w * 0.6;
    const btnH = 56;
    const startY = h * 0.5;

    this.buttons = [
      {
        id: 'play',
        text: '继续合成',
        x: (w - btnW) / 2,
        y: startY + 20,
        w: btnW,
        h: btnH,
        color: '#FF6347',
        hoverColor: '#FF4500',
        action: () => this._onPlay()
      },
      {
        id: 'shop',
        text: '商店',
        x: w * 0.08,
        y: h * 0.82,
        w: w * 0.38,
        h: 44,
        color: '#4169E1',
        hoverColor: '#3158D0',
        action: () => this._onShop()
      },
      {
        id: 'rank',
        text: '排行榜',
        x: w * 0.54,
        y: h * 0.82,
        w: w * 0.38,
        h: 44,
        color: '#FFD700',
        hoverColor: '#DAA520',
        action: () => this._onRank()
      }
    ];
  }

  update(dt) {
    if (!this.active) return;

    const dtSec = dt;  // dt already in seconds from game.js

    // 弹窗渐入动画
    if (this.showOfflinePopup) {
      this.popupAlpha += (this.popupTargetAlpha - this.popupAlpha) * 5 * dtSec;
      this.popupAlpha = Math.min(1, Math.max(0, this.popupAlpha));
    }

    // 身价动画
    if (Math.abs(this.displayedWorth - this.worthTarget) > 1) {
      this.displayedWorth += (this.worthTarget - this.displayedWorth) * 4 * dtSec;
      if (Math.abs(this.displayedWorth - this.worthTarget) < 10) {
        this.displayedWorth = this.worthTarget;
      }
    }

    // 星星闪烁
    for (const s of this.stars) {
      s.twinkle += s.speed * dtSec;
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 背景（优先真实图片）
    const imgMgr = this.game.imageManager;
    const bgImg = imgMgr ? imgMgr.get('03_menu_bg.png') : null;
    if (bgImg && bgImg.complete && bgImg.width > 0) {
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a0a2e');
      bgGrad.addColorStop(0.5, '#1a0a3e');
      bgGrad.addColorStop(1, '#0a1a2e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 星星
    for (const s of this.stars) {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.twinkle));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 标题
    const titleY = h * 0.15;
    this.drawText('合成亿万达', w / 2, titleY, 'bold 36px "PingFang SC", sans-serif', '#FFD700');

    // 副标题
    this.drawText('拖拽合成 × 放置挂机', w / 2, titleY + 45, '16px "PingFang SC", sans-serif', 'rgba(255,255,255,0.6)');

    // 总身价展示
    const worthY = h * 0.32;
    this.drawText('总身价', w / 2, worthY - 10, '14px "PingFang SC", sans-serif', 'rgba(255,255,255,0.5)');

    const worthText = this._formatWorth(this.displayedWorth);
    this.drawText(worthText, w / 2, worthY + 28, 'bold 32px "PingFang SC", sans-serif', '#FFD700');

    // 金币和钻石信息
    const infoY = worthY + 65;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.drawRoundRect(w * 0.25, infoY - 12, w * 0.5, 36, 18);
    this.drawText(
      `🪙 ${IdleSystem.formatEarnings(this.game.gameData.coins)}  💎 ${this.game.gameData.diamonds}`,
      w / 2, infoY + 6,
      '14px "PingFang SC", sans-serif', '#fff'
    );

    // 加速器数量
    if (this.game.gameData.accelerators > 0) {
      this.drawText(
        `⚡ 加速器 x${this.game.gameData.accelerators}`,
        w / 2, infoY + 40,
        '13px "PingFang SC", sans-serif', '#FFD700'
      );
    }

    // 按钮
    for (const btn of this.buttons) {
      ctx.fillStyle = btn.color;
      this.drawRoundRect(btn.x, btn.y, btn.w, btn.h, btn.h / 2);
      this.drawText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2, 'bold 18px "PingFang SC", sans-serif', '#fff');
    }

    // 版本信息
    this.drawText('v1.0.0', w / 2, h - 20, '12px "PingFang SC", sans-serif', 'rgba(255,255,255,0.3)');

    // 弹窗
    if (this._popupOpen === 'shop') this._renderShopPopup();
    if (this._popupOpen === 'rank') this._renderRankPopup();

    // 离线收益弹窗
    if (this.showOfflinePopup && this.popupAlpha > 0.01) {
      this._renderOfflinePopup();
    }
  }

  _renderOfflinePopup() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 遮罩
    ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * this.popupAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // 弹窗主体
    const pw = w * 0.8;
    const ph = 220;
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;

    ctx.globalAlpha = this.popupAlpha;

    // 弹窗背景
    ctx.fillStyle = 'rgba(30, 20, 50, 0.95)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    this.drawRoundRect(px, py, pw, ph, 20);
    ctx.stroke();

    // 标题
    this.drawText('🎉 离线收益', px + pw / 2, py + 35, 'bold 24px "PingFang SC", sans-serif', '#FFD700');

    // 离线时间
    const timeText = this._formatOfflineTime(this.offlineSeconds);
    this.drawText(`离线 ${timeText}`, px + pw / 2, py + 70, '14px "PingFang SC", sans-serif', 'rgba(255,255,255,0.7)');

    // 收益
    this.drawText(
      `+ ${IdleSystem.formatEarnings(this.offlineEarnings)} 金币`,
      px + pw / 2, py + 110,
      'bold 28px "PingFang SC", sans-serif', '#FF6347'
    );

    // 确认按钮
    const btnW = 150;
    const btnH = 42;
    const btnX = px + (pw - btnW) / 2;
    const btnY = py + ph - 60;
    ctx.fillStyle = '#FFD700';
    this.drawRoundRect(btnX, btnY, btnW, btnH, btnH / 2);
    this.drawText('领取收益', btnX + btnW / 2, btnY + btnH / 2, 'bold 16px "PingFang SC", sans-serif', '#333');

    // 存储弹窗按钮位置供点击检测
    this._popupBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

    ctx.globalAlpha = 1;
  }

  onTouchStart(x, y) {
    // 检查弹窗
    if (this._popupOpen) { this._handlePopupTouch(x, y); return; }
    // 检查离线弹窗按钮
    if (this.showOfflinePopup && this._popupBtn) {
      const b = this._popupBtn;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.showOfflinePopup = false;
        this.popupTargetAlpha = 0;
        return;
      }
      // 弹窗显示时不响应其他点击
      return;
    }

    // 检查主按钮
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        btn.action();
        return;
      }
    }
  }

  _onPlay() {
    this.game.switchScene('game');
  }

  _onShop() {
    this._popupOpen = 'shop';
    this._shopItems = [
      {id:'accel1',name:'加速器x1',price:50,desc:'30秒2.5倍速',icon:'⚡'},
      {id:'accel3',name:'加速器x3',price:120,desc:'省20金币',icon:'⚡⚡'},
      {id:'accel5',name:'加速器x5',price:180,desc:'省70金币',icon:'⚡⚡⚡'},
      {id:'gem10',name:'钻石x10',price:5,desc:'钻石货币',icon:'💎'},
      {id:'gem50',name:'钻石x50',price:20,desc:'省5钻石',icon:'💎💎'},
    ];
  }

  _onRank() {
    this._popupOpen = 'rank';
    this._rankData = [{name:'你',worth:this.game.gameData.totalWorth||0,me:true}];
    if (typeof wx !== 'undefined' && wx.cloud) {
      try {
        wx.cloud.callFunction({name:'leaderboard',data:{type:'worth',limit:10}}).then(res => {
          if (res.result && res.result.list) {
            this._rankData = res.result.list.map((r,i) => ({
              name: r.nickName||'玩家'+i, worth: r.totalWorth, me: false
            }));
          }
        }).catch(() => {});
      } catch(e) {}
    }
  }

  _formatWorth(worth) {
    if (worth >= 1e16) return `${(worth / 1e16).toFixed(2)} 亿亿元`;
    if (worth >= 1e12) return `${(worth / 1e12).toFixed(2)} 万亿元`;
    if (worth >= 1e8) return `${(worth / 1e8).toFixed(2)} 亿元`;
    if (worth >= 1e4) return `${(worth / 1e4).toFixed(2)} 万元`;
    return `${worth} 元`;
  }

  _formatOfflineTime(seconds) {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
  }



  _handlePopupTouch(x, y) {
    const w = this.width, h = this.height;
    const px = w * 0.08, py = h * 0.1, pw = w * 0.84, ph = h * 0.65;

    // Close X
    if (x > px + pw - 40 && x < px + pw && y > py && y < py + 40) {
      this._popupOpen = null; return;
    }

    if (this._popupOpen === 'shop') {
      const startY = py + 50, rowH = 48;
      for (let i = 0; i < this._shopItems.length; i++) {
        const ry = startY + i * rowH;
        if (y > ry && y < ry + rowH && x > px + 5 && x < px + pw - 5) {
          this._buyShopItem(i); return;
        }
      }
      this._popupOpen = null;
    } else if (this._popupOpen === 'rank') {
      this._popupOpen = null; // click anywhere to close
    }
  }

  _buyShopItem(idx) {
    const item = this._shopItems[idx];
    if (!item) return;
    const gd = this.game.gameData;
    const currency = item.id.startsWith('gem') ? 'diamonds' : 'coins';
    if (gd[currency] >= item.price) {
      gd[currency] -= item.price;
      if (item.id.startsWith('accel')) {
        const count = parseInt(item.id.replace('accel','')) || 1;
        gd.accelerators = (gd.accelerators || 0) + count;
      } else if (item.id.startsWith('gem')) {
        const count = parseInt(item.id.replace('gem','')) || 10;
        gd.diamonds = (gd.diamonds || 0) + count;
      }
      if (typeof wx !== 'undefined') wx.showToast({title:'购买成功！',icon:'success'});
    } else {
      if (typeof wx !== 'undefined') wx.showToast({title:'余额不足',icon:'none'});
    }
  }

  _renderShopPopup() {
    const ctx = this.ctx, w = this.width, h = this.height;
    const px = w * 0.08, py = h * 0.1, pw = w * 0.84, ph = h * 0.65;

    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(20,15,45,0.95)'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
    this.drawRoundRect(px, py, pw, ph, 18); ctx.stroke();

    this.drawText('🏪 商店', px + pw/2, py + 28, 'bold 20px "PingFang SC", sans-serif', '#FFD700');
    this.drawText('✕', px + pw - 22, py + 28, 'bold 18px "PingFang SC", sans-serif', '#e74c3c');

    // Balance
    const gd = this.game.gameData;
    this.drawText(`🪙${IdleSystem.formatEarnings(gd.coins)}  💎${gd.diamonds}`,
      px + pw/2, py + 48, '12px "PingFang SC", sans-serif', '#aaa');

    const startY = py + 55, rowH = 48;
    for (let i = 0; i < this._shopItems.length; i++) {
      const it = this._shopItems[i], ry = startY + i * rowH;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      this.drawRoundRect(px + 5, ry, pw - 10, rowH - 4, 8);

      this.drawText(it.icon+' '+it.name, px + 15, ry + 18, 'bold 13px "PingFang SC", sans-serif', '#fff', 'left');
      this.drawText(it.desc, px + 15, ry + 34, '11px "PingFang SC", sans-serif', '#888', 'left');
      const curr = it.id.startsWith('gem') ? '💎' : '🪙';
      this.drawText(curr+it.price, px + pw - 15, ry + 26, 'bold 14px "PingFang SC", sans-serif', '#FFD700', 'right');
    }
  }

  _renderRankPopup() {
    const ctx = this.ctx, w = this.width, h = this.height;
    const px = w * 0.08, py = h * 0.1, pw = w * 0.84, ph = h * 0.55;

    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(20,15,45,0.95)'; ctx.strokeStyle = '#4169E1'; ctx.lineWidth = 2;
    this.drawRoundRect(px, py, pw, ph, 18); ctx.stroke();

    this.drawText('🏆 富豪榜', px + pw/2, py + 28, 'bold 20px "PingFang SC", sans-serif', '#4169E1');

    const startY = py + 50, rowH = 38;
    const medals = ['🥇','🥈','🥉'];
    for (let i = 0; i < Math.min(this._rankData.length, 10); i++) {
      const r = this._rankData[i], ry = startY + i * rowH;
      ctx.fillStyle = r.me ? 'rgba(65,105,225,0.2)' : 'rgba(255,255,255,0.03)';
      this.drawRoundRect(px + 5, ry, pw - 10, rowH - 3, 6);

      this.drawText((medals[i]||(i+1+'.'))+' '+r.name,
        px + 15, ry + 20, '13px "PingFang SC", sans-serif', '#fff', 'left');
      this.drawText('💰'+IdleSystem.formatEarnings(r.worth||0),
        px + pw - 15, ry + 20, 'bold 13px "PingFang SC", sans-serif', '#FFD700', 'right');
    }

    this.drawText('点击任意处关闭', px+pw/2, py+ph-12, '11px "PingFang SC", sans-serif', 'rgba(255,255,255,0.4)');
  }
}

module.exports = MenuScene;
