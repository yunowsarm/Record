import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 获取 JWT_SECRET
const getJWTSecret = () => {
  return process.env.JWT_SECRET || "your-secret-key-change-in-production";
};

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    const JWT_SECRET = getJWTSecret();
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "用户不存在" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "无效的认证令牌" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "需要管理员权限" });
  }
  next();
};
