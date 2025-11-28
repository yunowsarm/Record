<template>
  <div class="tag-management">
    <el-button type="primary" @click="handleAdd" style="margin-bottom: 20px">
      添加标签
    </el-button>
    <el-table :data="tags" style="width: 100%">
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="createdAt" label="创建时间">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row._id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="添加标签" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTags, createTag, deleteTag } from '../api/tag'

const tags = ref([])
const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  name: ''
})

const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const loadTags = async () => {
  try {
    const data = await getTags()
    tags.value = data
  } catch (error) {
    ElMessage.error('加载标签失败')
  }
}

const handleAdd = () => {
  form.name = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await createTag(form)
        ElMessage.success('添加成功')
        dialogVisible.value = false
        loadTags()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个标签吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteTag(id)
    ElMessage.success('删除成功')
    loadTags()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadTags()
})
</script>

