import jwt from "jsonwebtoken";

// 获取 JWT_SECRET，如果未设置则使用默认值
const getJWTSecret = () => {
  const secret =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";

  // 只在开发环境且未设置时警告
  if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
    console.warn(
      "警告: JWT_SECRET 未设置，使用默认值。生产环境请务必设置环境变量！"
    );
  }

  return secret;
};

/**
 * 生成 JWT 令牌
 * @param {string} userId - 用户唯一ID
 * @returns {string} 签发的JWT令牌（有效期7天）
 */
export const generateToken = (userId) => {
  const JWT_SECRET = getJWTSecret();
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};
