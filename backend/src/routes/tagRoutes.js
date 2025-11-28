import express from "express";
import { body } from "express-validator";
import { getTags, createTag, deleteTag } from "../controllers/tagController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// 获取所有标签，公开接口
router.get("/", getTags);

// 创建新标签，需登录且为管理员，参数校验标签名称
router.post(
  "/",
  authenticate,
  isAdmin,
  [body("name").trim().notEmpty().withMessage("标签名称不能为空")],
  createTag
);

// 删除标签，需登录且为管理员
router.delete("/:id", authenticate, isAdmin, deleteTag);

export default router;
