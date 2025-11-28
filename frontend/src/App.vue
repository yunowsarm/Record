<template>
  <router-view />
</template>

<script setup></script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  /* 隐藏滚动条但保持滚动功能 */
  overflow-x: hidden;
}

/* 隐藏 body 滚动条 - 兼容所有浏览器 */
body::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

body {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

/* 隐藏 html 滚动条（某些情况下也需要） */
html::-webkit-scrollbar {
  display: none;
}

html {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
