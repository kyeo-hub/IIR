const express = require('express');
const router = express.Router();
const { upload } = require('../utils/upload');
const mediaController = require('../controllers/mediaController');

// 上传媒体文件路由
router.post('/', upload.single('file'), mediaController.uploadMedia);

// 获取媒体文件列表路由
router.get('/', mediaController.getMediaList);

// 删除媒体文件路由
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;