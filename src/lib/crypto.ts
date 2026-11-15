import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { env } from '@/lib/env';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  if (!env.INTEGRATION_SECRET_KEY) {
    throw new Error(
      'INTEGRATION_SECRET_KEY is not set. Generate one with `openssl rand -base64 32`.',
    );
  }
  return Buffer.from(env.INTEGRATION_SECRET_KEY, 'base64');
}

/** Encrypts with AES-256-GCM. Returns the IV, the auth tag and the ciphertext in base64. */
export function encryptSecret(plaintext: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

/** @throws if the value was changed or encrypted with another key */
export function decryptSecret(encrypted: string) {
  const data = Buffer.from(encrypted, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), data.subarray(0, IV_LENGTH));
  decipher.setAuthTag(data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
  return Buffer.concat([
    decipher.update(data.subarray(IV_LENGTH + TAG_LENGTH)),
    decipher.final(),
  ]).toString('utf8');
}
