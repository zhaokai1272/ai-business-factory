/**
 * js/scenes/GameScene.js — 游戏主场景
 * 4x4字卡网格、选中/取消逻辑、提交/清除按钮、计时器、分数/连击、道具栏
 */
const Scene = require('../core/Scene.js');
const { WORD_DICT, CHAR_POOL, findWordsInGrid, getHint, getInsight } = require('../core/WordBank.js');

class GameScene extends Scene {
  constructor(game) {
    super(game);

    // 字卡网格数据 [{char, row, col, selected, selectOrder}]
    this._cards = [];

    // 计时器
    this._timeLeft = 0;       // 剩余秒数
    this._timerTick = 0;      // 计时器累加器

    // 道具冷却
    this._hintCooldown = 0;   // 提示冷却剩余秒数

    // 动画相关
    this._cardAnimScale = []; // 每张卡片的动画缩放 [0~1]
    this._shakeTimer = 0;     // 错误抖动计时器
    this._scorePopups = [];   // 得分弹出文字 [{x, y, text, alpha, vy}]
    this._comboFlash = 0;     // 连击闪光计时器

    // 当前提交状态
    this._isSubmitting = false; // 正在提交中（防止连点）

    // 本局统计数据
    this._wordsFound = 0;      // 本局找到的词汇数
    this._foundWords = new Set(); // 已找到的词（防止重复计分）

    // 网格找词缓存
    this._allWords = [];       // 当前网格中所有可组成的词
    this._hintHighlight = null; // 提示高亮 {cells: [[r,c],...], timer: 秒}
    this._insightHighlight = null; // 天眼高亮
  }

  enter() {
    const { GAME_CONFIG } = this.game;
    this._timeLeft = GAME_CONFIG.gameDuration; // 设置倒计时
    this._timerTick = 0;
    this._hintCooldown = 0;
    this._isSubmitting = false;
    this._wordsFound = 0;
    this._foundWords.clear();
    this._scorePopups = [];
    this._comboFlash = 0;
    this._shakeTimer = 0;

    this._initGrid(); // 随机生成字卡网格
    this._scanGrid(); // 扫描网格中所有可组成的词
  }

  // ==================== 网格初始化 ====================

  /**
   * 从字符池随机抽取字符填充4x4网格
   */
  _initGrid() {
    const { GAME_CONFIG } = this.game;
    const rows = GAME_CONFIG.gridRows;
    const cols = GAME_CONFIG.gridCols;
    const total = rows * cols;

    // 随机抽取字符（允许重复以保证可玩性）
    this._cards = [];
    for (let i = 0; i < total; i++) {
      const randomIndex = Math.floor(Math.random() * CHAR_POOL.length);
      this._cards.push({
        char: CHAR_POOL[randomIndex], // 单个汉字
        row: Math.floor(i / cols),    // 所在行
        col: i % cols,                // 所在列
        selected: false,              // 是否被选中
        selectOrder: -1               // 选中顺序（-1表示未选中）
      });
    }

    // 初始化卡片动画（从0弹入到1）
    this._cardAnimScale = new Array(total).fill(0).map((_, i) => ({
      progress: 0,
      delay: i * 0.03 // 每张卡片依次延迟弹出
    }));

    console.log(`[游戏] 网格已生成: ${rows}×${cols}, 共${total}张字卡`);
  }

  /**
   * 扫描当前网格中所有可组成的有效词汇
   */
  _scanGrid() {
    const { GAME_CONFIG } = this.game;
    const rows = GAME_CONFIG.gridRows;
    const cols = GAME_CONFIG.gridCols;

    // 构建字符二维数组
    const grid = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const card = this._cards[r * cols + c];
        grid[r][c] = card ? card.char : '';
      }
    }

    this._allWords = findWordsInGrid(grid, rows, cols, 4);
    this._hintHighlight = null;
    this._insightHighlight = null;
    console.log(`[游戏] 网格扫描完成: 找到 ${this._allWords.length} 个可组词汇`);
  }

  // ==================== 更新循环 ====================

  update(dt) {
    // 计时器更新
    this._timerTick += dt;
    if (this._timerTick >= 1) {
      this._timerTick -= 1;      // 每秒减1
      this._timeLeft -= 1;
      if (this._timeLeft <= 0) {
        this._timeLeft = 0;
        this._onTimeUp(); // 时间到，结算
        return;
      }
    }

    // 道具冷却更新
    if (this._hintCooldown > 0) {
      this._hintCooldown = Math.max(0, this._hintCooldown - dt);
    }

    // 卡片弹入动画
    let allDone = true;
    this._cardAnimScale.forEach((anim) => {
      if (anim.progress < 1) {
        anim.delay = Math.max(0, anim.delay - dt); // 递减延迟
        if (anim.delay <= 0) {
          anim.progress = Math.min(1, anim.progress + dt * 4); // 4秒内完成弹入
        }
      }
      if (anim.progress < 1) allDone = false;
    });

    // 错误抖动衰减
    if (this._shakeTimer > 0) {
      this._shakeTimer = Math.max(0, this._shakeTimer - dt);
    }

    // 连击闪光衰减
    if (this._comboFlash > 0) {
      this._comboFlash = Math.max(0, this._comboFlash - dt * 2);
    }

    // 提示/天眼高亮衰减
    if (this._hintHighlight) {
      this._hintHighlight.timer -= dt;
      if (this._hintHighlight.timer <= 0) this._hintHighlight = null;
    }
    if (this._insightHighlight) {
      this._insightHighlight.timer -= dt;
      if (this._insightHighlight.timer <= 0) this._insightHighlight = null;
    }

    // 得分弹出文字动画（上升+淡出）
    this._scorePopups = this._scorePopups.filter((pop) => {
      pop.y -= dt * 80;          // 向上浮动（每秒80像素）
      pop.alpha -= dt * 0.8;     // 渐变消失
      return pop.alpha > 0;      // 完全透明后移除
    });
  }

  // ==================== 渲染 ====================

  render(ctx) {
    const { dw, dh, screenWidth, screenHeight, safeArea } = this.game;

    // === 背景 ===
    const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0d0d2b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 应用抖动偏移
    ctx.save();
    if (this._shakeTimer > 0) {
      const shakeAmplitude = dw(6) * (this._shakeTimer / 0.3); // 抖动幅度
      const shakeX = Math.sin(this._shakeTimer * 60) * shakeAmplitude;
      ctx.translate(shakeX, 0);
    }

    // === 顶栏：计时器 + 得分 ===
    this._renderTopBar(ctx);

    // === 字卡网格 ===
    this._renderGrid(ctx);

    // === 底部：提交/清除按钮 + 道具栏 ===
    this._renderBottomBar(ctx);

    // === 得分弹出文字 ===
    this._renderScorePopups(ctx);

    ctx.restore();
  }

  /**
   * 顶栏：倒计时、分数、连击
   */
  _renderTopBar(ctx) {
    const { dw, dh, screenWidth, safeArea } = this.game;
    const topY = (safeArea.top || 0) + dh(20); // 安全区顶部偏移

    // 半透明背景条
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, screenWidth, topY + dh(60));

    ctx.textBaseline = 'middle';

    // 倒计时（左侧）
    const timeColor = this._timeLeft <= 10 ? '#FF4444' : '#FFFFFF'; // 最后10秒变红
    ctx.fillStyle = timeColor;
    ctx.font = `bold ${dw(36)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    const minutes = Math.floor(this._timeLeft / 60);
    const seconds = this._timeLeft % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillText(`⏱ ${timeStr}`, dw(30), topY + dh(10));

    // 分数（居中）
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${dw(40)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.game.gameData.score}`, screenWidth / 2, topY + dh(10));

    // 连击（右侧，带闪光效果）
    if (this.game.gameData.combo >= 2) {
      const flashAlpha = 0.5 + Math.sin(this._comboFlash * Math.PI) * 0.5; // 闪光亮度
      ctx.fillStyle = `rgba(255, 107, 53, ${0.7 + flashAlpha * 0.3})`;
      ctx.font = `bold ${dw(28)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`🔥连击×${this.game.gameData.combo}`, screenWidth - dw(30), topY + dh(10));
    }
  }

  /**
   * 渲染4×4字卡网格
   */
  _renderGrid(ctx) {
    const { dw, dh, screenWidth, safeArea } = this.game;
    const { GAME_CONFIG } = this.game;
    const rows = GAME_CONFIG.gridRows;
    const cols = GAME_CONFIG.gridCols;

    // 网格布局计算
    const gridTop = (safeArea.top || 0) + dh(110);  // 网格顶边（给顶栏留空间）
    const gridLeft = dw(40);                         // 左边距
    const gridRight = screenWidth - dw(40);          // 右边距
    const gridWidth = gridRight - gridLeft;          // 网格总宽度
    const gap = dw(10);                              // 卡片间距
    const cardSize = (gridWidth - gap * (cols - 1)) / cols; // 单张卡片尺寸（正方形）
    const totalGridHeight = cardSize * rows + gap * (rows - 1);

    // 绘制每张字卡
    this._cards.forEach((card, index) => {
      const x = gridLeft + card.col * (cardSize + gap);
      const y = gridTop + card.row * (cardSize + gap);

      // 弹入动画缩放
      const animScale = this._cardAnimScale[index]
        ? this._cardAnimScale[index].progress
        : 1;
      const currentSize = cardSize * animScale;
      const offsetX = (cardSize - currentSize) / 2;
      const offsetY = (cardSize - currentSize) / 2;

      // 卡片背景
      const radius = dw(12); // 圆角半径
      if (card.selected) {
        // 选中状态：金色渐变
        const selGrad = ctx.createLinearGradient(x, y, x + cardSize, y + cardSize);
        selGrad.addColorStop(0, '#FFD700');
        selGrad.addColorStop(1, '#FF8C00');
        ctx.fillStyle = selGrad;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = dw(16);
      } else {
        // 未选中：白色半透明卡片
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // 绘制圆角矩形卡片
      this._roundRect(ctx, x + offsetX, y + offsetY, currentSize, currentSize, radius);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 选中序号标记（左上角小圆）
      if (card.selected && card.selectOrder >= 0) {
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(x + cardSize - dw(14), y + dh(14), dw(14), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${dw(18)}px "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.selectOrder + 1, x + cardSize - dw(14), y + dh(14)); // 显示1-based序号
      }

      // 汉字文字
      ctx.fillStyle = card.selected ? '#FFFFFF' : '#E8E8E8';
      ctx.font = `bold ${dw(44)}px "PingFang SC", "KaiTi", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.char, x + cardSize / 2, y + cardSize / 2);
    });

    // === 高亮叠加：提示 (金色脉冲) ===
    if (this._hintHighlight) {
      const pulse = 0.6 + Math.sin(Date.now() / 200) * 0.4; // 脉冲 0.2~1.0
      this._hintHighlight.cells.forEach(([r, c]) => {
        const idx = r * cols + c;
        if (idx >= this._cards.length) return;
        const hx = gridLeft + c * (cardSize + gap);
        const hy = gridTop + r * (cardSize + gap);
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.lineWidth = dw(4);
        this._roundRect(ctx, hx - dw(2), hy - dh(2), cardSize + dw(4), cardSize + dh(4), dw(14));
        ctx.stroke();
      });
    }

    // === 高亮叠加：天眼 (青色脉冲，路径连线) ===
    if (this._insightHighlight) {
      const pulse = 0.6 + Math.sin(Date.now() / 200) * 0.4;
      const cells = this._insightHighlight.cells;

      // 连线
      if (cells.length >= 2) {
        ctx.strokeStyle = `rgba(0, 255, 255, ${pulse * 0.5})`;
        ctx.lineWidth = dw(3);
        ctx.setLineDash([dw(8), dw(4)]);
        ctx.beginPath();
        const firstX = gridLeft + cells[0][1] * (cardSize + gap) + cardSize / 2;
        const firstY = gridTop + cells[0][0] * (cardSize + gap) + cardSize / 2;
        ctx.moveTo(firstX, firstY);
        for (let i = 1; i < cells.length; i++) {
          const lx = gridLeft + cells[i][1] * (cardSize + gap) + cardSize / 2;
          const ly = gridTop + cells[i][0] * (cardSize + gap) + cardSize / 2;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 边框高亮
      cells.forEach(([r, c]) => {
        const idx = r * cols + c;
        if (idx >= this._cards.length) return;
        const hx = gridLeft + c * (cardSize + gap);
        const hy = gridTop + r * (cardSize + gap);
        ctx.strokeStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.lineWidth = dw(4);
        this._roundRect(ctx, hx - dw(2), hy - dh(2), cardSize + dw(4), cardSize + dh(4), dw(14));
        ctx.stroke();
      });
    }
  }

  /**
   * 底部操作区：提交/清除按钮 + 道具栏
   */
  _renderBottomBar(ctx) {
    const { dw, dh, screenWidth, screenHeight } = this.game;

    const barTop = screenHeight - dh(220); // 底部栏顶边
    const btnWidth = dw(260);
    const btnHeight = dh(72);

    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, barTop - dh(10), screenWidth, screenHeight - barTop + dh(10));

    // === "提交"按钮（左侧） ===
    const submitX = dw(50);
    const submitY = barTop;
    this._drawActionBtn(ctx, submitX, submitY, btnWidth, btnHeight, '✅ 提交', '#4CAF50');

    // === "清除"按钮（右侧） ===
    const clearX = screenWidth - btnWidth - dw(50);
    const clearY = barTop;
    this._drawActionBtn(ctx, clearX, clearY, btnWidth, btnHeight, '🔄 清除', '#FF9800');

    // === 道具栏 ===
    const powerY = barTop + btnHeight + dh(20);
    const powerBtnW = (screenWidth - dw(60)) / 4; // 均分4个道具

    const powers = [
      { icon: '💡', label: '提示', cooldown: this._hintCooldown, action: () => this._onUseHint() },
      { icon: '⏳', label: '加时', cooldown: 0, action: () => this._onUseAddTime() },
      { icon: '🧹', label: '清除', cooldown: 0, action: () => this._onClearSelection() },
      { icon: '👁', label: '天眼', cooldown: 0, action: () => this._onUseInsight() }
    ];

    powers.forEach((p, i) => {
      const px = dw(20) + i * powerBtnW;
      // 道具背景
      ctx.fillStyle = p.cooldown > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';
      this._roundRect(ctx, px, powerY, powerBtnW - dw(8), dh(70), dw(10));
      ctx.fill();

      // 图标
      ctx.font = `${dw(28)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.icon, px + (powerBtnW - dw(8)) / 2, powerY + dh(24));

      // 标签
      ctx.fillStyle = p.cooldown > 0 ? `rgba(255,255,255,0.3)` : 'rgba(255,255,255,0.7)';
      ctx.font = `${dw(18)}px "PingFang SC", sans-serif`;
      let label = p.label;
      if (p.cooldown > 0) {
        label = `${Math.ceil(p.cooldown)}s`; // 冷却倒计时
      }
      ctx.fillText(label, px + (powerBtnW - dw(8)) / 2, powerY + dh(54));

      // 冷却遮罩
      if (p.cooldown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this._roundRect(ctx, px, powerY, powerBtnW - dw(8), dh(70), dw(10));
        ctx.fill();
      }
    });
  }

  /**
   * 绘制操作按钮（提交/清除）
   */
  _drawActionBtn(ctx, x, y, w, h, text, color) {
    const { dw, dh } = this.game;
    // 阴影
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = dw(8);
    ctx.shadowOffsetY = dh(3);
    ctx.fillStyle = color;
    this._roundRect(ctx, x, y, w, h, dh(14));
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${dw(28)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  /**
   * 得分弹出文字
   */
  _renderScorePopups(ctx) {
    const { dw } = this.game;
    this._scorePopups.forEach((pop) => {
      ctx.globalAlpha = pop.alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${dw(28)}px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pop.text, pop.x, pop.y);
    });
    ctx.globalAlpha = 1; // 恢复透明度
  }

  // ==================== 触摸交互 ====================

  onTouchEnd(pos) {
    const { dw, dh, screenWidth, screenHeight, safeArea } = this.game;
    const { GAME_CONFIG } = this.game;
    const rows = GAME_CONFIG.gridRows;
    const cols = GAME_CONFIG.gridCols;

    // ---- 区域1：字卡网格 ----
    const gridTop = (safeArea.top || 0) + dh(110);
    const gridLeft = dw(40);
    const gridRight = screenWidth - dw(40);
    const gridWidth = gridRight - gridLeft;
    const gap = dw(10);
    const cardSize = (gridWidth - gap * (cols - 1)) / cols;
    const totalGridHeight = cardSize * rows + gap * (rows - 1);

    if (pos.y >= gridTop && pos.y <= gridTop + totalGridHeight &&
        pos.x >= gridLeft && pos.x <= gridRight) {
      // 在网格内，计算命中的卡片
      const col = Math.floor((pos.x - gridLeft) / (cardSize + gap));
      const row = Math.floor((pos.y - gridTop) / (cardSize + gap));
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        const index = row * cols + col;
        this._toggleCard(index); // 切换卡片选中状态
      }
      return;
    }

    // ---- 区域2：底部按钮 ----
    const barTop = screenHeight - dh(220);
    const btnWidth = dw(260);
    const btnHeight = dh(72);

    // "提交"按钮命中检测
    const submitX = dw(50);
    if (pos.x >= submitX && pos.x <= submitX + btnWidth &&
        pos.y >= barTop && pos.y <= barTop + btnHeight) {
      this._onSubmitWord();
      return;
    }

    // "清除"按钮命中检测
    const clearX = screenWidth - btnWidth - dw(50);
    if (pos.x >= clearX && pos.x <= clearX + btnWidth &&
        pos.y >= barTop && pos.y <= barTop + btnHeight) {
      this._onClearSelection();
      return;
    }

    // ---- 区域3：道具栏 ----
    const powerY = barTop + btnHeight + dh(20);
    const powerBtnW = (screenWidth - dw(60)) / 4;
    if (pos.y >= powerY && pos.y <= powerY + dh(70)) {
      const powerIndex = Math.floor((pos.x - dw(20)) / powerBtnW);
      const powers = [
        { action: () => this._onUseHint() },
        { action: () => this._onUseAddTime() },
        { action: () => this._onClearSelection() },
        { action: () => this._onUseInsight() }
      ];
      if (powerIndex >= 0 && powerIndex < powers.length) {
        powers[powerIndex].action(); // 触发对应道具
      }
    }
  }

  // ==================== 字卡选中逻辑 ====================

  /**
   * 切换指定卡片的选中状态
   * @param {number} index - 卡片索引
   */
  _toggleCard(index) {
    const card = this._cards[index];
    if (!card) return;

    if (card.selected) {
      // 取消选中：移除选中状态
      const oldOrder = card.selectOrder;
      card.selected = false;
      card.selectOrder = -1;

      // 重新编号后续选中的卡片
      this._cards.forEach((c) => {
        if (c.selected && c.selectOrder > oldOrder) {
          c.selectOrder--;
        }
      });
    } else {
      // 选中：分配下一个序号
      const currentCount = this._getSelectedCount();
      card.selected = true;
      card.selectOrder = currentCount; // 0-based序号
    }

    console.log(`[游戏] 字卡 ${card.char}[${card.row},${card.col}] ${card.selected ? '选中' : '取消'}, 序号:${card.selectOrder}`);
  }

  /** 获取当前已选中卡片数量 */
  _getSelectedCount() {
    return this._cards.filter((c) => c.selected).length;
  }

  /** 获取按选中顺序排列的字符数组 */
  _getSelectedChars() {
    const selected = this._cards
      .filter((c) => c.selected)
      .sort((a, b) => a.selectOrder - b.selectOrder); // 按选中顺序排序
    return selected.map((c) => c.char);
  }

  // ==================== 提交 & 校验 ====================

  /**
   * 提交当前选中的词
   */
  _onSubmitWord() {
    if (this._isSubmitting) return; // 防连点

    const selectedChars = this._getSelectedChars();
    if (selectedChars.length < 1) {
      wx.showToast({ title: '请先选择字卡', icon: 'none', duration: 1000 });
      return;
    }

    const word = selectedChars.join(''); // 拼接为字符串

    // 校验是否在词库中
    if (WORD_DICT.has(word)) {
      // 检查是否已找到过（防重复计分）
      if (this._foundWords.has(word)) {
        wx.showToast({ title: '这个词已经找过了~', icon: 'none', duration: 1000 });
      } else {
        // 有效新词：计分
        this._foundWords.add(word);
        const baseScore = word.length * this.game.GAME_CONFIG.baseScorePerChar;
        const comboBonus = Math.floor(baseScore * this.game.gameData.combo * this.game.GAME_CONFIG.comboMultiplier);
        const totalScore = baseScore + comboBonus;

        this.game.gameData.score += totalScore;
        this.game.gameData.combo++;
        this._wordsFound++;

        // 更新连击闪光
        this._comboFlash = 1.0;

        // 弹出得分文字（在网格中心偏上）
        const { screenWidth, dh } = this.game;
        const gridTop = (this.game.safeArea.top || 0) + dh(110);
        this._scorePopups.push({
          x: screenWidth / 2,
          y: gridTop + dh(40),
          text: `+${totalScore}`,
          alpha: 1,
          vy: 0
        });
        if (this.game.gameData.combo >= 2) {
          this._scorePopups.push({
            x: screenWidth / 2,
            y: gridTop + dh(80),
            text: `连击×${this.game.gameData.combo}!`,
            alpha: 0.9,
            vy: 0
          });
        }

        // 震动反馈
        try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}

        console.log(`[游戏] 正确! 词:"${word}" 基础分:${baseScore} 连击加成:${comboBonus} 总分:${totalScore}`);
      }
    } else {
      // 无效词：重置连击 + 抖动
      this.game.gameData.combo = 0;
      this._shakeTimer = 0.3; // 0.3秒抖动

      try { wx.vibrateShort({ type: 'heavy' }); } catch (e) {}

      console.log(`[游戏] 无效词:"${word}"，连击已中断`);
      wx.showToast({ title: `"${word}" 不是有效词汇`, icon: 'none', duration: 1200 });
    }

    // 清除选中状态
    this._onClearSelection();
  }

  /** 清除所有选中 */
  _onClearSelection() {
    this._cards.forEach((c) => {
      c.selected = false;
      c.selectOrder = -1;
    });
    console.log('[游戏] 已清除所有选中');
  }

  // ==================== 道具系统 ====================

  /** 提示道具：高亮一个未找到的词的首字 */
  _onUseHint() {
    if (this._hintCooldown > 0) {
      wx.showToast({ title: `冷却中 ${Math.ceil(this._hintCooldown)}s`, icon: 'none' });
      return;
    }
    if (this.game.gameData.diamonds < 1) {
      wx.showToast({ title: '钻石不足', icon: 'none' });
      return;
    }

    const hint = getHint(this._allWords, this._foundWords);
    if (!hint) {
      wx.showToast({ title: '当前网格无更多词汇，换一局试试~', icon: 'none', duration: 2000 });
      return;
    }

    this.game.gameData.diamonds--;
    this._hintCooldown = this.game.GAME_CONFIG.hintCooldown;
    this._hintHighlight = {
      cells: [hint.hintCell], // 只高亮首字
      timer: 3.0,             // 高亮持续3秒
      word: hint.word
    };
    wx.showToast({ title: `提示: 试试找 "${hint.word}"`, icon: 'none', duration: 1500 });
    console.log(`[道具] 提示: 词="${hint.word}" 首字位置=[${hint.hintCell}]`);
  }

  /** 加时道具：增加10秒 */
  _onUseAddTime() {
    if (this.game.gameData.diamonds < 2) {
      wx.showToast({ title: '钻石不足（需要2钻）', icon: 'none' });
      return;
    }
    this.game.gameData.diamonds -= 2;
    this._timeLeft += 10;
    wx.showToast({ title: '+10秒！', icon: 'success', duration: 1000 });
  }

  /** 天眼道具：高亮显示一个完整词汇的所有字卡 */
  _onUseInsight() {
    if (this.game.gameData.diamonds < 3) {
      wx.showToast({ title: '钻石不足（需要3钻）', icon: 'none' });
      return;
    }

    const insight = getInsight(this._allWords, this._foundWords);
    if (!insight) {
      wx.showToast({ title: '当前网格无更多词汇', icon: 'none', duration: 2000 });
      return;
    }

    this.game.gameData.diamonds -= 3;
    this._insightHighlight = {
      cells: insight.cells,   // 完整路径
      timer: 4.0,             // 天眼持续4秒
      word: insight.word
    };
    wx.showToast({ title: `天眼: "${insight.word}"`, icon: 'none', duration: 2000 });
    console.log(`[道具] 天眼: 词="${insight.word}" 路径=${JSON.stringify(insight.cells)}`);
  }

  // ==================== 时间到 ====================

  /** 时间到：进入结算场景 */
  _onTimeUp() {
    // 更新最高分
    if (this.game.gameData.score > this.game.gameData.bestScore) {
      this.game.gameData.bestScore = this.game.gameData.score;
    }
    // 更新最高连击
    if (this.game.gameData.combo > this.game.gameData.maxCombo) {
      this.game.gameData.maxCombo = this.game.gameData.combo;
    }
    this.game.gameData.totalWords += this._wordsFound;

    try {
      const ResultScene = require('./ResultScene.js');
      this.game.switchScene(new ResultScene(this.game, {
        score: this.game.gameData.score,
        wordsFound: this._wordsFound,
        maxCombo: this.game.gameData.combo
      }));
    } catch (error) {
      console.error('[游戏] 加载结算场景失败:', error);
    }
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
    // 清理定时器等资源
    this._scorePopups = [];
    console.log('[游戏] 游戏场景退出');
  }
}

module.exports = GameScene;
