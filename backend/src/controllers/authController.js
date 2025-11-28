import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'
import { validationResult } from 'express-validator'
import {
  generateCode,
  sendVerificationCode,
  saveVerificationCode,
  verifyCode,
} from '../utils/email.js'

// 发送验证码（统一函数，通过 type 参数区分注册和重置密码）
const sendVerificationCodeController = async (req, res, type = 'register') => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: '请输入邮箱地址' })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '请输入有效的邮箱地址' })
    }

    // 根据类型检查邮箱状态
    if (type === 'register') {
      // 注册：检查邮箱是否已被注册
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: '该邮箱已被注册' })
      }
    } else if (type === 'resetPassword') {
      // 重置密码：检查邮箱是否已注册
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(404).json({ message: '该邮箱未注册' })
      }
    }

    // 生成并发送验证码
    const code = generateCode()
    await sendVerificationCode(email, code, type)
    saveVerificationCode(email, code)

    res.json({
      message: '验证码已发送，请查收邮箱',
      // 开发环境可以返回验证码，生产环境删除
      ...(process.env.NODE_ENV === 'development' && { code }),
    })
  } catch (error) {
    console.error('发送验证码错误:', error)
    res.status(500).json({
      message: error.message || '发送验证码失败，请稍后重试',
    })
  }
}

// 发送注册验证码
export const sendCode = async (req, res) => {
  return sendVerificationCodeController(req, res, 'register')
}

// 注册函数
export const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, email, password, code } = req.body

    // 验证验证码
    if (!code) {
      return res.status(400).json({ message: '请输入验证码' })
    }

    const codeVerification = verifyCode(email, code)
    if (!codeVerification.valid) {
      return res.status(400).json({ message: codeVerification.message })
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' })
    }

    const user = new User({ username, email, password })
    await user.save()

    const token = generateToken(user._id)

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

//登录
export const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    const token = generateToken(user._id)

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      message: '服务器错误',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

/**
 * 获取当前登录用户的个人信息
 * @route GET /api/profile
 * @access Private
 * @returns {Object} 用户信息（不包含密码字段）
 */
export const getProfile = async (req, res) => {
  try {
    // 根据用户ID查询用户信息，并排除密码字段
    const user = await User.findById(req.user._id).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

/**
 * 更新当前登录用户的个人信息
 * @route PUT /api/profile
 * @access Private
 * @param {string} req.body.bio - 简介
 * @param {string} req.body.avatar - 头像URL
 * @returns {Object} 更新后的用户信息（不包含密码字段）
 */
export const updateProfile = async (req, res) => {
  try {
    const { bio, avatar } = req.body
    // 根据用户ID更新bio和avatar字段，返回更新后的信息并校验
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio, avatar },
      { new: true, runValidators: true },
    ).select('-password')

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

/**
 * 上传用户头像
 * @route POST /api/auth/upload-avatar
 * @access Private
 * @param {File} req.file - 头像图片文件
 * @returns {Object} 包含头像URL的对象
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的文件' })
    }

    // 生成头像URL（相对于uploads目录）
    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    // 更新用户头像
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true },
    ).select('-password')

    res.json({
      message: '头像上传成功',
      url: avatarUrl,
      user,
    })
  } catch (error) {
    console.error('头像上传错误:', error)
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

// 发送重置密码验证码
export const sendResetPasswordCode = async (req, res) => {
  return sendVerificationCodeController(req, res, 'resetPassword')
}

// 重置密码
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, code, newPassword } = req.body

    if (!code) {
      return res.status(400).json({ message: '请输入验证码' })
    }

    // 验证验证码
    const codeVerification = verifyCode(email, code)
    if (!codeVerification.valid) {
      return res.status(400).json({ message: codeVerification.message })
    }

    // 查找用户
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 更新密码
    user.password = newPassword
    await user.save()

    res.json({
      message: '密码重置成功，请使用新密码登录',
    })
  } catch (error) {
    console.error('重置密码错误:', error)
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}
