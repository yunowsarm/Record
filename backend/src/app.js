import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import authRoutes from './routes/authRoutes.js'
import articleRoutes from './routes/articleRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import tagRoutes from './routes/tagRoutes.js'
import commentRoutes from './routes/commentRoutes.js'

// 加载环境变量
dotenv.config()

// 处理 ES 模块路径 (__filename, __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 创建 Express 应用实例
const app = express()

// 信任代理（用于正确获取客户端IP地址）
app.set('trust proxy', true)

// 使用 CORS 中间件，允许跨域请求
app.use(cors())

// 解析 json 格式请求体
app.use(express.json())

// 解析 urlencoded 格式请求体
app.use(express.urlencoded({ extended: true }))

// 提供上传文件的静态访问入口
app.use('/uploads', express.static(join(__dirname, '../uploads')))

// 连接 MongoDB 数据库
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 路由注册
app.use('/api/auth', authRoutes) // 用户认证相关
app.use('/api/articles', articleRoutes) // 文章相关
app.use('/api/categories', categoryRoutes) // 分类相关
app.use('/api/tags', tagRoutes) // 标签相关
app.use('/api/comments', commentRoutes) // 评论相关

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
})

// 启动服务并监听端口
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
