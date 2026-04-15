import mongoose from 'mongoose'
import dns from 'dns'

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  // Force DNS to use Google/Cloudflare to bypass local SRV resolution issues
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
  } catch (e) {
    console.warn('Warning: Could not set custom DNS servers:', e.message)
  }
  
  // Log presence but hide details for security
  const uri = process.env.MONGODB_URI
  const obscured = uri.replace(/\/\/.*@/, '//****:****@')
  console.log(`Connecting to MongoDB: ${obscured}`)
  
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of default
    connectTimeoutMS: 10000,
  })
  console.log('MongoDB connected')
}
