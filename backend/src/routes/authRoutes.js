import express from 'express'
import { body } from 'express-validator'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import {
  register,
  login,
  getProfile,
  updateProfile,
  uploadAvatar,
  sendCode,
  sendResetPasswordCode,
  resetPassword,
} from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

// 获取当前文件名和目录名
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 配置 multer 用于头像上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../../uploads/avatars'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件'), false)
    }
  },
})

const router = express.Router()

// 发送验证码路由
router.post('/send-code', [body('email').isEmail().withMessage('请输入有效的邮箱地址')], sendCode)

// 用户注册路由，参数校验用户名、邮箱、密码
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度必须在3-20个字符之间'),
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
    body('code').notEmpty().withMessage('请输入验证码'),
  ],
  register,
)

// 用户登录路由，参数校验邮箱和密码
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  login,
)

// 获取当前用户个人信息，需认证
router.get('/profile', authenticate, getProfile)

// 更新当前用户个人信息，需认证
router.put('/profile', authenticate, updateProfile)

// 上传头像，需认证
router.post('/upload-avatar', authenticate, upload.single('avatar'), uploadAvatar)

// 发送重置密码验证码
router.post(
  '/send-reset-code',
  [body('email').isEmail().withMessage('请输入有效的邮箱地址')],
  sendResetPasswordCode,
)

// 重置密码
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('code').notEmpty().withMessage('请输入验证码'),
    body('newPassword').isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
  ],
  resetPassword,
)

export default router
