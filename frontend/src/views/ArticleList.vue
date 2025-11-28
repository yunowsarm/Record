<template>
  <div class="article-list-page">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-main>
        <ArticleList />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import ArticleList from '../components/ArticleList.vue'
</script>

<style scoped>
.article-list-page {
  min-height: 100vh;
}
</style>

