import Comment from "../models/Comment.js";
import Article from "../models/Article.js";
import { validationResult } from "express-validator";

/**
 * 获取评论列表
 * @route GET /api/comments
 * @access Public
 * @param {string} [req.query.articleId] - （可选）文章ID，根据该文章过滤评论
 * @returns {Array} 评论列表，按创建时间倒序排列，仅返回已审核通过的评论
 */
export const getComments = async (req, res) => {
  try {
    const articleId = req.query.articleId; // 从查询参数中获取文章ID
    const query = { status: "approved" }; // 只查询已通过审核的评论
    if (articleId) query.article = articleId; // 如果有提供文章ID，添加到查询条件

    // 查询评论，并关联user和parentComment信息，按创建时间倒序排列
    const comments = await Comment.find(query)
      .populate("user", "username avatar") // 填充评论作者信息
      .populate({
        path: "parentComment", // 填充父评论
        populate: { path: "user", select: "username" }, // 填充父评论的作者用户名
      })
      .sort({ createdAt: -1 }); // 按创建时间倒序排列

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message }); // 错误处理
  }
};

//创建评论
export const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const article = await Article.findById(req.body.article);
    if (!article) {
      return res.status(404).json({ message: "文章不存在" });
    }

    const comment = new Comment({
      ...req.body,
      user: req.user._id,
    });

    await comment.save();
    await comment.populate("user", "username avatar");
    if (comment.parentComment) {
      await comment.populate({
        path: "parentComment",
        populate: { path: "user", select: "username" },
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};

//更新评论
export const updateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "username avatar");

    if (!comment) {
      return res.status(404).json({ message: "评论不存在" });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};

//删除评论
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "评论不存在" });
    }

    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "无权删除此评论" });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "评论已删除" });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};
