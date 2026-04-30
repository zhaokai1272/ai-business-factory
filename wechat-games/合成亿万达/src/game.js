/**
 * game.js — 合成亿万达 (全部图片渲染)
 */
const gameData = { totalWorth:0, coins:100, diamonds:5, accelerators:3, level:1, highestMerge:1, totalMerges:0 };

try { wx.cloud.init({ env:'cloud1-xxxxxxxx', traceUser:true }); } catch(e){}

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const sysInfo = wx.getSystemInfoSync();
const canvasWidth = sysInfo.screenWidth, canvasHeight = sysInfo.screenHeight;
const pixelRatio = sysInfo.pixelRatio||1;
canvas.width = canvasWidth*pixelRatio; canvas.height = canvasHeight*pixelRatio;
ctx.scale(pixelRatio, pixelRatio);

let currentScene = null;
const scenes = {};
function switchScene(name, params={}) {
  if (currentScene&&currentScene.exit) currentScene.exit();
  if (!scenes[name]) {
    const SC = { menu:require('./js/scenes/MenuScene.js'), game:require('./js/scenes/GameScene.js'), result:require('./js/scenes/ResultScene.js') }[name];
    if (!SC) return;
    scenes[name] = new SC(game);
  }
  currentScene = scenes[name];
  if (currentScene.enter) currentScene.enter(params);
}

const IdleSystem = require('./js/systems/IdleSystem.js');
const MergeSystem = require('./js/systems/MergeSystem.js');
const game = { ctx, canvas, canvasWidth, canvasHeight, width:canvasWidth, height:canvasHeight, switchScene, gameData,
  idleSystem: null, mergeSystem: null, imageManager: null };
game.idleSystem = new IdleSystem(game);
game.mergeSystem = new MergeSystem(game);

wx.onTouchStart(e => {
  if (!currentScene) return;
  const t = e.touches[0];
  if (currentScene.onTouchStart) currentScene.onTouchStart(t.clientX, t.clientY);
});
wx.onTouchMove(e => {
  if (!currentScene) return;
  const t = e.touches[0];
  if (currentScene.onTouchMove) currentScene.onTouchMove(t.clientX, t.clientY);
});
wx.onTouchEnd(e => {
  if (!currentScene) return;
  const t = e.changedTouches[0];
  if (currentScene.onTouchEnd) currentScene.onTouchEnd(t.clientX, t.clientY);
});

let lastTime = 0, isPaused = false;
function gameLoop(ts) {
  if (isPaused) { requestAnimationFrame(gameLoop); return; }
  let dt = (ts-lastTime)/1000; if (dt<=0||dt>0.2) dt=0.016; lastTime=ts;
  ctx.clearRect(0,0,canvasWidth,canvasHeight);
  if (currentScene) { try{ if(currentScene.update)currentScene.update(dt); if(currentScene.render)currentScene.render(); } catch(e){ console.error(e); } }
  requestAnimationFrame(gameLoop);
}
wx.onShow(()=>{isPaused=false;}); wx.onHide(()=>{isPaused=true;});

// ========== 预加载+加载画面 ==========
const ImageManager = require('./js/utils/ImageManager.js');
game.imageManager = ImageManager;

const IMG_LIST = [
  '03_menu_bg.png','37_bg_board.png',
  '04_card_level00.png','05_card_level01.png','06_card_level02.png','07_card_level03.png',
  '08_card_level04.png','09_card_level05.png','10_card_level06.png','11_card_level07.png',
  '12_card_level08.png','13_card_level09.png','14_card_level10.png','15_card_level11.png',
  '16_card_level12.png','17_card_level13.png','18_card_level14.png',
  '19_merge_effect_normal.png','20_merge_effect_super.png',
  '21_ui_coin_icon.png','22_ui_gem_icon.png','23_ui_energy_icon.png',
  '24_ui_button_merge.png','25_ui_button_shop.png',
  '26_ui_panel_top.png','27_ui_panel_merge.png','28_ui_panel_bottom.png',
  '29_ui_popup_offline.png','31_ui_popup_shop.png',
  '33_btn_buy_card.png','34_btn_boost.png',
  '43_fx_merge_glow.png','44_fx_level_up.png','46_fx_idle_coins.png',
];

let loadProg=0, loadTotal=IMG_LIST.length;
function drawLoading() {
  const w=canvasWidth, h=canvasHeight, cx=w/2, cy=h/2;
  ctx.fillStyle='#0a0a2e'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#FFD700'; ctx.font='bold 26px sans-serif'; ctx.textAlign='center';
  ctx.fillText('合成亿万达', cx, cy-40);
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='13px sans-serif';
  ctx.fillText('拖拽合成 × 放置挂机', cx, cy-10);
  const bw=w*0.65, bh=10, bx=cx-bw/2, by=cy+10;
  ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(bx,by,bw,bh);
  const pct=loadTotal>0?loadProg/loadTotal:0;
  const g=ctx.createLinearGradient(bx,0,bx+bw,0); g.addColorStop(0,'#FF6347'); g.addColorStop(1,'#FFD700');
  ctx.fillStyle=g; ctx.fillRect(bx,by,bw*pct,bh);
  ctx.fillStyle='#fff'; ctx.font='12px sans-serif';
  ctx.fillText(Math.floor(pct*100)+'%', cx, by+bh+18);
}

function onReady() {
  loadProg=loadTotal; drawLoading();
  setTimeout(()=>switchScene('menu'), 300);
}

function bootstrap() {
  lastTime=0; requestAnimationFrame(gameLoop);
  currentScene = {
    update(dt){ const p=ImageManager.progress(); loadProg=p.loaded; loadTotal=p.total; },
    render(ctx){ drawLoading(); },
    onTouchStart(){}
  };
  ImageManager.preload(IMG_LIST, (l,t)=>{loadProg=l;loadTotal=t;}, onReady);
}
bootstrap();
