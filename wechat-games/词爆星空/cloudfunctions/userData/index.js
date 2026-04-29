/**
 * 云函数: userData — 用户数据同步
 * 操作: save(保存) | load(加载) | update(更新单项)
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, data } = event;

  try {
    const userRes = await db.collection('users').where({ _openid: openid }).get();
    if (userRes.data.length === 0) {
      return { error: '用户不存在，请先登录' };
    }
    const userId = userRes.data[0]._id;

    switch (action) {
      case 'save': {
        // 合并保存（增量更新）
        const updateData = { ...data, updatedAt: db.serverDate() };
        await db.collection('users').doc(userId).update({ data: updateData });
        return { success: true };
      }

      case 'load': {
        return { user: userRes.data[0] };
      }

      case 'update': {
        // 原子更新（如消耗钻石）
        const { field, delta } = data;
        const updateObj = {};
        updateObj[field] = db.command.inc(delta);
        updateObj.updatedAt = db.serverDate();
        await db.collection('users').doc(userId).update({ data: updateObj });
        return { success: true };
      }

      default:
        return { error: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('[userData] 错误:', error);
    return { error: error.message };
  }
};
