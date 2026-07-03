/* ═══ Token Encryption Service ═════════════════════════════════════════════
   Encrypt OAuth tokens at rest in the database using Node's crypto module.
   Keys are derived from ENCRYPTION_KEY environment variable.
*/
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT = 'pitchiq-salt' // In production, use a random salt per token

export class TokenEncryption {
  private key: Buffer

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }

    // Derive a 256-bit key from the encryption key using scrypt
    this.key = scryptSync(encryptionKey, SALT, 32)
  }

  /**
   * Encrypt a sensitive token for storage in the database
   */
  encrypt(token: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, this.key, iv)

    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return: iv + authTag + encryptedData (all hex-encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt a token retrieved from the database
   */
  decrypt(encryptedData: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':')

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted token format')
      }

      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')

      const decipher = createDecipheriv(ALGORITHM, this.key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (err) {
      throw new Error('Failed to decrypt token — corruption or wrong encryption key')
    }
  }
}

// Singleton instance
let encryptionInstance: TokenEncryption | null = null

export function getEncryption(): TokenEncryption {
  if (!encryptionInstance) {
    encryptionInstance = new TokenEncryption()
  }
  return encryptionInstance
}
