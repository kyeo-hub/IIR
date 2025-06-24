const { AUTH_TOKEN } = process.env;

// 简单的Token验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供授权Token' });
  }

  if (token !== AUTH_TOKEN) {
    return res.status(403).json({ message: '无效的Token' });
  }

  next();
};

module.exports = authenticateToken;