import mongoose from 'mongoose'

const optionSchema = new mongoose.Schema({
  optionId: { type: String, default: null },
  label: { type: String, required: true },
  subtitle: { type: String, default: null },   // descriptive line shown under label
  badge: { type: String, default: null },       // 'SLOW' | 'AVERAGE' | 'AI-POWERED'
  shortLabel: { type: String, default: null },  // used in agency result summary line
  isCorrect: { type: Boolean, default: false },
  scoreImpact: {
    pipeline: { type: Number, default: 0 },
    agents: { type: Number, default: 0 },
    lifecycle: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 }
  }
})

const questionSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  text: { type: String, required: true },
  sectionLabel: { type: String, default: null }, // e.g. "GROWTH STRATEGY" shown above question
  order: { type: Number, required: true },
  aiRecommended: { type: mongoose.Schema.Types.ObjectId, default: null },
  aiRationale: { type: String, default: null },
  answer: { type: String, default: null }, // for crossword or text matches
  gridRow: { type: Number, default: null }, // row index (1-based)
  gridCol: { type: Number, default: null }, // column index (1-based)
  gridDir: { type: String, enum: ['across', 'down'], default: null },
  gridNum: { type: Number, default: null }, // number shown in grid (1, 2, 3...)
  gridLen: { type: Number, default: null }, // letter count (e.g. 7)
  personas: { type: [String], default: [] }, // ['cxo', 'agent', etc] for INTERVIEW game
  interviewType: { type: String, enum: ['tf', 'open'], default: null }, // tf | open
  hostProposal: { type: String, default: null }, // "Say it fast — True or False?"
  options: [optionSchema]
})

questionSchema.index({ gameId: 1 })

export default mongoose.model('Question', questionSchema)
