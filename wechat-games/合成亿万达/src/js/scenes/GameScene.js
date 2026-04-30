/**
 * GameScene.js — 核心合成场景
 * 4x4网格 + 拖拽合成 + 挂机 + 加速
 */

const Scene = require('../core/Scene');
const Card = require('../entities/Card');
const MergeSystem = require('../systems/MergeSystem');
const IdleSystem = require('../systems/IdleSystem');
const Easing = require('../utils/animation');

// 网格配置
const GRID_ROWS = 4;
const GRID_COLS = 4;
const DRAG_THRESHOLD = 8; // px，超过此阈值视为拖拽

// 掉落间隔（秒）
const DROP_INTERVAL = 3;  // 3秒掉落(更快节奏)
const DROP_MIN_LEVEL = 1;
const DROP_MAX_LEVEL = 2;  // 初期只掉低级卡,鼓励快速合成

class GameScene extends Scene {
  constructor(game) {
    super(game);

    // 网格系统
    this.grid = [];             // grid[row][col] = Card | null
    this.cards = [];            // 所有活跃卡片引用
    this.gridOriginX = 0;       // 网格左上角X
    this.gridOriginY = 0;       // 网格左上角Y
    this.cellSize = 0;          // 单元格大小

    // 拖拽系统
    this.dragCard = null;       // 当前拖拽的卡片
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragCurrentX = 0;
    this.dragCurrentY = 0;
    this.hasDragged = false;    // 是否已触发拖拽（超过阈值）
    this.dragSourceRow = -1;
    this.dragSourceCol = -1;

    // 粒子系统
    this.particles = [];

    // 掉落计时器
    this.dropTimer = 0;

    // 合成计数
    this.totalMerges = 0;
    this.highestLevel = 1;

    // 弹窗文本动画
    this.popTexts = [];

    // 加速按钮
    this.speedBtn = null;
    this.isSpeedActive = false;
    this.speedTimer = 0;

    // 顶部HUD
    this._initHUD = true;
  }

  onEnter(data) {
    super.onEnter(data);

    // 初始化网格布局
    this._calculateGridLayout();

    // 初始化或恢复网格
    if (!this.grid.length || this.grid.length === 0) {
      this._initGrid();
    }

    // 重置掉落计时器
    this.dropTimer = 0;

    // 初始化加速按钮区域
    this._buildSpeedButton();
  }

  onExit() {
    super.onExit();
    // 保存挂机时间
    this.game.idleSystem.saveLastOnlineTime();
  }

  /**
   * 计算网格布局参数
   */
  _calculateGridLayout() {
    const w = this.width;
    const h = this.height;

    // 网格占据屏幕中间偏上区域
    const gridAreaTop = h * 0.12;    // 顶部HUD区域
    const gridAreaBottom = h * 0.75; // 底部留按钮空间
    const gridAreaHeight = gridAreaBottom - gridAreaTop;
    const gridAreaWidth = w * 0.88;

    // 正方形网格
    const maxCellByWidth = gridAreaWidth / GRID_COLS;
    const maxCellByHeight = gridAreaHeight / GRID_ROWS;
    this.cellSize = Math.floor(Math.min(maxCellByWidth, maxCellByHeight));

    const totalGridW = this.cellSize * GRID_COLS;
    const totalGridH = this.cellSize * GRID_ROWS;

    this.gridOriginX = (w - totalGridW) / 2;
    this.gridOriginY = gridAreaTop + (gridAreaHeight - totalGridH) / 2;
  }

  /**
   * 初始化4x4网格，随机填充卡片
   */
  _initGrid() {
    this.grid = [];
    this.cards = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        this.grid[row][col] = null;
      }
    }

    // 随机放置4-5张初始卡片
    const initialCount = 4 + Math.floor(Math.random() * 2);
    const positions = this._getEmptyPositions();

    for (let i = 0; i < Math.min(initialCount, positions.length); i++) {
      const pos = positions[i];
      const level = DROP_MIN_LEVEL + Math.floor(Math.random() * (DROP_MAX_LEVEL - DROP_MIN_LEVEL + 1));
      const card = new Card(level);
      card._imgMgr = this.game.imageManager;
      card.setGridPosition(pos.row, pos.col);
      this.grid[pos.row][pos.col] = card;
      this.cards.push(card);
      this._updateCardPixelPos(card);
    }
  }

  /**
   * 获取所有空位
   */
  _getEmptyPositions() {
    const positions = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (!this.grid[row][col]) {
          positions.push({ row, col });
        }
      }
    }
    // 随机打乱
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions;
  }

  /**
   * 更新卡片像素坐标（基于网格位置）
   */
  _updateCardPixelPos(card) {
    if (card.gridRow < 0 || card.gridCol < 0) return;
    card.targetX = this.gridOriginX + card.gridCol * this.cellSize + this.cellSize / 2;
    card.targetY = this.gridOriginY + card.gridRow * this.cellSize + this.cellSize / 2;
    if (!card.isDragging) {
      card.x = card.targetX;
      card.y = card.targetY;
    }
  }

  /**
   * 更新所有卡片像素位置
   */
  _updateAllCardPositions() {
    for (const card of this.cards) {
      if (!card.isDragging) {
        this._updateCardPixelPos(card);
      }
    }
  }

  /**
   * 掉落新卡片到随机空位
   */
  _dropNewCard() {
    const positions = this._getEmptyPositions();
    if (positions.length === 0) return null;

    const pos = positions[0];
    const level = DROP_MIN_LEVEL + Math.floor(Math.random() * (DROP_MAX_LEVEL - DROP_MIN_LEVEL + 1));

    // 小概率掉落更高级别（10%概率 Lv4）
    const actualLevel = Math.random() < 0.1 ? 4 : level;

    const card = new Card(actualLevel);
    card._imgMgr = this.game.imageManager;
    card.setGridPosition(pos.row, pos.col);
    this.grid[pos.row][pos.col] = card;
    this.cards.push(card);
    this._updateCardPixelPos(card);

    // 掉落动画：从上方落下
    card.animScale = 0.2;
    card.y = this.gridOriginY - 50;
    card.targetY = this.gridOriginY + pos.row * this.cellSize + this.cellSize / 2;

    return card;
  }

  /**
   * 构建加速按钮
   */
  _buildSpeedButton() {
    const w = this.width;
    const h = this.height;
    const btnW = 120;
    const btnH = 40;
    this.speedBtn = {
      x: w - btnW - 12,
      y: h - btnH - 20,
      w: btnW,
      h: btnH
    };
  }

  update(dt) {
    if (!this.active) return;

    const dtSec = dt;  // dt already in seconds from game.js

    // 更新挂机系统
    this.game.idleSystem.update(dtSec);

    // 加速计时器
    if (this.isSpeedActive) {
      this.speedTimer -= dtSec;
      if (this.speedTimer <= 0) {
        this.isSpeedActive = false;
        this.speedTimer = 0;
      }
    }

    // 掉落计时器（加速时缩短间隔）
    const effectiveInterval = this.isSpeedActive ? DROP_INTERVAL * 0.4 : DROP_INTERVAL;
    this.dropTimer += dtSec;
    if (this.dropTimer >= effectiveInterval) {
      this.dropTimer -= effectiveInterval;
      this._dropNewCard();
    }

    // 动画平滑过渡
    const smoothFactor = 0.12;
    for (const card of this.cards) {
      // 位置平滑
      if (!card.isDragging) {
        card.x += (card.targetX - card.x) * smoothFactor;
        card.y += (card.targetY - card.y) * smoothFactor;
      }

      // 合成动画衰减
      if (card.isMerging) {
        card.mergeTimer -= dtSec;
        if (card.mergeTimer <= 0) {
          card.isMerging = false;
          card.animScale = 1;
          card.animRotation = 0;
        } else {
          const t = 1 - (card.mergeTimer / 0.4);
          card.animScale = 1 + 0.5 * (1 - Easing.easeOutBack(t));
          card.animRotation = Math.sin(t * Math.PI * 2) * 0.05 * (1 - t);
        }
      }

      // 掉落动画衰减
      if (card.animScale < 1 && !card.isDragging && !card.isMerging) {
        card.animScale += (1 - card.animScale) * 0.1;
        if (card.animScale > 0.99) card.animScale = 1;
      }
    }

    // 更新粒子
    this._updateParticles(dtSec);

    // 更新弹窗文本
    this._updatePopTexts(dtSec);
  }

  _updateParticles(dtSec) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dtSec;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += 300 * dtSec; // 重力
      p.vx *= 0.98;
    }
  }

  _updatePopTexts(dtSec) {
    for (let i = this.popTexts.length - 1; i >= 0; i--) {
      const t = this.popTexts[i];
      t.life -= dtSec;
      if (t.life <= 0) {
        this.popTexts.splice(i, 1);
        continue;
      }
      t.y -= 60 * dtSec;
      t.alpha = Math.min(1, t.life / t.maxLife * 2);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 背景（优先图片）
    const imgMgr = this.game.imageManager;
    const bgImg = imgMgr ? imgMgr.get('37_bg_board.png') : null;
    if (bgImg && bgImg.complete && bgImg.width > 0) {
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, w, h);
    }

    // 网格背景
    this._renderGridBackground();

    // 渲染所有卡片（非拖拽的先渲染）
    for (const card of this.cards) {
      if (card !== this.dragCard) {
        card.render(ctx, card.x, card.y, this.cellSize);
      }
    }

    // 渲染拖拽卡片（在最上层）
    if (this.dragCard) {
      this.dragCard.render(ctx, this.dragCard.x, this.dragCard.y, this.cellSize);

      // 高亮可能的合成目标
      this._renderMergeTargets();
    }

    // 渲染粒子
    this._renderParticles();

    // 渲染弹窗文本
    this._renderPopTexts();

    // 渲染HUD
    this._renderHUD();

    // 渲染底部按钮
    this._renderBottomButtons();
  }

  _renderGridBackground() {
    const ctx = this.ctx;
    const ox = this.gridOriginX;
    const oy = this.gridOriginY;
    const cs = this.cellSize;
    const gap = 4;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = ox + col * cs + gap / 2;
        const y = oy + row * cs + gap / 2;
        const s = cs - gap;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + s - 8, y);
        ctx.arcTo(x + s, y, x + s, y + 8, 8);
        ctx.lineTo(x + s, y + s - 8);
        ctx.arcTo(x + s, y + s, x + s - 8, y + s, 8);
        ctx.lineTo(x + 8, y + s);
        ctx.arcTo(x, y + s, x, y + s - 8, 8);
        ctx.lineTo(x, y + 8);
        ctx.arcTo(x, y, x + 8, y, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  _renderMergeTargets() {
    if (!this.hasDragged || !this.dragCard) return;

    const ctx = this.ctx;
    const mergeSystem = this.game.mergeSystem;

    for (const card of this.cards) {
      if (card === this.dragCard) continue;
      if (mergeSystem.canMerge(this.dragCard, card)) {
        // 高亮可合成目标
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 15;
        const size = card.getSize(this.cellSize);
        const half = size / 2 + 4;
        ctx.beginPath();
        ctx.moveTo(card.x - half + 10, card.y - half);
        ctx.arcTo(card.x + half, card.y - half, card.x + half, card.y + half, 10);
        ctx.arcTo(card.x + half, card.y + half, card.x - half, card.y + half, 10);
        ctx.arcTo(card.x - half, card.y + half, card.x - half, card.y - half, 10);
        ctx.arcTo(card.x - half, card.y - half, card.x + half, card.y - half, 10);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  _renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();

      // 发光效果
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }

  _renderPopTexts() {
    const ctx = this.ctx;
    for (const t of this.popTexts) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.font = `bold ${t.size}px "PingFang SC", sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  _renderHUD() {
    const ctx = this.ctx;
    const w = this.width;

    // 顶部半透明条
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, 44);

    const gd = this.game.gameData;

    // 身价
    this.drawText(`💰 ${IdleSystem.formatEarnings(gd.totalWorth)}`,
      w * 0.18, 22, 'bold 13px "PingFang SC", sans-serif', '#FFD700');

    // 金币
    this.drawText(`🪙 ${IdleSystem.formatEarnings(gd.coins)}`,
      w * 0.46, 22, '13px "PingFang SC", sans-serif', '#fff');

    // 钻石
    this.drawText(`💎 ${gd.diamonds}`,
      w * 0.65, 22, '13px "PingFang SC", sans-serif', '#fff');

    // 在线收益速率
    const cps = this.game.idleSystem.getCoinsPerSecond();
    this.drawText(`+${IdleSystem.formatEarnings(cps)}/s`,
      w * 0.85, 22, '12px "PingFang SC", sans-serif', '#7FFF00');
  }

  _renderBottomButtons() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 加速按钮
    const btn = this.speedBtn;
    if (btn) {
      const isActive = this.isSpeedActive;
      const bgColor = isActive ? '#FF4500' : '#FFD700';
      const textColor = isActive ? '#fff' : '#333';
      const label = isActive
        ? `⚡ ${Math.ceil(this.speedTimer)}s`
        : `⚡ 加速 ×${this.game.gameData.accelerators || 0}`;

      ctx.fillStyle = bgColor;
      this.drawRoundRect(btn.x, btn.y, btn.w, btn.h, btn.h / 2);
      this.drawText(label, btn.x + btn.w / 2, btn.y + btn.h / 2,
        'bold 13px "PingFang SC", sans-serif', textColor);
    }

    // 菜单按钮
    const menuBtn = { x: 12, y: h - 60, w: 80, h: 40 };
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    this.drawRoundRect(menuBtn.x, menuBtn.y, menuBtn.w, menuBtn.h, menuBtn.h / 2);
    ctx.stroke();
    this.drawText('📋 菜单', menuBtn.x + menuBtn.w / 2, menuBtn.y + menuBtn.h / 2,
      '13px "PingFang SC", sans-serif', '#fff');
    this._menuBtn = menuBtn;
  }

  // ==================== 触摸事件处理 ====================

  onTouchStart(x, y) {
    // 检查加速按钮
    if (this.speedBtn &&
        x >= this.speedBtn.x && x <= this.speedBtn.x + this.speedBtn.w &&
        y >= this.speedBtn.y && y <= this.speedBtn.y + this.speedBtn.h) {
      this._onSpeedBoost();
      return;
    }

    // 检查菜单按钮
    if (this._menuBtn &&
        x >= this._menuBtn.x && x <= this._menuBtn.x + this._menuBtn.w &&
        y >= this._menuBtn.y && y <= this._menuBtn.y + this._menuBtn.h) {
      this._onMenu();
      return;
    }

    // 查找被点击的卡片
    const hitCard = this._hitTestCard(x, y);
    if (hitCard) {
      this.dragCard = hitCard;
      this.dragStartX = x;
      this.dragStartY = y;
      this.dragCurrentX = x;
      this.dragCurrentY = y;
      this.hasDragged = false;
      this.dragSourceRow = hitCard.gridRow;
      this.dragSourceCol = hitCard.gridCol;

      // 拖拽偏移
      this.dragCard.dragOffsetX = hitCard.x - x;
      this.dragCard.dragOffsetY = hitCard.y - y;
      this.dragCard.isDragging = true;
    }
  }

  onTouchMove(x, y) {
    if (!this.dragCard) return;

    this.dragCurrentX = x;
    this.dragCurrentY = y;

    // 移动拖拽卡片
    this.dragCard.x = x + this.dragCard.dragOffsetX;
    this.dragCard.y = y + this.dragCard.dragOffsetY;

    // 检查拖拽阈值
    if (!this.hasDragged) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        this.hasDragged = true;
        // 从网格中临时移除
        if (this.dragSourceRow >= 0 && this.dragSourceCol >= 0) {
          this.grid[this.dragSourceRow][this.dragSourceCol] = null;
        }
      }
    }
  }

  onTouchEnd(x, y) {
    if (!this.dragCard) return;

    if (this.hasDragged) {
      // 查找目标卡片（最近的可合成卡片）
      const targetCard = this._findMergeTarget(x, y);

      if (targetCard) {
        // 执行合成
        this._performMerge(this.dragCard, targetCard);
      } else {
        // 拖拽到空位，放回原处或最近空位
        const targetPos = this._findNearestEmptyCell(x, y);
        if (targetPos) {
          this._placeCard(this.dragCard, targetPos.row, targetPos.col);
        } else {
          // 放回原位
          if (this.dragSourceRow >= 0 && this.dragSourceCol >= 0) {
            this._placeCard(this.dragCard, this.dragSourceRow, this.dragSourceCol);
          }
        }
      }
    } else {
      // 点击（未拖拽）：高亮显示卡片信息
      this._showCardInfo(this.dragCard);
      this.dragCard.isDragging = false;
      this.dragCard = null;
      return;
    }

    // 清理拖拽状态
    this.dragCard.isDragging = false;
    this.dragCard = null;
    this.hasDragged = false;
    this.dragSourceRow = -1;
    this.dragSourceCol = -1;
  }

  /**
   * 碰撞检测：触摸点是否在卡片上
   */
  _hitTestCard(x, y) {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const card = this.cards[i];
      const size = card.getSize(this.cellSize);
      const half = size / 2;
      if (x >= card.x - half && x <= card.x + half &&
          y >= card.y - half && y <= card.y + half) {
        return card;
      }
    }
    return null;
  }

  /**
   * 查找最近的合成目标（限定在一定距离内）
   */
  _findMergeTarget(x, y) {
    if (!this.dragCard) return null;

    const mergeSystem = this.game.mergeSystem;
    const maxDist = this.cellSize * 1.2;

    let bestCard = null;
    let bestDist = maxDist;

    for (const card of this.cards) {
      if (card === this.dragCard) continue;
      if (!mergeSystem.canMerge(this.dragCard, card)) continue;

      const dx = card.x - x;
      const dy = card.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestCard = card;
      }
    }

    return bestCard;
  }

  /**
   * 查找最近的空单元格
   */
  _findNearestEmptyCell(x, y) {
    let bestPos = null;
    let bestDist = Infinity;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.grid[row][col]) continue;

        const cx = this.gridOriginX + col * this.cellSize + this.cellSize / 2;
        const cy = this.gridOriginY + row * this.cellSize + this.cellSize / 2;
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bestDist) {
          bestDist = dist;
          bestPos = { row, col };
        }
      }
    }

    // 距离不能超过1.5个单元格
    return bestDist < this.cellSize * 1.5 ? bestPos : null;
  }

  /**
   * 放置卡片到指定格位
   */
  _placeCard(card, row, col) {
    card.setGridPosition(row, col);
    card.targetX = this.gridOriginX + col * this.cellSize + this.cellSize / 2;
    card.targetY = this.gridOriginY + row * this.cellSize + this.cellSize / 2;
    this.grid[row][col] = card;
  }

  /**
   * 执行合成
   */
  _performMerge(dragCard, targetCard) {
    const mergeSystem = this.game.mergeSystem;
    const result = mergeSystem.merge(dragCard, targetCard);

    if (!result) {
      // 合成失败，放回原位
      if (this.dragSourceRow >= 0 && this.dragSourceCol >= 0) {
        this._placeCard(dragCard, this.dragSourceRow, this.dragSourceCol);
      }
      return;
    }

    // 从cards列表中移除被合成的卡片
    const idx = this.cards.indexOf(targetCard);
    if (idx >= 0) {
      this.cards.splice(idx, 1);
    }

    // 更新最高等级
    if (dragCard.level > this.highestLevel) {
      this.highestLevel = dragCard.level;
      this.game.gameData.highestLevel = this.highestLevel;
    }

    // 更新游戏数据
    this.totalMerges++;
    this.game.gameData.totalMerges = this.totalMerges;
    this.game.gameData.totalWorth = Math.max(
      this.game.gameData.totalWorth,
      dragCard.value
    );

    // 添加粒子效果
    if (result.particles) {
      this.particles.push(...result.particles);
    }

    // 弹出金币文本
    this.popTexts.push({
      x: dragCard.x,
      y: dragCard.y - 30,
      text: `+${IdleSystem.formatEarnings(result.coinsEarned)}`,
      color: result.isCrit ? '#FF4500' : '#FFD700',
      size: result.isCrit ? 22 : 16,
      life: 1.0,
      maxLife: 1.0,
      alpha: 1
    });

    // 暴击提示
    if (result.isCrit) {
      this.popTexts.push({
        x: dragCard.x,
        y: dragCard.y - 55,
        text: '💥 暴击!',
        color: '#FF0000',
        size: 28,
        life: 1.5,
        maxLife: 1.5,
        alpha: 1
      });
    }

    // 里程碑庆祝 (Lv5/8/10/12/15)
    const milestones = {5:'🌟',8:'💫',10:'👑',12:'🏆',15:'🎪'};
    if (milestones[dragCard.level]) {
      this.popTexts.push({
        x: dragCard.x, y: dragCard.y - 80,
        text: `${milestones[dragCard.level]} ${dragCard.name}!`,
        color: '#FFD700', size: 30, life: 2.5, maxLife: 2.5, alpha: 1
      });
      // 里程碑粒子爆发
      for (let i=0; i<20; i++) {
        const angle = (i/20)*Math.PI*2;
        this.particles.push({
          x: dragCard.x, y: dragCard.y,
          vx: Math.cos(angle)*200, vy: Math.sin(angle)*200,
          color: i%2===0?'#FFD700':'#FF6347', size: 3+Math.random()*4,
          life: 1.5, maxLife: 1.5
        });
      }
      // 奖励加速器
      this.game.gameData.accelerators = (this.game.gameData.accelerators||0) + 1;
      this.popTexts.push({
        x: dragCard.x, y: dragCard.y - 50,
        text: '⚡ 加速器+1', color: '#3498db', size: 18, life: 2.0, maxLife: 2.0, alpha: 1
      });
    }

    // 满级触发成就
    if (dragCard.level >= Card.MAX_LEVEL) {
      setTimeout(() => {
        this.switchTo('result', {
          highestLevel: this.highestLevel,
          highestName: dragCard.name,
          totalWorth: this.game.gameData.totalWorth,
          totalMerges: this.totalMerges,
          playTime: this.game.idleSystem.onlineTimer
        });
      }, 1500);
    }
  }

  /**
   * 显示卡片信息（点击未拖拽）
   */
  _showCardInfo(card) {
    this.popTexts.push({
      x: card.x,
      y: card.y - 20,
      text: `${card.name} Lv.${card.level}`,
      color: card.colors[2] || '#fff',
      size: 14,
      life: 1.0,
      maxLife: 1.0,
      alpha: 1
    });
  }

  /**
   * 加速按钮点击
   */
  _onSpeedBoost() {
    const gd = this.game.gameData;

    // 使用加速器
    if (gd.accelerators > 0) {
      gd.accelerators--;
      this.isSpeedActive = true;
      this.speedTimer = 30; // 30秒加速
    } else {
      // 提示无加速器
      this.popTexts.push({
        x: this.speedBtn.x + this.speedBtn.w / 2,
        y: this.speedBtn.y - 10,
        text: '加速器不足，前往商店获取',
        color: '#FF6347',
        size: 13,
        life: 2.0,
        maxLife: 2.0,
        alpha: 1
      });
    }
  }

  /**
   * 菜单按钮点击
   */
  _onMenu() {
    this.switchTo('menu');
  }
}

module.exports = GameScene;
