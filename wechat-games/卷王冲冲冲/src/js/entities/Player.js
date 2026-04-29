/**
 * 玩家类 - 打工人角色
 * 在3条跑道间切换，拥有碰撞体和无敌状态
 */

// 跑道Y坐标常量（竖屏横向卷轴，跑道为水平带）
// 屏幕划分为上/中/下三个水平区域
const LANE_Y = [0, 1, 2]; // 跑道索引

class Player {
  /**
   * @param {Object} gameData - 全局游戏数据引用
   * @param {number} canvasWidth - 画布宽度
   * @param {number} canvasHeight - 画布高度
   */
  constructor(gameData, canvasWidth, canvasHeight) {
    this.gameData = gameData; // 全局数据引用

    // 画布尺寸
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 跑道系统 - 3条跑道均匀分布在竖屏中
    this.lane = 1; // 默认中间跑道(索引0=上,1=中,2=下)
    this.laneCount = 3; // 总跑道数
    this.laneHeight = canvasHeight / this.laneCount; // 每条跑道高度

    // 玩家位置 (水平居中偏左)
    this.x = canvasWidth * 0.2; // X轴: 距左20%位置
    this.y = this.getLaneY(this.lane); // Y轴: 当前跑道中心

    // 玩家尺寸
    this.width = 50; // 碰撞体宽度
    this.height = 60; // 碰撞体高度

    // 碰撞体 (矩形，相对位置)
    this.hitbox = {
      x: this.x - this.width / 2, // 碰撞体左边界
      y: this.y - this.height / 2, // 碰撞体上边界
      width: this.width,
      height: this.height,
    };

    // 无敌状态
    this.invincible = false; // 是否无敌
    this.invincibleTimer = 0; // 无敌剩余时间(ms)
    this.invincibleDuration = 2000; // 无敌持续时长(ms)
    this.invincibleBlinkInterval = 100; // 无敌闪烁间隔(ms)
    this.invincibleBlinkTimer = 0; // 闪烁计时器
    this.visible = true; // 当前是否可见(用于闪烁)

    // 跑道切换动画
    this.switching = false; // 是否正在切换跑道
    this.switchFromY = 0; // 切换起始Y
    this.switchToY = 0; // 切换目标Y
    this.switchDuration = 200; // 切换动画时长(ms)
    this.switchTimer = 0; // 切换计时器
    this.switchEasing = null; // 切换缓动函数引用

    // 视觉效果
    this.scale = 1; // 缩放(用于受击/吃道具效果)
    this.alpha = 1; // 透明度
    this.trail = []; // 残影(速度线效果)
    this.trailMax = 5; // 最大残影数
    this.animFrame = 0; // 动画帧计数
    this.animTimer = 0; // 动画计时器
    this.animInterval = 150; // 动画切换间隔(ms)
  }

  /**
   * 获取指定跑道索引对应的Y坐标(跑道中心)
   * @param {number} laneIndex - 跑道索引(0/1/2)
   * @returns {number} Y坐标
   */
  getLaneY(laneIndex) {
    return laneIndex * this.laneHeight + this.laneHeight / 2;
  }

  /**
   * 切换到指定跑道(带动画)
   * @param {number} targetLane - 目标跑道索引(0/1/2)
   */
  switchLane(targetLane) {
    // 边界检查
    if (targetLane < 0 || targetLane >= this.laneCount) return;
    // 已在目标跑道或正在切换则忽略
    if (targetLane === this.lane && !this.switching) return;

    this.switching = true; // 开始切换动画
    this.switchFromY = this.y; // 记录起始Y
    this.switchToY = this.getLaneY(targetLane); // 计算目标Y
    this.switchTimer = 0; // 重置计时器
    this.lane = targetLane; // 立即更新跑道索引(碰撞检测用)
  }

  /**
   * 激活无敌状态
   * @param {number} duration - 无敌时长(ms)，默认2000
   */
  activateInvincible(duration = 2000) {
    this.invincible = true;
    this.invincibleTimer = duration;
    this.invincibleDuration = duration;
    this.invincibleBlinkTimer = 0;
    this.visible = true;
  }

  /**
   * 玩家受到伤害
   * @returns {boolean} 是否真的受伤(无敌时返回false)
   */
  takeDamage() {
    if (this.invincible) return false; // 无敌状态不受伤害
    this.gameData.lives--; // 扣除生命
    // 受伤特效：缩小并闪红
    this.scale = 0.8;
    this.activateInvincible(1500); // 受伤后短暂无敌
    return true;
  }

  /**
   * 更新玩家状态(每帧调用)
   * @param {number} deltaTime - 帧间隔时间(ms)
   */
  update(deltaTime) {
    // === 跑道切换动画 ===
    if (this.switching) {
      this.switchTimer += deltaTime;
      const progress = Math.min(this.switchTimer / this.switchDuration, 1); // 0~1
      // 使用缓动函数
      const easedProgress =
        typeof Easing !== 'undefined'
          ? Easing.easeInOutCubic(progress)
          : progress;
      this.y = this.switchFromY + (this.switchToY - this.switchFromY) * easedProgress;

      if (progress >= 1) {
        this.switching = false; // 动画完成
        this.y = this.switchToY; // 精确对齐
      }
    }

    // === 无敌状态处理 ===
    if (this.invincible) {
      this.invincibleTimer -= deltaTime;
      // 闪烁效果
      this.invincibleBlinkTimer += deltaTime;
      if (this.invincibleBlinkTimer >= this.invincibleBlinkInterval) {
        this.invincibleBlinkTimer -= this.invincibleBlinkInterval;
        this.visible = !this.visible; // 切换可见/不可见
      }
      if (this.invincibleTimer <= 0) {
        this.invincible = false; // 无敌结束
        this.visible = true; // 恢复可见
        this.scale = 1; // 恢复大小
      }
    }

    // === 缩放恢复 ===
    if (this.scale < 1 && !this.invincible) {
      this.scale += deltaTime * 0.002; // 缓慢恢复
      if (this.scale > 1) this.scale = 1;
    }

    // === 动画帧 ===
    this.animTimer += deltaTime;
    if (this.animTimer >= this.animInterval) {
      this.animTimer -= this.animInterval;
      this.animFrame = (this.animFrame + 1) % 4; // 4帧跑步循环
    }

    // === 更新碰撞体 ===
    this.hitbox.x = this.x - this.width / 2;
    this.hitbox.y = this.y - this.height / 2;

    // === 残影更新(速度线效果) ===
    if (this.gameData.speed > 3) {
      // 高速时添加残影
      this.trail.push({
        x: this.x,
        y: this.y,
        alpha: 0.4,
        life: 200,
      });
      // 限制残影数量
      while (this.trail.length > this.trailMax) {
        this.trail.shift();
      }
    }
    // 更新残影生命周期
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= deltaTime;
      this.trail[i].x -= this.gameData.speed * (deltaTime / 16.67) * 0.5;
      if (this.trail[i].life <= 0) {
        this.trail.splice(i, 1);
      }
    }
  }

  /**
   * 渲染玩家
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  render(ctx) {
    if (!this.visible && this.invincible) return; // 无敌闪烁不可见时跳过

    const s = this.scale; // 缩放

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(s, s);

    // === 绘制残影 ===
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const trailAlpha = (t.life / 200) * 0.3;
      this.drawCharacter(ctx, t.x - this.x, t.y - this.y, trailAlpha, true);
    }

    // === 绘制角色主体 ===
    this.drawCharacter(ctx, 0, 0, 1, false);

    ctx.restore();
  }

  /**
   * 绘制打工人角色
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} offsetX - 偏移X
   * @param {number} offsetY - 偏移Y
   * @param {number} alpha - 透明度
   * @param {boolean} isTrail - 是否为残影
   */
  drawCharacter(ctx, offsetX, offsetY, alpha, isTrail) {
    ctx.save();
    ctx.globalAlpha = alpha;

    const w = this.width;
    const h = this.height;

    // 身体 (西装 - 深蓝色矩形)
    ctx.fillStyle = isTrail ? '#666' : '#2c3e50';
    ctx.fillRect(offsetX - w * 0.3, offsetY - h * 0.1, w * 0.6, h * 0.5);

    // 头 (圆形)
    ctx.fillStyle = isTrail ? '#999' : '#f5d6a0';
    ctx.beginPath();
    ctx.arc(offsetX, offsetY - h * 0.35, w * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 领带 (红色三角)
    if (!isTrail) {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY - h * 0.15);
      ctx.lineTo(offsetX - w * 0.1, offsetY + h * 0.2);
      ctx.lineTo(offsetX + w * 0.1, offsetY + h * 0.2);
      ctx.closePath();
      ctx.fill();
    }

    // 公文包 (右手)
    ctx.fillStyle = isTrail ? '#777' : '#8b4513';
    ctx.fillRect(
      offsetX + w * 0.2,
      offsetY - h * 0.1,
      w * 0.22,
      h * 0.25
    );

    // 腿 (跑步帧动画 - 交替)
    const legOffset = Math.sin((this.animFrame * Math.PI) / 2) * h * 0.15;
    ctx.fillStyle = isTrail ? '#555' : '#1a1a2e';
    // 左腿
    ctx.fillRect(
      offsetX - w * 0.15,
      offsetY + h * 0.35,
      w * 0.12,
      h * 0.25 + legOffset
    );
    // 右腿
    ctx.fillRect(
      offsetX + w * 0.03,
      offsetY + h * 0.35,
      w * 0.12,
      h * 0.25 - legOffset
    );

    // 表情 (眼睛+嘴)
    if (!isTrail) {
      // 眼睛
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(offsetX - w * 0.07, offsetY - h * 0.38, 2, 0, Math.PI * 2);
      ctx.arc(offsetX + w * 0.07, offsetY - h * 0.38, 2, 0, Math.PI * 2);
      ctx.fill();
      // 嘴 (坚定的微笑)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(offsetX, offsetY - h * 0.3, w * 0.08, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }

    // 如果无敌状态，绘制护盾光环
    if (this.invincible && !isTrail) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(offsetX, offsetY, w * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 重置玩家状态(新游戏时调用)
   */
  reset() {
    this.lane = 1;
    this.y = this.getLaneY(this.lane);
    this.switching = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.scale = 1;
    this.alpha = 1;
    this.trail = [];
    this.animFrame = 0;
    this.animTimer = 0;
    this.hitbox.x = this.x - this.width / 2;
    this.hitbox.y = this.y - this.height / 2;
  }
}

// 导出至全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}
