import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

    console.log('Connecting to DB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const collection = mongoose.connection.collection('sessions');
    
    console.log('Checking indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    if (indexes.find(i => i.name === 'playerId_1_gameId_1')) {
      console.log('Dropping unique index playerId_1_gameId_1...');
      await collection.dropIndex('playerId_1_gameId_1');
      console.log('Index dropped successfully.');
    } else {
      console.log('Index playerId_1_gameId_1 not found or already dropped.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixIndex();
