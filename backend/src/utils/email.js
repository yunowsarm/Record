import nodemailer from 'nodemailer'

// 验证码存储（实际生产环境建议使用 Redis）
const verificationCodes = new Map()

// 检查 SMTP 配置
const checkSMTPConfig = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP配置未完成，请在 .env 文件中配置 SMTP_USER 和 SMTP_PASS')
  }
}

// 创建邮件传输器（需要配置你的邮箱服务）
let transporter = null

const getTransporter = () => {
  if (!transporter) {
    checkSMTPConfig()
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com', // QQ邮箱SMTP服务器
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER, // 你的邮箱
        pass: process.env.SMTP_PASS, // 邮箱授权码（不是密码）
      },
    })
  }
  return transporter
}

// 生成6位随机验证码
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 发送验证码邮件（统一函数，通过 type 参数区分类型）
export const sendVerificationCode = async (email, code, type = 'register') => {
  try {
    checkSMTPConfig()
    const mailTransporter = getTransporter()

    // 根据类型设置邮件内容
    const emailConfig = {
      register: {
        subject: '注册验证码',
        title: '注册验证码',
        description: '您的注册验证码是：',
        footer: '验证码有效期为10分钟，请勿泄露给他人。',
      },
      resetPassword: {
        subject: '重置密码验证码',
        title: '重置密码验证码',
        description: '您正在重置密码，验证码是：',
        footer: '验证码有效期为10分钟，请勿泄露给他人。如非本人操作，请忽略此邮件。',
      },
    }

    const config = emailConfig[type] || emailConfig.register

    const mailOptions = {
      from: `"记录系统" <${process.env.SMTP_USER}>`,
      to: email,
      subject: config.subject,
      html: `
      <div style="padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #409eff;">${config.title}</h2>
          <p>${config.description}</p>
          <div style="font-size: 32px; font-weight: bold; color: #409eff; text-align: center; padding: 20px; background: #f0f9ff; border-radius: 4px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #909399; font-size: 12px;">${config.footer}</p>
        </div>
      </div>
    `,
    }

    await mailTransporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('发送邮件失败:', error)

    // 提供更详细的错误信息
    if (error.message.includes('SMTP配置')) {
      throw error
    } else if (error.code === 'EAUTH') {
      throw new Error('邮箱认证失败，请检查 SMTP_USER 和 SMTP_PASS 是否正确')
    } else if (error.code === 'ECONNECTION') {
      throw new Error('无法连接到邮件服务器，请检查网络连接和 SMTP_HOST 配置')
    } else {
      throw new Error(`邮件发送失败: ${error.message}`)
    }
  }
}

// 存储验证码（10分钟有效期）
export const saveVerificationCode = (email, code) => {
  verificationCodes.set(email, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10分钟后过期
  })
}

// 验证验证码
export const verifyCode = (email, code) => {
  const stored = verificationCodes.get(email)

  if (!stored) {
    return { valid: false, message: '验证码不存在或已过期' }
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email)
    return { valid: false, message: '验证码已过期，请重新获取' }
  }

  if (stored.code !== code) {
    return { valid: false, message: '验证码错误' }
  }

  // 验证成功后删除验证码（一次性使用）
  verificationCodes.delete(email)
  return { valid: true }
}

// 清理过期验证码（可选，定期清理）
export const cleanExpiredCodes = () => {
  const now = Date.now()
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email)
    }
  }
}
