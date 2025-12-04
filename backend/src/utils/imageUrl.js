/**
 * 将相对路径转换为完整的图片 URL
 * @param {Object} req - Express 请求对象
 * @param {string} relativePath - 相对路径，如 /uploads/avatars/xxx.png
 * @returns {string} 完整的 URL 或相对路径
 */
export const getFullImageUrl = (req, relativePath) => {
  if (!relativePath) {
    return null
  }

  // 如果已经是完整 URL，直接返回
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }

  // 确保路径以 / 开头
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`

  // 检查是否是开发环境
  // 判断标准：
  // 1. NODE_ENV 不是 'production'
  // 2. 或者后端运行在 localhost:3000（常见的开发端口）
  const isDevelopment =
    process.env.NODE_ENV !== 'production' ||
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === 'development'

  // 检查请求来源（origin 或 referer）
  const origin = req.headers.origin || req.headers.referer
  const host = req.get('host') || ''

  // 在开发环境中，如果请求来自前端开发服务器（通过 Vite 代理），返回相对路径
  // 这样浏览器会通过当前域（前端服务器）访问，Vite 代理会转发到后端
  if (isDevelopment) {
    // 检查请求来源（origin 或 referer）
    if (origin) {
      try {
        // 检查是否是前端开发服务器的请求（通常是 localhost:5173）
        const frontendPorts = ['5173', '3001', '8080', '5174', '5175'] // 常见的前端开发端口
        const originUrl = new URL(origin)

        // 如果请求来自前端开发服务器的端口，返回相对路径
        // Vite 代理会处理 /uploads 路径
        if (frontendPorts.includes(originUrl.port)) {
          return path // 返回相对路径，让浏览器通过当前域访问
        }
      } catch (e) {
        // URL 解析失败，继续检查
      }
    }

    // 如果后端运行在 localhost:3000，且请求来自 localhost，返回相对路径
    // 这样 Vite 代理可以处理请求
    if (host && host.includes('localhost') && (host.includes(':3000') || host === 'localhost')) {
      // 在开发环境中，如果检测到本地请求，默认返回相对路径
      return path
    }
  }

  // 生产环境或直接访问后端时，返回完整 URL
  // 如果 host 为空，无法构建完整 URL，返回相对路径作为后备方案
  if (!host || host.trim() === '') {
    return path
  }

  // 获取协议（支持反向代理）
  const protocol = req.headers['x-forwarded-proto'] || req.protocol

  return `${protocol}://${host}${path}`
}

/**
 * 处理用户对象，将 avatar 字段转换为完整 URL
 * @param {Object} req - Express 请求对象
 * @param {Object} user - 用户对象（可以是 Mongoose 文档、普通对象或数组）
 * @returns {Object|Array} 处理后的用户对象
 */
export const processUserAvatar = (req, user) => {
  if (!user) return user

  // 处理数组
  if (Array.isArray(user)) {
    return user.map((item) => processUserAvatar(req, item))
  }

  // 处理 Mongoose 文档或普通对象
  const userObj = user.toObject ? user.toObject() : { ...user }

  // 处理用户对象的 avatar
  if (userObj.avatar) {
    userObj.avatar = getFullImageUrl(req, userObj.avatar)
  }

  // 递归处理嵌套的 user 对象（如评论中的 user）
  if (userObj.user && typeof userObj.user === 'object') {
    userObj.user = processUserAvatar(req, userObj.user)
  }

  // 递归处理嵌套的 author 对象（如文章中的 author）
  if (userObj.author && typeof userObj.author === 'object') {
    userObj.author = processUserAvatar(req, userObj.author)
  }

  // 递归处理嵌套的 parentComment（如评论中的父评论）
  if (userObj.parentComment && typeof userObj.parentComment === 'object') {
    userObj.parentComment = processUserAvatar(req, userObj.parentComment)
  }

  return userObj
}

/**
 * 处理对象或数组中的用户头像 URL
 * 主要用于处理 populate 后的嵌套用户对象
 * @param {Object} req - Express 请求对象
 * @param {Object|Array} data - 需要处理的数据（文章、评论等）
 * @returns {Object|Array} 处理后的数据
 */
export const processNestedUserAvatars = (req, data) => {
  if (!data) return data

  // 处理数组
  if (Array.isArray(data)) {
    return data.map((item) => processUserAvatar(req, item))
  }

  // 处理对象
  return processUserAvatar(req, data)
}
