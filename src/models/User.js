import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  company: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }
}, { timestamps: true })

userSchema.index({ eventId: 1 })

export default mongoose.model('User', userSchema)
