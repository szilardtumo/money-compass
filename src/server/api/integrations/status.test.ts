import { describe, expect, it } from 'vitest';

import { getIntegrationStatus } from './status';

const now = new Date('2026-06-15T12:00:00Z');

describe('getIntegrationStatus', () => {
  it('is expiring 6 days before it expires', () => {
    const integration = { revokedAt: null, expiresAt: new Date('2026-06-21T12:00:00Z') };
    expect(getIntegrationStatus(integration, now)).toBe('expiring');
  });

  it('is active 8 days before it expires', () => {
    const integration = { revokedAt: null, expiresAt: new Date('2026-06-23T12:00:00Z') };
    expect(getIntegrationStatus(integration, now)).toBe('active');
  });

  it('is expired one second after it expires', () => {
    const integration = { revokedAt: null, expiresAt: new Date('2026-06-15T11:59:59Z') };
    expect(getIntegrationStatus(integration, now)).toBe('expired');
  });

  it('is revoked when the access was revoked', () => {
    const integration = {
      revokedAt: new Date('2026-06-10T12:00:00Z'),
      expiresAt: new Date('2026-07-15T12:00:00Z'),
    };
    expect(getIntegrationStatus(integration, now)).toBe('revoked');
  });
});
