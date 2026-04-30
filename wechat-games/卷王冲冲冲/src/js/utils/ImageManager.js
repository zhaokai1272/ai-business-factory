/**
 * ImageManager — 图片预加载与缓存管理
 */
const ImageManager = {
  _cache: {},
  _loaded: 0,
  _total: 0,
  _ready: false,

  /** 批量预加载 */
  preload(paths, onProgress, onComplete) {
    this._total = paths.length;
    this._loaded = 0;
    this._ready = false;

    if (typeof wx === 'undefined' || !wx.createImage) {
      // 非微信环境直接完成
      this._loaded = this._total;
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
    paths.forEach(p => {
      const img = wx.createImage();
      img.onload = () => {
        loaded++;
        this._loaded = loaded;
        if (onProgress) onProgress(loaded, this._total);
        if (loaded >= this._total) {
          this._ready = true;
          if (onComplete) onComplete();
        }
      };
      img.onerror = () => {
        loaded++;
        this._loaded = loaded;
        if (loaded >= this._total) {
          this._ready = true;
          if (onComplete) onComplete();
        }
      };
      img.src = 'images/' + p;
      this._cache[p] = img;
    });
  },

  /** 获取已缓存图片 */
  get(name) { return this._cache[name] || null; },

  /** 单张加载 */
  loadOne(name) {
    if (this._cache[name]) return this._cache[name];
    if (typeof wx === 'undefined' || !wx.createImage) return null;
    const img = wx.createImage();
    img.src = 'images/' + name;
    this._cache[name] = img;
    return img;
  },

  isReady() { return this._ready; },
  progress() { return { loaded: this._loaded, total: this._total }; }
};

module.exports = ImageManager;
