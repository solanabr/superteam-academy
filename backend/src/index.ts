import './env'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { initializeDatabase, closeDatabase } from './db'
import authRoutes from './routes/auth.routes'
import apiRoutes from './routes/api.routes'
import onchainRoutes, { initializeSignerService } from './routes/onchain.routes'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)

// ============= Health Check =============
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============= Auth Routes =============
app.use('/api', authRoutes)

// ============= API Routes =============
app.use('/api', apiRoutes)

// ============= On-Chain Routes =============
app.use('/api/onchain', onchainRoutes)

// ============= 404 Handler =============
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  })
})

// ============= Error Handler =============
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  })
})

// ============= Start Server =============

async function start() {
  try {
    // Initialize database
    await initializeDatabase()
    console.log('✅ Database initialized')

    // Initialize on-chain signer service
    initializeSignerService()
    console.log('✅ On-chain signer service initialized')

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Backend running on http://localhost:${PORT}`)
      console.log(`📚 API Documentation:`)
      console.log(`   AUTH:`)
      console.log(`   - POST   /api/auth/signup`)
      console.log(`   - POST   /api/auth/login`)
      console.log(`   - POST   /api/auth/verify`)
      console.log(`   - PUT    /api/auth/profile/:userId`)
      console.log(`   ENROLLMENT:`)
      console.log(`   - POST   /api/enrollments`)
      console.log(`   - POST   /api/enrollments/complete-lesson`)
      console.log(`   - POST   /api/enrollments/finalize-course`)
      console.log(`   - POST   /api/enrollments/issue-credential`)
      console.log(`   - GET    /api/progress/:userId`)
      console.log(`   - GET    /api/enrollments/:userId`)
      console.log(`   GAMIFICATION:`)
      console.log(`   - GET    /api/gamification/:userId`)
      console.log(`   - GET    /api/leaderboard`)
      console.log(`   - GET    /api/leaderboard/rank/:userId`)
      console.log(`   BLOCKCHAIN:`)
      console.log(`   - GET    /api/blockchain/xp-balance/:wallet`)
      console.log(`   - GET    /api/blockchain/credentials/:wallet`)
      console.log(`   - GET    /api/blockchain/rank/:wallet`)
      console.log(`   ON-CHAIN SIGNER:`)
      console.log(`   - POST   /api/onchain/complete-lesson`)
      console.log(`   - POST   /api/onchain/finalize-course`)
      console.log(`   - POST   /api/onchain/issue-credential`)
      console.log(`   - POST   /api/onchain/upgrade-credential`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...')
  await closeDatabase()
  process.exit(0)
})

start()

export default app
