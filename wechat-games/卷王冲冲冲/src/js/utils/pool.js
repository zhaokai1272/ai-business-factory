/**
 * 对象池 - 用于障碍物和道具的复用，避免频繁GC
 * 核心：预创建对象 → 获取(activate) → 使用 → 回收(deactivate) → 复用
 */
class ObjectPool {
  /**
   * @param {Function} factory - 对象工厂函数，返回新对象
   * @param {Function} reset - 对象重置函数(obj) => void
   * @param {number} initialSize - 初始池大小，默认20
   */
  constructor(factory, reset, initialSize = 20) {
    this.factory = factory; // 工厂函数
    this.reset = reset; // 重置函数
    this.pool = []; // 存储所有对象(包括活跃和非活跃)
    this.activeCount = 0; // 活跃对象计数

    // 预创建对象填充池
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj._active = false; // 标记非活跃
      this.pool.push(obj);
    }
  }

  /**
   * 从池中获取一个对象
   * 优先取非活跃对象，池空时扩容
   * @returns {Object} 已标记为活跃的对象
   */
  acquire() {
    // 先查找非活跃对象
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i]._active) {
        this.pool[i]._active = true; // 标记活跃
        this.activeCount++;
        return this.pool[i];
      }
    }
    // 池中无非活跃对象，创建新对象
    const obj = this.factory();
    obj._active = true;
    this.pool.push(obj);
    this.activeCount++;
    return obj;
  }

  /**
   * 回收对象到池中
   * @param {Object} obj - 要回收的对象
   */
  release(obj) {
    if (!obj || !obj._active) return; // 已回收则跳过
    this.reset(obj); // 调用重置函数清理状态
    obj._active = false; // 标记非活跃
    this.activeCount--;
  }

  /**
   * 回收所有活跃对象
   */
  releaseAll() {
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i]._active) {
        this.reset(this.pool[i]);
        this.pool[i]._active = false;
      }
    }
    this.activeCount = 0;
  }

  /**
   * 获取所有活跃对象(用于渲染/更新循环)
   * @returns {Array}
   */
  getActive() {
    const result = [];
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i]._active) {
        result.push(this.pool[i]);
      }
    }
    return result;
  }

  /**
   * 遍历所有活跃对象
   * @param {Function} callback - (obj) => void
   */
  forEachActive(callback) {
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i]._active) {
        callback(this.pool[i]);
      }
    }
  }

  /**
   * 获取池统计信息
   * @returns {{ total: number, active: number, inactive: number }}
   */
  stats() {
    return {
      total: this.pool.length,
      active: this.activeCount,
      inactive: this.pool.length - this.activeCount,
    };
  }

  /**
   * 清空整个池
   */
  clear() {
    this.pool = [];
    this.activeCount = 0;
  }
}

// 导出至全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ObjectPool;
}
