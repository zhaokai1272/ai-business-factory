/**
 * 云函数: login — 用户登录与初始化
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
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({ _openid: openid }).get();

    if (userRes.data.length === 0) {
      // 新用户初始化
      const newUser = {
        _openid: openid,
        nickName: '',
        avatarUrl: '',
        coins: 100,
        diamonds: 3,
        energy: 30,
        maxEnergy: 30,
        highScore: 0,
        totalPlays: 0,
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
    // 体力自动恢复计算
    const now = Date.now();
    const lastUpdate = user.updatedAt ? new Date(user.updatedAt).getTime() : now;
    const recoveryTime = Math.floor((now - lastUpdate) / 1000);
    const recoveredEnergy = Math.floor(recoveryTime / 600); // 每10分钟恢复1点
    const newEnergy = Math.min(user.maxEnergy, user.energy + recoveredEnergy);

    if (newEnergy !== user.energy) {
      await db.collection('users').doc(user._id).update({
        data: { energy: newEnergy, updatedAt: db.serverDate() }
      });
      user.energy = newEnergy;
    }

    return { openid, userData: user, isNewUser: false };
  } catch (error) {
    console.error('[login] 错误:', error);
    return { openid, error: error.message };
  }
};
