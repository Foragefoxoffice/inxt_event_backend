import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Session from './models/Session.js'
import Event from './models/Event.js'

dotenv.config()

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const event = await Event.findOne({ isActive: true })
    if (!event) {
      console.error('No active event found.')
      process.exit(1)
    }

    console.log(`Clearing ALL attendance data for event: ${event.name}...`)
    
    const userResult = await User.deleteMany({ eventId: event._id })
    const sessionResult = await Session.deleteMany({ eventId: event._id })

    console.log(`Successfully removed:`)
    console.log(`- ${userResult.deletedCount} Users`)
    console.log(`- ${sessionResult.deletedCount} Sessions`)
    
    console.log('\nEvent is now clean and ready for real starts!')
    process.exit(0)
  } catch (err) {
    console.error('Clear Data Error:', err)
    process.exit(1)
  }
}

clearData()
