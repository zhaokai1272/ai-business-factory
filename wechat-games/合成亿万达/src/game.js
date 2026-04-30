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

// ==================== 系统挂载 ====================
const IdleSystem = require('./js/systems/IdleSystem.js');
const MergeSystem = require('./js/systems/MergeSystem.js');
game.idleSystem = new IdleSystem(game);
game.mergeSystem = new MergeSystem(game);

// ==================== 触摸事件 ====================
wx.onTouchStart((e) => {
  if (!currentScene) return;
  const t = e.touches[0];
  if (currentScene.onTouchStart) currentScene.onTouchStart(t.clientX, t.clientY);
});
wx.onTouchMove((e) => {
  if (!currentScene) return;
  const t = e.touches[0];
  if (currentScene.onTouchMove) currentScene.onTouchMove(t.clientX, t.clientY);
});
wx.onTouchEnd((e) => {
  if (!currentScene) return;
  const t = e.changedTouches[0];
  if (currentScene.onTouchEnd) currentScene.onTouchEnd(t.clientX, t.clientY);
});

// ==================== 主循环 ====================
let lastTime = 0;
let isPaused = false;
function gameLoop(ts) {
  if (isPaused) { requestAnimationFrame(gameLoop); return; }
  let dt = (ts - lastTime) / 1000; // seconds
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

// ==================== 生命周期 ====================
wx.onShow(() => { isPaused = false; console.log('[生命周期] 恢复'); });
wx.onHide(() => { isPaused = true; console.log('[生命周期] 暂停'); });

// ==================== 图片预加载 ====================
const ImageManager = require('./js/utils/ImageManager.js');
game.imageManager = ImageManager;

const PRELOAD = [
  '03_menu_bg.png', '37_bg_board.png',
  '04_card_level00.png','05_card_level01.png','06_card_level02.png',
  '07_card_level03.png','08_card_level04.png','09_card_level05.png',
  '10_card_level06.png','11_card_level07.png','12_card_level08.png',
  '13_card_level09.png','14_card_level10.png','15_card_level11.png',
  '16_card_level12.png','17_card_level13.png','18_card_level14.png',
  '19_merge_effect_normal.png','20_merge_effect_super.png',
  '44_fx_level_up.png','46_fx_idle_coins.png',
];

// ==================== 启动 ====================
function bootstrap() {
  console.log('[启动] 合成亿万达 v1.0.0');
  ImageManager.preload(PRELOAD, null, () => {
    console.log('[图片] 预加载完成');
    switchScene('menu');
    lastTime = 0;
    requestAnimationFrame(gameLoop);
  });
}
bootstrap();
