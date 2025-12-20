import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/lib/api', () => ({
  widgetApi: {
    getConfig: jest.fn().mockResolvedValue({ widgetConfig: {} }),
    uploadIcon: jest.fn(),
    updateConfig: jest.fn().mockResolvedValue({}),
  },
  businessApi: {
    updatePreChatSettings: jest.fn().mockResolvedValue({}),
  },
}))

import WidgetSettingsView from '../WidgetSettingsView'
import { widgetApi } from '@/lib/api'

describe('WidgetSettingsView', () => {
  const defaultProps = {
    user: { businessId: 'b1' },
    addNotification: jest.fn(),
    setShowProAlert: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('uploads a valid image and notifies success', async () => {
    widgetApi.uploadIcon.mockResolvedValueOnce({ iconUrl: 'http://example.com/icon.png' })

    render(<WidgetSettingsView {...defaultProps} />)

    // Wait for initial getConfig
    await waitFor(() => expect(widgetApi.getConfig).toHaveBeenCalled())

    const input = screen.getByLabelText('Upload widget icon')

    // Create a small image file
    const file = new File(['image-content'], 'icon.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(defaultProps.addNotification).toHaveBeenCalledWith('تم رفع الأيقونة بنجاح وحفظها'))
  })

  test('rejects non-image file types', async () => {
    render(<WidgetSettingsView {...defaultProps} />)

    await waitFor(() => expect(widgetApi.getConfig).toHaveBeenCalled())

    const input = screen.getByLabelText('Upload widget icon')
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(defaultProps.addNotification).toHaveBeenCalledWith('الملف يجب أن يكون صورة', 'error'))
  })

  test('rejects large files (>2MB)', async () => {
    render(<WidgetSettingsView {...defaultProps} />)

    await waitFor(() => expect(widgetApi.getConfig).toHaveBeenCalled())

    const input = screen.getByLabelText('Upload widget icon')
    // Create a blob larger than 2MB
    const largeBlob = new Blob([new ArrayBuffer(3 * 1024 * 1024)], { type: 'image/png' })
    const largeFile = new File([largeBlob], 'large.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [largeFile] } })

    await waitFor(() => expect(defaultProps.addNotification).toHaveBeenCalledWith('حجم الملف كبير جداً (الحد الأقصى 2MB)', 'error'))
  })
})
