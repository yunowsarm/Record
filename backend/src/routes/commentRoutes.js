import express from "express";
import { body } from "express-validator";
import {
  getComments,
  createComment,
  updateCommentStatus,
  deleteComment,
} from "../controllers/commentController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// 获取评论列表，公开接口
router.get("/", getComments);

// 提交新评论，需登录，校验评论内容和所属文章ID
router.post(
  "/",
  authenticate,
  [
    body("content").trim().notEmpty().withMessage("评论内容不能为空"),
    body("article").notEmpty().withMessage("文章ID不能为空"),
  ],
  createComment
);

// 修改评论状态，需登录且为管理员，校验状态字段
router.put(
  "/:id/status",
  authenticate,
  isAdmin,
  [
    body("status")
      .isIn(["pending", "approved", "rejected"])
      .withMessage("无效的状态值"),
  ],
  updateCommentStatus
);

// 删除评论，需登录（通常作者本人或管理员可以删除）
router.delete("/:id", authenticate, deleteComment);

export default router;
