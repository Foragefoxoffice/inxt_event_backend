import mongoose from 'mongoose'

const statsSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, unique: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  gameType: { type: String, required: true },
  totalSubmissions: { type: Number, default: 0 },
  totalAiMatched: { type: Number, default: 0 },
  aiMatchPercent: { type: Number, default: 0 },
  questionStats: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      trueCount: { type: Number, default: 0 },
      falseCount: { type: Number, default: 0 },
      _id: false
    }
  ],
  avgMetrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  metricSums: { type: mongoose.Schema.Types.Mixed, default: {} },
  scoreSum: { type: Number, default: 0 }, // For MYTH average
  avgScore: { type: Number, default: 0 }, // For MYTH average
  totalCompletions: { type: Number, default: 0 }
}, { timestamps: true, strict: false })

statsSchema.index({ eventId: 1 })

export default mongoose.model('Stats', statsSchema)
