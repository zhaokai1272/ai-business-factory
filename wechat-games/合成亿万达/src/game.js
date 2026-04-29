/**
 * game.js — 合成亿万达 游戏主入口
 * 2048式拖拽合并 + 放置挂机系统
 * 微信小游戏 Canvas API + JavaScript ES6+
 */

// ==================== 全局游戏数据 ====================
const gameData = {
  totalWorth: 0,       // 总身价（元）
  coins: 100,           // 金币
  diamonds: 5,          // 钻石
  accelerators: 3,      // 加速券
  level: 1,             // 玩家等级
  lastOnlineTime: Date.now(),
  highestMerge: 1,      // 历史最高合成等级
  totalMerges: 0        // 总合成次数
};

// ==================== 云开发初始化 ====================
try {
  wx.cloud.init({ env: 'cloud1-xxxxxxxx', traceUser: true }); // 替换为实际云环境ID
  console.log('[云开发] 初始化成功');
} catch (e) {
  console.warn('[云开发] 初始化失败，本地模式:', e.message);
}

// ==================== Canvas初始化 ====================
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const sysInfo = wx.getSystemInfoSync();
const canvasWidth = sysInfo.screenWidth;
const canvasHeight = sysInfo.screenHeight;
const pixelRatio = sysInfo.pixelRatio || 1;

canvas.width = canvasWidth * pixelRatio;
canvas.height = canvasHeight * pixelRatio;
ctx.scale(pixelRatio, pixelRatio);

console.log(`[屏幕] ${canvasWidth}x${canvasHeight}`);

// ==================== 场景管理 ====================
let currentScene = null;
const scenes = {};

function switchScene(name, params = {}) {
  if (currentScene && currentScene.exit) currentScene.exit();
  
  if (!scenes[name]) {
    const SceneClass = {
      'menu': require('./js/scenes/MenuScene.js'),
      'game': require('./js/scenes/GameScene.js'),
      'result': require('./js/scenes/ResultScene.js')
    }[name];
    if (!SceneClass) { console.error(`未知场景: ${name}`); return; }
    scenes[name] = new SceneClass(game);
  }
  
  currentScene = scenes[name];
  if (currentScene.enter) currentScene.enter(params);
  console.log(`[场景] → ${name}`);
}

const game = { ctx, canvas, canvasWidth, canvasHeight, width: canvasWidth, height: canvasHeight, switchScene, gameData };

// ==================== 触摸事件 ====================
wx.onTouchStart((e) => {
  if (currentScene && currentScene.handleTouch) currentScene.handleTouch(e);
});
wx.onTouchMove((e) => {
  if (currentScene && currentScene.handleTouch) currentScene.handleTouch(e);
});
wx.onTouchEnd((e) => {
  if (currentScene && currentScene.handleTouch) currentScene.handleTouch(e);
});

// ==================== 主循环 ====================
let lastTime = 0;
function gameLoop(ts) {
  let dt = (ts - lastTime) / 1000; // 秒
  if (dt <= 0 || dt > 0.2) dt = 0.016;
  lastTime = ts;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (currentScene) {
    try {
      if (currentScene.update) currentScene.update(dt);
      if (currentScene.render) currentScene.render(ctx);
    } catch (e) { console.error('[主循环] 错误:', e); }
  }
  requestAnimationFrame(gameLoop);
}

// ==================== 启动 ====================
function bootstrap() {
  console.log('[启动] 合成亿万达 v1.0.0');
  switchScene('menu');
  lastTime = Date.now();
  requestAnimationFrame(gameLoop);
}
bootstrap();
