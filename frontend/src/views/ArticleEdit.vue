<template>
  <div class="article-edit-page">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-main>
        <div class="article-edit">
          <el-card>
            <el-form
              :model="form"
              :rules="rules"
              ref="formRef"
              label-width="80px"
            >
              <el-form-item label="标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入文章标题" />
              </el-form-item>
              <el-form-item label="摘要" prop="summary">
                <el-input
                  v-model="form.summary"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入文章摘要"
                />
              </el-form-item>
              <el-form-item label="分类" prop="category">
                <el-select
                  v-model="form.category"
                  placeholder="请选择分类"
                  clearable
                >
                  <el-option
                    v-for="category in categories"
                    :key="category._id"
                    :label="category.name"
                    :value="category._id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="标签" prop="tags">
                <el-select
                  v-model="form.tags"
                  multiple
                  filterable
                  placeholder="选择标签"
                  style="width: 100%"
                >
                  <el-option
                    v-for="tag in tags"
                    :key="tag._id"
                    :label="tag.name"
                    :value="tag._id"
                  />
                </el-select>
              </el-form-item>
              <!-- <el-form-item label="封面" prop="coverImage">
                <el-upload
                  class="cover-uploader"
                  :show-file-list="false"
                  :before-upload="handleCoverUpload"
                  accept="image/*"
                >
                  <img
                    v-if="coverImageUrl"
                    :src="coverImageUrl"
                    class="cover-image"
                  />
                  <el-icon v-else class="cover-uploader-icon"><plus /></el-icon>
                </el-upload>
              </el-form-item> -->
              <el-form-item label="内容" prop="content">
                <div class="content-editor">
                  <div class="editor-toolbar">
                    <el-button-group>
                      <el-button size="small" @click="openCodeEditor">
                        <el-icon><DocumentCopy /></el-icon>
                        <span style="margin-left: 5px">插入代码块</span>
                      </el-button>
                      <el-button size="small" @click="insertInlineCode">
                        <el-icon><Document /></el-icon>
                        <span style="margin-left: 5px">行内代码</span>
                      </el-button>
                    </el-button-group>
                    <el-text type="info" size="small" style="margin-left: 10px">
                      提示：可直接粘贴图片，支持 Markdown 语法
                    </el-text>
                  </div>
                  <div
                    ref="editorRef"
                    contenteditable="true"
                    class="content-editable"
                    :placeholder="'请输入文章内容（支持Markdown语法，可直接粘贴图片）'"
                    @paste="handlePaste"
                    @input="handleEditorInput"
                    @blur="handleEditorBlur"
                  ></div>
                </div>
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="form.status">
                  <el-radio label="draft">草稿</el-radio>
                  <el-radio label="published">发布</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  @click="handleSubmit"
                  :loading="loading"
                >
                  {{ articleId ? "更新" : "发布" }}
                </el-button>
                <el-button @click="$router.back()">取消</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-main>
    </el-container>

    <!-- 代码编辑器对话框 -->
    <el-dialog
      v-model="codeEditorVisible"
      title="插入代码块"
      width="900px"
      :close-on-click-modal="false"
      @closed="handleCodeEditorClosed"
    >
      <el-form :model="codeEditorForm" label-width="80px">
        <el-form-item label="语言">
          <el-select
            v-model="codeEditorForm.language"
            filterable
            style="width: 200px"
            placeholder="选择编程语言"
          >
            <el-option
              v-for="lang in codeLanguages"
              :key="lang.value"
              :label="lang.label"
              :value="lang.value"
            />
          </el-select>
          <el-button
            type="primary"
            size="small"
            style="margin-left: 10px"
            @click="formatCodeInEditor"
            :disabled="!codeEditorForm.code.trim()"
          >
            格式化代码
          </el-button>
          <el-button
            size="small"
            style="margin-left: 10px"
            @click="clearCodeEditor"
          >
            清空
          </el-button>
        </el-form-item>
        <el-form-item label="代码">
          <el-input
            v-model="codeEditorForm.code"
            type="textarea"
            :rows="20"
            placeholder="在此输入或粘贴代码，支持自动格式化..."
            class="code-editor-textarea"
            @paste="handleCodePaste"
          />
          <div class="code-tips">
            <el-text type="info" size="small">
              提示：粘贴代码后会自动尝试识别语言，也可以手动选择语言并格式化
            </el-text>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="codeEditorVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="insertCodeFromEditor"
            :disabled="!codeEditorForm.code.trim()"
          >
            插入代码
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { DocumentCopy, Document } from "@element-plus/icons-vue";
import { js_beautify } from "js-beautify";
import { marked } from "marked";
import TurndownService from "turndown";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import Header from "../components/Header.vue";
import { getArticle, createArticle, updateArticle } from "../api/article";
import { getCategories } from "../api/category";
import { getTags } from "../api/tag";
import { useUserStore } from "../stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const articleId = route.params.id;
const formRef = ref(null);
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);
const coverImageUrl = ref("");
const coverImageFile = ref(null);
const codeEditorVisible = ref(false);
const editorRef = ref(null);
const isUpdatingEditor = ref(false); // 防止循环更新
const codeEditorForm = reactive({
  language: "javascript",
  code: "",
  cursorPosition: null, // 改为保存 Selection 对象
});

// 配置 marked 支持代码高亮
marked.setOptions({
  highlight: function (code, lang) {
    const language = lang || "plaintext";
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        return hljs.highlightAuto(code).value;
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// 初始化 Turndown 服务
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// 配置 Turndown 处理图片
turndownService.addRule("image", {
  filter: "img",
  replacement: function (content, node) {
    const alt = node.getAttribute("alt") || "";
    const src = node.getAttribute("src") || "";
    return `![${alt}](${src})`;
  },
});

// 图片上传相关
const uploadImageUrl = computed(() => {
  return "/api/articles/upload-image";
});

const uploadHeaders = computed(() => {
  const token = userStore.token;
  return {
    Authorization: `Bearer ${token}`,
  };
});

// Markdown 转 HTML（用于显示在编辑器中）
const markdownToHtml = (markdown) => {
  if (!markdown) return "";
  try {
    let html = marked(markdown);

    // 后处理：为所有图片添加统一的样式
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const images = tempDiv.querySelectorAll("img");
    images.forEach((img) => {
      // 如果图片还没有内联样式，添加样式
      if (!img.style.maxWidth) {
        img.style.maxWidth = "820px";
        img.style.height = "auto";
        img.style.borderRadius = "4px";
        img.style.margin = "15px auto";
        img.style.display = "block";
      }
    });

    return tempDiv.innerHTML;
  } catch (error) {
    console.error("Markdown 转换错误:", error);
    return markdown.replace(/\n/g, "<br>");
  }
};

// HTML 转 Markdown（用于保存）
const htmlToMarkdown = (html) => {
  if (!html) return "";
  try {
    // 清理编辑器中的占位符和特殊标记
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    // 移除上传中的占位符
    const uploadingImages = tempDiv.querySelectorAll(".uploading-image");
    uploadingImages.forEach((img) => img.remove());
    return turndownService.turndown(tempDiv.innerHTML);
  } catch (error) {
    console.error("HTML 转换错误:", error);
    return html;
  }
};

// 恢复光标位置
const restoreSelection = (range) => {
  if (!range || !editorRef.value) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  try {
    selection.addRange(range);
  } catch (error) {
    console.error("恢复光标位置失败:", error);
  }
};

// 编辑器输入处理
const handleEditorInput = () => {
  if (isUpdatingEditor.value) return;
  if (!editorRef.value) return;

  const html = editorRef.value.innerHTML;
  const markdown = htmlToMarkdown(html);
  form.content = markdown;
};

// 编辑器失焦处理
const handleEditorBlur = () => {
  if (!editorRef.value) return;
  const html = editorRef.value.innerHTML;
  const markdown = htmlToMarkdown(html);
  form.content = markdown;
};

// 处理粘贴事件
const handlePaste = async (event) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  // 检查是否有图片
  let hasImage = false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf("image") !== -1) {
      hasImage = true;
      event.preventDefault();

      const file = item.getAsFile();
      if (!file) continue;

      // 验证文件
      if (!beforeImageUpload(file)) {
        return;
      }

      // 显示上传中的占位符
      const localUrl = URL.createObjectURL(file);
      const placeholderId = `uploading-${Date.now()}`;
      const placeholderHtml = `<img src="${localUrl}" class="uploading-image" data-id="${placeholderId}" style="max-width: 820px; height: auto; border: 2px dashed #409eff; padding: 10px; border-radius: 4px; background: #f5f7fa; margin: 15px auto; display: block;" alt="上传中..." />`;

      insertHtmlAtCursor(placeholderHtml);

      // 上传图片
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(uploadImageUrl.value, {
          method: "POST",
          headers: uploadHeaders.value,
          body: formData,
        });

        const result = await response.json();

        if (result && result.url) {
          // 替换占位符为实际图片
          await nextTick();
          const placeholder = editorRef.value?.querySelector(
            `[data-id="${placeholderId}"]`
          );
          if (placeholder) {
            const img = document.createElement("img");
            img.src = result.url;
            img.style.maxWidth = "820px";
            img.style.height = "auto";
            img.style.borderRadius = "4px";
            img.style.margin = "15px auto";
            img.style.display = "block";
            placeholder.replaceWith(img);

            // 更新 form.content
            const html = editorRef.value.innerHTML;
            form.content = htmlToMarkdown(html);
          }
          ElMessage.success("图片上传成功");
        } else {
          throw new Error("上传失败");
        }
      } catch (error) {
        // 移除失败的占位符
        const placeholder = editorRef.value?.querySelector(
          `[data-id="${placeholderId}"]`
        );
        if (placeholder) {
          placeholder.remove();
        }
        ElMessage.error("图片上传失败，请重试");
      } finally {
        URL.revokeObjectURL(localUrl);
      }
      break;
    }
  }

  // 如果没有图片，允许默认粘贴行为
  if (!hasImage) {
    // 延迟处理，让浏览器先完成默认粘贴
    setTimeout(() => {
      if (editorRef.value) {
        const html = editorRef.value.innerHTML;
        form.content = htmlToMarkdown(html);
      }
    }, 0);
  }
};

// 在光标位置插入 HTML
const insertHtmlAtCursor = (html, addNewLine = false) => {
  if (!editorRef.value) return;

  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    // 如果没有选中，在末尾插入
    editorRef.value.focus();
    const range = document.createRange();
    range.selectNodeContents(editorRef.value);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // 在移动节点之前检测是否包含图片或代码块（块级元素）
  const isImage = tempDiv.querySelector("img") !== null;
  const isCodeBlock = tempDiv.querySelector("pre") !== null;

  const fragment = document.createDocumentFragment();

  // 保存最后一个节点，用于后续设置光标位置
  let lastNode = null;
  while (tempDiv.firstChild) {
    const node = tempDiv.firstChild;
    fragment.appendChild(node);
    lastNode = node; // 保存最后一个节点
  }

  // 如果 fragment 为空，直接返回
  if (!lastNode) return;

  // 插入节点
  range.insertNode(fragment);

  // 如果插入的是图片、代码块或需要添加换行，在插入内容后添加换行
  if (isImage || isCodeBlock || addNewLine) {
    // 等待 DOM 更新，确保 lastNode 已经在 DOM 中
    const br = document.createElement("br");
    // 在 lastNode 之后插入 br
    if (lastNode && lastNode.parentNode) {
      // 使用 insertBefore，将 br 插入到 lastNode 的下一个兄弟节点之前（即 lastNode 之后）
      if (lastNode.nextSibling) {
        lastNode.parentNode.insertBefore(br, lastNode.nextSibling);
      } else {
        // 如果没有下一个兄弟节点，直接追加到父节点
        lastNode.parentNode.appendChild(br);
      }
      lastNode = br; // 更新 lastNode 为 br，这样光标会定位到 br 之后
    } else {
      // 如果 lastNode 没有 parent（不应该发生），在 range 的结束位置插入
      range.setStartAfter(lastNode);
      range.collapse(false);
      range.insertNode(br);
      lastNode = br;
    }
  }

  // 移动光标到插入内容之后（或换行之后）
  // 使用插入后的 lastNode（它现在已经在 DOM 中）
  if (lastNode && lastNode.parentNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // 如果 lastNode 没有 parent（不应该发生），使用 range 的 endContainer
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  editorRef.value.focus();
};

// 支持的编程语言列表
const codeLanguages = [
  { label: "纯文本", value: "plaintext" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "Vue", value: "vue" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "C", value: "c" },
  { label: "C#", value: "csharp" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "PHP", value: "php" },
  { label: "Ruby", value: "ruby" },
  { label: "Swift", value: "swift" },
  { label: "Kotlin", value: "kotlin" },
  { label: "SQL", value: "sql" },
  { label: "JSON", value: "json" },
  { label: "XML", value: "xml" },
  { label: "YAML", value: "yaml" },
  { label: "Markdown", value: "markdown" },
  { label: "Shell", value: "shell" },
  { label: "Bash", value: "bash" },
  { label: "Dockerfile", value: "dockerfile" },
];

const form = reactive({
  title: "",
  summary: "",
  content: "",
  category: "",
  tags: [],
  status: "draft",
});

const rules = {
  title: [{ required: true, message: "请输入文章标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入文章内容", trigger: "blur" }],
};

const loadCategories = async () => {
  try {
    const data = await getCategories();
    categories.value = data;
  } catch (error) {
    console.error("加载分类失败:", error);
  }
};

const loadTags = async () => {
  try {
    const data = await getTags();
    tags.value = data;
  } catch (error) {
    console.error("加载标签失败:", error);
  }
};

const loadArticle = async () => {
  if (!articleId) return;
  try {
    const data = await getArticle(articleId);
    form.title = data.title;
    form.summary = data.summary || "";
    form.content = data.content;
    form.category = data.category?._id || "";
    form.tags = data.tags?.map((t) => t._id) || [];
    form.status = data.status;
    if (data.coverImage) {
      coverImageUrl.value = data.coverImage;
    }

    // 将 Markdown 转换为 HTML 显示在编辑器中
    await nextTick();
    if (editorRef.value && form.content) {
      isUpdatingEditor.value = true;
      editorRef.value.innerHTML = markdownToHtml(form.content);
      isUpdatingEditor.value = false;
    }
  } catch (error) {
    ElMessage.error("加载文章失败");
    router.push("/articles");
  }
};

// 打开代码编辑器
const openCodeEditor = () => {
  if (!editorRef.value) return;

  const selection = window.getSelection();
  let selectedText = "";

  if (selection.rangeCount > 0) {
    selectedText = selection.toString();
    // 保存光标位置
    codeEditorForm.cursorPosition = selection.getRangeAt(0).cloneRange();
  }

  // 如果有选中的文本，填充到编辑器
  if (selectedText && selectedText.trim()) {
    codeEditorForm.code = selectedText.trim();
    // 尝试自动识别语言
    const detectedLang = detectLanguage(selectedText);
    if (detectedLang) {
      codeEditorForm.language = detectedLang;
    }
  } else {
    // 使用默认语言和占位符
    codeEditorForm.language = "javascript";
    codeEditorForm.code = getCodePlaceholder("javascript");
    codeEditorForm.cursorPosition = null;
  }

  codeEditorVisible.value = true;
};

// 从编辑器插入代码
const insertCodeFromEditor = () => {
  if (!codeEditorForm.code.trim()) {
    ElMessage.warning("请输入代码");
    return;
  }

  if (!editorRef.value) return;

  const language = codeEditorForm.language || "plaintext";
  const code = codeEditorForm.code.trim();

  // 恢复光标位置
  if (codeEditorForm.cursorPosition) {
    restoreSelection(codeEditorForm.cursorPosition);
  } else {
    // 如果没有保存的位置，在末尾插入
    editorRef.value.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editorRef.value);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // 创建代码块 HTML（使用 pre 和 code 标签，保持格式）
  const codeBlockHtml = `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;

  insertHtmlAtCursor(codeBlockHtml);

  codeEditorVisible.value = false;
  ElMessage.success("代码已插入");

  // 更新 form.content
  nextTick(() => {
    if (editorRef.value) {
      const html = editorRef.value.innerHTML;
      form.content = htmlToMarkdown(html);
    }
  });
};

// HTML 转义
const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// 格式化编辑器中的代码
const formatCodeInEditor = () => {
  if (!codeEditorForm.code.trim()) {
    ElMessage.warning("请先输入代码");
    return;
  }

  try {
    const formatted = formatCode(codeEditorForm.code, codeEditorForm.language);
    codeEditorForm.code = formatted;
    ElMessage.success("代码已格式化");
  } catch (error) {
    ElMessage.warning("格式化失败，请检查代码语法");
  }
};

// 格式化代码
const formatCode = (code, language) => {
  if (!code || !code.trim()) return code;

  try {
    switch (language) {
      case "javascript":
      case "typescript":
      case "jsx":
      case "tsx":
        return js_beautify.js(code, {
          indent_size: 2,
          space_in_empty_paren: true,
          preserve_newlines: true,
          max_preserve_newlines: 2,
        });
      case "html":
      case "vue":
        return js_beautify.html(code, { indent_size: 2 });
      case "css":
      case "scss":
      case "less":
        return js_beautify.css(code, {
          indent_size: 2,
        });
      case "json":
        return JSON.stringify(JSON.parse(code), null, 2);
      case "xml":
        return js_beautify.html(code, {
          indent_size: 2,
        });
      default:
        // 对于其他语言，尝试使用 JavaScript 格式化
        try {
          return js_beautify.js(code, {
            indent_size: 2,
            preserve_newlines: true,
          });
        } catch {
          return code;
        }
    }
  } catch (error) {
    console.warn("代码格式化失败:", error);
    return code;
  }
};

// 自动检测语言
const detectLanguage = (code) => {
  const trimmedCode = code.trim();
  if (!trimmedCode) return null;

  // 检测 JSON
  if (
    (trimmedCode.startsWith("{") && trimmedCode.endsWith("}")) ||
    (trimmedCode.startsWith("[") && trimmedCode.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmedCode);
      return "json";
    } catch {}
  }

  // 检测 HTML/XML
  if (
    trimmedCode.startsWith("<") &&
    (trimmedCode.includes("</") || trimmedCode.includes("/>"))
  ) {
    if (trimmedCode.includes("<script") || trimmedCode.includes("<!DOCTYPE")) {
      return "html";
    }
    return "xml";
  }

  // 检测 SQL
  const sqlKeywords = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
  ];
  if (
    sqlKeywords.some((keyword) => trimmedCode.toUpperCase().startsWith(keyword))
  ) {
    return "sql";
  }

  // 检测 CSS
  if (
    trimmedCode.includes("{") &&
    trimmedCode.includes("}") &&
    trimmedCode.includes(":")
  ) {
    if (!trimmedCode.includes("<") && !trimmedCode.includes("function")) {
      return "css";
    }
  }

  // 检测 Python
  if (
    trimmedCode.includes("def ") ||
    trimmedCode.includes("import ") ||
    trimmedCode.includes("from ") ||
    trimmedCode.includes("print(")
  ) {
    return "python";
  }

  // 检测 Shell/Bash
  if (
    trimmedCode.startsWith("#!") ||
    trimmedCode.includes("#!/bin/") ||
    trimmedCode.includes("echo ") ||
    trimmedCode.includes("$")
  ) {
    return "bash";
  }

  return null; // 无法检测，返回 null
};

// 处理粘贴事件
const handleCodePaste = (event) => {
  // 延迟检测，等待粘贴内容完成
  setTimeout(() => {
    if (codeEditorForm.code && !codeEditorForm.language) {
      const detectedLang = detectLanguage(codeEditorForm.code);
      if (detectedLang) {
        codeEditorForm.language = detectedLang;
        ElMessage.info(
          `已自动识别为 ${codeLanguages.find((l) => l.value === detectedLang)?.label || detectedLang}`
        );
      }
    }
  }, 100);
};

// 清空代码编辑器
const clearCodeEditor = () => {
  codeEditorForm.code = "";
  codeEditorForm.language = "javascript";
};

// 代码编辑器关闭后的处理
const handleCodeEditorClosed = () => {
  // 可以在这里添加清理逻辑
};

// 图片上传成功
const handleImageSuccess = (response) => {
  if (response && response.url) {
    // 插入 Markdown 图片语法到当前光标位置
    insertImage(response.url);
    ElMessage.success("图片上传成功");
  } else {
    ElMessage.error("图片上传失败");
  }
};

// 图片上传失败
const handleImageError = () => {
  ElMessage.error("图片上传失败，请重试");
};

// 图片上传前验证
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith("image/");
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error("只能上传图片文件！");
    return false;
  }
  if (!isLt5M) {
    ElMessage.error("图片大小不能超过 5MB！");
    return false;
  }
  return true;
};

// 插入图片到编辑器
const insertImage = (imageUrl) => {
  if (!editorRef.value) return;

  // 创建图片元素
  const img = document.createElement("img");
  img.src = imageUrl;
  img.style.maxWidth = "820px";
  img.style.height = "auto";
  img.style.borderRadius = "4px";
  img.style.margin = "15px auto";
  img.style.display = "block";
  img.alt = "图片";

  // 插入到光标位置
  insertHtmlAtCursor(img.outerHTML);

  // 更新 form.content
  nextTick(() => {
    if (editorRef.value) {
      const html = editorRef.value.innerHTML;
      form.content = htmlToMarkdown(html);
    }
  });
};

// 根据语言获取代码占位符
const getCodePlaceholder = (language) => {
  const placeholders = {
    javascript: "// 在这里粘贴你的代码",
    typescript: "// 在这里粘贴你的代码",
    python: "# 在这里粘贴你的代码",
    java: "// 在这里粘贴你的代码",
    cpp: "// 在这里粘贴你的代码",
    c: "// 在这里粘贴你的代码",
    csharp: "// 在这里粘贴你的代码",
    go: "// 在这里粘贴你的代码",
    rust: "// 在这里粘贴你的代码",
    php: "// 在这里粘贴你的代码",
    ruby: "# 在这里粘贴你的代码",
    swift: "// 在这里粘贴你的代码",
    kotlin: "// 在这里粘贴你的代码",
    sql: "-- 在这里粘贴你的SQL代码",
    html: "<!-- 在这里粘贴你的HTML代码 -->",
    css: "/* 在这里粘贴你的CSS代码 */",
    vue: "<!-- 在这里粘贴你的Vue代码 -->",
    json: "{\n  // 在这里粘贴你的JSON代码\n}",
    xml: "<!-- 在这里粘贴你的XML代码 -->",
    yaml: "# 在这里粘贴你的YAML代码",
    markdown: "<!-- 在这里粘贴你的Markdown代码 -->",
    shell: "# 在这里粘贴你的Shell脚本",
    bash: "# 在这里粘贴你的Bash脚本",
    dockerfile: "# 在这里粘贴你的Dockerfile代码",
    plaintext: "在这里粘贴你的代码",
  };
  return placeholders[language] || "// 在这里粘贴你的代码";
};

// 插入行内代码
const insertInlineCode = () => {
  if (!editorRef.value) return;

  const selection = window.getSelection();
  let selectedText = "";

  if (selection.rangeCount > 0) {
    selectedText = selection.toString();
  }

  const code = selectedText || "代码";
  const codeHtml = `<code>${escapeHtml(code)}</code>`;

  insertHtmlAtCursor(codeHtml);

  // 更新 form.content
  nextTick(() => {
    if (editorRef.value) {
      const html = editorRef.value.innerHTML;
      form.content = htmlToMarkdown(html);
    }
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  // 确保 form.content 是最新的 Markdown
  if (editorRef.value) {
    const html = editorRef.value.innerHTML;
    form.content = htmlToMarkdown(html);
  }

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const articleData = {
          ...form,
          coverImageFile: coverImageFile.value,
        };
        if (articleId) {
          await updateArticle(articleId, articleData);
          ElMessage.success("更新成功");
        } else {
          await createArticle(articleData);
          ElMessage.success("发布成功");
        }
        router.push("/articles");
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "操作失败");
      } finally {
        loading.value = false;
      }
    }
  });
};

// 监听 form.content 的外部变化（如加载文章时）
// 注意：这个 watch 主要用于外部更新 form.content 的情况
// 编辑器内部输入时不会触发（因为 isUpdatingEditor 标志）
watch(
  () => form.content,
  (newContent, oldContent) => {
    if (isUpdatingEditor.value) return;
    if (!editorRef.value) return;

    // 只有当内容真正改变时才更新（避免循环）
    const currentHtml = editorRef.value.innerHTML.trim();
    if (!currentHtml && !newContent) return; // 都是空，不需要更新

    const currentMarkdown = htmlToMarkdown(currentHtml).trim();
    if (currentMarkdown !== (newContent || "").trim()) {
      isUpdatingEditor.value = true;
      editorRef.value.innerHTML = newContent ? markdownToHtml(newContent) : "";
      isUpdatingEditor.value = false;
    }
  },
  { immediate: false }
);

onMounted(async () => {
  loadCategories();
  loadTags();
  await loadArticle();

  // 如果是新建文章，初始化编辑器
  if (!articleId && editorRef.value) {
    editorRef.value.innerHTML = "";
  }
});
</script>

<style scoped>
.article-edit-page {
  min-height: 100vh;
}

.article-edit {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 200px;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 200px;
  line-height: 200px;
  text-align: center;
}

.cover-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  display: block;
}

.content-editor {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.content-textarea {
  margin-bottom: 10px;
}

.content-editable {
  min-height: 400px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  background: #fff;
  overflow-y: auto;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.content-editable:focus {
  border-color: #409eff;
}

.content-editable:empty:before {
  content: attr(placeholder);
  color: #c0c4cc;
  pointer-events: none;
}

.content-editable img {
  max-width: 820px;
  height: auto;
  border-radius: 4px;
  margin: 15px auto;
  display: block;
}

.content-editable pre {
  background: #1e1e1e;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 10px 0;
}

.content-editable pre code {
  background: transparent;
  padding: 0;
  color: #d4d4d4;
  font-size: 14px;
  line-height: 1.6;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
}

.content-editable code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
  font-size: 13px;
}

.content-editable p {
  margin: 10px 0;
}

.content-editable h1,
.content-editable h2,
.content-editable h3,
.content-editable h4,
.content-editable h5,
.content-editable h6 {
  margin: 15px 0 10px 0;
  font-weight: bold;
}

.content-editable blockquote {
  border-left: 4px solid #409eff;
  padding-left: 15px;
  margin: 15px 0;
  color: #909399;
}

.content-editable ul,
.content-editable ol {
  margin: 10px 0;
  padding-left: 30px;
}

.content-editable li {
  margin: 5px 0;
}

.content-editable a {
  color: #409eff;
  text-decoration: none;
}

.content-editable a:hover {
  text-decoration: underline;
}

.uploading-image {
  opacity: 0.6;
  position: relative;
}

.uploading-image::after {
  content: "上传中...";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(64, 158, 255, 0.9);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.markdown-tips {
  padding: 10px;
  background: #f0f9ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.markdown-tips p {
  margin: 5px 0;
}

.markdown-tips pre {
  background: #fff;
  padding: 8px;
  border-radius: 3px;
  margin: 5px 0;
  font-size: 11px;
  overflow-x: auto;
}

.markdown-tips code {
  background: #f5f7fa;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: "Courier New", monospace;
}

.code-editor-textarea {
  font-family: "Courier New", "Monaco", "Consolas", monospace;
  font-size: 14px;
  line-height: 1.6;
}

.code-tips {
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
