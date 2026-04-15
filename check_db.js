import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './src/models/Game.js';
import Question from './src/models/Question.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const games = await Game.find().lean();
  console.log(`Found ${games.length} games:`);
  
  for (const game of games) {
    const qCount = await Question.countDocuments({ gameId: game._id });
    console.log(`- [${game.type}] ${game.title} (ID: ${game._id}) -> ${qCount} questions`);
  }

  process.exit();
}

check();
