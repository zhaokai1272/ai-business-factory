/**
 * 云函数: leaderboard — 排行榜管理 (合成亿万达)
 * 操作: submit(提交身价) | getTop(获取排行) | getRank(查自己排名)
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, score, totalWorth, highestMerge, gameName = '合成亿万达', limit = 50 } = event;

  try {
    switch (action) {
      case 'submit': {
        const existing = await db.collection('leaderboard')
          .where({ _openid: openid, gameName })
          .get();

        if (existing.data.length > 0) {
          if (score > existing.data[0].score) {
            await db.collection('leaderboard').doc(existing.data[0]._id).update({
              data: { score, totalWorth, highestMerge, updatedAt: db.serverDate() }
            });
          }
        } else {
          await db.collection('leaderboard').add({
            data: {
              _openid: openid,
              gameName,
              score,
              totalWorth,
              highestMerge,
              createdAt: db.serverDate()
            }
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
        const countRes = await db.collection('leaderboard')
          .where({ gameName, score: _.gt(score) })
          .count();
        const total = await db.collection('leaderboard').where({ gameName }).count();
        return { rank: countRes.total + 1, total: total.total };
      }

      default:
        return { error: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('[leaderboard] 错误:', error);
    return { error: error.message };
  }
};
