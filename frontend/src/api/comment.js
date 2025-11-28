import request from '../utils/request'

export const getComments = (params) => {
  return request.get('/comments', { params })
}

export const createComment = (data) => {
  return request.post('/comments', data)
}

export const updateCommentStatus = (id, status) => {
  return request.put(`/comments/${id}/status`, { status })
}

export const deleteComment = (id) => {
  return request.delete(`/comments/${id}`)
}

