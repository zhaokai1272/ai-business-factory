/**
 * game.js — 卷王冲冲冲 竖版跑酷
 */
const gameData = { score:0, coins:0, diamonds:3, lives:3, distance:0, combo:0, speed:5, highScore:0, totalPlays:0, maxSpeed:20 };

try { wx.cloud.init({ env: 'cloud1-xxxxxxxx', traceUser: true }); }
catch(e) { console.warn('[云] 开发模式'); }

// Canvas
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const sysInfo = wx.getSystemInfoSync();
const canvasWidth = sysInfo.screenWidth;
const canvasHeight = sysInfo.screenHeight;
const pixelRatio = sysInfo.pixelRatio || 1;
canvas.width = canvasWidth * pixelRatio;
canvas.height = canvasHeight * pixelRatio;
ctx.scale(pixelRatio, pixelRatio);

// 场景
let currentScene = null;
const scenes = {};
function switchScene(name, params={}) {
  if (currentScene && currentScene.exit) currentScene.exit();
  if (!scenes[name]) {
    const SC = { menu: require('./js/scenes/MenuScene.js'), game: require('./js/scenes/GameScene.js'), result: require('./js/scenes/ResultScene.js') }[name];
    if (!SC) return;
    scenes[name] = new SC(game);
  }
  currentScene = scenes[name];
  if (currentScene.enter) currentScene.enter(params);
}
const game = { ctx, canvas, canvasWidth, canvasHeight, width:canvasWidth, height:canvasHeight, switchScene, gameData };

// 触摸
wx.onTouchStart(e => { if (currentScene && currentScene.handleTouch) currentScene.handleTouch(e); });

// 主循环
let lastTime = 0, isPaused = false;
function gameLoop(ts) {
  if (isPaused) { requestAnimationFrame(gameLoop); return; }
  let dt = (ts - lastTime) / 1000;
  if (dt <= 0 || dt > 0.2) dt = 0.016;
  lastTime = ts;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (currentScene) {
    try { if (currentScene.update) currentScene.update(dt); if (currentScene.render) currentScene.render(ctx); }
    catch(e) { console.error('[循环]', e); }
  }
  requestAnimationFrame(gameLoop);
}
wx.onShow(() => { isPaused = false; });
wx.onHide(() => { isPaused = true; });

// ============ 图片预加载 + 加载画面 ============
const ImageManager = require('./js/utils/ImageManager.js');
game.imageManager = ImageManager;

const ALL_IMAGES = [
  '01_icon.png','02_splash.png','03_menu_bg.png','04_player_idle.png',
  '05_player_run1.png','06_player_run2.png','07_player_run3.png','08_player_jump.png',
  '09_player_slide.png','10_player_death.png','11_obstacle_meeting.png','12_obstacle_boss.png',
  '13_obstacle_overtime.png','14_obstacle_deadline.png','15_obstacle_printer.png',
  '16_powerup_coffee.png','17_powerup_shield.png','18_powerup_magnet.png','19_powerup_speed.png',
  '20_powerup_double.png','21_bg_office_day.png','22_bg_office_night.png','23_bg_subway.png',
  '24_bg_lobby.png','25_bg_desk.png','26_ui_coin.png','27_ui_energy.png','28_ui_score.png',
  '29_btn_start.png','30_btn_retry.png','31_ui_leaderboard.png','32_ui_equip.png',
  '33_ui_share.png','34_panel_top.png','35_panel_pause.png','36_panel_result.png',
  '37_popup_shop.png','38_skin_default.png','39_ui_hp.png','40_ui_leaderboard_item.png',
  '40_ui_result.png','41_ui_skin_card.png','42_ui_badge.png','43_ui_loading.png',
  '44_ui_item_select.png','45_ui_share_card.png','46_ui_id_card.png','47_fx_boss_warning.png',
  '48_fx_levelup.png','49_fx_death.png','50_deco_loading.png'
];

let loadingProgress = 0;
let loadingTotal = ALL_IMAGES.length;

function drawLoadingScreen() {
  const w = canvasWidth, h = canvasHeight;
  const cx = w/2, cy = h/2;

  // 背景
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  // 标题
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('卷王冲冲冲', cx, cy - 60);

  // 副标题
  ctx.fillStyle = '#f39c12';
  ctx.font = '14px sans-serif';
  ctx.fillText('打工人の逆袭', cx, cy - 30);

  // 进度条背景
  const barW = w * 0.7, barH = 12, barX = cx - barW/2, barY = cy + 10;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(barX, barY, barW, barH);

  // 进度条
  const pct = loadingTotal > 0 ? loadingProgress / loadingTotal : 0;
  const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  grad.addColorStop(0, '#e74c3c');
  grad.addColorStop(1, '#f39c12');
  ctx.fillStyle = grad;
  ctx.fillRect(barX, barY, barW * pct, barH);

  // 百分比
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(Math.floor(pct * 100) + '%', cx, barY + barH + 20);

  // 底部提示
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px sans-serif';
  ctx.fillText('资源加载中...', cx, h - 30);
}

// 加载完成后进入菜单
function onLoadComplete() {
  console.log('[图片] 全部加载完成');
  loadingProgress = loadingTotal; // 确保100%
  drawLoadingScreen(); // 最后一帧100%
  // 短暂延迟让用户看到100%
  setTimeout(() => {
    switchScene('menu');
  }, 300);
}

// 启动
function bootstrap() {
  console.log('[启动] 卷王冲冲冲 v1.0.0');
  lastTime = 0;
  requestAnimationFrame(gameLoop);

  // 初始渲染加载画面
  currentScene = {
    update(dt) {
      const prog = ImageManager.progress();
      loadingProgress = prog.loaded;
      loadingTotal = prog.total;
    },
    render(ctx) { drawLoadingScreen(); },
    handleTouch() {} // 加载中不响应触摸
  };

  // 开始预加载
  ImageManager.preload(ALL_IMAGES,
    (loaded, total) => { loadingProgress = loaded; loadingTotal = total; },
    onLoadComplete
  );
}
bootstrap();
