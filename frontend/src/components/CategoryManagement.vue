<template>
  <div class="category-management">
    <el-button type="primary" @click="handleAdd" style="margin-bottom: 20px">
      添加分类
    </el-button>
    <el-table :data="categories" style="width: 100%">
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="createdAt" label="创建时间">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row._id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/category";

const categories = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref("添加分类");
const loading = ref(false);
const formRef = ref(null);
const editingId = ref(null);

const form = reactive({
  name: "",
  description: "",
});

const rules = {
  name: [{ required: true, message: "请输入分类名称", trigger: "blur" }],
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("zh-CN");
};

const loadCategories = async () => {
  try {
    const data = await getCategories();
    categories.value = data;
  } catch (error) {
    ElMessage.error("加载分类失败");
  }
};

const handleAdd = () => {
  editingId.value = null;
  dialogTitle.value = "添加分类";
  form.name = "";
  form.description = "";
  dialogVisible.value = true;
};

const handleEdit = (category) => {
  editingId.value = category._id;
  dialogTitle.value = "编辑分类";
  form.name = category.name;
  form.description = category.description || "";
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        if (editingId.value) {
          await updateCategory(editingId.value, form);
          ElMessage.success("更新成功");
        } else {
          await createCategory(form);
          ElMessage.success("添加成功");
        }
        dialogVisible.value = false;
        loadCategories();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "操作失败");
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm("确定要删除这个分类吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteCategory(id);
    ElMessage.success("删除成功");
    loadCategories();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style lang="scss" scoped>
.category-management {
  margin-top: 20px;
}
</style>
