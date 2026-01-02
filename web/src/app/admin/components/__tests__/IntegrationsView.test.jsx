import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/lib/api', () => ({
  adminApi: {
    getIntegrations: jest.fn().mockResolvedValue({ data: [] }),
    getBusinesses: jest.fn().mockResolvedValue({ data: [{ id: 'b1', name: 'BizCo' }] }),
    getIntegration: jest.fn().mockResolvedValue({ data: {} }),
    upsertIntegration: jest.fn().mockResolvedValue({ message: 'Saved' }),
    testIntegration: jest.fn().mockResolvedValue({ data: { success: true, message: 'OK' } })
  }
}));

import IntegrationsView from '../IntegrationsView';
import { adminApi } from '@/lib/api-client';

describe('IntegrationsView', () => {
  it('renders sections for supported integrations', () => {
    render(<IntegrationsView />);

    // Wait for initial load to finish
    return waitFor(() => {
      expect(adminApi.getIntegrations).toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: /WhatsApp/ })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Telegram/ })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Infoseed/ })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Facebook Messenger/ })).toBeInTheDocument();
    });
  });
});
