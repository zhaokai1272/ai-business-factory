/**
 * WordBank.js — 词库与网格找词算法
 * 
 * 功能：
 *   1. 200+词汇的词库
 *   2. 从 4×4 汉字网格中找出所有可组成的有效词汇（BFS邻接搜索）
 *   3. 供 GameScene 的提示/天眼道具使用
 * 
 * 邻接规则：上下左右四方向相邻，每个单元格只能用一次
 */

// ==================== 词库 (200+ 常用双字词/成语) ====================
const WORD_DICT = new Set([
  // === 天文自然 (30词) ===
  '星空', '星星', '天空', '流星', '银河', '宇宙', '太阳', '月亮', '地球',
  '火星', '金星', '水星', '木星', '土星', '北斗', '北极', '南极', '彩虹',
  '白云', '蓝天', '晚霞', '朝霞', '闪电', '雷鸣', '风雨', '雷电', '山海',
  '春风', '秋月', '冬雪', '夏日', '大雪', '小雨', '晴天', '阴天', '雾霾',
  '冰雹', '霜冻', '露水', '彩虹',

  // === 成语经典 (40词) ===
  '一心一意', '三心二意', '四面八方', '五光十色', '六神无主', '七上八下',
  '九牛一毛', '十全十美', '百发百中', '千军万马', '万水千山', '天长地久',
  '风花雪月', '花好月圆', '龙飞凤舞', '马到成功', '心想事成', '万事如意',
  '一帆风顺', '步步高升', '金榜题名', '名列前茅', '出类拔萃', '鹤立鸡群',
  '如鱼得水', '画龙点睛', '虎头蛇尾', '鸡飞狗跳', '狼吞虎咽', '对牛弹琴',

  // === 情感生活 (30词) ===
  '快乐', '幸福', '美好', '希望', '梦想', '未来', '光明', '成功', '努力',
  '坚持', '勇敢', '自由', '和平', '健康', '平安', '爱情', '友情', '亲情',
  '温暖', '善良', '美丽', '可爱', '开心', '微笑', '眼泪', '感动', '思念',
  '回忆', '珍惜', '感恩', '祝福', '团圆',

  // === 学习成长 (25词) ===
  '学习', '知识', '智慧', '才华', '读书', '写作', '思考', '创造', '发明',
  '探索', '发现', '研究', '实验', '进步', '成长', '考试', '毕业', '大学',
  '老师', '同学', '朋友', '家人', '故乡', '远方', '世界',

  // === 科技数字 (20词) ===
  '科技', '数学', '物理', '化学', '历史', '地理', '生物', '音乐', '美术',
  '体育', '电脑', '手机', '网络', '数据', '算法', '编程', '人工智能',
  '机器人', '互联网', '区块链',

  // === 文化艺术 (20词) ===
  '文化', '艺术', '诗词', '书法', '绘画', '音乐', '舞蹈', '戏剧', '电影',
  '文学', '哲学', '历史', '传统', '现代', '经典', '流行', '时尚', '设计',
  '建筑', '园林',

  // === 美食生活 (20词) ===
  '美食', '水果', '西瓜', '苹果', '香蕉', '葡萄', '草莓', '橙子', '芒果',
  '咖啡', '茶叶', '牛奶', '面包', '蛋糕', '火锅', '烧烤', '饺子', '面条',
  '米饭', '炒菜',

  // === 游戏趣味 (15词) ===
  '游戏', '玩家', '挑战', '冒险', '闯关', '升级', '装备', '技能', '道具',
  '积分', '排名', '冠军', '王者', '荣耀', '巅峰',

  // === 单字补全 (允许2字词中包含单字) ===
  '星', '空', '天', '地', '人', '日', '月', '光', '火', '水',
  '木', '金', '土', '风', '花', '雪', '夜', '梦', '心', '爱',
  '美', '龙', '虎', '马', '牛', '羊', '鸟', '鱼', '海', '山',
  '云', '雨', '雷', '电', '春', '夏', '秋', '冬', '红', '绿',
  '蓝', '白', '黑', '大', '小', '高', '低', '快', '慢', '新',
]);

// ==================== 字符池（用于填充网格） ====================
// 从词库中提取高频字，确保网格中有足够多的可组词
const extractChars = () => {
  const charFreq = {};
  WORD_DICT.forEach(word => {
    for (const ch of word) {
      charFreq[ch] = (charFreq[ch] || 0) + 1;
    }
  });
  // 按频率排序，取高频字
  return Object.entries(charFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([ch]) => ch)
    .join('');
};

const CHAR_POOL = extractChars();

// ==================== 网格找词算法 ====================

/**
 * 从网格中找出所有可组成的有效词汇
 * 
 * 算法：对每个格子做 BFS 深度优先搜索（最多4步），
 * 检查路径对应的字符串是否在词库中
 * 
 * @param {string[][]} grid - 4×4 字符网格
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @param {number} maxLen - 最大词长（默认4）
 * @returns {Array<{word: string, path: Array<[number,number]>}>} 找到的词及其路径
 */
function findWordsInGrid(grid, rows = 4, cols = 4, maxLen = 4) {
  const found = new Map(); // word -> {word, path}（只保留最短路径）
  const visited = new Array(rows * cols).fill(false);

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右

  function dfs(r, c, currentWord, path) {
    if (currentWord.length >= 2 && currentWord.length <= maxLen) {
      if (WORD_DICT.has(currentWord)) {
        // 保留路径更短的（或首次发现）
        if (!found.has(currentWord) || path.length < found.get(currentWord).path.length) {
          found.set(currentWord, { word: currentWord, path: [...path] });
        }
      }
    }

    if (currentWord.length >= maxLen) return; // 超过最大长度，剪枝

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const idx = nr * cols + nc;
      if (visited[idx]) continue;

      visited[idx] = true;
      dfs(nr, nc, currentWord + grid[nr][nc], [...path, [nr, nc]]);
      visited[idx] = false;
    }
  }

  // 对每个格子启动搜索
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      visited[idx] = true;
      dfs(r, c, grid[r][c], [[r, c]]);
      visited[idx] = false;
    }
  }

  return Array.from(found.values());
}

/**
 * 从词列表中获取一个"提示"：返回一个词的首字格子坐标
 * 
 * @param {Array<{word, path}>} allWords - 所有可找到的词
 * @param {Set<string>} excludeWords - 已找到的词（需要排除）
 * @returns {{word: string, hintCell: [number, number]}|null}
 */
function getHint(allWords, excludeWords) {
  const candidates = allWords.filter(w => !excludeWords.has(w.word));
  if (candidates.length === 0) return null;
  // 随机选一个
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { word: pick.word, hintCell: pick.path[0] }; // 返回首字位置
}

/**
 * 获取"天眼"数据：返回一个完整词的所有格子坐标
 * 
 * @param {Array<{word, path}>} allWords - 所有可找到的词
 * @param {Set<string>} excludeWords - 已找到的词
 * @returns {{word: string, cells: Array<[number,number]>}|null}
 */
function getInsight(allWords, excludeWords) {
  const candidates = allWords.filter(w => !excludeWords.has(w.word));
  if (candidates.length === 0) return null;
  // 选最长的那个（更有价值感）
  candidates.sort((a, b) => b.word.length - a.word.length);
  return { word: candidates[0].word, cells: candidates[0].path };
}

module.exports = {
  WORD_DICT,
  CHAR_POOL,
  IDIOMS_200,
  findWordsInGrid,
  getHint,
  getInsight
};
