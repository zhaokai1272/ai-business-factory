const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'get':
      return await getUserData(openid);
    case 'update':
      return await updateUserData(openid, data);
    case 'syncOffline':
      return await syncOfflineEarnings(openid, data);
    default:
      return { code: -1, msg: '未知操作' };
  }
};

async function getUserData(openid) {
  const res = await db.collection('users').where({ _openid: openid }).get();
  if (res.data.length === 0) {
    const defaultData = {
      _openid: openid,
      nickname: '',
      highScore: 0,
      totalGames: 0,
      coins: 100,
      skins: ['default'],
      equippedSkin: 'default',
      unlockedLevels: 1,
      dailyScore: 0,
      dailyDate: '',
      energy: 5,
      energyLastRefill: Date.now(),
      maxEnergy: 5,
      rank: '互联网实习生',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.collection('users').add({ data: defaultData });
    return { code: 0, data: defaultData };
  }
  return { code: 0, data: res.data[0] };
}

async function updateUserData(openid, data) {
  data.updatedAt = Date.now();
  await db.collection('users').where({ _openid: openid }).update({ data });
  return { code: 0 };
}

async function syncOfflineEarnings(openid, data) {
  const { offlineMs } = data;
  const earnings = Math.floor(offlineMs / 60000) * 2; // 每分钟2金币
  const cappedEarnings = Math.min(earnings, 500);
  await db.collection('users').where({ _openid: openid }).update({
    data: { coins: db.command.inc(cappedEarnings), updatedAt: Date.now() }
  });
  return { code: 0, data: { coinsEarned: cappedEarnings } };
}
