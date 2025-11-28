<template>
  <el-header class="header">
    <div class="header-content">
      <div class="logo" @click="$router.push('/')">
        <el-icon style="vertical-align: middle; margin-right: 8px">
          <House />
        </el-icon>
      </div>
      <div class="nav">
        <div class="nav-links">
          <span :class="['nav-link', { active: activeIndex === '/' }]" @click="handleSelect('/')">
            首页
          </span>
          <span
            :class="['nav-link', { active: activeIndex === '/articles' }]"
            @click="handleSelect('/articles')"
          >
            文章
          </span>
          <span
            v-if="userStore.isLoggedIn"
            :class="['nav-link', { active: activeIndex === '/profile' }]"
            @click="handleSelect('/profile')"
          >
            个人中心
          </span>
          <span
            v-if="userStore.isLoggedIn && userStore.isAdmin"
            :class="['nav-link', { active: activeIndex === '/admin' }]"
            @click="handleSelect('/admin')"
          >
            管理后台
          </span>
        </div>
      </div>
      <div class="user-info">
        <template v-if="userStore.isLoggedIn">
          <el-dropdown trigger="hover" placement="bottom">
            <el-avatar :src="userStore.user?.avatar" :size="32" class="user-avatar">
              <span>{{ userStore.user?.username?.charAt(0)?.toUpperCase() }}</span>
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item class="user-info-item" @click="handleSelect('/profile')">
                  <div class="dropdown-user-name">
                    <span>{{ userStore.user?.username }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <span class="logout-item">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button @click="$router.push('/login')"> 登录 </el-button>
          <el-button type="primary" @click="$router.push('/register')"> 注册 </el-button>
        </template>
      </div>
    </div>
  </el-header>
</template>

<script setup>
import { computed } from 'vue'
import { House } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeIndex = computed(() => {
  return route.path
})

const handleSelect = (key) => {
  router.push(key)
}

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<style lang="scss" scoped>
.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 60px;
  line-height: 60px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.nav {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-links {
  display: flex;
  gap: 30px;
  align-items: center;
}

.nav-link {
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  transition: color 0.3s;
  white-space: nowrap;
}

.nav-link:hover {
  color: #409eff;
}

.nav-link.active {
  color: #409eff;
  border-bottom: 2px solid #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  cursor: pointer;
  border: 2px solid #e4e7ed;
  transition: border-color 0.3s;
}

.user-avatar:hover {
  border-color: #409eff;
}

.user-info-item {
  cursor: default;
}

.dropdown-user-name {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}

.logout-item {
  color: #ff9595;
  font-size: 12px;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #f5f7fa;
}
</style>
