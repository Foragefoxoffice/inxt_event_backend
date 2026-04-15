import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './src/models/Event.js';

dotenv.config();

async function checkEvents() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const events = await Event.find().lean();
  console.log(`Found ${events.length} events:`);
  
  for (const event of events) {
    console.log(`- ${event.name} (Slug: ${event.slug}, ID: ${event._id}, Active: ${event.isActive})`);
  }

  process.exit();
}

checkEvents();
