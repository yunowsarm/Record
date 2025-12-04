<template>
  <div class="dashboard">
    <!-- 顶部统计区域 -->
    <el-row :gutter="20" class="top-stats-row">
      <!-- 左侧：文章统计 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card class="stats-panel articles-panel" shadow="never">
          <div class="panel-header">
            <el-icon class="panel-icon"><Document /></el-icon>
            <span class="panel-title">文章统计</span>
          </div>
          <div class="stats-cards">
            <div class="stat-card-item">
              <div class="stat-label">已发布文章</div>
              <div class="stat-value">
                <el-icon class="value-icon"><Document /></el-icon>
                <span>{{ stats.totalArticles }}</span>
              </div>
              <div class="stat-uptime">分类: {{ stats.totalCategories }} 个</div>
            </div>
            <div class="stat-card-item">
              <div class="stat-label">总阅读量</div>
              <div class="stat-value">
                <el-icon class="value-icon"><View /></el-icon>
                <span>{{ stats.totalViews }}</span>
              </div>
              <div class="stat-uptime">标签: {{ stats.totalTags }} 个</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：快速操作 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card class="stats-panel action-panel" shadow="never">
          <div class="panel-header">
            <el-icon class="panel-icon"><Operation /></el-icon>
            <span class="panel-title">快速操作</span>
          </div>
          <div class="action-content">
            <div v-if="!userStore.isLoggedIn" class="no-action">
              <el-icon class="warning-icon"><Warning /></el-icon>
              <p>您还没有登录</p>
              <p>登录后可以发布文章和管理内容</p>
            </div>
            <div v-else class="action-buttons">
              <el-button
                type="success"
                size="large"
                class="action-button"
                @click="$router.push('/articles/edit')"
              >
                <el-icon><Edit /></el-icon>
                <span>写文章</span>
              </el-button>
              <el-button
                type="primary"
                size="large"
                class="action-button"
                @click="$router.push('/articles')"
              >
                <el-icon><Document /></el-icon>
                <span>浏览文章</span>
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部：阅读量统计图表 -->
    <el-card class="chart-panel" shadow="never">
      <div class="chart-header">
        <div class="chart-title">
          <el-icon class="chart-icon"><DataAnalysis /></el-icon>
          <span>阅读量统计</span>
        </div>
        <div class="chart-controls">
          <el-select v-model="chartDays" style="width: 120px" size="small" @change="loadChartData">
            <el-option label="最近7天" :value="7" />
            <el-option label="最近30天" :value="30" />
            <el-option label="最近90天" :value="90" />
          </el-select>
          <el-button text size="small" @click="loadChartData" class="refresh-btn">
            <el-icon><Refresh /></el-icon>
            <span>刷新</span>
          </el-button>
        </div>
      </div>
      <div v-loading="chartLoading" class="chart-content">
        <div
          v-if="chartData && chartData.length > 0"
          ref="chartContainer"
          class="chart-container"
        ></div>
        <el-empty v-else-if="!chartLoading" description="暂无统计数据" />
      </div>
      <!-- 图例说明 -->
      <div class="chart-legend">
        <div class="legend-item">
          <span class="legend-dot blue"></span>
          <span>总阅读量</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot green"></span>
          <span>文章数量</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot yellow"></span>
          <span>平均阅读量</span>
        </div>
      </div>
    </el-card>

    <!-- 最近文章列表 -->
    <el-card class="recent-panel" shadow="never">
      <div class="panel-header">
        <el-icon class="panel-icon"><Clock /></el-icon>
        <span class="panel-title">最近文章</span>
        <el-button
          text
          type="primary"
          size="small"
          @click="$router.push('/articles')"
          class="more-btn"
        >
          查看更多
        </el-button>
      </div>
      <div v-loading="articlesLoading" class="articles-list">
        <div v-if="recentArticles.length > 0" class="articles-grid">
          <div
            v-for="article in recentArticles"
            :key="article._id"
            class="article-card"
            @click="$router.push(`/articles/${article._id}`)"
          >
            <div class="article-card-header">
              <el-tooltip
                v-if="article.title && article.title.length > 28"
                :content="article.title"
                placement="top"
              >
                <h3 class="article-card-title">
                  {{ article.title.slice(0, 28) + '...' }}
                </h3>
              </el-tooltip>
              <h3 v-else class="article-card-title">
                {{ article.title }}
              </h3>
              <el-tag v-if="article.category" size="small" type="info">
                {{ article.category.name }}
              </el-tag>
            </div>
            <div class="article-card-meta">
              <span class="author">
                <el-icon><User /></el-icon>
                {{ article.author?.username || '未知' }}
              </span>
              <span class="date">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(article.createdAt) }}
              </span>
              <span class="views">
                <el-icon><View /></el-icon>
                {{ article.views || 0 }}
              </span>
            </div>
          </div>
        </div>
        <el-empty v-else-if="!articlesLoading" description="暂无文章" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Document,
  View,
  Edit,
  Operation,
  Warning,
  DataAnalysis,
  Refresh,
  Clock,
  User,
  Calendar,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getArticles, getArticleStats } from '../api/article'
import { getCategories } from '../api/category'
import { getTags } from '../api/tag'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 统计数据
const stats = ref({
  totalArticles: 0,
  totalViews: 0,
  totalCategories: 0,
  totalTags: 0,
})

// 图表相关
const chartLoading = ref(false)
const chartDays = ref(30)
const chartData = ref([])
const chartContainer = ref(null)
let chartInstance = null

// 最近文章
const articlesLoading = ref(false)
const recentArticles = ref([])

// 加载统计数据
const loadStats = async () => {
  try {
    // 加载文章统计
    const articlesResponse = await getArticles({
      page: 1,
      limit: 1,
      status: 'published',
    })
    stats.value.totalArticles = articlesResponse.pagination?.total || 0

    // 计算总阅读量
    const allArticlesResponse = await getArticles({
      page: 1,
      limit: 1000,
      status: 'published',
    })
    stats.value.totalViews =
      allArticlesResponse.articles?.reduce((sum, article) => sum + (article.views || 0), 0) || 0

    // 加载分类和标签
    const categories = await getCategories()
    stats.value.totalCategories = categories?.length || 0

    const tags = await getTags()
    stats.value.totalTags = tags?.length || 0
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载图表数据
const loadChartData = async () => {
  if (!userStore.isLoggedIn) {
    chartData.value = []
    return
  }

  chartLoading.value = true
  try {
    const response = await getArticleStats({ days: chartDays.value })
    if (response && response.stats) {
      chartData.value = response.stats

      await nextTick()
      if (chartContainer.value && chartData.value.length > 0) {
        renderChart()
      }
    }
  } catch (error) {
    console.error('加载图表数据失败:', error)
    chartData.value = []
  } finally {
    chartLoading.value = false
  }
}

// 渲染图表
const renderChart = () => {
  if (!chartContainer.value) return

  // 销毁旧图表
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 创建新图表
  chartInstance = echarts.init(chartContainer.value)

  // 准备数据
  const dates = chartData.value.map((item) => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const views = chartData.value.map((item) => item.views)
  const counts = chartData.value.map((item) => item.count)
  const avgViews =
    counts.length > 0 ? views.map((v, i) => (counts[i] > 0 ? (v / counts[i]).toFixed(1) : 0)) : []

  // 配置选项
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['总阅读量', '文章数量', '平均阅读量'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '阅读量/数量',
        position: 'left',
      },
      {
        type: 'value',
        name: '平均阅读量',
        position: 'right',
      },
    ],
    series: [
      {
        name: '总阅读量',
        type: 'line',
        smooth: true,
        data: views,
        itemStyle: {
          color: '#409eff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(64, 158, 255, 0.3)',
              },
              {
                offset: 1,
                color: 'rgba(64, 158, 255, 0.1)',
              },
            ],
          },
        },
      },
      {
        name: '文章数量',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: '#67c23a',
        },
      },
      {
        name: '平均阅读量',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: avgViews,
        itemStyle: {
          color: '#e6a23c',
        },
      },
    ],
  }

  chartInstance.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

// 加载最近文章
const loadRecentArticles = async () => {
  articlesLoading.value = true
  try {
    const response = await getArticles({
      page: 1,
      limit: 8,
      status: 'published',
    })
    recentArticles.value = response.articles || []
  } catch (error) {
    console.error('加载最近文章失败:', error)
  } finally {
    articlesLoading.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

onMounted(async () => {
  await loadStats()
  await loadRecentArticles()
  await loadChartData()
})
</script>

<style scoped lang="scss">
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 顶部统计区域 */
.top-stats-row {
  margin-bottom: 20px;
}

.stats-panel {
  border-radius: 12px;
}

.articles-panel {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border: none;
}

.articles-panel :deep(.el-card__body) {
  padding: 25px;
}

.action-panel {
  background: #ffffff;
  border: 1px solid #e4e7ed;
}

.action-panel :deep(.el-card__body) {
  padding: 25px;
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.panel-icon {
  font-size: 24px;
  color: #409eff;
}

.articles-panel .panel-icon {
  color: #ffffff;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.articles-panel .panel-title {
  color: #ffffff;
}

.more-btn {
  margin-left: auto;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.stat-card-item {
  flex: 1;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.value-icon {
  color: #67c23a;
  font-size: 28px;
}

.stat-uptime {
  font-size: 12px;
  color: #909399;
}

/* 操作面板 */
.action-content {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-action {
  text-align: center;
  color: #909399;
}

.warning-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 15px;
}

.no-action p {
  margin: 8px 0;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  width: 100%;
  justify-content: center;
}

.action-button {
  flex: 1;
  height: 50px;
  font-size: 16px;
}

.action-button .el-icon {
  margin-right: 8px;
}

/* 图表面板 */
.chart-panel {
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.chart-panel :deep(.el-card__body) {
  padding: 25px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-icon {
  font-size: 24px;
  color: #409eff;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.chart-content {
  min-height: 300px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.chart-legend {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.blue {
  background: #409eff;
}

.legend-dot.green {
  background: #67c23a;
}

.legend-dot.yellow {
  background: #e6a23c;
}

/* 最近文章面板 */
.recent-panel {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.recent-panel :deep(.el-card__body) {
  padding: 25px;
}

.articles-list {
  margin-top: 20px;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.article-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.article-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.article-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  gap: 10px;
}

.article-card-title {
  flex: 1;
  margin: 0;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-card-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
  flex-wrap: wrap;
}

.article-card-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-card-meta .el-icon {
  font-size: 14px;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }

  .stats-cards {
    flex-direction: column;
  }

  .stat-card-item {
    min-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
