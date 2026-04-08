import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  selectedOptionId: { type: mongoose.Schema.Types.ObjectId, default: null }, // for single-select compatibility
  selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],             // for multi-select support
  inputText: { type: String, default: null },
  isCorrect: { type: Boolean, default: false },
  aiMatched: { type: Boolean, default: false }
}, { _id: false })

const sessionSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  gameType: { type: String, required: true },
  answers: [answerSchema],
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true })

sessionSchema.index({ playerId: 1, gameId: 1 }, { unique: true })
sessionSchema.index({ eventId: 1, gameType: 1 })
sessionSchema.index({ gameId: 1, 'result.score': -1, completedAt: 1 })

export default mongoose.model('Session', sessionSchema)
