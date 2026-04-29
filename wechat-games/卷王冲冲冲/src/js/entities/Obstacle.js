/**
 * 障碍物类 - 职场障碍
 * 类型：老板👔 / 会议📋 / 加班💻 / 裁员✂️
 * 从右侧生成向左移动
 */

// 障碍物类型定义
const OBSTACLE_TYPES = {
  BOSS: {
    type: 'boss',
    width: 55,
    height: 65,
    color: '#e74c3c', // 红色系 - 老板
    score: 10,
  },
  MEETING: {
    type: 'meeting',
    width: 60,
    height: 45,
    color: '#3498db', // 蓝色系 - 会议
    score: 10,
  },
  OVERTIME: {
    type: 'overtime',
    width: 50,
    height: 50,
    color: '#2c3e50', // 深色系 - 加班
    score: 10,
  },
  LAYOFF: {
    type: 'layoff',
    width: 45,
    height: 55,
    color: '#f39c12', // 橙色系 - 裁员
    score: 15,
  },
};

class Obstacle {
  constructor() {
    this.x = 0; // X坐标(屏幕右外)
    this.y = 0; // Y坐标(跑道中心)
    this.width = 50; // 宽度
    this.height = 50; // 高度
    this.type = OBSTACLE_TYPES.OVERTIME; // 障碍物类型
    this.lane = 1; // 所在跑道索引
    this.speed = 0; // 移动速度(由gameData.speed决定)
    this._active = false; // 对象池标记
    this.passed = false; // 是否已被玩家越过(计分用)
    this.scored = false; // 是否已给分

    // 视觉效果
    this.wobble = 0; // 摆动偏移
    this.wobbleSpeed = 0.003 + Math.random() * 0.005; // 摆动速度
    this.flashTimer = 0; // 闪红计时器
    this.flashing = false; // 是否在闪烁
  }

  /**
   * 初始化障碍物
   * @param {number} x - 初始X坐标
   * @param {number} y - 初始Y坐标
   * @param {number} lane - 跑道索引
   * @param {string} typeKey - 类型键('boss'|'meeting'|'overtime'|'layoff')
   */
  init(x, y, lane, typeKey) {
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.type = OBSTACLE_TYPES[typeKey] || OBSTACLE_TYPES.OVERTIME;
    this.width = this.type.width;
    this.height = this.type.height;
    this.speed = 0;
    this.passed = false;
    this.scored = false;
    this.wobble = 0;
    this.flashTimer = 0;
    this.flashing = false;
    return this;
  }

  /**
   * 获取碰撞矩形
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getHitbox() {
    // 碰撞体比视觉略小，给玩家一些操作空间
    const shrink = 8;
    return {
      x: this.x - this.width / 2 + shrink,
      y: this.y - this.height / 2 + shrink,
      width: this.width - shrink * 2,
      height: this.height - shrink * 2,
    };
  }

  /**
   * 更新障碍物位置
   * @param {number} deltaTime - 帧间隔(ms)
   * @param {number} gameSpeed - 当前游戏速度
   */
  update(deltaTime, gameSpeed) {
    // 向左移动(速度=游戏基准速度 * delta系数)
    this.speed = gameSpeed;
    this.x -= this.speed * (deltaTime / 16.67);

    // 摆动效果
    this.wobble += this.wobbleSpeed * deltaTime;

    // 闪红计时器递减
    if (this.flashing) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.flashing = false;
      }
    }
  }

  /**
   * 触发碰撞闪烁效果
   */
  triggerFlash() {
    this.flashing = true;
    this.flashTimer = 200; // 闪红200ms
  }

  /**
   * 判断是否完全离开屏幕左边界
   * @returns {boolean}
   */
  isOffScreen() {
    return this.x < -this.width;
  }

  /**
   * 判断玩家是否已越过此障碍物(用于计分)
   * @param {number} playerX - 玩家X坐标
   * @returns {boolean}
   */
  isPassedBy(playerX) {
    return this.x < playerX && !this.passed;
  }

  /**
   * 渲染障碍物
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const wobbleOffset = Math.sin(this.wobble) * 3; // 摆动偏移量

    ctx.save();
    ctx.translate(this.x, this.y + wobbleOffset);

    // 碰撞闪烁红色覆盖
    if (this.flashing) {
      ctx.globalAlpha = 0.5 + Math.sin(this.flashTimer * 0.05) * 0.5;
    }

    switch (this.type.type) {
      case 'boss':
        this.renderBoss(ctx);
        break;
      case 'meeting':
        this.renderMeeting(ctx);
        break;
      case 'overtime':
        this.renderOvertime(ctx);
        break;
      case 'layoff':
        this.renderLayoff(ctx);
        break;
      default:
        this.renderOvertime(ctx);
    }

    // 警告标识(红色感叹号悬浮)
    if (!this.flashing) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', 0, -this.height / 2 - 8);
    }

    ctx.restore();
  }

  /**
   * 绘制老板障碍 👔
   */
  renderBoss(ctx) {
    const w = this.width;
    const h = this.height;

    // 身体 (西装)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-w * 0.4, -h * 0.1, w * 0.8, h * 0.55);

    // 头
    ctx.fillStyle = '#f5d6a0';
    ctx.beginPath();
    ctx.arc(0, -h * 0.35, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // 领带 (金色 - 老板特权)
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.15);
    ctx.lineTo(-w * 0.12, h * 0.25);
    ctx.lineTo(w * 0.12, h * 0.25);
    ctx.closePath();
    ctx.fill();

    // 墨镜
    ctx.fillStyle = '#000';
    ctx.fillRect(-w * 0.2, -h * 0.42, w * 0.4, h * 0.1);

    // 👔 标识
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', 0, h * 0.45);
  }

  /**
   * 绘制会议障碍 📋
   */
  renderMeeting(ctx) {
    const w = this.width;
    const h = this.height;

    // 会议桌 (长椭圆)
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.4, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 桌面文件
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w * 0.2, -h * 0.15, w * 0.4, h * 0.3);

    // 文件线条
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.15, -h * 0.05);
    ctx.lineTo(w * 0.15, -h * 0.05);
    ctx.moveTo(-w * 0.15, h * 0.02);
    ctx.lineTo(w * 0.1, h * 0.02);
    ctx.stroke();

    // 小人头像(会议参与者)
    for (let i = -1; i <= 1; i += 2) {
      ctx.fillStyle = '#95a5a6';
      ctx.beginPath();
      ctx.arc(i * w * 0.22, -h * 0.05, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 📋 标识
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('会议', 0, h * 0.4);
  }

  /**
   * 绘制加班障碍 💻
   */
  renderOvertime(ctx) {
    const w = this.width;
    const h = this.height;

    // 笔记本电脑
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-w * 0.4, -h * 0.15, w * 0.8, h * 0.3);

    // 屏幕
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-w * 0.35, -h * 0.35, w * 0.7, h * 0.25);

    // 屏幕代码行
    ctx.fillStyle = '#2ecc71';
    ctx.font = '6px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('while(true)', -w * 0.3, -h * 0.25);
    ctx.fillText('{ work(); }', -w * 0.3, -h * 0.18);

    // 键盘
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-w * 0.35, h * 0.08, w * 0.7, h * 0.12);

    // 咖啡杯(加班伴侣)
    ctx.fillStyle = '#6f4e37';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.05, 6, 0, Math.PI * 2);
    ctx.fill();

    // 💻 标识
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('996', 0, h * 0.42);
  }

  /**
   * 绘制裁员障碍 ✂️
   */
  renderLayoff(ctx) {
    const w = this.width;
    const h = this.height;

    // 剪刀 (交叉两片)
    // 左刀片
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.ellipse(-w * 0.15, 0, w * 0.2, h * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 右刀片
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.ellipse(w * 0.15, 0, w * 0.2, h * 0.35, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 把手
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-w * 0.15, h * 0.3, 8, 0, Math.PI * 2);
    ctx.arc(w * 0.15, h * 0.3, 8, 0, Math.PI * 2);
    ctx.stroke();

    // ✂️ 标识
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('裁员', 0, h * 0.48);
  }

  /**
   * 重置对象(对象池调用)
   */
  reset() {
    this.x = -200;
    this.y = 0;
    this.lane = 1;
    this.passed = false;
    this.scored = false;
    this.flashing = false;
    this.flashTimer = 0;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Obstacle, OBSTACLE_TYPES };
}
