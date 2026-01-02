import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/lib/api', () => ({
  adminApi: {
    getAuditLogs: jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1, total: 0 } })
  }
}))

import AuditLogsView from '../AuditLogsView'
import { adminApi } from '@/lib/api-client'

describe('AuditLogsView', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    adminApi.getAuditLogs = jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1, total: 0 } })
  })

  test('renders empty state', async () => {
    render(<AuditLogsView />)
    await waitFor(() => expect(adminApi.getAuditLogs).toHaveBeenCalled())
    expect(screen.getByText('لا توجد سجلات')).toBeInTheDocument()
  })

  test('renders logs and pagination', async () => {
    const logs = [
      { id: 'l1', action: 'USER_CREATE', createdAt: new Date().toISOString(), user: { name: 'Ali', email: 'ali@example.com' }, meta: { target: 'user', id: 'u1' } }
    ]
    adminApi.getAuditLogs.mockResolvedValueOnce({ data: logs, pagination: { totalPages: 1, total: 1 } })
    render(<AuditLogsView />)
    await waitFor(() => expect(adminApi.getAuditLogs).toHaveBeenCalled())
    expect(screen.getByText('USER_CREATE')).toBeInTheDocument()
    expect(screen.getByText(/Ali/)).toBeInTheDocument()
    expect(screen.getByText(/target/)).toBeInTheDocument()
  })

  test('applies filters', async () => {
    adminApi.getAuditLogs.mockResolvedValueOnce({ data: [], pagination: { totalPages: 1, total: 0 } })
    render(<AuditLogsView />)
    await waitFor(() => expect(adminApi.getAuditLogs).toHaveBeenCalled())

    const actionInput = screen.getByLabelText('action-filter')
    fireEvent.change(actionInput, { target: { value: 'USER_CREATE' } })
    fireEvent.click(screen.getByText('تطبيق'))
    await waitFor(() => expect(adminApi.getAuditLogs).toHaveBeenCalled())
    expect(adminApi.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_CREATE', page: 1, limit: 50 }))
  })
})
