/**
 * 道具类 - 职场增益道具
 * 类型：☕咖啡(加速) / 🐟摸鱼(无敌/穿墙) / 💰涨薪(加分)
 */

// 道具类型定义
const POWERUP_TYPES = {
  COFFEE: {
    type: 'coffee',
    width: 35,
    height: 40,
    color: '#6f4e37', // 咖啡色
    effect: 'speed_boost', // 效果:加速
    duration: 3000, // 持续3秒
    label: '☕',
  },
  FISH: {
    type: 'fish',
    width: 40,
    height: 35,
    color: '#3498db', // 蓝色 - 摸鱼
    effect: 'invincible', // 效果:无敌
    duration: 5000, // 持续5秒
    label: '🐟',
  },
  SALARY: {
    type: 'salary',
    width: 38,
    height: 38,
    color: '#f1c40f', // 金色 - 涨薪
    effect: 'bonus_score', // 效果:加分
    duration: 0, // 即时效果
    label: '💰',
  },
};

class PowerUp {
  constructor() {
    this.x = 0; // X坐标
    this.y = 0; // Y坐标
    this.width = 35; // 宽度
    this.height = 40; // 高度
    this.type = POWERUP_TYPES.COFFEE; // 道具类型
    this.lane = 1; // 所在跑道
    this.speed = 0; // 移动速度
    this._active = false; // 对象池标记
    this.collected = false; // 是否已被收集

    // 视觉效果
    this.bobOffset = 0; // 上下浮动偏移
    this.bobPhase = Math.random() * Math.PI * 2; // 浮动相位
    this.rotation = 0; // 旋转角度
    this.glowIntensity = 0; // 发光强度
    this.glowDirection = 1; // 发光变化方向
    this.sparkTimer = 0; // 粒子计时器
  }

  /**
   * 初始化道具
   * @param {number} x - 初始X
   * @param {number} y - 初始Y
   * @param {number} lane - 跑道索引
   * @param {string} typeKey - 类型键
   */
  init(x, y, lane, typeKey) {
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.type = POWERUP_TYPES[typeKey] || POWERUP_TYPES.COFFEE;
    this._imgMgr = null; // set by caller
    this.width = this.type.width;
    this.height = this.type.height;
    this.speed = 0;
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.rotation = 0;
    this.glowIntensity = 0;
    this.glowDirection = 1;
    this.sparkTimer = 0;
    return this;
  }

  /**
   * 获取碰撞矩形
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * 应用道具效果到玩家
   * @param {Object} gameData - 全局游戏数据
   * @param {Player} player - 玩家实例
   */
  applyEffect(gameData, player) {
    switch (this.type.effect) {
      case 'speed_boost':
        // 咖啡效果：临时加速
        gameData.boostActive = true;
        gameData.boostTimer = this.type.duration;
        gameData.boostMultiplier = 1.5; // 1.5倍速
        gameData.combo++; // 连击+1
        break;

      case 'invincible':
        // 摸鱼效果：无敌状态
        player.activateInvincible(this.type.duration);
        gameData.combo++;
        break;

      case 'bonus_score':
        // 涨薪效果：即时加分
        const bonusPoints = 50 + Math.floor(gameData.combo * 10); // 基础50+连击加成
        gameData.score += bonusPoints;
        gameData.coins += Math.floor(bonusPoints / 10); // 金币=分数的10%
        gameData.combo++;
        break;

      default:
        break;
    }
    this.collected = true;
  }

  /**
   * 更新道具
   * @param {number} deltaTime - 帧间隔
   * @param {number} gameSpeed - 游戏速度
   */
  update(deltaTime, gameSpeed) {
    // 向左移动
    this.speed = gameSpeed;
    this.x -= this.speed * (deltaTime / 16.67);

    // 上下浮动
    this.bobOffset = Math.sin(this.bobPhase + performance.now() * 0.003) * 5;

    // 旋转
    this.rotation += deltaTime * 0.002;

    // 发光脉冲
    this.glowIntensity += 0.02 * this.glowDirection;
    if (this.glowIntensity >= 1) this.glowDirection = -1;
    if (this.glowIntensity <= 0) this.glowDirection = 1;

    // 粒子效果计时
    this.sparkTimer += deltaTime;
  }

  /**
   * 是否离开屏幕
   * @returns {boolean}
   */
  isOffScreen() {
    return this.x < -this.width;
  }

  /**
   * 渲染道具
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y + this.bobOffset);

    const glowAlpha = 0.3 + this.glowIntensity * 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.width * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(this.rotation);

    switch (this.type.type) {
      case 'coffee':
        this.renderCoffee(ctx);
        break;
      case 'fish':
        this.renderFish(ctx);
        break;
      case 'salary':
        this.renderSalary(ctx);
        break;
      default:
        this.renderCoffee(ctx);
    }

    // 粒子效果
    if (this.sparkTimer > 150) {
      this.sparkTimer = 0;
      this.renderSpark(ctx);
    }

    ctx.restore();
  }

  /**
   * 绘制咖啡道具 ☕
   */
  renderCoffee(ctx) {
    const w = this.width;
    const h = this.height;

    // 杯子
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, -h * 0.3);
    ctx.lineTo(-w * 0.25, h * 0.3);
    ctx.lineTo(w * 0.25, h * 0.3);
    ctx.lineTo(w * 0.35, -h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6f4e37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 咖啡液
    ctx.fillStyle = '#6f4e37';
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, w * 0.25, 0, Math.PI);
    ctx.fill();

    // 把手
    ctx.strokeStyle = '#6f4e37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.3, 0, w * 0.15, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    // 热气
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, -h * 0.35);
      ctx.quadraticCurveTo(i * 8 + 3, -h * 0.55, i * 8, -h * 0.7);
      ctx.stroke();
    }
  }

  /**
   * 绘制摸鱼道具 🐟
   */
  renderFish(ctx) {
    const w = this.width;
    const h = this.height;

    // 鱼身
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 鱼尾
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, 0);
    ctx.lineTo(-w * 0.55, -h * 0.25);
    ctx.lineTo(-w * 0.55, h * 0.25);
    ctx.closePath();
    ctx.fill();

    // 鱼眼
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(w * 0.2, -h * 0.08, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w * 0.23, -h * 0.08, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 鱼鳞
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 8, 3, 6, 0, Math.PI);
      ctx.stroke();
    }

    // 气泡
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(w * 0.3, -h * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制涨薪道具 💰
   */
  renderSalary(ctx) {
    const w = this.width;
    const h = this.height;

    // 钱袋
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(0, -h * 0.05, w * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 袋口收束
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.35);
    ctx.quadraticCurveTo(0, -h * 0.2, w * 0.2, -h * 0.35);
    ctx.quadraticCurveTo(0, -h * 0.45, -w * 0.2, -h * 0.35);
    ctx.fill();

    // $符号
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, -h * 0.02);

    // 金光射线
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * w * 0.3, Math.sin(angle) * h * 0.25);
      ctx.lineTo(Math.cos(angle) * w * 0.5, Math.sin(angle) * h * 0.45);
      ctx.stroke();
    }
  }

  /**
   * 绘制粒子火花
   */
  renderSpark(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 15;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  /**
   * 重置(对象池)
   */
  reset() {
    this.x = -200;
    this.y = 0;
    this.lane = 1;
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.rotation = 0;
    this.glowIntensity = 0;
    this.glowDirection = 1;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PowerUp, POWERUP_TYPES };
}
