/**
 * MergeSystem.js — 合成系统
 * 处理合成逻辑、暴击判定、合成结果生成
 */

const Card = require('../entities/Card');

// 粒子爆发配置
const PARTICLE_COUNT = 12;
const PARTICLE_SPEED = 200;

class MergeSystem {
  constructor(game) {
    this.game = game;
  }

  /**
   * 判断两个卡片是否可以合成
   * @param {Card} card1
   * @param {Card} card2
   * @returns {boolean}
   */
  canMerge(card1, card2) {
    if (!card1 || !card2) return false;
    if (card1 === card2) return false;
    if (card1.level !== card2.level) return false;
    if (card1.level >= Card.MAX_LEVEL) return false;
    return true;
  }

  /**
   * 执行合成
   * @param {Card} card1 - 被拖拽的卡片（将变成合成结果）
   * @param {Card} card2 - 目标位置的卡片（将被移除）
   * @returns {{ result: Card, isCrit: boolean, coinsEarned: number } | null}
   */
  merge(card1, card2) {
    if (!this.canMerge(card1, card2)) return null;

    const baseLevel = card1.level;
    const isCrit = Math.random() < 0.05; // 5% 暴击概率
    const newLevel = isCrit ? Math.min(baseLevel + 2, Card.MAX_LEVEL) : baseLevel + 1;

    // 合成金币奖励 = 被合成卡面值之和 × 0.1
    const coinsEarned = Math.floor((card1.value + card2.value) * 0.1);

    // 更新card1为合成结果
    card1.reset(newLevel);
    card1.gridRow = card2.gridRow;
    card1.gridCol = card2.gridCol;

    // 标记合成动画
    card1.isMerging = true;
    card1.mergeTimer = 0.4; // 0.4秒动画
    card1.animScale = 1.5;
    card1.animRotation = 0;

    // 更新游戏数据
    const gd = this.game.gameData;
    gd.coins += coinsEarned;
    gd.totalWorth = Math.max(gd.totalWorth, card1.value);

    // 生成粒子效果数据
    const particles = this._generateParticles(
      card1.x, card1.y,
      isCrit ? '#FFD700' : card1.colors[0],
      isCrit
    );

    return {
      result: card1,
      isCrit,
      coinsEarned,
      particles
    };
  }

  /**
   * 生成合成粒子效果数据
   */
  _generateParticles(x, y, color, isCrit) {
    const count = isCrit ? PARTICLE_COUNT * 2 : PARTICLE_COUNT;
    const particles = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
      const speed = PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - speed * 0.3,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        color,
        size: 3 + Math.random() * 5
      });
    }

    return particles;
  }
}

module.exports = MergeSystem;
