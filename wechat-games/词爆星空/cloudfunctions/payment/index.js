/**
 * 云函数: payment — 支付回调处理
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

  // 商品定义
  const PRODUCTS = {
    'diamonds_60': { type: 'diamonds', quantity: 60 },
    'diamonds_300': { type: 'diamonds', quantity: 300 },
    'diamonds_980': { type: 'diamonds', quantity: 980 },
    'coins_1000': { type: 'coins', quantity: 1000 },
    'monthly_card': { type: 'monthlyCard', days: 30 },
    'starter_pack': { type: 'starter', diamonds: 100, coins: 500 },
    'skin_pack': { type: 'skin', skinId: productId.replace('skin_', '') }
  };

  try {
    switch (action) {
      case 'verify': {
        // 验证支付凭据（上线后接入微信支付服务端API）
        // 此处为骨架，具体验证逻辑需接入微信支付API
        const product = PRODUCTS[productId];
        if (!product) return { error: '未知商品: ' + productId };

        // 记录支付订单
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

        // 发货
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
    // 记录失败订单以便补单
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
