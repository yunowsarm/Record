import Article from '../models/Article.js'
import { validationResult } from 'express-validator'
import { getClientIP, canIncrementView } from '../utils/viewTracker.js'

// 获取文章列表
export const getArticles = async (req, res) => {
  try {
    // 获取分页参数及过滤条件
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const status = req.query.status || 'published' // 默认只展示已发布文章
    const category = req.query.category
    const tag = req.query.tag
    const tags = req.query.tags // 支持多标签筛选
    const search = req.query.search
    const author = req.query.author // 支持按作者筛选

    // 构建查询条件
    const query = { status }
    if (category) query.category = category
    if (tags) {
      // 多标签筛选：文章必须包含所有选中的标签
      const tagArray = tags.split(',').filter(Boolean)
      if (tagArray.length > 0) {
        query.tags = { $all: tagArray }
      }
    } else if (tag) {
      // 单标签筛选（向后兼容）
      query.tags = tag
    }
    if (author) query.author = author // 添加作者筛选
    if (search) {
      // 使用正则表达式对标题和内容进行模糊搜索
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ]
    }

    // 查询文章列表，同时关联作者、分类、标签信息
    const articles = await Article.find(query)
      .populate('author', 'username avatar')
      .populate('category', 'name')
      .populate('tags', 'name')
      .sort({ createdAt: -1 }) // 按创建时间倒序
      .skip(skip)
      .limit(limit)

    // 查询总数，用于分页
    const total = await Article.countDocuments(query)

    // 返回结果
    res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    // 捕获错误并返回服务器异常
    console.error('获取文章列表错误:', error)
    res.status(500).json({
      message: '服务器错误',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// 获取单篇文章详情
export const getArticle = async (req, res) => {
  try {
    // 根据ID查找文章，关联作者、分类、标签信息
    const article = await Article.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('category', 'name description')
      .populate('tags', 'name')

    if (!article) {
      // 文章不存在
      return res.status(404).json({ message: '文章不存在' })
    }

    // 获取客户端标识：优先使用用户ID（如果已登录），否则使用IP地址
    const identifier = req.user?._id?.toString() || getClientIP(req)

    // 检查是否可以增加阅读量（防刷机制：15分钟内同一用户/IP只计算一次）
    if (canIncrementView(identifier, req.params.id)) {
      // 增加浏览量
      article.views += 1
      await article.save()
    }

    res.json(article)
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

// 新建文章
export const createArticle = async (req, res) => {
  try {
    // 校验请求参数
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // 构造文章数据
    const articleData = {
      ...req.body,
      author: req.user._id, // 文章作者为当前登录用户
    }

    // 处理分类为空的情况
    if (articleData.category === '' || articleData.category === null) {
      articleData.category = undefined
    }
    // 处理标签为空的情况
    if (!articleData.tags || articleData.tags.length === 0) {
      articleData.tags = []
    }

    // 如果有上传封面图片，则保存图片路径
    if (req.file) {
      articleData.coverImage = `/uploads/${req.file.filename}`
    }

    // 创建并保存文章
    const article = new Article(articleData)
    await article.save()
    // 关联填充返回的作者、分类、标签信息
    await article.populate('author', 'username avatar')
    await article.populate('category', 'name')
    await article.populate('tags', 'name')

    res.status(201).json(article)
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

// 更新文章
export const updateArticle = async (req, res) => {
  try {
    // 校验请求参数
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // 查找需要更新的文章
    const article = await Article.findById(req.params.id)
    if (!article) {
      return res.status(404).json({ message: '文章不存在' })
    }

    // 检查权限，只能作者本人或管理员才能修改
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权修改此文章' })
    }

    // 处理更新数据，防止空字符串等异常情况
    const updateData = { ...req.body }
    if (updateData.category === '' || updateData.category === null) {
      updateData.category = undefined
    }
    if (!updateData.tags || updateData.tags.length === 0) {
      updateData.tags = []
    }

    // 应用更新数据
    Object.assign(article, updateData)
    // 处理新的封面图片
    if (req.file) {
      article.coverImage = `/uploads/${req.file.filename}`
    }

    // 保存并填充好作者、分类、标签字段
    await article.save()
    await article.populate('author', 'username avatar')
    await article.populate('category', 'name')
    await article.populate('tags', 'name')

    res.json(article)
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

// 删除文章
export const deleteArticle = async (req, res) => {
  try {
    // 查找需要删除的文章
    const article = await Article.findById(req.params.id)
    if (!article) {
      return res.status(404).json({ message: '文章不存在' })
    }

    // 检查是否有权限删除，作者本人或管理员
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此文章' })
    }

    // 删除文章
    await Article.findByIdAndDelete(req.params.id)
    res.json({ message: '文章已删除' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

// 获取用户的文章阅读量统计
export const getArticleStats = async (req, res) => {
  try {
    const userId = req.user._id
    const days = parseInt(req.query.days) || 30 // 默认30天

    // 计算日期范围
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 查询用户的所有文章
    const articles = await Article.find({
      author: userId,
      status: 'published',
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .select('views createdAt title')
      .sort({ createdAt: 1 })

    // 按日期分组统计
    const statsMap = new Map()
    articles.forEach((article) => {
      const date = new Date(article.createdAt).toISOString().split('T')[0]
      if (!statsMap.has(date)) {
        statsMap.set(date, { date, views: 0, count: 0 })
      }
      const stat = statsMap.get(date)
      stat.views += article.views || 0
      stat.count += 1
    })

    // 转换为数组并填充缺失的日期
    const stats = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (statsMap.has(dateStr)) {
        stats.push(statsMap.get(dateStr))
      } else {
        stats.push({ date: dateStr, views: 0, count: 0 })
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 计算总统计
    const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0)
    const totalArticles = articles.length
    const avgViews = totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0

    res.json({
      stats,
      summary: {
        totalViews,
        totalArticles,
        avgViews,
      },
    })
  } catch (error) {
    console.error('获取文章统计错误:', error)
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

//上传文章内容图片，需认证
export const uploadPicture = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的文件' })
    }
    // 构造图片的 URL，相对于上传目录
    const imageUrl = `/uploads/${req.file.filename}`
    res.json({
      message: '图片上传成功',
      url: imageUrl,
    })
  } catch (error) {
    console.error('图片上传错误:', error)
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}
