/**
 * 对象池 — Object Pool
 * 复用粒子、动画对象，减少GC压力
 */

class ObjectPool {
  constructor(factory, reset, initialSize = 0) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];
    this._active = 0;

    // 预分配
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(this._factory());
    }
  }

  /**
   * 从池中获取一个对象
   */
  acquire() {
    let obj;
    if (this._pool.length > 0) {
      obj = this._pool.pop();
    } else {
      obj = this._factory();
    }
    this._active++;
    return obj;
  }

  /**
   * 归还对象到池中
   */
  release(obj) {
    if (!obj) return;
    this._reset(obj);
    this._pool.push(obj);
    this._active = Math.max(0, this._active - 1);
  }

  /**
   * 批量归还
   */
  releaseAll(objs) {
    for (const obj of objs) {
      this.release(obj);
    }
  }

  /**
   * 获取池中可用对象数量
   */
  get size() {
    return this._pool.length;
  }

  /**
   * 获取活跃对象数量
   */
  get activeCount() {
    return this._active;
  }

  /**
   * 清空对象池
   */
  clear() {
    this._pool.length = 0;
    this._active = 0;
  }
}

module.exports = ObjectPool;
