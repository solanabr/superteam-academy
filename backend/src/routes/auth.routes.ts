import express, { Request, Response } from 'express'
import { authService } from '../services/auth.service'

const router = express.Router()

/**
 * POST /api/auth/signup
 * Register new user with full profile
 */
router.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, age, bio, avatar } = req.body

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, firstName, lastName',
      })
    }

    const result = await authService.signup({
      email,
      password,
      firstName,
      lastName,
      age,
      bio,
      avatar,
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('Signup failed:', error)
    res.status(400).json({ error: error instanceof Error ? error.message : 'Signup failed' })
  }
})

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' })
    }

    const result = await authService.login({ email, password })
    res.json(result)
  } catch (error) {
    console.error('Login failed:', error)
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' })
  }
})

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/auth/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Missing token' })
    }

    const decoded = authService.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({ valid: true, userId: decoded.userId, email: decoded.email })
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' })
  }
})

/**
 * PUT /api/auth/profile/:userId
 * Update user profile
 */
router.put('/auth/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, age, bio, avatar } = req.body

    const result = await authService.updateProfile(req.params.userId, {
      firstName,
      lastName,
      age,
      bio,
      avatar,
    })

    res.json(result)
  } catch (error) {
    console.error('Profile update failed:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Profile update failed' })
  }
})

export default router
