/**
 * js/scenes/GameScene.js — 游戏主场景 v2.0
 * 4×4 网格，每行一个四字成语，选4字自动校验，无需提交/清除按钮
 */
const Scene = require('../core/Scene.js');
const { IDIOMS_200 } = require('../core/WordBank.js');

class GameScene extends Scene {
  constructor(game) {
    super(game);

    // 字卡网格 [{char, row, col, selected, selectOrder, idiomIdx}]
    this._cards = [];

    // 当前4个成语 [{word, cells:[{row,col,char}], found:bool}]
    this._idioms = [];

    // 计时器
    this._timeLeft = 0;
    this._timerTick = 0;

    // 道具冷却
    this._hintCooldown = 0;

    // 动画
    this._cardAnimScale = [];
    this._shakeTimer = 0;
    this._scorePopups = [];
    this._comboFlash = 0;

    // 统计
    this._wordsFound = 0;
    this._totalRounds = 0;      // 已完成轮次（4个成语=1轮）

    // 已用成语索引（防止重复）
    this._usedIdiomIndices = new Set();
  }

  enter() {
    const { GAME_CONFIG } = this.game;
    this._timeLeft = GAME_CONFIG.gameDuration;
    this._timerTick = 0;
    this._hintCooldown = 0;
    this._wordsFound = 0;
    this._totalRounds = 0;
    this._scorePopups = [];
    this._comboFlash = 0;
    this._shakeTimer = 0;
    this._usedIdiomIndices.clear();

    this._initGrid();
  }

  // ==================== 网格初始化 ====================

  /**
   * 初始化4×4网格：随机选取4个不同成语，每行放一个
   */
  _initGrid() {
    const { GAME_CONFIG } = this.game;
    const rows = GAME_CONFIG.gridRows;     // 4
    const cols = GAME_CONFIG.gridCols;     // 4

    // 随机选4个不重复的成语
    const picked = this._pickIdioms(4);
    this._idioms = picked.map((word, rowIdx) => {
      const cells = word.split('').map((char, colIdx) => ({
        char,
        row: rowIdx,
        col: colIdx
      }));
      return { word, cells, found: false };
    });

    // 构建字卡数组
    this._cards = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this._cards.push({
          char: this._idioms[r].cells[c].char,
          row: r,
          col: c,
          selected: false,
          selectOrder: -1,
          idiomIdx: r   // 属于第几个成语
        });
      }
    }

    // 打乱每行4个字的顺序（玩家需要自行排列成正确成语）
    for (let r = 0; r < rows; r++) {
      const rowCards = this._cards.filter(c => c.row === r);
      const shuffledCols = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      rowCards.forEach((card, i) => { card.col = shuffledCols[i]; });
    }
    // 按行列重新排序 cards 数组
    this._cards.sort((a, b) => a.row * 100 + a.col - (b.row * 100 + b.col));

    // 弹入动画
    this._cardAnimScale = new Array(rows * cols).fill(0).map((_, i) => ({
      progress: 0,
      delay: i * 0.04
    }));

    console.log(`[游戏] 4个成语: ${picked.join('、')}`);
    console.log(`[游戏] 网格: ${rows}×${cols}, 已就绪`);
  }

  /**
   * 从词库随机选取 count 个不重复成语
   */
  _pickIdioms(count) {
    const available = [];
    for (let i = 0; i < IDIOMS_200.length; i++) {
      if (!this._usedIdiomIndices.has(i)) {
        available.push(i);
      }
    }

    // 如果可用成语不够，清空已用记录
    if (available.length < count) {
      this._usedIdiomIndices.clear();
      for (let i = 0; i < IDIOMS_200.length; i++) {
        available.push(i);
      }
    }

    // Fisher-Yates 洗牌取前 count 个
    const result = [];
    const pool = [...available];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }

    result.forEach(i => this._usedIdiomIndices.add(i));
    return result.map(i => IDIOMS_200[i]);
  }

  /**
   * 重新填充指定行（成语被找到后换新成语）
   */
  _refillRow(rowIdx) {
    const { GAME_CONFIG } = this.game;
    const cols = GAME_CONFIG.gridCols;

    // 选一个新成语
    const [newIdx] = this._pickIdioms(1);
    const newWord = IDIOMS_200[newIdx];

    // 更新 idiom 数据
    this._idioms[rowIdx] = {
      word: newWord,
      cells: newWord.split('').map((char, colIdx) => ({
        char,
        row: rowIdx,
        col: colIdx
      })),
      found: false
    };

    // 更新对应字卡：先重置为顺序列，赋字，再打乱
    const cols2 = GAME_CONFIG.gridCols;
    const rowCards = this._cards.filter(c => c.row === rowIdx);
    // 重置列为顺序 0,1,2,3 并赋字
    rowCards.forEach((card, i) => {
      card.col = i;
      card.char = newWord[i];
      card.idiomIdx = rowIdx;
    });

    // 打乱该行的列顺序
    const shuffledCols = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    rowCards.forEach((card, i) => { card.col = shuffledCols[i]; });
    this._cards.sort((a, b) => a.row * 100 + a.col - (b.row * 100 + b.col));

    // 重置弹入动画
    rowCards.forEach((_, i) => {
      const cardIdx = this._cards.indexOf(rowCards[i]);
      this._cardAnimScale[cardIdx] = {
        progress: 0,
        delay: i * 0.05
      };
    });

    console.log(`[游戏] 第${rowIdx + 1}行已刷新: "${newWord}"`);
  }

  // ==================== 更新循环 ====================

  update(dt) {
    // 计时器
    this._timerTick += dt;
    if (this._timerTick >= 1) {
      this._timerTick -= 1;
      this._timeLeft -= 1;
      if (this._timeLeft <= 0) {
        this._timeLeft = 0;
        this._onTimeUp();
        return;
      }
    }

    // 道具冷却
    if (this._hintCooldown > 0) {
      this._hintCooldown = Math.max(0, this._hintCooldown - dt);
    }

    // 卡片弹入动画
    this._cardAnimScale.forEach((anim) => {
      if (anim.progress < 1) {
        anim.delay = Math.max(0, anim.delay - dt);
        if (anim.delay <= 0) {
          anim.progress = Math.min(1, anim.progress + dt * 4);
        }
      }
    });

    // 抖动衰减
    if (this._shakeTimer > 0) {
      this._shakeTimer = Math.max(0, this._shakeTimer - dt);
    }

    // 连击闪光衰减
    if (this._comboFlash > 0) {
      this._comboFlash = Math.max(0, this._comboFlash - dt * 2);
    }

    // 得分弹出
    this._scorePopups = this._scorePopups.filter((pop) => {
      pop.y -= dt * 80;
      pop.alpha -= dt * 0.8;
      return pop.alpha > 0;
    });
  }

  // ==================== 渲染 ====================

  render(ctx) {
    const { dw, dh, screenWidth, screenHeight, safeArea } = this.game;

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0d0d2b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    ctx.save();
    if (this._shakeTimer > 0) {
      const amp = dw(6) * (this._shakeTimer / 0.3);
      ctx.translate(Math.sin(this._shakeTimer * 60) * amp, 0);
    }

    this._renderTopBar(ctx);
    this._renderGrid(ctx);
    this._renderBottomBar(ctx);
    this._renderScorePopups(ctx);

    ctx.restore();
  }

  /**
   * 顶栏：倒计时 + 得分 + 进度
   */
  _renderTopBar(ctx) {
    const { dw, dh, screenWidth, safeArea } = this.game;
    const topY = (safeArea.top || 0) + dh(20);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, screenWidth, topY + dh(60));

    ctx.textBaseline = 'middle';

    // 倒计时
    const timeColor = this._timeLeft <= 10 ? '#FF4444' : '#FFFFFF';
    ctx.fillStyle = timeColor;
    ctx.font = `bold ${dw(30)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    const m = Math.floor(this._timeLeft / 60);
    const s = this._timeLeft % 60;
    ctx.fillText(`⏱ ${m}:${s.toString().padStart(2, '0')}`, dw(30), topY + dh(10));

    // 进度：已找到/总数
    const foundCount = this._idioms.filter(i => i.found).length;
    ctx.fillStyle = '#AAAAAA';
    ctx.font = `${dw(22)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${foundCount}/4`, screenWidth / 2, topY + dh(10));

    // 分数
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${dw(36)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${this.game.gameData.score}`, screenWidth - dw(30), topY + dh(10));
  }

  /**
   * 渲染4×4字卡网格 — 每行一个成语，行间有明显间隔
   */
  _renderGrid(ctx) {
    const { dw, dh, screenWidth, safeArea } = this.game;
    const { GAME_CONFIG } = this.game;
    const rows = GAME_CONFIG.gridRows;
    const cols = GAME_CONFIG.gridCols;

    const gridTop = (safeArea.top || 0) + dh(110);
    const gridLeft = dw(30);
    const gridRight = screenWidth - dw(30);
    const gridWidth = gridRight - gridLeft;
    const colGap = dw(8);
    const rowGap = dh(16);        // 行间距 > 列间距，明确体现每行=一个词
    const cardSize = (gridWidth - colGap * (cols - 1)) / cols;

    this._cards.forEach((card, index) => {
      const x = gridLeft + card.col * (cardSize + colGap);
      const y = gridTop + card.row * (cardSize + rowGap);

      // 弹入动画
      const animScale = this._cardAnimScale[index]
        ? this._cardAnimScale[index].progress
        : 1;
      const currentSize = cardSize * animScale;
      const offsetX = (cardSize - currentSize) / 2;
      const offsetY = (cardSize - currentSize) / 2;

      const radius = dw(12);

      // 卡片背景
      if (card.selected) {
        const selGrad = ctx.createLinearGradient(x, y, x + cardSize, y + cardSize);
        selGrad.addColorStop(0, '#FFD700');
        selGrad.addColorStop(1, '#FF8C00');
        ctx.fillStyle = selGrad;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = dw(16);
      } else {
        // 已找到的成语行：半透明绿色
        const idiom = this._idioms[card.idiomIdx];
        if (idiom && idiom.found) {
          ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      this._roundRect(ctx, x + offsetX, y + offsetY, currentSize, currentSize, radius);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 选中序号
      if (card.selected && card.selectOrder >= 0) {
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(x + cardSize - dw(14), y + dh(14), dw(14), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${dw(18)}px "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.selectOrder + 1, x + cardSize - dw(14), y + dh(14));
      }

      // 汉字
      const idiom = this._idioms[card.idiomIdx];
      const isFound = idiom && idiom.found;
      ctx.fillStyle = card.selected ? '#FFFFFF' : (isFound ? 'rgba(255,255,255,0.3)' : '#E8E8E8');
      ctx.font = `bold ${dw(44)}px "PingFang SC", "KaiTi", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.char, x + cardSize / 2, y + cardSize / 2);
    });
  }

  /**
   * 底部：操作提示 + 道具栏（无提交/清除按钮）
   */
  _renderBottomBar(ctx) {
    const { dw, dh, screenWidth, screenHeight } = this.game;

    const barTop = screenHeight - dh(160);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, barTop - dh(10), screenWidth, screenHeight - barTop + dh(10));

    // 操作提示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `${dw(20)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('选择同一行的 4 个字组成成语', screenWidth / 2, barTop + dh(8));

    // 道具栏
    const powerY = barTop + dh(30);
    const powerBtnW = (screenWidth - dw(60)) / 3;

    const powers = [
      { icon: '💡', label: '提示', cooldown: this._hintCooldown, action: () => this._onHint() },
      { icon: '⏳', label: '加时 +10s', cooldown: 0, action: () => this._onAddTime() },
      { icon: '👁', label: '天眼', cooldown: 0, action: () => this._onInsight() }
    ];

    powers.forEach((p, i) => {
      const px = dw(20) + i * powerBtnW;

      ctx.fillStyle = p.cooldown > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';
      this._roundRect(ctx, px, powerY, powerBtnW - dw(8), dh(70), dw(10));
      ctx.fill();

      ctx.font = `${dw(28)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.icon, px + (powerBtnW - dw(8)) / 2, powerY + dh(24));

      ctx.fillStyle = p.cooldown > 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)';
      ctx.font = `${dw(18)}px "PingFang SC", sans-serif`;
      ctx.fillText(
        p.cooldown > 0 ? `${Math.ceil(p.cooldown)}s` : p.label,
        px + (powerBtnW - dw(8)) / 2,
        powerY + dh(54)
      );

      if (p.cooldown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this._roundRect(ctx, px, powerY, powerBtnW - dw(8), dh(70), dw(10));
        ctx.fill();
      }
    });
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
    ctx.globalAlpha = 1;
  }

  // ==================== 触摸交互 ====================

  onTouchEnd(pos) {
    const { dw, dh, screenWidth, screenHeight, safeArea } = this.game;
    const { GAME_CONFIG } = this.game;
    const rows = GAME_CONFIG.gridRows;
    const cols = GAME_CONFIG.gridCols;

    // 区域1：字卡网格
    const gridTop = (safeArea.top || 0) + dh(110);
    const gridLeft = dw(30);
    const gridRight = screenWidth - dw(30);
    const gridWidth = gridRight - gridLeft;
    const colGap = dw(8);
    const rowGap = dh(16);
    const cardSize = (gridWidth - colGap * (cols - 1)) / cols;
    const totalGridHeight = cardSize * rows + rowGap * (rows - 1);

    if (pos.y >= gridTop && pos.y <= gridTop + totalGridHeight &&
        pos.x >= gridLeft && pos.x <= gridRight) {
      const col = Math.floor((pos.x - gridLeft) / (cardSize + colGap));
      const row = Math.floor((pos.y - gridTop) / (cardSize + rowGap));
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        const index = row * cols + col;
        this._toggleCard(index);
      }
      return;
    }

    // 区域2：道具栏
    const barTop = screenHeight - dh(160);
    const powerY = barTop + dh(30);
    const powerBtnW = (screenWidth - dw(60)) / 3;
    if (pos.y >= powerY && pos.y <= powerY + dh(70)) {
      const pIdx = Math.floor((pos.x - dw(20)) / powerBtnW);
      if (pIdx === 0) this._onHint();
      else if (pIdx === 1) this._onAddTime();
      else if (pIdx === 2) this._onInsight();
    }
  }

  // ==================== 选中与自动校验 ====================

  _toggleCard(index) {
    const card = this._cards[index];
    if (!card) return;

    // 已找到的成语行不允许选中
    const idiom = this._idioms[card.idiomIdx];
    if (idiom && idiom.found) return;

    if (card.selected) {
      // 取消选中
      const oldOrder = card.selectOrder;
      card.selected = false;
      card.selectOrder = -1;
      this._cards.forEach((c) => {
        if (c.selected && c.selectOrder > oldOrder) {
          c.selectOrder--;
        }
      });
    } else {
      // 选中
      const currentCount = this._getSelectedCount();
      card.selected = true;
      card.selectOrder = currentCount;
    }

    // 选满4个 → 自动校验
    if (this._getSelectedCount() === 4) {
      this._autoValidate();
    }
  }

  _getSelectedCount() {
    return this._cards.filter((c) => c.selected).length;
  }

  /**
   * 自动校验：检查选中的4个字是否组成同一行的成语
   */
  _autoValidate() {
    const selected = this._cards
      .filter((c) => c.selected)
      .sort((a, b) => a.selectOrder - b.selectOrder);

    // 检查是否全部在同一行
    const rows = new Set(selected.map(c => c.row));
    const selectedIdioms = new Set(selected.map(c => c.idiomIdx));

    if (rows.size === 1 && selectedIdioms.size === 1) {
      const idiomIdx = [...selectedIdioms][0];
      const idiom = this._idioms[idiomIdx];

      if (!idiom.found) {
        // 检查选中的字符是否匹配成语
        const selectedChars = selected.map(c => c.char).sort().join('');
        const idiomChars = idiom.word.split('').sort().join('');

        if (selectedChars === idiomChars) {
          // ✅ 正确！
          this._onCorrect(idiomIdx, idiom);
          return;
        }
      }
    }

    // ❌ 错误
    this._onWrong();
  }

  /**
   * 找到成语：计分 + 消除 + 换新
   */
  _onCorrect(idiomIdx, idiom) {
    const { GAME_CONFIG } = this.game;

    // 标记已找到
    idiom.found = true;

    // 计分
    const baseScore = 4 * GAME_CONFIG.baseScorePerChar;  // 40
    this.game.gameData.combo++;
    const comboBonus = Math.floor(baseScore * (this.game.gameData.combo - 1) * GAME_CONFIG.comboMultiplier);
    const totalScore = baseScore + comboBonus;

    this.game.gameData.score += totalScore;
    this._wordsFound++;
    this._comboFlash = 1.0;

    // 得分弹出
    const { screenWidth, dh, safeArea } = this.game;
    const gridTop = (safeArea.top || 0) + dh(110);
    this._scorePopups.push({
      x: screenWidth / 2,
      y: gridTop + dh(40),
      text: `"${idiom.word}" +${totalScore}`,
      alpha: 1
    });
    if (this.game.gameData.combo >= 2) {
      this._scorePopups.push({
        x: screenWidth / 2,
        y: gridTop + dh(80),
        text: `连击×${this.game.gameData.combo}!`,
        alpha: 0.9
      });
    }

    // 震动
    try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}

    console.log(`[游戏] ✅ 找到成语: "${idiom.word}" +${totalScore} (连击×${this.game.gameData.combo})`);

    // 清除选中
    this._clearSelection();

    // 检查是否本轮4个全找完
    const allFound = this._idioms.every(i => i.found);
    if (allFound) {
      // 一轮完成：重新生成4个新成语
      console.log(`[游戏] 🎉 第${this._totalRounds + 1}轮完成！生成新成语`);
      this._totalRounds++;
      this._initGrid();
    } else {
      // 替换已找到的行
      this._refillRow(idiomIdx);
    }
  }

  /**
   * 错误：抖动 + 清空选中 + 重置连击
   */
  _onWrong() {
    this.game.gameData.combo = 0;
    this._shakeTimer = 0.3;
    try { wx.vibrateShort({ type: 'heavy' }); } catch (e) {}

    wx.showToast({ title: '不是成语，再试试~', icon: 'none', duration: 1000 });
    console.log('[游戏] ❌ 选中的4个字不能组成成语');

    this._clearSelection();
  }

  _clearSelection() {
    this._cards.forEach((c) => {
      c.selected = false;
      c.selectOrder = -1;
    });
  }

  // ==================== 道具系统 ====================

  /**
   * 提示：高亮一个未找到的成语的行
   */
  _onHint() {
    if (this._hintCooldown > 0) {
      wx.showToast({ title: `冷却中 ${Math.ceil(this._hintCooldown)}s`, icon: 'none' });
      return;
    }
    if (this.game.gameData.diamonds < 1) {
      wx.showToast({ title: '钻石不足', icon: 'none' });
      return;
    }

    // 找一个未找到的成语
    const unfound = this._idioms.find(i => !i.found);
    if (!unfound) {
      wx.showToast({ title: '本轮全部找到！', icon: 'none' });
      return;
    }

    this.game.gameData.diamonds--;
    this._hintCooldown = this.game.GAME_CONFIG.hintCooldown;

    // 自动选中该行的前两个字（在打乱的网格中按字符匹配）
    this._clearSelection();
    const rowIdx = unfound.cells[0].row;
    const rowCards = this._cards.filter(c => c.row === rowIdx);
    unfound.cells.slice(0, 2).forEach((cell, i) => {
      const card = rowCards.find(c => c.char === cell.char && !c.selected);
      if (card) {
        card.selected = true;
        card.selectOrder = i;
      }
    });

    wx.showToast({ title: `提示: 第${rowIdx + 1}行`, icon: 'none', duration: 1500 });
    console.log(`[道具] 提示: 第${rowIdx + 1}行 "${unfound.word}"`);
  }

  /**
   * 加时
   */
  _onAddTime() {
    if (this.game.gameData.diamonds < 2) {
      wx.showToast({ title: '钻石不足（需要2钻）', icon: 'none' });
      return;
    }
    this.game.gameData.diamonds -= 2;
    this._timeLeft += 10;
    wx.showToast({ title: '+10秒！', icon: 'success', duration: 1000 });
  }

  /**
   * 天眼：直接揭示一个成语（自动完成）
   */
  _onInsight() {
    if (this.game.gameData.diamonds < 3) {
      wx.showToast({ title: '钻石不足（需要3钻）', icon: 'none' });
      return;
    }

    const unfound = this._idioms.find(i => !i.found);
    if (!unfound) {
      wx.showToast({ title: '本轮全部找到！', icon: 'none' });
      return;
    }

    this.game.gameData.diamonds -= 3;
    this._clearSelection();

    // 自动全选（在打乱的网格中按字符匹配）并触发正确
    const rowIdx = unfound.cells[0].row;
    const rowCards = this._cards.filter(c => c.row === rowIdx);
    unfound.cells.forEach((cell, i) => {
      const card = rowCards.find(c => c.char === cell.char && !c.selected);
      if (card) {
        card.selected = true;
        card.selectOrder = i;
      }
    });

    // 直接触发校验
    this._autoValidate();

    console.log(`[道具] 天眼: 揭示 "${unfound.word}"`);
  }

  // ==================== 结算 ====================

  _onTimeUp() {
    if (this.game.gameData.score > this.game.gameData.bestScore) {
      this.game.gameData.bestScore = this.game.gameData.score;
    }
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
    this._scorePopups = [];
    console.log('[游戏] 游戏场景退出');
  }
}

module.exports = GameScene;
