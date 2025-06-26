const MediaItem = require('../models');
const { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const r2Client = require('../utils/r2Client');

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// 上传媒体文件
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { name, type, category } = req.body;

    // 验证必需的字段
    if (!name || !type || !category) {
      return res.status(400).json({ error: '缺少必需的字段：name, type, category' });
    }

    // 验证类型
    if (!['image', 'icon'].includes(type)) {
      return res.status(400).json({ error: '无效的类型，必须是 image 或 icon' });
    }

    // 获取文件扩展名
    const fileExt = req.file.originalname.split('.').pop();
    
    // 构建R2存储路径
    const r2Key = `${type}/${category}/${name}.${fileExt}`;

    // 上传到R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    });

    await r2Client.send(uploadCommand);

    // 构建公开访问URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

    // 创建数据库记录
    const mediaItem = new MediaItem({
      name,
      type,
      category,
      url: publicUrl,
      createdAt: new Date()
    });

    await mediaItem.save();

    res.status(201).json({
      message: '媒体文件上传成功',
      data: mediaItem
    });

  } catch (error) {
    console.error('上传媒体文件失败:', error);
    res.status(500).json({ error: '上传媒体文件失败' });
  }
};

// 获取媒体文件列表
exports.getMediaList = async (req, res) => {
  try {
    const { 
      type, 
      category, 
      page = 1, 
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search
    } = req.query;

    // 构建查询条件
    const query = {};
    
    // 处理 type 查询
    if (type) {
      if (Array.isArray(type)) {
        query.type = { $in: type };
      } else {
        query.type = type;
      }
    }

    // 处理 category 查询
    if (category) {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // 处理搜索
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // 验证并处理分页参数
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // 限制最大返回数量为100
    const skip = (pageNum - 1) * limitNum;

    // 构建排序条件
    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    // 从数据库获取媒体列表
    const mediaItems = await MediaItem.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // 获取总数（用于分页计算）
    const fullTotal = await MediaItem.countDocuments(query);

    // 如果请求的页码超出范围，返回错误
    const totalPages = Math.ceil(fullTotal / limitNum);
    if (pageNum > totalPages && fullTotal > 0) {
      return res.status(400).json({
        error: `请求的页码 ${pageNum} 超出范围，最大页码为 ${totalPages}`
      });
    }

    // 获取所有分类的统计信息（不受查询条件限制）
    const categoryStats = await MediaItem.aggregate([
      // 如果有type条件，保留type过滤
      ...(query.type ? [{ $match: { type: query.type } }] : []),
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }  // 按分类名称排序
    ]);

    res.json({
      data: mediaItems,
      pagination: {
        total: fullTotal,  // 使用完整总数
        page: pageNum,
        limit: limitNum,
        totalPages  // 已经在前面计算过了
      },
      stats: {
        categories: categoryStats,
        total: fullTotal  // 添加总数到统计信息中
      }
    });

  } catch (error) {
    logger.error('获取媒体文件列表失败:', error);
    res.status(500).json({ error: '获取媒体文件列表失败' });
  }
};

// 删除媒体文件
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    // 从数据库获取媒体项
    const mediaItem = await MediaItem.findById(id);
    if (!mediaItem) {
      return res.status(404).json({ error: '媒体文件不存在' });
    }

    // 从URL中提取R2 key
    const r2Key = mediaItem.url.replace(`${process.env.R2_PUBLIC_URL}/`, '');

    // 从R2删除文件
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key
    });

    await r2Client.send(deleteCommand);

    // 从数据库删除记录
    await MediaItem.findByIdAndDelete(id);

    res.json({ message: '媒体文件删除成功' });

  } catch (error) {
    console.error('删除媒体文件失败:', error);
    res.status(500).json({ error: '删除媒体文件失败' });
  }
};