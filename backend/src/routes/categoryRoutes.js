import express from "express";
import { body } from "express-validator";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// 获取所有分类，公开接口
router.get("/", getCategories);

// 获取单个分类信息，公开接口
router.get("/:id", getCategory);

// 创建新分类，需登录且为管理员，参数校验分类名称
router.post(
  "/",
  authenticate,
  isAdmin,
  body("name").trim().notEmpty().withMessage("分类名称不能为空"),
  createCategory
);

// 更新分类，需登录且为管理员，参数校验分类名称
router.put(
  "/:id",
  authenticate,
  isAdmin,
  body("name").trim().notEmpty().withMessage("分类名称不能为空"),
  updateCategory
);

// 删除分类，需登录且为管理员
router.delete("/:id", authenticate, isAdmin, deleteCategory);

export default router;
