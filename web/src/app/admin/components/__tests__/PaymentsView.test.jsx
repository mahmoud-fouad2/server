import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/lib/api', () => ({
  adminApi: {
    getInvoices: jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1 } }),
    getPaymentGateways: jest.fn().mockResolvedValue({ data: [] }),
    getSubscriptions: jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1 } }),
    updatePaymentGateway: jest.fn().mockResolvedValue({}),
    getBusinesses: jest.fn().mockResolvedValue({ data: [] }),
    createCustomPayment: jest.fn().mockResolvedValue({})
  }
}))

import PaymentsView from '../PaymentsView'
import { adminApi } from '@/lib/api'

describe('PaymentsView', () => {
  beforeEach(() => {
    // Reset all mocks and set fresh default implementations per test to avoid
    // cross-test flakiness due to React strict-mode double effect calls.
    jest.resetAllMocks()
    adminApi.getInvoices = jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways = jest.fn().mockResolvedValue({ data: [] })
    adminApi.getSubscriptions = jest.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1 } })
    adminApi.updatePaymentGateway = jest.fn().mockResolvedValue({})
    adminApi.getBusinesses = jest.fn().mockResolvedValue({ data: [] })
    adminApi.createCustomPayment = jest.fn().mockResolvedValue({})
  })

  test('renders empty invoices and gateways', async () => {
    adminApi.getInvoices.mockResolvedValueOnce({ data: [], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways.mockResolvedValueOnce({ data: [] })
    adminApi.getPaymentGateways.mockResolvedValueOnce({ data: [] })
    render(<PaymentsView />)
    await waitFor(() => expect(adminApi.getInvoices).toHaveBeenCalled())
    await waitFor(() => expect(adminApi.getPaymentGateways).toHaveBeenCalled())
    expect(screen.getByText('لا توجد فواتير')).toBeInTheDocument()
    expect(screen.getByText('لا توجد بوابات دفع')).toBeInTheDocument()
  })

  test('toggles gateway active state', async () => {
    const g = { id: 'gw1', name: 'Stripe', description: 'Stripe gateway', isEnabled: false }
    adminApi.getInvoices.mockResolvedValueOnce({ data: [], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways.mockResolvedValue({ data: [g] })
    render(<PaymentsView />)
    await waitFor(() => expect(adminApi.getPaymentGateways).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('تفعيل')).toBeInTheDocument())

    // mock confirm state is not used here; toggleGatewayActive calls updatePaymentGateway
    const btn = screen.getByText('تفعيل')
    fireEvent.click(btn)
    await waitFor(() => expect(adminApi.updatePaymentGateway).toHaveBeenCalledWith('gw1', { isEnabled: true }))
  })

  test('edits gateway', async () => {
    const g = { id: 'gw2', name: 'PayMob', description: 'PayMob gateway', isEnabled: true, isActive: true, hasApiKey: true }
    adminApi.getInvoices.mockResolvedValueOnce({ data: [], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways.mockResolvedValue({ data: [g] })
    adminApi.getBusinesses.mockResolvedValueOnce({ data: [] })
    adminApi.updatePaymentGateway = jest.fn().mockResolvedValue({ data: {} })

    render(<PaymentsView />)
    await waitFor(() => expect(adminApi.getPaymentGateways).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('تعديل')).toBeInTheDocument())

    fireEvent.click(screen.getByText('تعديل'))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'تعديل بوابة الدفع' })).toBeInTheDocument())

    // name input should be present (label associated)
    const nameInput = screen.getByLabelText('الاسم')
    fireEvent.change(nameInput, { target: { value: 'PayMob Updated' } })
    const saveBtn = screen.getByText('حفظ')
    fireEvent.click(saveBtn)

    await waitFor(() => expect(adminApi.updatePaymentGateway).toHaveBeenCalledWith('gw2', expect.objectContaining({ name: 'PayMob Updated' })))
  })

  test('editing keys asks for confirmation and sends keys when confirmed', async () => {
    const g = { id: 'gw3', name: 'KeyGate', description: 'Key gateway', isEnabled: true, isActive: true, hasApiKey: true }
    adminApi.getInvoices.mockResolvedValueOnce({ data: [], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways.mockResolvedValue({ data: [g] })
    adminApi.updatePaymentGateway = jest.fn().mockResolvedValue({ data: {} })

    render(<PaymentsView />)
    await waitFor(() => expect(adminApi.getPaymentGateways).toHaveBeenCalled())
    fireEvent.click(screen.getByText('تعديل'))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'تعديل بوابة الدفع' })).toBeInTheDocument())

    const apiInput = screen.getByLabelText('API Key (سيتم تغييره فقط عند ملئه)')
    fireEvent.change(apiInput, { target: { value: 'new-api-key' } })
    fireEvent.click(screen.getByText('حفظ'))

    // Confirm dialog should appear
    await waitFor(() => expect(screen.getByText('تأكيد تحديث المفاتيح')).toBeInTheDocument())
    fireEvent.click(screen.getByText('تأكيد'))
    await waitFor(() => expect(adminApi.updatePaymentGateway).toHaveBeenCalledWith('gw3', expect.objectContaining({ apiKey: 'new-api-key' })))
  })

  test('renders subscriptions list', async () => {
    const s = { id: 's1', businessId: 'b1', planType: 'PRO', isActive: true, startDate: new Date().toISOString(), endDate: new Date(Date.now()+30*24*3600*1000).toISOString(), business: { name: 'BizCo' } }
    adminApi.getInvoices.mockResolvedValueOnce({ data: [], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways.mockResolvedValueOnce({ data: [] })
    adminApi.getSubscriptions.mockResolvedValueOnce({ data: [s], pagination: { totalPages: 1 } })
    render(<PaymentsView />)
    await waitFor(() => expect(adminApi.getSubscriptions).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('BizCo')).toBeInTheDocument())
    expect(screen.getByText('PRO')).toBeInTheDocument()
  })

  test('opens invoice details modal', async () => {
    const inv = { id: 'p1', number: 'INV-001', customerName: 'Ali', amount: 100, currency: 'SAR', status: 'COMPLETED' }
    adminApi.getInvoices.mockResolvedValueOnce({ data: [inv], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways.mockResolvedValueOnce({ data: [] })
    adminApi.getInvoice = jest.fn().mockResolvedValue({ data: inv })

    render(<PaymentsView />)
    await waitFor(() => expect(screen.getByText('INV-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('INV-001'))
    await waitFor(() => expect(adminApi.getInvoice).toHaveBeenCalledWith('p1'))
    await waitFor(() => expect(screen.getByText(/تفاصيل الفاتورة #INV-001/)).toBeInTheDocument())
  })

  test('creates custom payment', async () => {
    const inv = { id: 'p1', number: 'INV-001', customerName: 'Ali', amount: 100, currency: 'SAR', status: 'COMPLETED' }
    const b = { id: 'b1', name: 'BizCo' }
    adminApi.getInvoices.mockResolvedValueOnce({ data: [inv], pagination: { totalPages: 1 } })
    adminApi.getPaymentGateways.mockResolvedValueOnce({ data: [] })
    adminApi.getBusinesses.mockResolvedValue({ data: [b] })
    adminApi.createCustomPayment = jest.fn().mockResolvedValue({ data: { id: 'pay1' } })

    const { container } = render(<PaymentsView />)
    // Wait for initial load
    await waitFor(() => expect(adminApi.getInvoices).toHaveBeenCalled())

    fireEvent.click(screen.getAllByText('إنشاء دفعة مخصصة')[0])
    await waitFor(() => expect(screen.getByRole('heading', { name: 'إنشاء دفعة مخصصة' })).toBeInTheDocument())

    // Wait for businesses API call to have happened, then fill modal values
    await waitFor(() => expect(adminApi.getBusinesses).toHaveBeenCalled())

    const heading = screen.getByRole('heading', { name: 'إنشاء دفعة مخصصة' })
    // Walk up until we find the element that contains the select/input elements for the modal
    let modalRoot = heading
    while (modalRoot && !modalRoot.querySelector('select')) modalRoot = modalRoot.parentElement
    const modal = within(modalRoot)

    const businessSelect = modal.getByLabelText('العمل')
    const amountInput = modal.getByLabelText('المبلغ')
    const descriptionInput = modal.getByLabelText('الوصف')

    // Choose business and fill mandatory fields
    fireEvent.change(businessSelect, { target: { value: 'b1' } })
    fireEvent.change(amountInput, { target: { value: '50' } })
    fireEvent.change(descriptionInput, { target: { value: 'Manual credit' } })

    fireEvent.click(modal.getByText('إنشاء'))

    await waitFor(() => expect(adminApi.createCustomPayment).toHaveBeenCalledWith(expect.objectContaining({ businessId: 'b1', amount: 50, description: 'Manual credit' })))
  })
})
