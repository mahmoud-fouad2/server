import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/lib/api', () => ({
  adminApi: {
    getBusinesses: jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1 } }),
    activateBusiness: jest.fn().mockResolvedValue({}),
    deleteBusiness: jest.fn().mockResolvedValue({}),
  }
}))

import BusinessesView from '../BusinessesView'
import { adminApi } from '@/lib/api'

describe('BusinessesView', () => {
  beforeEach(() => jest.clearAllMocks())

  test('renders empty state when no businesses', async () => {
    adminApi.getBusinesses.mockResolvedValueOnce({ data: [], pagination: { totalPages: 1 } })
    render(<BusinessesView />)
    await waitFor(() => expect(adminApi.getBusinesses).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('لا توجد شركات')).toBeInTheDocument())
  })

  test('renders list of businesses', async () => {
    const b = { id: 'b1', name: 'TestCo', ownerName: 'Ali', planType: 'PRO', isActive: true, createdAt: new Date().toISOString() }
    adminApi.getBusinesses.mockResolvedValueOnce({ data: [b], pagination: { totalPages: 1 } })
    render(<BusinessesView />)
    await waitFor(() => expect(adminApi.getBusinesses).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('TestCo')).toBeInTheDocument())
    expect(screen.getByText('Ali')).toBeInTheDocument()
  })

  test('activate and delete call APIs', async () => {
    const b = { id: 'b2', name: 'XCo', ownerName: 'Z', planType: 'BASIC', isActive: false, createdAt: new Date().toISOString() }
    adminApi.getBusinesses.mockResolvedValueOnce({ data: [b], pagination: { totalPages: 1 } })
    render(<BusinessesView />)
    await waitFor(() => expect(adminApi.getBusinesses).toHaveBeenCalled())
    // Wait for row to render
    await waitFor(() => expect(screen.getByText('XCo')).toBeInTheDocument())

    // Activate (confirm dialog is used in component, so simulate confirm)
    window.confirm = jest.fn().mockReturnValue(true)
    const activateBtn = screen.getByText('تفعيل/إيقاف')
    fireEvent.click(activateBtn)
    await waitFor(() => expect(adminApi.activateBusiness).toHaveBeenCalledWith('b2'))

    const deleteBtn = screen.getByText('حذف')
    fireEvent.click(deleteBtn)
    await waitFor(() => expect(adminApi.deleteBusiness).toHaveBeenCalledWith('b2'))
  })
})
