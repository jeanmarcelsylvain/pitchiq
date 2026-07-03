import type { Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const token = authHeader.slice(7)

  // If Firebase Admin isn't initialized, we cannot verify token signatures.
  // Fail CLOSED in production — an unverified decode would let anyone forge a
  // token with an arbitrary user_id and impersonate any user. The unverified
  // path is allowed only in local development for testing without credentials.
  if (!admin.apps.length) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FIREBASE_* env vars missing in production — rejecting all authenticated requests')
      return res.status(503).json({ error: 'Authentication service unavailable' })
    }
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      req.userId = payload.user_id ?? payload.sub
      req.userEmail = payload.email
      return next()
    } catch {
      return res.status(401).json({ error: 'Firebase not configured and token decode failed' })
    }
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.userId = decoded.uid
    req.userEmail = decoded.email
    next()
  } catch (err) {
    console.error('Token verification failed:', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
