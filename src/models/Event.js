import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: false }
}, { timestamps: true })

eventSchema.index({ isActive: 1 })

export default mongoose.model('Event', eventSchema)
