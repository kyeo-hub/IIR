const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const mediaRoutes = require('./routes/mediaRoutes');
const authenticateToken = require('./middleware/authMiddleware');
const setupSwagger = require('./middleware/swaggerMiddleware');
const logger = require('./utils/logger');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件设置
app.use(cors());
app.use(helmet());
app.use(logger.expressMiddleware); // 使用 winston 日志中间件
app.use(express.json());

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', err));

// API路由
app.use('/api/media', mediaRoutes);
logger.info('✅ 路由 /api/media 已成功挂载');

// 设置 Swagger 文档
setupSwagger(app);
logger.info('✅ Swagger 文档已成功配置');

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 服务器运行在端口 ${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});