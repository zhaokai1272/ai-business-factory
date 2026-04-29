/**
 * game.js — 词爆星空 游戏主入口
 * 微信小游戏 Canvas API + JavaScript ES6+
 * 无框架，纯原生API实现
 */

// ==================== 全局状态对象 ====================
// 持久化游戏数据（后续接入云存储/本地缓存）
const gameData = {
  score: 0,        // 当前得分
  coins: 100,      // 金币（初始100）
  diamonds: 5,     // 钻石
  energy: 30,      // 体力（每局消耗5点）
  level: 1,        // 当前关卡
  combo: 0,        // 连击数
  maxCombo: 0,     // 最高连击
  totalWords: 0,   // 历史找到的词汇总数
  bestScore: 0     // 历史最高分
};

// ==================== 云开发初始化 ====================
try {
  wx.cloud.init({
    env: 'cloud1-xxxxxxxx', // 替换为实际云环境ID（微信云开发控制台获取）
    traceUser: true
  });
  console.log('[云开发] 初始化成功');
} catch (error) {
  console.warn('[云开发] 初始化失败，使用本地模式:', error.message);
}

// ==================== Canvas 初始化 & 屏幕适配 ====================
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 获取屏幕信息并处理刘海屏安全区域
const sysInfo = wx.getSystemInfoSync();
const screenWidth = sysInfo.screenWidth;
const screenHeight = sysInfo.screenHeight;
const safeArea = sysInfo.safeArea || { top: 0, bottom: screenHeight, left: 0, right: screenWidth };
const pixelRatio = sysInfo.pixelRatio || 1;

// 设置Canvas物理尺寸（适配高DPI）
canvas.width = screenWidth * pixelRatio;
canvas.height = screenHeight * pixelRatio;
ctx.scale(pixelRatio, pixelRatio);

// 设计基准宽高（以750为基准等比缩放）
const designWidth = 750;
const designHeight = 1334;
const scaleX = screenWidth / designWidth;   // X轴缩放比
const scaleY = screenHeight / designHeight; // Y轴缩放比

// 全局缩放辅助函数：设计稿尺寸 → 实际像素
const dw = (val) => val * scaleX; // 按宽度缩放
const dh = (val) => val * scaleY; // 按高度缩放

console.log(`[屏幕] ${screenWidth}x${screenHeight}, 安全区top=${safeArea.top}, bottom=${safeArea.bottom}`);

// ==================== 游戏配置常量 ====================
const GAME_CONFIG = {
  gridRows: 4,          // 字卡网格行数
  gridCols: 4,          // 字卡网格列数
  gameDuration: 120,    // 单局时长（秒）
  energyCost: 5,        // 每局消耗体力
  baseScorePerChar: 10, // 每个字基础分
  comboMultiplier: 0.5, // 连击倍率增量
  hintCooldown: 10,     // 提示道具冷却（秒）
};

// ==================== 场景管理器 ====================
let currentScene = null; // 当前活跃场景引用

/**
 * 切换到指定场景
 * @param {Scene} newScene - 目标场景实例
 */
function switchScene(newScene) {
  if (currentScene && typeof currentScene.exit === 'function') {
    currentScene.exit(); // 调用旧场景退出方法
  }
  currentScene = newScene;
  if (currentScene && typeof currentScene.enter === 'function') {
    currentScene.enter(); // 调用新场景进入方法
  }
  console.log(`[场景] 切换到: ${newScene ? newScene.constructor.name : 'null'}`);
}

// ==================== 触摸事件处理 ====================
/**
 * 将触摸坐标转换为逻辑坐标（去除像素比影响）
 */
function getTouchPos(e) {
  if (!e.touches || e.touches.length === 0) return null;
  const touch = e.touches[0];
  return {
    x: touch.clientX, // clientX已是逻辑坐标
    y: touch.clientY
  };
}

// 绑定全局触摸事件，转发给当前场景
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
  // touchEnd时touches为空，需用changedTouches
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  const touch = e.changedTouches[0];
  const pos = { x: touch.clientX, y: touch.clientY };
  if (pos && currentScene && currentScene.onTouchEnd) {
    currentScene.onTouchEnd(pos, e);
  }
});

// ==================== 主循环 ====================
let lastTime = 0; // 上一帧时间戳（ms）

/**
 * 游戏主循环（由requestAnimationFrame驱动）
 * @param {number} timestamp - 当前帧时间戳
 */
function gameLoop(timestamp) {
  // 计算帧间隔时间（秒），首帧或异常时限制最大值
  let dt = (timestamp - lastTime) / 1000;
  if (dt <= 0 || dt > 0.2) dt = 0.016; // 限制最大帧间隔200ms，默认约60fps
  lastTime = timestamp;

  // 清除画布
  ctx.clearRect(0, 0, screenWidth, screenHeight);

  // 更新并渲染当前场景
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
      console.error('[主循环] 场景执行错误:', error);
    }
  }

  // 请求下一帧
  requestAnimationFrame(gameLoop);
}

// ==================== 启动游戏 ====================
/**
 * 游戏启动入口
 */
async function bootstrap() {
  console.log('[启动] 词爆星空 v1.0.0');
  console.log(`[启动] 设备: ${sysInfo.model}, 微信: ${sysInfo.version}`);

  try {
    // 预加载必要的JS模块（微信小游戏require为同步调用）
    const MenuScene = require('./js/scenes/MenuScene.js');
    // 启动时进入主菜单场景
    switchScene(new MenuScene({ gameData, switchScene, GAME_CONFIG, dw, dh, screenWidth, screenHeight, safeArea }));
    console.log('[启动] 主菜单场景已加载');
  } catch (error) {
    console.error('[启动] 场景加载失败:', error);
    // 降级：绘制错误信息到Canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${dh(36)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏加载失败，请重试', screenWidth / 2, screenHeight / 2);
    return;
  }

  // 启动主循环
  lastTime = Date.now();
  requestAnimationFrame(gameLoop);
  console.log('[启动] 游戏主循环已开始');
}

// 执行启动
bootstrap();

// ==================== 导出全局变量（供场景使用） ====================
export { gameData, GAME_CONFIG, screenWidth, screenHeight, safeArea, dw, dh, switchScene };
