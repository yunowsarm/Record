import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    maxlength: 500,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  coverImage: {
    type: String,
    default: ''
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

articleSchema.index({ title: 'text', content: 'text' })
articleSchema.index({ author: 1, createdAt: -1 })
articleSchema.index({ category: 1 })
articleSchema.index({ status: 1 })

export default mongoose.model('Article', articleSchema)

