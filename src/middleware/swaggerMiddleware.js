const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

// 构建Swagger配置文件的绝对路径
const swaggerPath = path.join(__dirname, '../docs/swagger.json');

// 检查文件是否存在
if (!fs.existsSync(swaggerPath)) {
  throw new Error(`Swagger配置文件未找到: ${swaggerPath}`);
}

// 读取并解析Swagger配置文件
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath));

module.exports = (app) => {
  // 设置Swagger文档中间件
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};