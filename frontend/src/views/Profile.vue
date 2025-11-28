<template>
  <div class="profile-page">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-main>
        <div class="profile">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="个人信息" name="info">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>个人中心</span>
                  </div>
                </template>
                <div class="profile-content">
                  <!-- 头像区域 -->
                  <div class="avatar-section">
                    <el-upload
                      class="avatar-uploader"
                      :action="uploadAvatarUrl"
                      :headers="uploadHeaders"
                      :show-file-list="false"
                      :on-success="handleAvatarSuccess"
                      :on-error="handleAvatarError"
                      :before-upload="beforeAvatarUpload"
                      name="avatar"
                    >
                      <el-avatar
                        v-if="form.avatar"
                        :src="form.avatar"
                        :size="120"
                        class="avatar"
                      />
                      <el-icon v-else class="avatar-uploader-icon">
                        <Plus />
                      </el-icon>
                    </el-upload>
                    <div class="avatar-tips">
                      <p>点击头像上传</p>
                      <p class="tips-small">
                        支持 JPG、PNG 格式，大小不超过 2MB
                      </p>
                    </div>
                  </div>

                  <el-form
                    :model="form"
                    label-width="100px"
                    style="max-width: 500px"
                  >
                    <el-form-item label="用户名">
                      <el-input v-model="form.username" disabled />
                    </el-form-item>
                    <el-form-item label="邮箱">
                      <el-input v-model="form.email" disabled />
                    </el-form-item>
                    <el-form-item label="角色">
                      <el-tag :type="form.role === 'admin' ? 'danger' : ''">
                        {{ form.role === "admin" ? "管理员" : "普通用户" }}
                      </el-tag>
                    </el-form-item>
                    <el-form-item label="个人简介">
                      <el-input
                        v-model="form.bio"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入个人简介"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button
                        type="primary"
                        @click="handleUpdate"
                        :loading="loading"
                      >
                        更新
                      </el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-card>
            </el-tab-pane>
            <el-tab-pane label="我的文章" name="articles">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>我的文章</span>
                    <el-button
                      type="primary"
                      @click="$router.push('/articles/edit')"
                    >
                      写文章
                    </el-button>
                  </div>
                </template>
                <div class="article-tabs">
                  <el-radio-group
                    v-model="articleStatus"
                    @change="loadMyArticles"
                  >
                    <el-radio-button label="published">已发布</el-radio-button>
                    <el-radio-button label="draft">草稿</el-radio-button>
                  </el-radio-group>
                </div>
                <div v-loading="articlesLoading" class="my-articles">
                  <el-card
                    v-for="article in myArticles"
                    :key="article._id"
                    class="article-item"
                    shadow="hover"
                  >
                    <div class="article-content">
                      <h3
                        @click="goToDetail(article._id)"
                        class="article-title"
                      >
                        {{ article.title }}
                      </h3>
                      <div class="article-meta">
                        <el-tag
                          :type="
                            article.status === 'published' ? 'success' : 'info'
                          "
                          size="small"
                        >
                          {{
                            article.status === "published" ? "已发布" : "草稿"
                          }}
                        </el-tag>
                        <span class="meta-item"
                          >分类：{{ article.category?.name || "未分类" }}</span
                        >
                        <span class="meta-item"
                          >创建时间：{{ formatDate(article.createdAt) }}</span
                        >
                        <span class="meta-item"
                          >阅读量：{{ article.views }}</span
                        >
                      </div>
                      <div class="article-summary">
                        {{
                          article.summary ||
                          article.content.substring(0, 100) + "..."
                        }}
                      </div>
                      <div class="article-actions">
                        <el-button size="small" @click="goToEdit(article._id)"
                          >编辑</el-button
                        >
                        <el-button
                          size="small"
                          type="danger"
                          @click="handleDelete(article._id)"
                        >
                          删除
                        </el-button>
                        <el-button
                          v-if="article.status === 'draft'"
                          size="small"
                          type="success"
                          @click="handlePublish(article._id)"
                        >
                          发布
                        </el-button>
                      </div>
                    </div>
                  </el-card>
                  <el-empty
                    v-if="!articlesLoading && myArticles.length === 0"
                    description="暂无文章"
                  />
                  <div
                    v-if="myArticles.length > 0"
                    class="pagination-container"
                  >
                    <el-pagination
                      v-model:current-page="currentPage"
                      v-model:page-size="pageSize"
                      :total="total"
                      :page-sizes="[10, 20, 50]"
                      layout="total, sizes, prev, pager, next, jumper"
                      @size-change="loadMyArticles"
                      @current-change="loadMyArticles"
                    />
                  </div>
                </div>
              </el-card>
            </el-tab-pane>
            <el-tab-pane label="数据统计" name="stats">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>阅读量统计</span>
                    <el-select
                      v-model="statsDays"
                      style="width: 120px"
                      @change="loadStats"
                    >
                      <el-option label="最近7天" :value="7" />
                      <el-option label="最近30天" :value="30" />
                      <el-option label="最近90天" :value="90" />
                    </el-select>
                  </div>
                </template>
                <div v-loading="statsLoading">
                  <div v-if="statsSummary" class="stats-summary">
                    <el-row :gutter="20">
                      <el-col :span="8">
                        <el-statistic
                          title="总阅读量"
                          :value="statsSummary.totalViews"
                        >
                          <template #suffix>
                            <span style="font-size: 14px">次</span>
                          </template>
                        </el-statistic>
                      </el-col>
                      <el-col :span="8">
                        <el-statistic
                          title="文章数量"
                          :value="statsSummary.totalArticles"
                        >
                          <template #suffix>
                            <span style="font-size: 14px">篇</span>
                          </template>
                        </el-statistic>
                      </el-col>
                      <el-col :span="8">
                        <el-statistic
                          title="平均阅读量"
                          :value="statsSummary.avgViews"
                        >
                          <template #suffix>
                            <span style="font-size: 14px">次/篇</span>
                          </template>
                        </el-statistic>
                      </el-col>
                    </el-row>
                  </div>
                  <div
                    v-if="chartData && chartData.length > 0"
                    ref="chartContainer"
                    class="chart-container"
                  ></div>
                  <el-empty
                    v-else-if="!statsLoading"
                    description="暂无统计数据"
                  />
                </div>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import Header from "../components/Header.vue";
import { getProfile, updateProfile } from "../api/auth";
import {
  getArticles,
  deleteArticle,
  updateArticle,
  getArticleStats,
} from "../api/article";
import { useUserStore } from "../stores/user";

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const activeTab = ref("info");
const articleStatus = ref("published");
const myArticles = ref([]);
const articlesLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const statsLoading = ref(false);
const statsDays = ref(30);
const statsSummary = ref(null);
const chartData = ref([]);
const chartContainer = ref(null);
let chartInstance = null;

const form = reactive({
  username: "",
  email: "",
  role: "",
  bio: "",
  avatar: "",
});

// 头像上传相关
const uploadAvatarUrl = computed(() => {
  return "/api/auth/upload-avatar";
});

const uploadHeaders = computed(() => {
  const token = userStore.token;
  return {
    Authorization: `Bearer ${token}`,
  };
});

const loadProfile = async () => {
  try {
    const data = await getProfile();
    form.username = data.username;
    form.email = data.email;
    form.role = data.role;
    form.bio = data.bio || "";
    form.avatar = data.avatar || "";
    userStore.user = data;
  } catch (error) {
    ElMessage.error("加载个人信息失败");
  }
};

const handleUpdate = async () => {
  loading.value = true;
  try {
    await updateProfile({ bio: form.bio, avatar: form.avatar });
    ElMessage.success("更新成功");
    await loadProfile();
  } catch (error) {
    ElMessage.error("更新失败");
  } finally {
    loading.value = false;
  }
};

// 头像上传成功
const handleAvatarSuccess = (response) => {
  if (response && response.url) {
    form.avatar = response.url;
    ElMessage.success("头像上传成功");
    // 自动保存
    handleUpdate();
  } else {
    ElMessage.error("头像上传失败");
  }
};

// 头像上传失败
const handleAvatarError = () => {
  ElMessage.error("头像上传失败，请重试");
};

// 头像上传前验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith("image/");
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error("只能上传图片文件！");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过 2MB！");
    return false;
  }
  return true;
};

const loadMyArticles = async () => {
  if (!userStore.user) {
    await loadProfile();
  }

  articlesLoading.value = true;
  try {
    const userId = userStore.user._id || userStore.user.id;
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: articleStatus.value,
      author: userId,
    };
    const response = await getArticles(params);
    myArticles.value = response.articles;
    total.value = response.pagination.total;
  } catch (error) {
    ElMessage.error("加载文章失败");
  } finally {
    articlesLoading.value = false;
  }
};

const handleTabChange = (tabName) => {
  if (tabName === "articles") {
    loadMyArticles();
  } else if (tabName === "stats") {
    loadStats();
  }
};

const loadStats = async () => {
  if (!userStore.user) {
    await loadProfile();
  }

  statsLoading.value = true;
  try {
    const response = await getArticleStats({ days: statsDays.value });
    statsSummary.value = response.summary;
    chartData.value = response.stats;

    await nextTick();
    if (chartContainer.value && chartData.value.length > 0) {
      renderChart();
    }
  } catch (error) {
    ElMessage.error("加载统计数据失败");
  } finally {
    statsLoading.value = false;
  }
};

const renderChart = () => {
  if (!chartContainer.value) return;

  // 销毁旧图表
  if (chartInstance) {
    chartInstance.dispose();
  }

  // 创建新图表
  chartInstance = echarts.init(chartContainer.value);

  // 准备数据
  const dates = chartData.value.map((item) => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const views = chartData.value.map((item) => item.views);

  // 配置选项
  const option = {
    title: {
      text: "阅读量趋势",
      left: "center",
      textStyle: {
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      name: "阅读量",
    },
    series: [
      {
        name: "阅读量",
        type: "line",
        smooth: true,
        data: views,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(64, 158, 255, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(64, 158, 255, 0.1)",
              },
            ],
          },
        },
        itemStyle: {
          color: "#409eff",
        },
        lineStyle: {
          color: "#409eff",
          width: 2,
        },
      },
    ],
  };

  chartInstance.setOption(option);

  // 响应式调整
  window.addEventListener("resize", () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
};

// 监听窗口大小变化
watch(
  () => activeTab.value,
  (newVal) => {
    if (newVal === "stats" && chartInstance) {
      nextTick(() => {
        chartInstance.resize();
      });
    }
  }
);

const formatDate = (date) => {
  return new Date(date).toLocaleString("zh-CN");
};

const goToDetail = (id) => {
  router.push(`/articles/${id}`);
};

const goToEdit = (id) => {
  router.push(`/articles/edit/${id}`);
};

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm("确定要删除这篇文章吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteArticle(id);
    ElMessage.success("删除成功");
    loadMyArticles();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handlePublish = async (id) => {
  try {
    await ElMessageBox.confirm("确定要发布这篇文章吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "info",
    });
    // 获取当前文章信息
    const article = myArticles.value.find((a) => a._id === id);
    if (!article) {
      ElMessage.error("文章不存在");
      return;
    }
    // 更新状态为已发布
    await updateArticle(id, {
      title: article.title,
      content: article.content,
      summary: article.summary || "",
      category: article.category?._id || "",
      tags: article.tags?.map((t) => t._id) || [],
      status: "published",
    });
    ElMessage.success("发布成功");
    loadMyArticles();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("发布失败");
    }
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 0 45%;
  margin-top: 20px;
}

.profile-content .el-form {
  flex: 0 0 55%;
  max-width: none;
}

.avatar-uploader {
  margin-bottom: 15px;
}

.avatar-uploader :deep(.el-upload) {
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 120px;
  height: 120px;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.avatar {
  display: block;
  width: 120px;
  height: 120px;
}

.avatar-uploader-icon {
  font-size: 48px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar-tips {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.avatar-tips p {
  margin: 5px 0;
}

.tips-small {
  font-size: 12px;
  color: #c0c4cc;
}

.article-tabs {
  margin-bottom: 20px;
}

.my-articles {
  min-height: 200px;
}

.article-item {
  margin-bottom: 20px;
}

.article-content {
  padding: 10px;
}

.article-title {
  margin: 0 0 10px 0;
  cursor: pointer;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.article-title:hover {
  color: #409eff;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  margin-left: 5px;
}

.article-summary {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
  font-size: 14px;
}

.article-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.stats-summary {
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.chart-container {
  width: 100%;
  height: 400px;
  margin-top: 20px;
}

.profile-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
}

.avatar-uploader {
  margin-bottom: 15px;
}

.avatar-uploader :deep(.el-upload) {
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 120px;
  height: 120px;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.avatar {
  display: block;
  width: 120px;
  height: 120px;
}

.avatar-uploader-icon {
  font-size: 48px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar-tips {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.avatar-tips p {
  margin: 5px 0;
}

.tips-small {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
