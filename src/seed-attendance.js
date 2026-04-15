import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Session from './models/Session.js'
import Event from './models/Event.js'
import Game from './models/Game.js'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

async function seedAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const event = await Event.findOne({ isActive: true })
    if (!event) {
      console.error('No active event found. Please run npm run seed first.')
      process.exit(1)
    }

    // 1. Clear current attendance data
    console.log('Clearing current users and sessions...')
    await User.deleteMany({ eventId: event._id })
    await Session.deleteMany({ eventId: event._id })

    const games = await Game.find({ eventId: event._id }).lean()
    const agencyGame = games.find(g => g.type === 'AGENCY')
    const mythGame = games.find(g => g.type === 'MYTH')
    const crosswordGame = games.find(g => g.type === 'CROSSWORD')
    const interviewGame = games.find(g => g.type === 'INTERVIEW')

    const demoUsers = [
      { name: 'Faizal Azmi', company: 'AIA Public' },
      { name: 'Siti Rohani', company: 'Prudential BSN' },
      { name: 'Hassan Basri', company: 'Etiqa' },
      { name: 'Nurul Izzah', company: 'Great Eastern' },
      { name: 'Selvam Arumugam', company: 'Hong Leong MSIG' },
      { name: 'David Low', company: 'FWD' },
      { name: 'Aishah Zain', company: 'AmMetLife' },
      { name: 'Ravi Shankar', company: 'Sun Life Malaysia' },
      { name: 'Ahmad Kamal', company: 'Ikhlas' },
      { name: 'Rosmah Mansor', company: 'Zurich' }
    ]

    console.log(`Seeding ${demoUsers.length} demo users and their sessions...`)

    for (const u of demoUsers) {
      const playerId = uuidv4()
      const user = await User.create({
        playerId,
        name: u.name,
        company: u.company,
        eventId: event._id
      })

      // Create some demo sessions
      // Agency Game
      if (agencyGame) {
        await Session.create({
          playerId,
          userId: user._id,
          gameId: agencyGame._id,
          eventId: event._id,
          gameType: 'AGENCY',
          answers: [],
          result: {
            score: Math.floor(Math.random() * 40) + 60, // 60-100
            metrics: {
              pipeline: Math.floor(Math.random() * 20) + 20,
              agents: Math.floor(Math.random() * 20) + 20,
              lifecycle: Math.floor(Math.random() * 20) + 20,
              visibility: Math.floor(Math.random() * 20) + 20
            }
          }
        })
      }

      // Myth Game
      if (mythGame) {
        await Session.create({
          playerId,
          userId: user._id,
          gameId: mythGame._id,
          eventId: event._id,
          gameType: 'MYTH',
          answers: [],
          result: {
            score: Math.floor(Math.random() * 5) + 5, // 5-10
            total: 10
          }
        })
      }

      // Crossword Game
      if (crosswordGame) {
        await Session.create({
          playerId,
          userId: user._id,
          gameId: crosswordGame._id,
          eventId: event._id,
          gameType: 'CROSSWORD',
          answers: [],
          result: {
            score: Math.floor(Math.random() * 30) + 20, // 20-50 correct cells
            total: 54,
            time: Math.floor(Math.random() * 120) + 60 // 60-180 seconds
          }
        })
      }
    }

    console.log('Attendance seeding complete!')
    process.exit(0)
  } catch (err) {
    console.error('Seed Error:', err)
    process.exit(1)
  }
}

seedAttendance()
