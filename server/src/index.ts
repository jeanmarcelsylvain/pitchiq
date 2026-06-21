import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import matchRoutes from './routes/matches'
import goalRoutes from './routes/goals'
import analyticsRoutes from './routes/analytics'
import coachRoutes from './routes/coach'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.set('trust proxy', 1)

app.use(helmet())
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['http://localhost:5173', process.env.CLIENT_ORIGIN].filter(Boolean)
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json({ limit: '10kb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/matches', matchRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/coach', coachRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`PitchIQ API running on port ${PORT}`)
})

export default app
