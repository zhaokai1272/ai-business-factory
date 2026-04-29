/**
 * game.js — 词爆星空 微信小游戏入口
 * 4×4 字卡网格，每行一个四字成语，选4字自动校验
 */
const Scene = require('./js/core/Scene.js');

// ==================== 画布初始化 ====================
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

let screenWidth = canvas.width;
let screenHeight = canvas.height;
const safeArea = { top: 0, bottom: screenHeight, left: 0, right: screenWidth };

// 设计稿基准 390×844 (iPhone 12/13 Pro)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scaleX = screenWidth / BASE_WIDTH;
const scaleY = screenHeight / BASE_HEIGHT;
const dw = (val) => val * scaleX;
const dh = (val) => val * scaleY;

console.log(`[屏幕] ${screenWidth}x${screenHeight}, 安全区top=${safeArea.top}, bottom=${safeArea.bottom}`);

// ==================== 游戏配置常量 ====================
const GAME_CONFIG = {
  gridRows: 4,           // 4行
  gridCols: 4,           // 4列 = 16格 = 4个成语
  gameDuration: 120,     // 单局时长（秒）
  energyCost: 5,         // 每局消耗体力
  baseScorePerChar: 10,  // 每个字基础分
  comboMultiplier: 0.5,  // 连击倍率增量
  hintCooldown: 10,      // 提示道具冷却（秒）
};

// ==================== 场景管理器 ====================
let currentScene = null;

function switchScene(newScene) {
  if (currentScene && typeof currentScene.exit === 'function') {
    currentScene.exit();
  }
  currentScene = newScene;
  if (currentScene && typeof currentScene.enter === 'function') {
    currentScene.enter();
  }
  console.log(`[场景] 切换到: ${newScene ? newScene.constructor.name : 'null'}`);
}

// ==================== 触摸事件处理 ====================
function getTouchPos(e) {
  if (!e.touches || e.touches.length === 0) return null;
  const touch = e.touches[0];
  return { x: touch.clientX, y: touch.clientY };
}

wx.onTouchStart((e) => {
  const pos = getTouchPos(e);
  if (pos && currentScene && currentScene.onTouchStart) {
    currentScene.onTouchStart(pos, e);
  }
});

wx.onTouchMove((e) => {
  const pos = getTouchPos(e);
  if (pos && currentScene && currentScene.onTouchMove) {
    currentScene.onTouchMove(pos, e);
  }
});

wx.onTouchEnd((e) => {
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  const touch = e.changedTouches[0];
  const pos = { x: touch.clientX, y: touch.clientY };
  if (pos && currentScene && currentScene.onTouchEnd) {
    currentScene.onTouchEnd(pos, e);
  }
});

// ==================== 主循环 ====================
let lastTime = 0;

function gameLoop(timestamp) {
  let dt = (timestamp - lastTime) / 1000;
  if (dt <= 0 || dt > 0.2) dt = 0.016;
  lastTime = timestamp;

  ctx.clearRect(0, 0, screenWidth, screenHeight);

  if (currentScene) {
    try {
      if (typeof currentScene.update === 'function') {
        currentScene.update(dt);
      }
      ctx.save();
      if (typeof currentScene.render === 'function') {
        currentScene.render(ctx);
      }
      ctx.restore();
    } catch (error) {
      console.error('[主循环] 渲染错误:', error);
    }
  }

  requestAnimationFrame(gameLoop);
}

// ==================== 游戏数据 ====================
const gameData = {
  score: 0,
  bestScore: 0,
  combo: 0,
  maxCombo: 0,
  diamonds: 6,
  energy: 30,
  totalWords: 0,
  level: 1,
};

// ==================== 启动 ====================
console.log('[启动] 词爆星空 v1.1.0');
console.log(`[启动] 设备: ${wx.getSystemInfoSync().model}, 微信: ${wx.getSystemInfoSync().version}`);

try {
  const MenuScene = require('./js/scenes/MenuScene.js');
  switchScene(new MenuScene({
    gameData, switchScene, GAME_CONFIG,
    dw, dh, screenWidth, screenHeight, safeArea
  }));
} catch (error) {
  console.error('[启动] 加载主菜单失败:', error);
}

requestAnimationFrame(gameLoop);

export { gameData, GAME_CONFIG, screenWidth, screenHeight, safeArea, dw, dh, switchScene };
