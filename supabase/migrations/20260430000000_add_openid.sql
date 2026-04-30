-- 为微信小程序登录添加 openid 字段
ALTER TABLE parents ADD COLUMN IF NOT EXISTS openid TEXT UNIQUE;
