import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import User from '../models/User.js'
import Event from '../models/Event.js'
import { emitToEvent } from '../socket.js'

const router = Router()

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, company, eventId } = req.body
    if (!name || !company || !eventId) {
      return res.status(400).json({ error: 'name, company, and eventId are required' })
    }

    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    const playerId = uuidv4()
    const user = await User.create({ playerId, name, company, eventId })

    emitToEvent(eventId, 'player:joined', { name, company })

    res.status(201).json({ playerId, userId: user._id, name, company })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
