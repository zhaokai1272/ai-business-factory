/**
 * ImageManager — 图片预加载(带进度+超时)
 */
const ImageManager = {
  _cache: {},
  _total: 0,
  _loaded: 0,
  _ready: false,
  _timeoutId: null,

  preload(paths, onProgress, onComplete) {
    this._total = paths.length;
    this._loaded = 0;
    this._ready = false;

    if (typeof wx === 'undefined' || !wx.createImage) {
      this._ready = true;
      if (onComplete) onComplete();
      return;
    }
    if (paths.length === 0) {
      this._ready = true;
      if (onComplete) onComplete();
      return;
    }

    let loaded = 0;
    const total = paths.length;

    // 超时兜底: 3秒后强制完成
    this._timeoutId = setTimeout(() => {
      if (!this._ready) {
        this._loaded = total;
        this._ready = true;
        if (onComplete) onComplete();
      }
    }, 3000);

    paths.forEach(p => {
      const img = wx.createImage();
      img.onload = () => {
        loaded++;
        this._loaded = loaded;
        this._cache[p] = img;
        if (onProgress) onProgress(loaded, total);
        if (loaded >= total) this._finish(onComplete);
      };
      img.onerror = () => {
        loaded++;
        this._loaded = loaded;
        if (loaded >= total) this._finish(onComplete);
      };
      img.src = 'images/' + p;
    });
  },

  _finish(onComplete) {
    if (this._ready) return;
    this._ready = true;
    if (this._timeoutId) clearTimeout(this._timeoutId);
    if (onComplete) onComplete();
  },

  get(name) {
    const img = this._cache[name];
    if (!img) return null;
    try { return (img.complete && img.width > 0) ? img : null; }
    catch(e) { return null; }
  },

  isReady() { return this._ready; },
  progress() { return { loaded: this._loaded, total: this._total }; }
};

module.exports = ImageManager;
