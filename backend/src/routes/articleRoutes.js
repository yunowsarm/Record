import express from "express";
import { body } from "express-validator";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleStats,
  uploadPicture,
} from "../controllers/articleController.js";
import { authenticate } from "../middleware/auth.js";

// 获取当前文件名和目录名，用于上传路径设定
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置 multer 存储引擎，用于处理文件上传
const storage = multer.diskStorage({
  // 指定文件保存路径为 uploads 文件夹
  destination: (req, file, cb) => {
    cb(null, join(__dirname, "../../uploads"));
  },
  // 自定义生成文件名：当前时间戳+随机数+原始文件名，避免重名
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// 创建 multer 实例，限制文件大小和类型
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 设置最大文件大小为5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片类型文件上传
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件"), false);
    }
  },
});

// 创建路由对象
const router = express.Router();

// 查询文章列表，公开接口
router.get("/", getArticles);

// 获取单篇文章详情，公开接口
router.get("/:id", getArticle);

// 创建新文章，需登录、支持封面图片上传，带参数校验
router.post(
  "/",
  authenticate, // 用户认证中间件
  upload.single("coverImage"), // 单文件上传，字段名为coverImage
  [
    body("title").trim().notEmpty().withMessage("标题不能为空"),
    body("content").notEmpty().withMessage("内容不能为空"),
  ],
  createArticle
);

// 更新文章，需登录、支持封面更换，带参数校验
router.put(
  "/:id",
  authenticate,
  // 使用 multer 处理中间件，接收表单中的单个文件（字段名为 coverImage），用于更换文章封面图片
  upload.single("coverImage"),
  [
    // 校验标题不为空
    body("title").trim().notEmpty().withMessage("标题不能为空"),
    // 校验内容不为空
    body("content").notEmpty().withMessage("内容不能为空"),
  ],
  updateArticle
);

// 删除文章，需登录
router.delete("/:id", authenticate, deleteArticle);

// 获取文章统计数据，需登录（必须在 /:id 路由之前）
router.get("/stats/summary", authenticate, getArticleStats);

// 上传文章内容图片，需认证
router.post(
  "/upload-image",          // 路由路径，前端应将图片 POST 到 /api/articles/upload-image
  authenticate,             // 用户认证中间件，只有登录用户才能上传图片
  upload.single("image"),   // multer 中间件，接收表单中的单个文件，字段名为 "image"
  uploadPicture             // 控制器处理上传逻辑，保存图片并返回图片地址
);

export default router;
