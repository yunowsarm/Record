<template>
  <div class="forgot-password-container">
    <el-card class="forgot-password-card">
      <template #header>
        <div class="card-header">
          <span>重置密码</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入注册邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div style="display: flex; gap: 10px">
            <el-input v-model="form.code" placeholder="请输入验证码" style="flex: 1" />
            <el-button
              :disabled="!canSendCode || countdown > 0"
              :loading="sendingCode"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            @keyup.enter="handleResetPassword"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleResetPassword"
            :loading="loading"
            style="width: 100%"
          >
            确认重置
          </el-button>
        </el-form-item>
        <el-form-item>
          <div style="text-align: center">
            <el-link type="primary" @click="$router.push('/login')">返回登录</el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendResetPasswordCode, resetPassword } from '../api/auth'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer = null

const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

// 验证邮箱格式
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 是否可以发送验证码
const canSendCode = computed(() => {
  return form.email && emailRegex.test(form.email)
})

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 发送验证码
const handleSendCode = async () => {
  if (!canSendCode.value) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }

  sendingCode.value = true
  try {
    await sendResetPasswordCode({ email: form.email })
    ElMessage.success('验证码已发送，请查收邮箱')

    // 开始倒计时
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await resetPassword({
          email: form.email,
          code: form.code,
          newPassword: form.newPassword,
        })
        ElMessage.success('密码重置成功，请使用新密码登录')
        router.push('/login')
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '重置密码失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.forgot-password-card {
  width: 400px;
}
</style>
