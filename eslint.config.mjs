// /* global process */
// import js from "@eslint/js";
// import vue from "eslint-plugin-vue";
// import globals from "globals";

// export default [
//   // 忽略文件
//   {
//     ignores: [
//       "node_modules/**",
//       "dist/**",
//       "build/**",
//       "*.min.js",
//       "frontend/uploads/**",
//     ],
//   },
//   // 基础配置
//   js.configs.recommended,
//   // Vue 文件配置（前端）
//   ...vue.configs["flat/recommended"],
//   {
//     files: ["frontend/**/*.{js,vue}"],
//     languageOptions: {
//       ecmaVersion: 2021,
//       sourceType: "module",
//       globals: {
//         ...globals.browser,
//         ...globals.node,
//         process: "readonly",
//       },
//       parserOptions: {
//         ecmaVersion: 2021,
//         sourceType: "module",
//       },
//     },
//     plugins: {
//       vue,
//     },
//     rules: {
//       // 未使用变量检查
//       "no-unused-vars": [
//         "error",
//         {
//           argsIgnorePattern: "^_",
//           varsIgnorePattern: "^_",
//           caughtErrorsIgnorePattern: "^_",
//         },
//       ],
//       "vue/no-unused-vars": [
//         "error",
//         {
//           ignorePattern: "^_",
//         },
//       ],
//       "vue/no-unused-components": "warn",
//       "vue/no-unused-refs": "warn",

//       // 其他规则
//       // 根据环境变量设置规则（开发环境允许 console 和 debugger）
//       "no-console": process?.env?.NODE_ENV === "production" ? "warn" : "off",
//       "no-debugger": process?.env?.NODE_ENV === "production" ? "warn" : "off",
//       "vue/multi-word-component-names": "off",
//       "vue/no-v-html": "off",
//       "vue/html-self-closing": [
//         "error",
//         {
//           html: {
//             void: "always",
//             normal: "never",
//             component: "always",
//           },
//           svg: "always",
//           math: "always",
//         },
//       ],
//     },
//   },
//   // Node.js 文件配置（后端）
//   {
//     files: ["backend/**/*.js"],
//     languageOptions: {
//       ecmaVersion: 2021,
//       sourceType: "module",
//       globals: {
//         ...globals.node,
//       },
//     },
//     rules: {
//       "no-console": "off",
//       "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
//     },
//   },
// ];
