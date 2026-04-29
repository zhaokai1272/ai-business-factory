/**
 * 主菜单场景 - 游戏入口界面
 * 显示标题、打工人形象、开始按钮、金币/钻石、商店/排行榜入口
 */
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
        action: () => this.showToast('商店功能开发中~'),
      },
      {
        id: 'rank',
        x: cx - btnW / 2 + btnW - 85 + 95,
        y: 0,
        width: 85,
        height: 40,
        text: '排行',
        color: '#3498db',
        action: () => this.showToast('排行榜功能开发中~'),
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
    const y = this.canvasHeight * 0.55;
    const cx = this.canvasWidth / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';

    // 金币
    ctx.fillText(`💰 ${this.game.gameData.coins}`, cx - 50, y);

    // 钻石
    ctx.fillText(`💎 ${this.game.gameData.diamonds}`, cx + 50, y);
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
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MenuScene;
}
