import request from '../utils/request'

export const register = (data) => {
  return request.post('/auth/register', data)
}

export const login = (data) => {
  return request.post('/auth/login', data)
}

export const sendCode = (data) => {
  return request.post('/auth/send-code', data)
}

export const getProfile = () => {
  return request.get('/auth/profile')
}

export const updateProfile = (data) => {
  return request.put('/auth/profile', data)
}

export const sendResetPasswordCode = (data) => {
  return request.post('/auth/send-reset-code', data)
}

export const resetPassword = (data) => {
  return request.post('/auth/reset-password', data)
}
