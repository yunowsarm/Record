import request from "../utils/request";

export const getArticles = (params) => {
  return request.get("/articles", { params });
};

export const getArticle = (id) => {
  return request.get(`/articles/${id}`);
};

export const createArticle = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    // 跳过 coverImageFile，稍后单独处理
    if (key === "coverImageFile") return;

    if (key === "tags" && Array.isArray(data[key])) {
      data[key].forEach((tag) => formData.append("tags", tag));
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  // 如果有文件，添加为 coverImage 字段
  if (data.coverImageFile) {
    formData.append("coverImage", data.coverImageFile);
  }
  return request.post("/articles", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateArticle = (id, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    // 跳过 coverImageFile，稍后单独处理
    if (key === "coverImageFile") return;

    if (key === "tags" && Array.isArray(data[key])) {
      data[key].forEach((tag) => formData.append("tags", tag));
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  // 如果有文件，添加为 coverImage 字段
  if (data.coverImageFile) {
    formData.append("coverImage", data.coverImageFile);
  }
  return request.put(`/articles/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteArticle = (id) => {
  return request.delete(`/articles/${id}`);
};

export const getArticleStats = (params) => {
  return request.get("/articles/stats/summary", { params });
};
