<template>
  <div class="article-list">
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文章..."
        style="width: 300px"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
      <el-select
        v-model="selectedCategory"
        placeholder="选择分类"
        clearable
        style="width: 150px; margin-left: 10px"
        @change="handleCategoryChange"
      >
        <el-option
          v-for="category in categories"
          :key="category._id"
          :label="category.name"
          :value="category._id"
        />
      </el-select>
      <el-select
        v-model="selectedTag"
        placeholder="选择标签"
        multiple
        clearable
        collapse-tags
        collapse-tags-tooltip
        style="width: 200px; margin-left: 10px"
        @change="handleTagChange"
      >
        <el-option v-for="tag in tags" :key="tag._id" :label="tag.name" :value="tag._id" />
      </el-select>
      <el-button
        v-if="userStore.isLoggedIn"
        type="primary"
        style="margin-left: 10px"
        @click="$router.push('/articles/edit')"
      >
        写文章
      </el-button>
    </div>

    <div
      v-if="articles.length > 0"
      v-infinite-scroll="loadMoreArticles"
      :infinite-scroll-disabled="loading || noMore"
      class="card-container"
    >
      <el-card
        v-for="article in articles"
        :key="article._id"
        class="article-card"
        @click="goToDetail(article._id)"
      >
        <div class="article-header">
          <h3>{{ article.title }}</h3>
          <div class="article-meta">
            <span>作者：{{ article.author?.username }}</span>
            <span>分类：{{ article.category?.name || '未分类' }}</span>
            <span>发布时间：{{ formatDate(article.createdAt) }}</span>
            <span>阅读量：{{ article.views }}</span>
          </div>
        </div>
        <div class="article-summary">
          {{ article.summary || article.content.substring(0, 150) + '...' }}
        </div>
        <div class="article-tags">
          <el-tag v-for="tag in article.tags" :key="tag._id" size="small" style="margin-right: 5px">
            {{ tag.name }}
          </el-tag>
        </div>
      </el-card>

      <!-- 加载状态提示 -->
      <div v-if="loading && articles.length > 0" class="loading-more">
        <span>加载中...</span>
      </div>

      <!-- 没有更多数据提示 -->
      <div v-if="noMore && articles.length > 0" class="no-more">没有更多文章了</div>
    </div>

    <div
      v-else
      style="
        height: calc(100vh - 200px);
        display: flex;
        justify-content: center;
        align-items: center;
      "
    >
      <el-empty description="暂无文章" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getArticles } from '../api/article'
import { getCategories } from '../api/category'
import { getTags } from '../api/tag'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const articles = ref([])
const categories = ref([])
const tags = ref([])
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedTag = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const noMore = ref(false) // 是否没有更多数据

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const loadArticles = async (isLoadMore = false) => {
  if (loading.value) return // 防止重复调用

  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: 'published',
    }
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    if (selectedTag.value && selectedTag.value.length > 0) {
      // 多选标签，传递数组
      params.tags = selectedTag.value.join(',')
    }
    const response = await getArticles(params)

    if (isLoadMore) {
      // 加载更多时追加数据
      articles.value = [...articles.value, ...response.articles]
    } else {
      // 首次加载或搜索时替换数据
      articles.value = response.articles
    }

    total.value = response.pagination.total

    // 检查是否还有更多数据
    noMore.value = articles.value.length >= total.value
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMoreArticles = async () => {
  // 如果正在加载或没有更多数据，直接返回
  if (loading.value || noMore.value) return

  currentPage.value++
  await loadArticles(true) // 传递 true 表示是加载更多
}

const loadCategories = async () => {
  try {
    const data = await getCategories()
    categories.value = data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  noMore.value = false // 重置状态
  loadArticles(false) // 搜索时替换数据
}

const handleCategoryChange = () => {
  currentPage.value = 1
  noMore.value = false // 重置状态
  loadArticles(false) // 分类改变时替换数据
}

const handleTagChange = () => {
  currentPage.value = 1
  noMore.value = false // 重置状态
  loadArticles(false) // 标签改变时替换数据
}

const loadTags = async () => {
  try {
    const data = await getTags()
    tags.value = data
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

const goToDetail = (id) => {
  router.push(`/articles/${id}`)
}

onMounted(() => {
  loadArticles()
  loadCategories()
  loadTags()
})
</script>

<style lang="scss" scoped>
.article-list {
  height: calc(100vh - 100px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.card-container {
  height: calc(100vh - 162px);
  overflow-y: auto; /* 启用垂直滚动 */
  overflow-x: hidden; /* 隐藏横向滚动 */
  /* 隐藏滚动条 (兼容主流浏览器) */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
.card-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.article-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.article-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.article-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.article-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.article-summary {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 10px;
}

.article-tags {
  margin-top: 10px;
}

.pagination-container {
  display: flex;
  justify-content: center;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
