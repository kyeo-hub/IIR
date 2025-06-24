# 图片和图标API项目

该项目提供了一个基于Node.js和Express框架的API服务，用于管理图片和图标资源。以下是项目的配置和使用说明。

## 技术栈
- 后端: Node.js + Express
- 数据库: MongoDB（远程连接）
- 对象存储: Cloudflare R2
- 授权验证: JWT 或简单Token机制（通过环境变量配置密钥）
- 日志系统: Winston（支持文件和控制台输出）

## 环境变量配置
在项目根目录下创建`.env`文件，并根据您的实际配置填写以下内容：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=your_mongodb_connection_string

# Cloudflare R2 配置
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_PUBLIC_URL=your_r2_public_url

# 授权配置
AUTH_TOKEN=your_auth_token
```

## 数据库设计
数据库集合名称为`media_items`，包含以下字段：
- `name`: String (文件名)
- `type`: String (类型 image/icon)
- `category`: String (分类)
- `url`: String (Cloudflare R2返回的URL)
- `createdAt`: Date (创建时间)

## API接口

### 媒体列表查询 (GET /api/media)
支持多种查询参数组合，实现灵活的筛选、排序和分页功能：

#### 基础查询参数
```
GET /api/media?type=image&category=banner
```

#### 多值查询（支持数组）
```
# 查询多个类型
GET /api/media?type[]=image&type[]=icon

# 查询多个分类
GET /api/media?category[]=banner&category[]=avatar
```

#### 排序功能
```
# 按创建时间降序（默认）
GET /api/media?sort=createdAt&order=desc

# 按名称升序
GET /api/media?sort=name&order=asc
```

#### 搜索功能
```
# 搜索名称或分类包含 "logo" 的内容
GET /api/media?search=logo
```

#### 分页控制
```
# 第1页，每页10条（默认）
GET /api/media?page=1&limit=10
```

#### 组合查询示例
```
# 查询 image 类型下所有 banner 和 logo 分类的内容，按时间倒序
GET /api/media?type=image&category[]=banner&category[]=logo&sort=createdAt&order=desc

# 查询所有类型中包含 "main" 的内容，每页显示20条
GET /api/media?search=main&limit=20
```

#### 返回数据格式
```json
{
  "data": [...], // 媒体列表数据
  "pagination": {
    "total": 100,    // 总记录数
    "page": 1,       // 当前页码
    "limit": 10,     // 每页条数
    "totalPages": 10 // 总页数
  },
  "stats": {
    "categories": [  // 分类统计
      { "_id": "banner", "count": 5 },
      { "_id": "logo", "count": 3 }
    ]
  }
}
```

### 上传媒体文件 (POST /api/media)
上传新的图片或图标文件，并保存到R2存储和数据库中。

### 删除媒体文件 (DELETE /api/media/:id)
删除指定ID的媒体文件，同时从R2存储和数据库中移除。

## 使用教程
### 安装依赖
执行以下命令安装项目所需依赖：
```bash
npm install
```

### 启动服务
执行以下命令启动服务：
```bash
npm start
```

### 访问API文档
服务启动后，可以通过访问以下URL查看和测试API接口：
```
http://localhost:3000/api-docs
```

> 💡 **提示**: 如果启用了授权验证，可通过以下方式携带Token访问：
> - 在 Swagger 页面右上角点击 "Authorize"，输入 `Bearer your_auth_token`
> - 使用浏览器插件（如 ModHeader）自动添加请求头
> - 开发阶段可选择性关闭文档授权限制（见 `src/middleware/swaggerMiddleware.js`）

### API请求示例
#### 获取媒体列表（基本查询）
```bash
curl -X GET "http://localhost:3000/api/media" -H "Authorization: Bearer your_auth_token"
```

#### 获取媒体列表（高级查询）
```bash
curl -X GET "http://localhost:3000/api/media?type=image&category[]=banner&category[]=logo&sort=createdAt&order=desc&page=1&limit=20" -H "Authorization: Bearer your_auth_token"
```

#### 上传新文件
```bash
curl -X POST "http://localhost:3000/api/media" \
  -H "Authorization: Bearer your_auth_token" \
  -F "name=example" \
  -F "category=banner" \
  -F "type=image" \
  -F "file=@/path/to/your/file.jpg"
```

#### 删除指定ID的媒体文件
```bash
curl -X DELETE "http://localhost:3000/api/media/your_media_item_id" -H "Authorization: Bearer your_auth_token"
```

## Cloudflare R2集成
使用AWS SDK进行文件上传和删除，按照分类建立文件夹结构:
- images/category_name/filename
- icons/category_name/filename

## 日志系统
项目集成了Winston日志系统，提供以下功能：
- 不同级别的日志记录（debug, info, warn, error）
- 日志文件轮转（每个文件最大5MB，保留5个文件）
- 开发环境下控制台彩色输出
- 生产环境下只记录重要日志
- HTTP请求日志记录

日志文件存储在`logs`目录下：
- `combined.log`: 所有级别的日志
- `error.log`: 仅错误级别日志
- `exceptions.log`: 未捕获的异常
- `rejections.log`: 未处理的Promise拒绝

## 项目结构
```
pir/
│
├── src/                       # 存放源代码
│   ├── routes/                # API路由定义
│   ├── controllers/           # 控制器逻辑处理
│   ├── models/                # 数据库模型定义
│   ├── middleware/            # 中间件（认证、Swagger等）
│   └── utils/                 # 工具类（日志、R2客户端等）
│   └── docs/                  # API文档
│       └── swagger.json           # Swagger API定义
├── logs/                      # 日志文件目录
│
├── .env                       # 环境变量配置文件
├── package.json               # 项目依赖及脚本
└── README.md                  # 使用文档说明
```

## 开发与维护
### 添加新功能
1. 在相应的控制器中添加新的处理函数
2. 在路由文件中注册新的路由
3. 更新Swagger文档以反映API变化
4. 使用Winston记录关键操作日志

### 错误处理
所有API错误都会返回适当的HTTP状态码和JSON格式的错误信息。系统错误会被记录到日志文件中，便于调试和问题排查。