/**
 * 主菜单场景 - 游戏入口界面
 * 显示标题、打工人形象、开始按钮、金币/钻石、商店/排行榜入口
 */
const Scene = require('../core/Scene');

class MenuScene extends Scene {
  constructor(game) {
    super(game);

    // === UI元素位置 ===
    this.titleY = 0; // 标题Y坐标(动态计算)
    this.charY = 0; // 打工人形象Y坐标

    // === 按钮 ===
    this.buttons = [];
    this.defineButtons();

    // === 动画 ===
    this.enterTimer = 0; // 入场动画计时器
    this.enterDuration = 800; // 入场动画时长(ms)
    this.breatheAnim = 0; // 呼吸动画相位

    // === 粒子 ===
    this.particles = [];
    this.initParticles();

    // === 背景 ===
    this.bgOffset = 0; // 背景滚动偏移
    this._shopOpen = false;
    this._shopTab = 'skins';  // skins|items
    this._rankOpen = false;
    this._rankData = [];
    this._shopSkins = [
      {id:'default',name:'格子衫程序员',price:0,owned:true,color:'#3498db'},
      {id:'suit',name:'西装暴徒',price:500,owned:false,color:'#2c3e50'},
      {id:'panda',name:'熊猫眼加班人',price:1000,owned:false,color:'#95a5a6'},
      {id:'vacation',name:'摸鱼达人',price:1500,owned:false,color:'#e74c3c'},
      {id:'genz',name:'00后整顿职场',price:2000,owned:false,color:'#9b59b6'},
      {id:'boss',name:'老板本板',price:5000,owned:false,color:'#c0392b'},
    ];
    this._shopItems = [
      {id:'shield',name:'护身符',price:100,desc:'开局无敌3秒'},
      {id:'speed',name:'加速鞋',price:200,desc:'速度+30%'},
      {id:'double',name:'双倍金币',price:300,desc:'金币x2'},
    ];
  }

  /**
   * 定义所有按钮
   */
  defineButtons() {
    const btnW = 180;
    const btnH = 50;
    const cx = this.canvasWidth / 2;

    this.buttons = [
      {
        id: 'start',
        x: cx - btnW / 2,
        y: 0, // 动态设置
        width: btnW,
        height: btnH,
        text: '开始卷',
        color: '#e74c3c',
        action: () => this.switchTo('game'),
      },
      {
        id: 'shop',
        x: cx - btnW / 2 - 95,
        y: 0,
        width: 85,
        height: 40,
        text: '商店',
        color: '#f39c12',
        action: () => { this._shopOpen = true; this._shopTab = 'skins'; },
      },
      {
        id: 'rank',
        x: cx - btnW / 2 + btnW - 85 + 95,
        y: 0,
        width: 85,
        height: 40,
        text: '排行',
        color: '#3498db',
        action: () => { this._rankOpen = true; this._loadRank(); },
      },
    ];
  }

  /**
   * 初始化背景粒子(营造职场氛围)
   */
  initParticles() {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: 1 + Math.random() * 3,
        speed: 0.2 + Math.random() * 0.5,
        alpha: 0.2 + Math.random() * 0.4,
      });
    }
  }

  /**
   * 显示Toast提示
   */
  showToast(msg) {
    if (typeof wx !== 'undefined') {
      wx.showToast({ title: msg, icon: 'none', duration: 1500 });
    }
  }

  /**
   * 场景进入
   */
  enter() {
    super.enter();
    this.enterTimer = 0;
    this.bgOffset = 0;

    // 动态计算Y坐标
    this.titleY = this.canvasHeight * 0.12;
    this.charY = this.canvasHeight * 0.38;

    // 更新按钮Y坐标
    const btnStartY = this.canvasHeight * 0.68;
    this.buttons[0].y = btnStartY;
    // 商店/排行按钮
    const btnSecY = this.canvasHeight * 0.8;
    this.buttons[1].y = btnSecY;
    this.buttons[2].y = btnSecY;
  }

  /**
   * 更新
   */
  update(deltaTime) {
    this.enterTimer += deltaTime;
    this.breatheAnim += deltaTime * 0.001;
    this.bgOffset += deltaTime * 0.02;

    // 更新粒子
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].y -= this.particles[i].speed;
      if (this.particles[i].y < -10) {
        this.particles[i].y = this.canvasHeight + 10;
        this.particles[i].x = Math.random() * this.canvasWidth;
      }
    }
  }

  /**
   * 渲染
   */
  render(ctx) {
    // === 背景 ===
    this.renderBackground(ctx);

    // === 粒子 ===
    this.renderParticles(ctx);

    // === 标题 ===
    this.renderTitle(ctx);

    // === 打工人形象 ===
    this.renderCharacter(ctx);

    // === 资源显示 ===
    this.renderResources(ctx);

    // === 按钮 ===
    this.renderButtons(ctx);

    // === 底部信息 ===
    this.renderFooter(ctx);

    // === 弹窗（最上层） ===
    if (this._shopOpen) this._renderShopPopup(ctx);
    if (this._rankOpen) this._renderRankPopup(ctx);
  }

  /**
   * 渲染渐变背景
   */
  renderBackground(ctx) {
    // 天空渐变(清晨→傍晚)
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.3, '#302b63');
    gradient.addColorStop(0.6, '#24243e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 远景楼(剪影)
    ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
    const buildingPositions = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8];
    for (let i = 0; i < buildingPositions.length; i++) {
      const bx = (buildingPositions[i] * this.canvasWidth + this.bgOffset) % this.canvasWidth;
      const bw = 40 + Math.sin(i * 2.5) * 20;
      const bh = 80 + Math.abs(Math.cos(i * 1.7)) * 120;
      ctx.fillRect(bx, this.canvasHeight - bh - 50, bw, bh);
      // 窗户
      ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
      for (let wy = 0; wy < bh - 10; wy += 15) {
        for (let wx = 5; wx < bw - 10; wx += 12) {
          if (Math.random() > 0.3) {
            ctx.fillRect(bx + wx, this.canvasHeight - bh - 50 + wy, 5, 8);
          }
        }
      }
      ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
    }
  }

  /**
   * 渲染浮动粒子
   */
  renderParticles(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 渲染标题"卷王冲冲冲"
   */
  renderTitle(ctx) {
    const progress = Math.min(this.enterTimer / this.enterDuration, 1);
    const ease =
      typeof Easing !== 'undefined'
        ? Easing.easeOutBack(Math.min(progress * 1.5, 1))
        : progress;
    const scale = 0.5 + ease * 0.5;
    const alpha = Math.min(progress * 2, 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.canvasWidth / 2, this.titleY);
    ctx.scale(scale, scale);

    // 标题背景光晕
    const glowGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
    glowGradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, Math.PI * 2);
    ctx.fill();

    // 卷王冲冲冲 (主标题)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('卷王冲冲冲', 0, 0);

    // 副标题
    ctx.fillStyle = '#f39c12';
    ctx.font = '14px sans-serif';
    ctx.fillText('打工人の逆袭', 0, 28);

    // 底部装饰线
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-80, 38);
    ctx.lineTo(80, 38);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 渲染打工人形象(菜单展示)
   */
  renderCharacter(ctx) {
    const progress = Math.min(this.enterTimer / this.enterDuration, 1);
    const ease =
      typeof Easing !== 'undefined'
        ? Easing.easeOutElastic(Math.min(progress * 1.3, 1))
        : progress;
    const scale = ease;
    const alpha = Math.min(progress * 1.5, 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.canvasWidth / 2, this.charY);
    ctx.scale(1.5 * scale, 1.5 * scale); // 放大展示

    // 呼吸动效(微微上下)
    const breathe = Math.sin(this.breatheAnim) * 5;

    // === 身体 ===
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-15, -5 + breathe, 30, 30);

    // === 头 ===
    ctx.fillStyle = '#f5d6a0';
    ctx.beginPath();
    ctx.arc(0, -22 + breathe, 14, 0, Math.PI * 2);
    ctx.fill();

    // === 领带 ===
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, -8 + breathe);
    ctx.lineTo(-6, 15 + breathe);
    ctx.lineTo(6, 15 + breathe);
    ctx.closePath();
    ctx.fill();

    // === 眼睛(坚定的眼神) ===
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -25 + breathe, 2, 0, Math.PI * 2);
    ctx.arc(5, -25 + breathe, 2, 0, Math.PI * 2);
    ctx.fill();

    // === 嘴(自信微笑) ===
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -18 + breathe, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // === 公文包 ===
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(10, 0 + breathe, 14, 16);

    // === 头顶卷字标签 ===
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('卷', 0, -40 + breathe);

    // === 光环 ===
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -5 + breathe, 35, 0, Math.PI * 2);
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  /**
   * 渲染金币/钻石资源
   */
  renderResources(ctx) {
    const y = this.canvasHeight * 0.52;
    const cx = this.canvasWidth / 2;

    // 历史最高
    const hs = this.game.gameData.highScore || 0;
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`🏆 ${hs}`, cx, y);

    // 金币+钻石
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText(`💰${this.game.gameData.coins||0}  💎${this.game.gameData.diamonds||0}`, cx, y+28);

    // 段位
    let rank='📄 简历待投';
    if(hs>=10000) rank='👑 资本本资';
    else if(hs>=5000) rank='💼 总监';
    else if(hs>=2500) rank='👔 经理';
    else if(hs>=1000) rank='🧑‍💻 骨干';
    else if(hs>=500) rank='📋 专员';
    else if(hs>=200) rank='🎓 实习生';
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '13px sans-serif';
    ctx.fillText(rank, cx, y+48);
  }

  /**
   * 渲染按钮
   */
  renderButtons(ctx) {
    const progress = Math.min(this.enterTimer / this.enterDuration, 1);
    const btnEase =
      typeof Easing !== 'undefined'
        ? Easing.easeOutBack(Math.min(progress * 1.2, 1))
        : progress;

    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];

      ctx.save();
      ctx.globalAlpha = Math.min(progress * 2, 1);

      // 按钮缩放(按入场延迟)
      const delay = i * 0.15;
      const btnScale = Math.max(0, Math.min(1, btnEase - delay)) * 0.9 + 0.1;

      ctx.translate(btn.x + btn.width / 2, btn.y + btn.height / 2);
      ctx.scale(btnScale, btnScale);

      // 按钮阴影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-btn.width / 2 + 2, -btn.height / 2 + 2, btn.width, btn.height);

      // 按钮主体
      const btnGradient = ctx.createLinearGradient(0, -btn.height / 2, 0, btn.height / 2);
      btnGradient.addColorStop(0, btn.color);
      btnGradient.addColorStop(1, this.darkenColor(btn.color, 0.3));
      ctx.fillStyle = btnGradient;

      // 圆角矩形
      const r = 10;
      const bw = btn.width;
      const bh = btn.height;
      ctx.beginPath();
      ctx.moveTo(-bw / 2 + r, -bh / 2);
      ctx.lineTo(bw / 2 - r, -bh / 2);
      ctx.arcTo(bw / 2, -bh / 2, bw / 2, -bh / 2 + r, r);
      ctx.lineTo(bw / 2, bh / 2 - r);
      ctx.arcTo(bw / 2, bh / 2, bw / 2 - r, bh / 2, r);
      ctx.lineTo(-bw / 2 + r, bh / 2);
      ctx.arcTo(-bw / 2, bh / 2, -bw / 2, bh / 2 - r, r);
      ctx.lineTo(-bw / 2, -bh / 2 + r);
      ctx.arcTo(-bw / 2, -bh / 2, -bw / 2 + r, -bh / 2, r);
      ctx.closePath();
      ctx.fill();

      // 按钮文字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.text, 0, 0);

      ctx.restore();
    }
  }

  /**
   * 渲染底部信息
   */
  renderFooter(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('向上/下滑动切换跑道 | 躲避障碍 | 收集道具', this.canvasWidth / 2, this.canvasHeight - 20);
    ctx.fillText('v1.0.0', this.canvasWidth / 2, this.canvasHeight - 5);
  }

  /**
   * 颜色加深工具
   */
  darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.floor(r * (1 - factor));
    const dg = Math.floor(g * (1 - factor));
    const db = Math.floor(b * (1 - factor));
    return `rgb(${dr},${dg},${db})`;
  }

  /**
   * 触摸事件处理
   */
  handleTouch(event) {
    if (event.type !== 'touchstart') return false;

    const touch = event.touches[0];
    if (!touch) return false;
    const tx = touch.clientX;
    const ty = touch.clientY;

    // 弹窗关闭/交互
    if (this._shopOpen) { this._handleShopTouch(tx, ty); return true; }
    if (this._rankOpen) { this._rankOpen = false; return true; }

    // 检测按钮点击
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (
        tx >= btn.x &&
        tx <= btn.x + btn.width &&
        ty >= btn.y &&
        ty <= btn.y + btn.height
      ) {
        btn.action(); // 执行按钮动作
        return true; // 消费事件
      }
    }
    return false;
  }

  /** 加载排行榜 */
  _loadRank() {
    this._rankData = [{name:'你',score:this.game.gameData.highScore||0,me:true}];
    if (typeof wx !== 'undefined' && wx.cloud) {
      try {
        wx.cloud.callFunction({name:'leaderboard',data:{type:'top',limit:10}}).then(res => {
          if (res.result && res.result.list) {
            this._rankData = res.result.list.map((r,i) => ({
              name: r.nickName || '玩家'+i, score: r.score, me: r._openid === 'self'
            }));
          }
        }).catch(() => {});
      } catch(e) {}
    }
  }

  /** 商店触摸处理 */
  _handleShopTouch(tx, ty) {
    const w = this.canvasWidth, h = this.canvasHeight;
    const popX = w * 0.1, popY = h * 0.08, popW = w * 0.8, popH = h * 0.7;
    // Close button (X top-right)
    if (tx > popX + popW - 40 && tx < popX + popW && ty > popY && ty < popY + 40) {
      this._shopOpen = false; return;
    }
    // Tab buttons
    const tabY = popY + 45;
    if (ty > tabY && ty < tabY + 30) {
      if (tx > popX + 10 && tx < popX + popW/2) this._shopTab = 'skins';
      else if (tx > popX + popW/2 && tx < popX + popW - 10) this._shopTab = 'items';
      return;
    }
    // Item rows
    const items = this._shopTab === 'skins' ? this._shopSkins : this._shopItems;
    const startY = tabY + 40, rowH = 55;
    for (let i = 0; i < items.length; i++) {
      const ry = startY + i * rowH;
      if (ty > ry && ty < ry + rowH && tx > popX + 5 && tx < popX + popW - 5) {
        this._buyItem(i); return;
      }
    }
  }

  /** 购买道具 */
  _buyItem(idx) {
    const items = this._shopTab === 'skins' ? this._shopSkins : this._shopItems;
    const item = items[idx];
    if (!item) return;
    if (item.owned) return;
    const gd = this.game.gameData;
    if (gd.coins >= item.price) {
      gd.coins -= item.price;
      item.owned = true;
      if (this._shopTab === 'skins') {
        gd.activeSkin = item.id;
        if (typeof wx !== 'undefined') wx.showToast({title:'购买成功！',icon:'success'});
      } else {
        gd[item.id + 'Count'] = (gd[item.id + 'Count'] || 0) + 1;
        if (typeof wx !== 'undefined') wx.showToast({title:'获得 '+item.name,icon:'success'});
      }
    } else {
      if (typeof wx !== 'undefined') wx.showToast({title:'金币不足',icon:'none'});
    }
  }

  /** 渲染商店弹窗 */
  _renderShopPopup(ctx) {
    const w = this.canvasWidth, h = this.canvasHeight;
    const popX = w * 0.1, popY = h * 0.08, popW = w * 0.8, popH = h * 0.7;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    // Popup bg
    ctx.fillStyle = 'rgba(30,30,60,0.95)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    this.drawRoundRect(popX, popY, popW, popH, 16, ctx);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('商店', popX + popW/2, popY + 28);

    // Close X
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('✕', popX + popW - 22, popY + 28);

    // Tabs
    const tabY = popY + 45;
    ctx.fillStyle = this._shopTab === 'skins' ? '#e74c3c' : 'rgba(255,255,255,0.1)';
    this.drawRoundRect(popX + 10, tabY, popW/2 - 15, 30, 8, ctx);
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText('皮肤', popX + popW/4, tabY + 20);

    ctx.fillStyle = this._shopTab === 'items' ? '#e74c3c' : 'rgba(255,255,255,0.1)';
    this.drawRoundRect(popX + popW/2 + 5, tabY, popW/2 - 15, 30, 8, ctx);
    ctx.fillStyle = '#fff';
    ctx.fillText('道具', popX + popW * 0.75, tabY + 20);

    // Items
    const items = this._shopTab === 'skins' ? this._shopSkins : this._shopItems;
    const startY = tabY + 40, rowH = 55;
    for (let i = 0; i < items.length; i++) {
      const it = items[i], ry = startY + i * rowH;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      this.drawRoundRect(popX + 5, ry, popW - 10, rowH - 5, 8, ctx);
      ctx.fillStyle = it.color || '#fff';
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(it.name, popX + 15, ry + 20);
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif';
      ctx.fillText(it.desc || '', popX + 15, ry + 38);
      ctx.textAlign = 'right';
      if (it.owned) {
        ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('已拥有', popX + popW - 15, ry + 28);
      } else {
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('💰'+it.price, popX + popW - 15, ry + 28);
      }
    }
    ctx.textAlign = 'left';
  }

  /** 渲染排行榜弹窗 */
  _renderRankPopup(ctx) {
    const w = this.canvasWidth, h = this.canvasHeight;
    const popX = w * 0.08, popY = h * 0.1, popW = w * 0.84, popH = h * 0.6;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(30,30,60,0.95)';
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    this.drawRoundRect(popX, popY, popW, popH, 16, ctx);

    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 排行榜', popX + popW/2, popY + 28);

    const startY = popY + 50, rowH = 36;
    for (let i = 0; i < Math.min(this._rankData.length, 10); i++) {
      const r = this._rankData[i], ry = startY + i * rowH;
      const medals = ['🥇','🥈','🥉'];
      ctx.fillStyle = r.me ? 'rgba(231,76,60,0.2)' : 'rgba(255,255,255,0.03)';
      this.drawRoundRect(popX + 5, ry, popW - 10, rowH - 3, 6, ctx);
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText((medals[i] || (i+1+'.')) + ' ' + (r.name||'匿名'), popX + 15, ry + 22);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(r.score + '分', popX + popW - 15, ry + 22);
    }
    ctx.textAlign = 'left';

    // Tap to close hint
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('点击任意处关闭', popX + popW/2, popY + popH - 12);
    ctx.textAlign = 'left';
  }

  /** Draw round rect helper */
  drawRoundRect(x, y, w, h, r, ctx) {
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
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MenuScene;
}
