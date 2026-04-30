const ImageManager = {
  _cache: {},
  preload(paths) {
    if (typeof wx === 'undefined' || !wx.createImage) return;
    paths.forEach(p => {
      try {
        const img = wx.createImage();
        img.src = 'images/' + p;
        this._cache[p] = img;
      } catch(e) {}
    });
  },
  get(name) {
    const img = this._cache[name];
    if (!img) return null;
    try { return (img.complete && img.width > 0) ? img : null; }
    catch(e) { return null; }
  }
};
module.exports = ImageManager;
