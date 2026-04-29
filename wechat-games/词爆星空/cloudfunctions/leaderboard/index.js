/**
 * 云函数: leaderboard — 排行榜管理
 * 操作: submit(提交分数) | getTop(获取排行) | getRank(查自己排名)
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, score, gameName, limit = 50 } = event;

  try {
    switch (action) {
      case 'submit': {
        // 检查是否历史最高
        const existing = await db.collection('leaderboard')
          .where({ _openid: openid, gameName })
          .get();

        if (existing.data.length > 0) {
          if (score > existing.data[0].score) {
            await db.collection('leaderboard').doc(existing.data[0]._id).update({
              data: { score, updatedAt: db.serverDate() }
            });
          }
        } else {
          await db.collection('leaderboard').add({
            data: { _openid: openid, gameName, score, createdAt: db.serverDate() }
          });
        }
        return { success: true };
      }

      case 'getTop': {
        const { data } = await db.collection('leaderboard')
          .where({ gameName })
          .orderBy('score', 'desc')
          .limit(limit)
          .get();
        return { list: data };
      }

      case 'getRank': {
        // 获取大于当前分数的记录数（即排名）
        const countRes = await db.collection('leaderboard')
          .where({ gameName, score: _.gt(score) })
          .count();
        return { rank: countRes.total + 1, total: await db.collection('leaderboard').where({ gameName }).count().then(r => r.total) };
      }

      default:
        return { error: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('[leaderboard] 错误:', error);
    return { error: error.message };
  }
};
