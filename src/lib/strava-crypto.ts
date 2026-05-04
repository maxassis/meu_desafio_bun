import { symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto'

import { env } from '../shared/config/env'

const secretConfig = {
  keys: new Map([[0, env.betterAuthSecret]]),
  currentVersion: 0,
  legacySecret: env.betterAuthSecret,
}

export async function decryptStravaToken(encryptedToken: string | null | undefined): Promise<string | null> {
  if (!encryptedToken) {
    return null
  }

  try {
    const decrypted = await symmetricDecrypt({
      key: secretConfig,
      data: encryptedToken,
    })
    console.log('[StravaCrypto] Decrypted token, length:', decrypted.length)
    return decrypted
  }
  catch {
    console.log('[StravaCrypto] Decrypt failed, returning as plain text')
    return encryptedToken
  }
}

export async function encryptStravaToken(token: string): Promise<string> {
  const encrypted = await symmetricEncrypt({
    key: secretConfig,
    data: token,
  })

  return encrypted
}
