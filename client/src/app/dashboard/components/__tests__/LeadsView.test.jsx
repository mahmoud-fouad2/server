import { render, screen, waitFor } from '@testing-library/react';
import LeadsView from '../LeadsView';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('LeadsView', () => {
  beforeEach(() => jest.resetAllMocks());

  test('renders empty state', async () => {
    api.apiCall.mockResolvedValue({ data: [] });
    render(<LeadsView />);
    expect(screen.getByText('بيانات العملاء')).toBeInTheDocument();
    await waitFor(() => expect(api.apiCall).toHaveBeenCalledWith('/api/crm/leads'));
    expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument();
  });

  test('renders leads', async () => {
    const leads = [{ id: '1', name: 'Ali', email: 'a@e.com', phone: '123', requestSummary: 'طلب', source: 'PRE_CHAT_FORM', createdAt: new Date().toISOString() }];
    api.apiCall.mockResolvedValue({ data: leads });
    render(<LeadsView />);
    await waitFor(() => expect(screen.getByText('Ali')).toBeInTheDocument());
    expect(screen.getByText('a@e.com')).toBeInTheDocument();
  });
});
