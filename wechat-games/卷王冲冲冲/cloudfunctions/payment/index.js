/**
 * 云函数: payment — 支付回调处理 (卷王冲冲冲)
 * 触发: 微信支付成功回调
 * 处理: 验证签名 → 发货（增加道具/货币）
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, orderId, productId, amount } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const PRODUCTS = {
    'diamonds_60': { type: 'diamonds', quantity: 60 },
    'diamonds_300': { type: 'diamonds', quantity: 300 },
    'diamonds_980': { type: 'diamonds', quantity: 980 },
    'coins_1000': { type: 'coins', quantity: 1000 },
    'lives_pack': { type: 'lives', quantity: 5 },
    'monthly_card': { type: 'monthlyCard', days: 30 },
    'starter_pack': { type: 'starter', diamonds: 100, coins: 500 },
    'skin_pack': { type: 'skin', skinId: productId.replace('skin_', '') }
  };

  try {
    switch (action) {
      case 'verify': {
        const product = PRODUCTS[productId];
        if (!product) return { error: '未知商品: ' + productId };

        await db.collection('purchases').add({
          data: {
            _openid: openid,
            orderId,
            productId,
            amount,
            status: 'success',
            createdAt: db.serverDate()
          }
        });

        const userRes = await db.collection('users').where({ _openid: openid }).get();
        if (userRes.data.length === 0) return { error: '用户不存在' };

        const updateData = { updatedAt: db.serverDate() };
        switch (product.type) {
          case 'diamonds':
            updateData.diamonds = db.command.inc(product.quantity);
            break;
          case 'coins':
            updateData.coins = db.command.inc(product.quantity);
            break;
          case 'lives':
            updateData.lives = db.command.inc(product.quantity);
            break;
          case 'monthlyCard':
            updateData.vipExpireAt = db.serverDate({
              offset: product.days * 24 * 60 * 60 * 1000
            });
            break;
          case 'starter':
            updateData.diamonds = db.command.inc(product.diamonds);
            updateData.coins = db.command.inc(product.coins);
            break;
          case 'skin':
            updateData.ownedSkins = db.command.push(product.skinId);
            break;
        }

        await db.collection('users').doc(userRes.data[0]._id).update({ data: updateData });
        return { success: true, product };
      }

      default:
        return { error: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('[payment] 错误:', error);
    await db.collection('purchases').add({
      data: {
        _openid: openid,
        orderId,
        productId,
        amount,
        status: 'failed',
        error: error.message,
        createdAt: db.serverDate()
      }
    });
    return { error: error.message };
  }
};
