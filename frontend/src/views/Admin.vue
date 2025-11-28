<template>
  <div class="admin-page">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-main>
        <div class="admin">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="分类管理" name="categories">
              <CategoryManagement />
            </el-tab-pane>
            <el-tab-pane label="标签管理" name="tags">
              <TagManagement />
            </el-tab-pane>
            <el-tab-pane label="评论审核" name="comments">
              <CommentManagement />
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from '../components/Header.vue'
import CategoryManagement from '../components/CategoryManagement.vue'
import TagManagement from '../components/TagManagement.vue'
import CommentManagement from '../components/CommentManagement.vue'

const activeTab = ref('categories')
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
}

.admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>

