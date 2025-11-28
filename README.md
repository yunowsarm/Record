# Vue3 + Node.js 博客系统

一个基于Vue3前端和Node.js后端的完整博客系统。

## 技术栈

### 前端
- Vue 3 (Composition API)
- Vue Router
- Pinia
- Element Plus
- Axios
- Vite

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT
- bcrypt
- express-validator
- multer

## 项目结构

```
Blog/
├── frontend/          # Vue3前端项目
├── backend/           # Node.js后端项目
└── package.json       # Monorepo配置
```

## 快速开始

### 安装依赖

```bash
npm run install:all
```

### 启动开发服务器

后端：
```bash
npm run dev:backend
```

前端：
```bash
npm run dev:frontend
```

### 环境配置

后端需要在 `backend/.env` 文件中配置：

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blog
JWT_SECRET=your-secret-key
```

## 功能特性

- 用户注册/登录
- 文章管理（CRUD）
- 分类和标签管理
- 评论系统
- 文章搜索
- Markdown编辑器
- 文件上传

