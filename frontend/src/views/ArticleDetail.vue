<template>
  <div class="article-detail-page">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-main>
        <div v-loading="loading" class="article-detail">
          <el-card v-if="article">
            <div class="article-header">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <h1>{{ article.title }}</h1>
                <div class="article-actions">
                  <div v-if="canEdit">
                    <el-button @click="handleEdit">编辑</el-button>
                    <el-button type="danger" @click="handleDelete">删除</el-button>
                  </div>

                  <div>
                    <el-button type="primary" @click="handleBack">返回</el-button>
                  </div>
                </div>
              </div>

              <div class="article-meta">
                <span>作者：{{ article.author?.username }}</span>
                <span>分类：{{ article.category?.name || '未分类' }}</span>
                <span>发布时间：{{ formatDate(article.createdAt) }}</span>
                <span>阅读量：{{ article.views }}</span>
              </div>
              <div class="article-tags">
                <el-tag
                  v-for="tag in article.tags"
                  :key="tag._id"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
            </div>
            <div v-if="article.coverImage" class="article-cover">
              <img :src="article.coverImage" alt="封面" />
            </div>
            <div class="article-content-wrapper">
              <div
                ref="contentRef"
                class="article-content"
                :class="{
                  'content-collapsed': !isExpanded && shouldShowExpand,
                }"
                v-html="formatContent(article.content)"
              ></div>
              <div v-if="shouldShowExpand" class="content-expand-btn" @click="toggleExpand">
                <el-button type="text">
                  <el-icon style="margin-right: 5px">
                    <ArrowUp v-if="isExpanded" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ isExpanded ? '收起' : '浏览全文' }}
                </el-button>
              </div>
            </div>
          </el-card>
          <CommentList :article-id="articleId" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import Header from '../components/Header.vue'
import CommentList from '../components/CommentList.vue'
import { getArticle, deleteArticle } from '../api/article'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const articleId = route.params.id
const article = ref(null)
const loading = ref(true)
const isExpanded = ref(false)
const contentRef = ref(null)
const shouldShowExpand = ref(false)

const canEdit = computed(() => {
  if (!userStore.isLoggedIn || !article.value) return false
  return (
    userStore.user._id === article.value.author._id ||
    userStore.user.id === article.value.author._id ||
    userStore.isAdmin
  )
})

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 配置 marked 支持代码高亮
marked.setOptions({
  highlight: function (code, lang) {
    const language = lang || 'plaintext'
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        // 如果指定语言失败，尝试自动检测
        return hljs.highlightAuto(code).value
      }
    }
    // 如果没有指定语言或语言不支持，自动检测
    return hljs.highlightAuto(code).value
  },
  breaks: true, // 支持换行
  gfm: true, // 支持 GitHub Flavored Markdown
})

const formatContent = (content) => {
  try {
    return marked(content || '')
  } catch (error) {
    console.error('Markdown 渲染错误:', error)
    return content.replace(/\n/g, '<br>')
  }
}

const loadArticle = async () => {
  try {
    loading.value = true
    const data = await getArticle(articleId)
    console.log('data', data)
    console.log('userStore.user', userStore.user)
    article.value = data
    // 重置展开状态
    isExpanded.value = false
    // 等待DOM更新后检查内容高度
    await nextTick()
    checkContentHeight()
  } catch (error) {
    ElMessage.error('加载文章失败')
    router.push('/articles')
  } finally {
    loading.value = false
  }
}

// 检查内容高度，判断是否需要显示展开按钮
const checkContentHeight = () => {
  if (!contentRef.value) return

  // 获取内容元素的实际高度
  const contentElement = contentRef.value
  const lineHeight = parseFloat(getComputedStyle(contentElement).lineHeight) || 24
  const maxHeight = lineHeight * 10 // 10行的高度

  // 检查内容是否超过10行
  shouldShowExpand.value = contentElement.scrollHeight > maxHeight
}

// 切换展开/折叠
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 监听文章内容变化
watch(
  () => article.value?.content,
  () => {
    if (article.value) {
      nextTick(() => {
        checkContentHeight()
      })
    }
  },
)

const handleEdit = () => {
  router.push(`/articles/edit/${articleId}`)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteArticle(articleId)
    ElMessage.success('删除成功')
    router.push('/articles')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleBack = () => {
  router.push('/articles')
}

onMounted(() => {
  loadArticle()
})
</script>

<style lang="scss" scoped>
.article-detail-page {
  min-height: 100vh;
}

.article-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.article-header h1 {
  margin: 0 0 15px 0;
  color: #303133;
}

.article-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #909399;
  margin-bottom: 15px;
}

.article-tags {
  margin-bottom: 15px;
}

.article-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.article-cover {
  margin: 20px 0;
}

.article-cover img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 4px;
}

.article-content-wrapper {
  position: relative;
}

.article-content {
  line-height: 1.8;
  color: #606266;
  margin-top: 20px;
  transition: max-height 0.3s ease;
}

.article-content.content-collapsed {
  max-height: calc(1.8em * 10);
  overflow: hidden;
  position: relative;
}

.article-content.content-collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #fff);
  pointer-events: none;
}

.content-expand-btn {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 20px;
}

.content-expand-btn .el-button {
  color: #409eff;
  font-size: 14px;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4),
.article-content :deep(h5),
.article-content :deep(h6) {
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: bold;
}

.article-content :deep(p) {
  margin-bottom: 15px;
}

.article-content :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.article-content :deep(pre) {
  background: #1e1e1e;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 15px;
  position: relative;
}

.article-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #d4d4d4;
  font-size: 14px;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.article-content :deep(pre code.hljs) {
  display: block;
  overflow-x: auto;
  padding: 1em;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 15px;
  margin: 15px 0;
  color: #909399;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin-bottom: 15px;
  padding-left: 30px;
}

.article-content :deep(li) {
  margin-bottom: 5px;
}

.article-content :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.article-content :deep(a:hover) {
  text-decoration: underline;
}

.article-content :deep(img) {
  max-width: 820px;
  height: auto;
  border-radius: 4px;
  margin: 15px auto;
  display: block;
}
</style>
