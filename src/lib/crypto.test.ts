import { describe, expect, it, vi } from 'vitest';

import { decryptSecret, encryptSecret } from './crypto';

vi.mock('@/lib/env', () => ({
  env: { INTEGRATION_SECRET_KEY: Buffer.alloc(32, 7).toString('base64') },
}));

describe('encryptSecret', () => {
  it('round trips through decryptSecret', () => {
    const encrypted = encryptSecret('{"token":"123456789012345678901234"}');

    expect(encrypted).not.toContain('123456789012345678901234');
    expect(decryptSecret(encrypted)).toBe('{"token":"123456789012345678901234"}');
  });

  it('throws when a ciphertext byte changed', () => {
    const data = Buffer.from(encryptSecret('secret'), 'base64');
    data[data.length - 1] ^= 1;

    expect(() => decryptSecret(data.toString('base64'))).toThrow(
      'Unsupported state or unable to authenticate data',
    );
  });
});
