type IntegrationStatus = 'pending' | 'active' | 'expired' | 'unknown';

export interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  expiresAt?: Date;
  institution: {
    id: string;
    name: string;
    bic?: string;
    logoUrl?: string;
  };
}
