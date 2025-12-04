import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 确保目录存在，如果不存在则创建
 * @param {string} dirPath - 目录路径
 */
const ensureDirectoryExists = (dirPath) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
    console.log(`已创建目录: ${dirPath}`)
  }
}

/**
 * 获取上传文件的基础路径
 * 开发环境：使用相对路径 backend/uploads
 * 生产环境：使用环境变量 UPLOAD_PATH 或默认相对路径
 */
export const getUploadPath = () => {
  // 如果设置了环境变量，优先使用环境变量
  let uploadPath
  if (process.env.UPLOAD_PATH) {
    uploadPath = process.env.UPLOAD_PATH
  } else {
    // 开发环境使用相对路径
    uploadPath = join(__dirname, '../../uploads')
  }

  // 确保目录存在
  ensureDirectoryExists(uploadPath)
  return uploadPath
}

/**
 * 获取头像上传路径
 */
export const getAvatarUploadPath = () => {
  const basePath = getUploadPath()
  const avatarPath = join(basePath, 'avatars')
  // 确保头像目录存在
  ensureDirectoryExists(avatarPath)
  return avatarPath
}
