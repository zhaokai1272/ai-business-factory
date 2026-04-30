/**
 * game.js — 卷王冲冲冲 游戏主入口
 * 横向3跑道跑酷，竖屏模式
 * 微信小游戏 Canvas API + JavaScript ES6+
 */

// ==================== 全局游戏数据 ====================
const gameData = {
  score: 0,
  coins: 0,
  diamonds: 3,
  lives: 3,
  distance: 0,
  combo: 0,
  speed: 5,
  highScore: 0,
  totalPlays: 0
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
const scenes = {}; // 场景实例缓存

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

// game对象（注入给所有Scene）
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
let isPaused = false;
function gameLoop(ts) {
  if (isPaused) { requestAnimationFrame(gameLoop); return; }
  let dt = (ts - lastTime) / 1000; // seconds
  if (dt <= 0 || dt > 0.2) dt = 0.016; // clamp
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

// ==================== 生命周期 ====================
wx.onShow(() => { isPaused = false; console.log('[生命周期] 恢复'); });
wx.onHide(() => { isPaused = true; console.log('[生命周期] 暂停'); });

// ==================== 启动 ====================
function bootstrap() {
  console.log('[启动] 卷王冲冲冲 v1.0.0');
  switchScene('menu');
  lastTime = 0; // will be set on first frame
  requestAnimationFrame(gameLoop);
}
bootstrap();
