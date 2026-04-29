/**
 * 云函数: login — 用户登录与初始化 (合成亿万达)
 * 触发: 游戏启动时自动调用
 * 输入: 无（自动获取openid）
 * 输出: { openid, userData, isNewUser }
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const userRes = await db.collection('users').where({ _openid: openid }).get();

    if (userRes.data.length === 0) {
      // 新用户初始化（合成放置游戏数据模型）
      const newUser = {
        _openid: openid,
        nickName: '',
        avatarUrl: '',
        coins: 100,
        diamonds: 5,
        accelerators: 3,
        totalWorth: 0,
        level: 1,
        highestMerge: 1,
        totalMerges: 0,
        offlineBonus: 0,
        lastOnlineTime: db.serverDate(),
        ownedSkins: ['default'],
        activeSkin: 'default',
        vipLevel: 0,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      };
      await db.collection('users').add({ data: newUser });
      return { openid, userData: newUser, isNewUser: true };
    }

    const user = userRes.data[0];
    // 离线收益计算（挂机系统）
    const now = Date.now();
    const lastOnline = user.lastOnlineTime ? new Date(user.lastOnlineTime).getTime() : now;
    const offlineSeconds = Math.floor((now - lastOnline) / 1000);
    const maxOfflineSeconds = 8 * 3600; // 最多8小时离线收益
    const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds);
    const offlineEarnings = Math.floor(effectiveSeconds * (user.level || 1) * 0.5); // 每秒收益公式

    if (offlineEarnings > 0) {
      await db.collection('users').doc(user._id).update({
        data: {
          coins: db.command.inc(offlineEarnings),
          lastOnlineTime: db.serverDate(),
          updatedAt: db.serverDate()
        }
      });
      user.coins = (user.coins || 0) + offlineEarnings;
      user.offlineBonus = offlineEarnings;
    }

    return { openid, userData: user, isNewUser: false };
  } catch (error) {
    console.error('[login] 错误:', error);
    return { openid, error: error.message };
  }
};
