/**
 * 云函数: login — 用户登录与初始化 (卷王冲冲冲)
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
      // 新用户初始化（跑酷游戏数据模型）
      const newUser = {
        _openid: openid,
        nickName: '',
        avatarUrl: '',
        coins: 100,
        diamonds: 3,
        lives: 3,
        maxLives: 5,
        highScore: 0,
        totalPlays: 0,
        totalDistance: 0,
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
    // 生命自动恢复计算（每20分钟恢复1条命）
    const now = Date.now();
    const lastUpdate = user.updatedAt ? new Date(user.updatedAt).getTime() : now;
    const recoveryTime = Math.floor((now - lastUpdate) / 1000);
    const recoveredLives = Math.floor(recoveryTime / 1200); // 每20分钟恢复1条
    const newLives = Math.min(user.maxLives || 5, (user.lives || 3) + recoveredLives);

    if (newLives !== user.lives) {
      await db.collection('users').doc(user._id).update({
        data: { lives: newLives, updatedAt: db.serverDate() }
      });
      user.lives = newLives;
    }

    return { openid, userData: user, isNewUser: false };
  } catch (error) {
    console.error('[login] 错误:', error);
    return { openid, error: error.message };
  }
};
