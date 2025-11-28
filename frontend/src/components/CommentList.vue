<template>
  <div class="comment-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>评论 ({{ comments.length }})</span>
        </div>
      </template>
      <div v-if="userStore.isLoggedIn" class="comment-form">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
        />
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          style="margin-top: 10px"
        >
          发表评论
        </el-button>
      </div>
      <div v-else class="login-tip">
        <el-link type="primary" @click="$router.push('/login')"
          >登录后即可评论</el-link
        >
      </div>
      <div class="comments">
        <div
          v-for="comment in comments"
          :key="comment._id"
          class="comment-item"
        >
          <div class="comment-header">
            <el-avatar :size="40" :src="comment.user?.avatar">
              {{ comment.user?.username?.charAt(0) }}
            </el-avatar>
            <div class="comment-info">
              <span class="comment-author">{{ comment.user?.username }}</span>
              <span class="comment-time">{{
                formatDate(comment.createdAt)
              }}</span>
            </div>
            <div class="comment-actions">
              <el-button
                v-if="userStore.isLoggedIn"
                size="small"
                text
                @click="handleReply(comment)"
              >
                回复
              </el-button>
              <el-button
                v-if="canDelete(comment)"
                type="danger"
                size="small"
                text
                @click="handleDelete(comment._id)"
              >
                删除
              </el-button>
            </div>
          </div>
          <div v-if="comment.parentComment" class="comment-reply-to">
            回复
            <span class="reply-user"
              >@{{ comment.parentComment.user?.username }}</span
            >
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div v-if="replyingTo === comment._id" class="reply-form">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              placeholder="写下你的回复..."
            />
            <div class="reply-actions">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button
                size="small"
                type="primary"
                @click="handleReplySubmit(comment._id)"
              >
                回复
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="comments.length === 0" description="暂无评论" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getComments, createComment, deleteComment } from "../api/comment";
import { useUserStore } from "../stores/user";

const props = defineProps({
  articleId: {
    type: String,
    required: true,
  },
});

const userStore = useUserStore();
const comments = ref([]);
const commentContent = ref("");
const submitting = ref(false);
const replyingTo = ref(null);
const replyContent = ref("");

const formatDate = (date) => {
  return new Date(date).toLocaleString("zh-CN");
};

const canDelete = (comment) => {
  if (!userStore.isLoggedIn) return false;
  return comment.user._id === userStore.user.id || userStore.isAdmin;
};

const loadComments = async () => {
  try {
    const data = await getComments({ articleId: props.articleId });
    comments.value = data;
  } catch (error) {
    console.error("加载评论失败:", error);
  }
};

const handleSubmit = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning("请输入评论内容");
    return;
  }
  submitting.value = true;
  try {
    await createComment({
      article: props.articleId,
      content: commentContent.value,
    });
    ElMessage.success("评论成功");
    commentContent.value = "";
    loadComments();
  } catch (error) {
    ElMessage.error("评论失败");
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm("确定要删除这条评论吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteComment(id);
    ElMessage.success("删除成功");
    loadComments();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleReply = (comment) => {
  replyingTo.value = comment._id;
  replyContent.value = "";
};

const cancelReply = () => {
  replyingTo.value = null;
  replyContent.value = "";
};

const handleReplySubmit = async (parentId) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning("请输入回复内容");
    return;
  }
  submitting.value = true;
  try {
    await createComment({
      article: props.articleId,
      content: replyContent.value,
      parentComment: parentId,
    });
    ElMessage.success("回复成功");
    replyContent.value = "";
    replyingTo.value = null;
    loadComments();
  } catch (error) {
    ElMessage.error("回复失败");
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadComments();
});
</script>

<style lang="scss" scoped>
.comment-list {
  margin-top: 20px;
}

.comment-form {
  margin-bottom: 20px;
}

.login-tip {
  text-align: center;
  padding: 20px;
  margin-bottom: 20px;
}

.comments {
  margin-top: 20px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comment-author {
  font-weight: bold;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
  margin-left: 50px;
  margin-top: 10px;
}

.comment-reply-to {
  margin-left: 50px;
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.reply-user {
  color: #409eff;
  font-weight: 500;
}

.reply-form {
  margin-left: 50px;
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.reply-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
