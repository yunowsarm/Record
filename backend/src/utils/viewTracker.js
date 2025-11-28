// 访问记录追踪工具
// 使用内存存储记录 IP + 文章ID + 时间戳

const viewRecords = new Map(); // 存储格式: "IP:articleId" => timestamp
const VIEW_INTERVAL = 15 * 60 * 1000; // 30分钟内不重复计数（可配置）

/**
 * 获取客户端IP地址
 */
export const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

/**
 * 检查是否可以增加阅读量
 * @param {string} identifier - 客户端标识（IP或用户ID）
 * @param {string} articleId - 文章ID
 * @returns {boolean} - true表示可以增加，false表示在时间间隔内
 */
export const canIncrementView = (identifier, articleId) => {
  const key = `${identifier}:${articleId}`;
  const lastViewTime = viewRecords.get(key);
  const now = Date.now();

  if (!lastViewTime || now - lastViewTime > VIEW_INTERVAL) {
    // 更新访问时间
    viewRecords.set(key, now);

    // 清理过期记录（可选，防止内存泄漏）
    if (viewRecords.size > 10000) {
      cleanupExpiredRecords();
    }

    return true;
  }

  return false;
};

/**
 * 清理过期的访问记录
 */
const cleanupExpiredRecords = () => {
  const now = Date.now();
  for (const [key, timestamp] of viewRecords.entries()) {
    if (now - timestamp > VIEW_INTERVAL) {
      viewRecords.delete(key);
    }
  }
};

/**
 * 定期清理过期记录（每小时执行一次）
 */
setInterval(cleanupExpiredRecords, 60 * 60 * 1000);
