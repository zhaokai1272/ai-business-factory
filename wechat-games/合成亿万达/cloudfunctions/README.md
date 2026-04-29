# 合成亿万达 — 微信云开发 数据库初始化脚本

## 数据库集合 (Collections)

在微信云开发控制台 → 数据库 中创建以下集合：

### 1. users — 用户表
```json
{
  "_openid": "string (自动)",
  "nickName": "string",
  "avatarUrl": "string",
  "coins": "number (默认100)",
  "diamonds": "number (默认5)",
  "accelerators": "number (默认3)",
  "totalWorth": "number (默认0)",
  "level": "number (默认1)",
  "highestMerge": "number (默认1)",
  "totalMerges": "number (默认0)",
  "offlineBonus": "number (默认0)",
  "lastOnlineTime": "date",
  "ownedSkins": "array (默认['default'])",
  "activeSkin": "string (默认'default')",
  "vipLevel": "number (默认0)",
  "vipExpireAt": "date (可空)",
  "createdAt": "date",
  "updatedAt": "date"
}
```
权限: 仅创建者可读写

### 2. leaderboard — 排行榜
```json
{
  "_openid": "string",
  "gameName": "string (合成亿万达)",
  "score": "number (总身价)",
  "totalWorth": "number",
  "highestMerge": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```
索引: gameName + score (降序)
权限: 所有用户可读，仅创建者可写

### 3. purchases — 支付记录
```json
{
  "_openid": "string",
  "orderId": "string",
  "productId": "string",
  "amount": "number",
  "status": "string (success|failed|refunded)",
  "error": "string (可空)",
  "createdAt": "date"
}
```
权限: 仅创建者可读

### 4. mergeRecords — 合成记录
```json
{
  "_openid": "string",
  "fromLevel": "number (合成前等级)",
  "toLevel": "number (合成后等级)",
  "timestamp": "date"
}
```
权限: 仅创建者可读写

### 5. adRecords — 广告观看记录
```json
{
  "_openid": "string",
  "adType": "string (revive|hint|double|energy|signin|accelerate)",
  "gameName": "string (合成亿万达)",
  "watchedAt": "date"
}
```
权限: 仅创建者可写

---

## 云函数部署步骤
1. 在微信开发者工具中打开项目
2. 右键 `cloudfunctions/` 目录 → 选择当前环境
3. 右键每个云函数文件夹 → "上传并部署：云端安装依赖"
4. 在云开发控制台检查云函数是否部署成功

## 云存储设置
- 创建目录: `/assets/` (游戏美术资源)
- 创建目录: `/audio/` (音效BGM)
- 存储权限: 所有用户可读
