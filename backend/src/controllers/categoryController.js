import Category from "../models/Category.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";

/**
 * 获取所有分类
 * @route GET /api/categories
 * @access Public
 * @returns {Array} 分类列表，按创建时间倒序排列
 */
export const getCategories = async (req, res) => {
  try {
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "数据库未连接" });
    }

    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error("获取分类列表错误:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};

/**
 * 根据ID获取单个分类
 * @route GET /api/categories/:id
 * @access Public
 * @param {string} req.params.id - 分类ID
 * @returns {Object} 分类对象
 * @returns {404} 分类不存在
 */
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "分类不存在" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};

/**
 * 创建新分类
 * @route POST /api/categories
 * @access Private (需要管理员权限)
 * @param {string} req.body.name - 分类名称（必填，唯一，最多50字符）
 * @param {string} req.body.description - 分类描述（可选，最多200字符）
 * @returns {Object} 新创建的分类对象
 * @returns {400} 验证失败或分类名称已存在
 */
export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "分类名称已存在" });
    }
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};

/**
 * 更新分类信息
 * @route PUT /api/categories/:id
 * @access Private (需要管理员权限)
 * @param {string} req.params.id - 分类ID
 * @param {string} req.body.name - 分类名称（可选，唯一，最多50字符）
 * @param {string} req.body.description - 分类描述（可选，最多200字符）
 * @returns {Object} 更新后的分类对象
 * @returns {404} 分类不存在
 * @returns {400} 验证失败或分类名称已存在
 */
export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: "分类不存在" });
    }

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "分类名称已存在" });
    }
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};

/**
 * 删除分类
 * @route DELETE /api/categories/:id
 * @access Private (需要管理员权限)
 * @param {string} req.params.id - 分类ID
 * @returns {Object} 删除成功消息
 * @returns {404} 分类不存在
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "分类不存在" });
    }
    res.json({ message: "分类已删除" });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
};
