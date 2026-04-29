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
    case 'claimOffline':
      return await claimOffline(openid);
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
      highestLevel: 1,
      totalMerges: 0,
      coins: 0,
      gems: 5,
      board: [{ id: 'c0', level: 0, x: 0, y: 0 }],
      lastOnline: Date.now(),
      boostActive: false,
      boostUntil: 0,
      totalEarnings: 0,
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

async function claimOffline(openid) {
  const res = await db.collection('users').where({ _openid: openid }).get();
  if (res.data.length === 0) return { code: 0, data: { earnings: 0 } };
  
  const user = res.data[0];
  const offlineMs = Date.now() - (user.lastOnline || Date.now());
  const offlineHours = Math.min(offlineMs / 3600000, 8); // 最多8小时
  const baseRate = 10 + (user.highestLevel - 1) * 5; // 等级越高收益越高
  const earnings = Math.floor(offlineHours * baseRate);
  
  await db.collection('users').where({ _openid: openid }).update({
    data: { 
      coins: db.command.inc(earnings), 
      lastOnline: Date.now(),
      updatedAt: Date.now() 
    }
  });
  
  return { code: 0, data: { earnings, offlineHours: Math.floor(offlineHours * 10) / 10 } };
}
