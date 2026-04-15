import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, default: null },
  phone: { type: String, default: null },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }
}, { timestamps: true })

userSchema.index({ eventId: 1 })
userSchema.index({ phone: 1, eventId: 1 })

export default mongoose.model('User', userSchema)
