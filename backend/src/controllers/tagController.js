import Tag from '../models/Tag.js'
import { validationResult } from 'express-validator'

//获取标签
export const getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 })
    res.json(tags)
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

//创建标签
export const createTag = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const tag = new Tag(req.body)
    await tag.save()
    res.status(201).json(tag)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '标签名称已存在' })
    }
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

//删除标签
export const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id)
    if (!tag) {
      return res.status(404).json({ message: '标签不存在' })
    }
    res.json({ message: '标签已删除' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
}

