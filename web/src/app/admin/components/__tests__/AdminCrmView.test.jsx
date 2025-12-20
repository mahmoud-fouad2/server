import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/lib/api', () => ({
  adminApi: {
    getAdminCrmLeads: jest.fn().mockResolvedValue([]),
    getAdminCrmStats: jest.fn().mockResolvedValue({ total: 0, businessesWithCrm: 0 }),
    deleteAdminCrmLead: jest.fn().mockResolvedValue({}),
    getAdminCrmLeadById: jest.fn().mockResolvedValue({ data: null }),
    bulkUpdateCrmLeads: jest.fn().mockResolvedValue({ count: 0 }),
    getUsers: jest.fn().mockResolvedValue({ data: [{ id: 'u1', name: 'Agent One', email: 'agent1@example.com' }] })
  },
  apiCall: jest.fn()
}))

import AdminCrmView from '../AdminCrmView'
import { adminApi } from '@/lib/api'

describe('AdminCrmView', () => {
  beforeEach(() => jest.clearAllMocks())

  test('renders empty state and stats', async () => {
    render(<AdminCrmView />)
    await waitFor(() => expect(adminApi.getAdminCrmStats).toHaveBeenCalled())
    await waitFor(() => expect(adminApi.getAdminCrmLeads).toHaveBeenCalled())
    expect(screen.getByText('لا توجد عملاء محتملين')).toBeInTheDocument()
  })

  test('renders leads and delete calls API', async () => {
    const lead = { id: 'l1', name: 'Test Lead', email: 'a@b.com', phone: '123', businessName: 'BizCo', createdAt: new Date().toISOString() }
    adminApi.getAdminCrmLeads.mockResolvedValueOnce([lead])
    adminApi.getAdminCrmStats.mockResolvedValueOnce({ total: 1, businessesWithCrm: 1 })

    render(<AdminCrmView />)
    await waitFor(() => expect(adminApi.getAdminCrmLeads).toHaveBeenCalled())
    expect(screen.getByText('Test Lead')).toBeInTheDocument()

    window.confirm = jest.fn().mockReturnValue(true)
    const del = screen.getByText('حذف')
    fireEvent.click(del)
    await waitFor(() => expect(adminApi.deleteAdminCrmLead).toHaveBeenCalledWith('l1'))
  })

  test('open lead shows details and allows adding note', async () => {
    const lead = { id: 'l2', name: 'LeadTwo', email: 'b@b.com', phone: '321', business: { name: 'BizCo' }, requestSummary: 'طلب', createdAt: new Date().toISOString() }
    adminApi.getAdminCrmLeads.mockResolvedValueOnce({ data: [lead], pagination: { totalPages: 1 } })
    adminApi.getAdminCrmLeadById = jest.fn().mockResolvedValueOnce({ data: lead })

    // mock notes endpoint via apiCall
    const api = require('@/lib/api')
    api.apiCall = jest.fn().mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [{ id: 'n1', message: 'note', createdAt: new Date().toISOString(), author: { name: 'Agent' } }] })

    render(<AdminCrmView />)
    await waitFor(() => expect(adminApi.getAdminCrmLeads).toHaveBeenCalled())

    const viewBtn = await screen.findByText('عرض')
    fireEvent.click(viewBtn)

    await waitFor(() => expect(adminApi.getAdminCrmLeadById).toHaveBeenCalled())
    // Modal heading should be present
    expect(await screen.findByRole('heading', { name: 'LeadTwo' })).toBeInTheDocument()

    const input = screen.getByPlaceholderText('أضف ملاحظة...')
    fireEvent.change(input, { target: { value: 'New note' } })
    const addBtn = screen.getByText('إضافة')
    fireEvent.click(addBtn)

    await waitFor(() => expect(api.apiCall).toHaveBeenCalled())
  })

  test('bulk actions update statuses and assign', async () => {
    const lead1 = { id: 'l3', name: 'Lead3', email: 'c@c.com', phone: '111', businessName: 'BizCo', createdAt: new Date().toISOString() }
    const lead2 = { id: 'l4', name: 'Lead4', email: 'd@d.com', phone: '222', businessName: 'BizCo', createdAt: new Date().toISOString() }
    // return array form (component accepts either array or { data: [...] }) to be robust
    // use mockResolvedValue to ensure any subsequent calls also return the leads
    adminApi.getAdminCrmLeads.mockResolvedValue([lead1, lead2])
    adminApi.getAdminCrmStats.mockResolvedValue({ total: 2, businessesWithCrm: 1 })
    render(<AdminCrmView />)
    await waitFor(() => expect(adminApi.getAdminCrmLeads).toHaveBeenCalled())
    // wait for rows to render
    expect(await screen.findByText('Lead3')).toBeInTheDocument()

    // select both leads
    const checkboxes = await screen.findAllByRole('checkbox')
    // first checkbox is 'select all' - click it
    fireEvent.click(checkboxes[0])

    // choose bulk action to set status
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'status-CONTACTED' } })
    // execute
    const execBtn = screen.getByText('تنفيذ')
    fireEvent.click(execBtn)

    await waitFor(() => expect(adminApi.bulkUpdateCrmLeads).toHaveBeenCalledWith({ leadIds: [lead1.id, lead2.id], updates: { status: 'CONTACTED' } }))

    // test assign flow
    // select again (re-query checkboxes because the DOM was re-rendered)
    const newCheckboxes = await screen.findAllByRole('checkbox')
    fireEvent.click(newCheckboxes[0])
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'assign' } })
    // type into the user search box that appears for assign flow
    const userSearch = await screen.findByPlaceholderText('ابحث عن مستخدم...')
    fireEvent.change(userSearch, { target: { value: 'Agent' } })
    // wait for user list to be shown and pick agent
    expect(await screen.findByText('Agent One')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Agent One'))
    await waitFor(() => expect(adminApi.bulkUpdateCrmLeads).toHaveBeenCalledWith({ leadIds: [lead1.id, lead2.id], updates: { assignedTo: 'u1' } }))
  })

  test('assign picker fetches users and assigns', async () => {
    const lead = { id: 'l3', name: 'LeadThree', email: 'c@c.com', phone: '000', business: { name: 'BizCo' }, requestSummary: 'طلب', createdAt: new Date().toISOString() }
    adminApi.getAdminCrmLeads.mockResolvedValueOnce({ data: [lead], pagination: { totalPages: 1 } })
    adminApi.getAdminCrmLeadById = jest.fn().mockResolvedValueOnce({ data: lead })
    adminApi.getUsers = jest.fn().mockResolvedValueOnce({ data: [{ id: 'u1', name: 'Agent One', email: 'agent1@example.com' }] })

    const api = require('@/lib/api')
    api.apiCall = jest.fn().mockResolvedValueOnce({ success: true }) // notes fetch
    api.apiCall.mockResolvedValueOnce({ success: true }) // assign call

    render(<AdminCrmView />)
    await waitFor(() => expect(adminApi.getAdminCrmLeads).toHaveBeenCalled())

    const viewBtn = await screen.findByText('عرض')
    fireEvent.click(viewBtn)
    await waitFor(() => expect(adminApi.getAdminCrmLeadById).toHaveBeenCalled())

    // Open assign picker
    const assignBtn = await screen.findByText('تعيين')
    fireEvent.click(assignBtn)

    // Search for user
    const searchInput = await screen.findByPlaceholderText('ابحث عن مستخدم...')
    fireEvent.change(searchInput, { target: { value: 'Agent' } })

    // Click on user result
    const agent = await screen.findByText('Agent One')
    fireEvent.click(agent)

    await waitFor(() => expect(api.apiCall).toHaveBeenCalled())
  })
})
