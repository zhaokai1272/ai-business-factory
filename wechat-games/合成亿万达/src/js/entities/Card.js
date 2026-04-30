/**
 * Card.js — 合成卡片类
 *
 * 合成链 Lv1-Lv15:
 * '钢镚','小目标','中目标','大目标','亿万达','十亿万达','百亿万达','千亿万达',
 * '万亿万达','十万亿万达','百万亿万达','千万亿万达','亿亿万达','宇宙首富','多元宇宙首富'
 *
 * 面值: 10^level 元
 */

const CARD_NAMES = [
  '', // 占位，索引从1开始
  '钢镚',
  '小目标',
  '中目标',
  '大目标',
  '亿万达',
  '十亿万达',
  '百亿万达',
  '千亿万达',
  '万亿万达',
  '十万亿万达',
  '百万亿万达',
  '千万亿万达',
  '亿亿万达',
  '宇宙首富',
  '多元宇宙首富'
];

// 每级颜色方案 [背景色, 边框色, 文字色]
const LEVEL_COLORS = [
  null,
  ['#8B7355', '#6B5335', '#FFF8DC'],   // Lv1 钢镚 - 古铜
  ['#C0C0C0', '#A0A0A0', '#FFFFFF'],   // Lv2 小目标 - 银色
  ['#FFD700', '#DAA520', '#8B4513'],   // Lv3 中目标 - 金色
  ['#FF6347', '#CC4422', '#FFFFFF'],   // Lv4 大目标 - 橙红
  ['#FF1493', '#CC1070', '#FFFFFF'],   // Lv5 亿万达 - 粉红
  ['#9400D3', '#6A00A0', '#FFFFFF'],   // Lv6 十亿万达 - 紫
  ['#4169E1', '#2A4AB0', '#FFFFFF'],   // Lv7 百亿万达 - 蓝
  ['#00CED1', '#00A0A0', '#FFFFFF'],   // Lv8 千亿万达 - 青
  ['#00FF7F', '#00CC60', '#003300'],   // Lv9 万亿万达 - 翠绿
  ['#FF4500', '#CC3700', '#FFE4B5'],   // Lv10 十万亿万达 - 橙
  ['#DC143C', '#A01028', '#FFD700'],   // Lv11 百万亿万达 - 深红金
  ['#8B0000', '#600000', '#FFD700'],   // Lv12 千万亿万达 - 暗红金
  ['#1E90FF', '#1870CC', '#FFD700'],   // Lv13 亿亿万达 - 亮蓝金
  ['#FFD700', '#DAA520', '#8B0000'],   // Lv14 宇宙首富 - 金红
  ['#FF00FF', '#CC00CC', '#00FFFF']    // Lv15 多元宇宙首富 - 霓虹
];

const MAX_LEVEL = 15;

class Card {
  constructor(level = 1) {
    this.level = Math.min(Math.max(level, 1), MAX_LEVEL);
    this.name = CARD_NAMES[this.level];
    this.value = Math.pow(10, this.level);

    // 网格位置（-1表示未放置）
    this.gridRow = -1;
    this.gridCol = -1;

    // 拖拽状态
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // 动画状态
    this.animScale = 1;
    this.animAlpha = 1;
    this.animRotation = 0;
    this.bouncePhase = 0;
    this.isMerging = false;
    this.mergeTimer = 0;

    // 像素位置（渲染用）
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  /**
   * 获取当前等级的颜色方案
   */
  get colors() {
    return LEVEL_COLORS[this.level] || LEVEL_COLORS[1];
  }

  /**
   * 获取卡片大小（基于等级变化）
   */
  getSize(cellSize) {
    const baseSize = cellSize * 0.82;
    const levelBonus = (this.level - 1) * 2; // 高等级略大
    return Math.min(baseSize + levelBonus, cellSize * 0.95);
  }

  /**
   * 获取面值显示文本
   */
  getDisplayValue() {
    if (this.level <= 3) {
      return `${this.value}元`;
    }
    if (this.level <= 7) {
      const yi = this.value / 1e8;
      return `${yi}亿元`;
    }
    if (this.level <= 11) {
      const wanYi = this.value / 1e12;
      return `${wanYi}万亿元`;
    }
    const yiYi = this.value / 1e16;
    return `${yiYi}亿亿元`;
  }

  /**
   * 设置网格位置
   */
  setGridPosition(row, col) {
    this.gridRow = row;
    this.gridCol = col;
  }

  /**
   * 清理网格位置
   */
  clearGridPosition() {
    this.gridRow = -1;
    this.gridCol = -1;
  }

  /**
   * 渲染卡片到Canvas
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心x
   * @param {number} y - 中心y
   * @param {number} cellSize - 单元格大小
   */
  render(ctx, x, y, cellSize) {
    const size = this.getSize(cellSize);
    const half = size / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.animScale, this.animScale);
    if (this.animRotation) ctx.rotate(this.animRotation);
    ctx.globalAlpha = this.animAlpha;

    // 优先真实图片
    if (this._imgMgr) {
      const lvl = this.level - 1;
      if (lvl >= 0 && lvl <= 14) {
        const fn = `${String(4+lvl).padStart(2,'0')}_card_level${String(lvl).padStart(2,'0')}.png`;
        const img = this._imgMgr.get(fn);
        if (img) { ctx.drawImage(img, -half, -half, size, size); ctx.restore(); return; }
      }
    }

    // 回退: Canvas绘制
    const [bgColor, borderColor, textColor] = this.colors;
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillStyle = bgColor;
    this._drawRoundRect(ctx, -half, -half, size, size, size*0.15);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = borderColor; ctx.lineWidth = Math.max(2, size*0.04);
    this._drawRoundRect(ctx, -half, -half, size, size, size*0.15, false);
    const grad = ctx.createLinearGradient(-half,-half,-half,half);
    grad.addColorStop(0,'rgba(255,255,255,0.3)'); grad.addColorStop(0.5,'rgba(255,255,255,0)'); grad.addColorStop(1,'rgba(0,0,0,0.1)');
    ctx.fillStyle = grad; this._drawRoundRect(ctx, -half, -half, size, size, size*0.15);
    ctx.font = `bold ${size*0.22}px "PingFang SC",sans-serif`; ctx.fillStyle = textColor; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(`Lv.${this.level}`, 0, -size*0.15);
    ctx.font = `bold ${size*0.28}px "PingFang SC",sans-serif`;
    ctx.fillText(this.name.length>4?this.name.slice(0,4)+'..':this.name, 0, size*0.08);
    ctx.font = `${size*0.16}px "PingFang SC",sans-serif`;
    ctx.fillText(this.getDisplayValue(), 0, size*0.28);
    ctx.restore();
  }

  _drawRoundRect(ctx, x, y, w, h, r, fill = true) {
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
    if (fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  /**
   * 重置卡片状态（用于对象池回收）
   */
  reset(level = 1) {
    this.level = Math.min(Math.max(level, 1), MAX_LEVEL);
    this.name = CARD_NAMES[this.level];
    this.value = Math.pow(10, this.level);
    this.gridRow = -1;
    this.gridCol = -1;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.animScale = 1;
    this.animAlpha = 1;
    this.animRotation = 0;
    this.bouncePhase = 0;
    this.isMerging = false;
    this.mergeTimer = 0;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    return this;
  }
}

// 静态常量
Card.CARD_NAMES = CARD_NAMES;
Card.LEVEL_COLORS = LEVEL_COLORS;
Card.MAX_LEVEL = MAX_LEVEL;

module.exports = Card;
