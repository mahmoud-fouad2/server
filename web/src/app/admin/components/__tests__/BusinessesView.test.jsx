import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/lib/api', () => ({
  adminApi: {
    getBusinesses: jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1 } }),
    activateBusiness: jest.fn().mockResolvedValue({}),
    deleteBusiness: jest.fn().mockResolvedValue({}),
    toggleBusinessCrm: jest.fn().mockResolvedValue({}),
    toggleBusinessPreChat: jest.fn().mockResolvedValue({}),
  }
}))

import BusinessesView from '../BusinessesView'
import { adminApi } from '@/lib/api-client'

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
    adminApi.getBusinesses.mockResolvedValue({ data: [b], pagination: { totalPages: 1 } })
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

  test('toggle prechat calls API', async () => {
    const b = { id: 'b3', name: 'YCo', ownerName: 'M', planType: 'BASIC', isActive: true, preChatFormEnabled: false, crmLeadCollectionEnabled: false, createdAt: new Date().toISOString() }
    adminApi.getBusinesses.mockResolvedValue({ data: [b], pagination: { totalPages: 1 } })
    render(<BusinessesView />)
    await waitFor(() => expect(adminApi.getBusinesses).toHaveBeenCalled())

    window.confirm = jest.fn().mockReturnValue(true)

    const prechatBtn = await screen.findByText('نموذج ما قبل الدردشة: معطل')
    fireEvent.click(prechatBtn)
    await waitFor(() => expect(adminApi.toggleBusinessPreChat).toHaveBeenCalledWith('b3', true))
  })

  test('toggle crm calls API', async () => {
    const b = { id: 'b4', name: 'ZCo', ownerName: 'L', planType: 'BASIC', isActive: true, preChatFormEnabled: true, crmLeadCollectionEnabled: false, createdAt: new Date().toISOString() }
    adminApi.getBusinesses.mockResolvedValue({ data: [b], pagination: { totalPages: 1 } })
    render(<BusinessesView />)
    await waitFor(() => expect(adminApi.getBusinesses).toHaveBeenCalled())

    window.confirm = jest.fn().mockReturnValue(true)

    const crmBtn = await screen.findByText('CRM: معطل')
    fireEvent.click(crmBtn)
    await waitFor(() => expect(adminApi.toggleBusinessCrm).toHaveBeenCalledWith('b4', true))
  })
})
