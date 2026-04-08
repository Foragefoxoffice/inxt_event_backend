import mongoose from 'mongoose'

const GAME_TYPES = ['QUIZ', 'AGENCY', 'MYTH', 'CROSSWORD', 'INTERVIEW']

const gameSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: GAME_TYPES, required: true },
  isActive: { type: Boolean, default: true },
  maxPossibleScore: { type: Number, default: 100 },
  agencyMaxPerMetric: {
    pipeline: { type: Number, default: 80 },
    agents: { type: Number, default: 40 },
    lifecycle: { type: Number, default: 40 },
    visibility: { type: Number, default: 40 }
  }
}, { timestamps: true })

gameSchema.index({ eventId: 1, isActive: 1 })

export default mongoose.model('Game', gameSchema)
