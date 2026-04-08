import mongoose from 'mongoose'
import Game from './models/Game.js'
import dotenv from 'dotenv'

dotenv.config()

async function check() {
  await mongoose.connect(process.env.MONGODB_URI)
  const games = await Game.find().select('_id title type').lean()
  console.log('Available Games:', JSON.stringify(games, null, 2))
  process.exit()
}

check()
