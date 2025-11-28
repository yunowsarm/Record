<template>
  <div class="comment-management">
    <el-table :data="comments" style="width: 100%">
      <el-table-column prop="user.username" label="用户" />
      <el-table-column prop="content" label="内容" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button
            v-if="row.status !== 'approved'"
            size="small"
            type="success"
            @click="handleUpdateStatus(row._id, 'approved')"
          >
            通过
          </el-button>
          <el-button
            v-if="row.status !== 'rejected'"
            size="small"
            type="warning"
            @click="handleUpdateStatus(row._id, 'rejected')"
          >
            拒绝
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(row._id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getComments, updateCommentStatus, deleteComment } from '../api/comment'

const comments = ref([])

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const loadComments = async () => {
  try {
    const data = await getComments()
    comments.value = data
  } catch (error) {
    ElMessage.error('加载评论失败')
  }
}

const handleUpdateStatus = async (id, status) => {
  try {
    await updateCommentStatus(id, status)
    ElMessage.success('更新成功')
    loadComments()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteComment(id)
    ElMessage.success('删除成功')
    loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadComments()
})
</script>

