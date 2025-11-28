<template>
  <div class="home">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-main>
        <Dashboard />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import Header from "../components/Header.vue";
import Dashboard from "../components/Dashboard.vue";
</script>

<style scoped>
.home {
  min-height: 100vh;
}
</style>
