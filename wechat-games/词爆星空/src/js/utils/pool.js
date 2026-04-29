/**
 * js/utils/pool.js — 对象池
 * 复用对象以减少GC压力，适用于子弹、粒子、字卡动画等高频创建销毁的对象
 */
class ObjectPool {
  /**
   * @param {Function} createFn - 创建新对象的工厂函数，返回新对象
   * @param {Function} resetFn - 重置对象状态的函数，接收对象作为参数
   * @param {number} initialSize - 初始预创建对象数量（默认0）
   */
  constructor(createFn, resetFn, initialSize = 0) {
    this._create = createFn;   // 工厂方法
    this._reset = resetFn;     // 重置方法
    this._pool = [];           // 空闲对象数组（栈结构，LIFO提升缓存命中）
    this._active = new Set();  // 活跃对象集合（用于调试和批量操作）

    // 预创建指定数量的对象
    for (let i = 0; i < initialSize; i++) {
      const obj = this._create();
      this._reset(obj);
      this._pool.push(obj);
    }
  }

  /**
   * 从池中获取一个对象（优先复用空闲对象）
   * @returns {Object} 可用的对象
   */
  acquire() {
    let obj;
    if (this._pool.length > 0) {
      obj = this._pool.pop(); // 复用池中空闲对象
    } else {
      obj = this._create();   // 池空则创建新对象
    }
    this._active.add(obj);    // 标记为活跃
    return obj;
  }

  /**
   * 将对象归还到池中
   * @param {Object} obj - 要归还的对象
   */
  release(obj) {
    if (!obj) return; // 防御性检查
    this._active.delete(obj); // 移除活跃标记
    this._reset(obj);         // 重置对象状态
    this._pool.push(obj);     // 放入空闲池
  }

  /**
   * 批量归还所有活跃对象
   */
  releaseAll() {
    this._active.forEach((obj) => {
      this._reset(obj);
      this._pool.push(obj);
    });
    this._active.clear(); // 清空活跃集合
  }

  /**
   * 获取当前池状态信息（调试用）
   * @returns {{free: number, active: number, total: number}}
   */
  getStats() {
    return {
      free: this._pool.length,      // 空闲数量
      active: this._active.size,    // 活跃数量
      total: this._pool.length + this._active.size // 总对象数
    };
  }

  /**
   * 清空对象池
   */
  clear() {
    this._pool.length = 0;  // 清空空闲数组
    this._active.clear();   // 清空活跃集合
  }
}

// CommonJS 导出
module.exports = ObjectPool;
