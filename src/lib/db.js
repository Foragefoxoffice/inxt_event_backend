import mongoose from 'mongoose'

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }
  
  // Log presence but hide details for security
  const uri = process.env.MONGODB_URI
  const obscured = uri.replace(/\/\/.*@/, '//****:****@')
  console.log(`Connecting to MongoDB: ${obscured}`)
  
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')
}
