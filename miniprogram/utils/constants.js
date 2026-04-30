// 常量 - 直接从 H5 版本迁移
const AVATARS = ['🐣', '🐼', '🦊', '🐸', '🦁', '🐯', '🐨', '🐰', '🐻', '🦄']
const TEMOJI = ['🦷', '📚', '🧸', '🌈', '🏃', '🎨', '🎵', '🍎', '💤', '🧹', '🌿', '🚿', '📝', '🎯', '🤝', '✏️', '🔤', '🎹', '🤸', '🎒', '🧼']
const REMOJI = ['📺', '🍦', '🏞️', '🎮', '👫', '🍕', '🎠', '🧁', '🎪', '🎬', '🛝', '🎁', '🎈', '🚗', '⚽']
const CATS = ['学习', '习惯', '品德', '运动', '其他']
const CAT_EMOJI = { 学习: '📚', 习惯: '🌱', 品德: '🤝', 运动: '🏃', 其他: '⭐' }
const CAT_COLOR = { 学习: '#4A90E2', 习惯: '#6BCB77', 品德: '#FF8C42', 运动: '#9B6BFF', 其他: '#9B8FAE' }
const FREQS = [
  { k: 'daily', l: '每天' },
  { k: 'weekday', l: '周一至五' },
  { k: 'saturday', l: '周六' },
  { k: 'sunday', l: '周日' },
]
const LEVELS = [
  { min: 0, l: '🐣 星星萌新' },
  { min: 20, l: '🌱 成长新芽' },
  { min: 50, l: '🦋 蝴蝶小勇士' },
  { min: 100, l: '🌟 闪耀小英雄' },
  { min: 200, l: '🚀 超级小达人' },
  { min: 400, l: '👑 传说小冠军' },
]
const DAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const DEFAULT_REWARDS = [
  { name: '看动画片', emoji: '📺', cost: 20, sort_order: 0 },
  { name: '吃冰淇淋', emoji: '🍦', cost: 30, sort_order: 1 },
  { name: '去公园玩', emoji: '🏞️', cost: 50, sort_order: 2 },
  { name: '买新玩具', emoji: '🎮', cost: 80, sort_order: 3 },
]

const BUILTIN_TEMPLATES = [
  { id: 'b1',  name: '刷牙洁净',   description: '早晚各刷2分钟',      emoji: '🦷', category: '习惯', stars: 3, frequency: 'daily' },
  { id: 'b2',  name: '洗脸洗手',   description: '保持清洁卫生',        emoji: '🧼', category: '习惯', stars: 2, frequency: 'daily' },
  { id: 'b3',  name: '整理书包',   description: '提前准备好第二天',    emoji: '🎒', category: '习惯', stars: 3, frequency: 'weekday' },
  { id: 'b4',  name: '整理小房间', description: '玩具放回原位',        emoji: '🧸', category: '习惯', stars: 4, frequency: 'daily' },
  { id: 'b5',  name: '早睡早起',   description: '按时上床不赖床',      emoji: '💤', category: '习惯', stars: 3, frequency: 'daily' },
  { id: 'b6',  name: '阅读30分钟', description: '读课外书或绘本',      emoji: '📚', category: '学习', stars: 5, frequency: 'daily' },
  { id: 'b7',  name: '完成作业',   description: '认真独立完成作业',    emoji: '📝', category: '学习', stars: 6, frequency: 'weekday' },
  { id: 'b8',  name: '练习写字',   description: '认真练习笔画',        emoji: '✏️', category: '学习', stars: 4, frequency: 'weekday' },
  { id: 'b9',  name: '背单词',     description: '每天背5个英语单词',   emoji: '🔤', category: '学习', stars: 4, frequency: 'weekday' },
  { id: 'b10', name: '练钢琴',     description: '认真练习30分钟',      emoji: '🎹', category: '学习', stars: 5, frequency: 'daily' },
  { id: 'b11', name: '帮忙做家务', description: '帮爸爸妈妈做家务',    emoji: '🧹', category: '品德', stars: 4, frequency: 'daily' },
  { id: 'b12', name: '帮助家人',   description: '主动做一件好事',      emoji: '🌈', category: '品德', stars: 3, frequency: 'daily' },
  { id: 'b13', name: '不发脾气',   description: '遇事冷静不哭闹',      emoji: '😊', category: '品德', stars: 5, frequency: 'daily' },
  { id: 'b14', name: '分享玩具',   description: '和小朋友友好分享',    emoji: '🤝', category: '品德', stars: 4, frequency: 'daily' },
  { id: 'b15', name: '户外运动',   description: '跑步/骑车/跳绳',      emoji: '🏃', category: '运动', stars: 5, frequency: 'daily' },
  { id: 'b16', name: '做体操',     description: '认真做广播体操',      emoji: '🤸', category: '运动', stars: 3, frequency: 'weekday' },
]

module.exports = { AVATARS, TEMOJI, REMOJI, CATS, CAT_EMOJI, CAT_COLOR, FREQS, LEVELS, DAYS_CN, DEFAULT_REWARDS, BUILTIN_TEMPLATES }
