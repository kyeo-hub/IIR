const mongoose = require('mongoose');

// 定义媒体项目的模式
const mediaItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'icon'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建并导出模型
const MediaItem = mongoose.model('MediaItem', mediaItemSchema);

module.exports = MediaItem;