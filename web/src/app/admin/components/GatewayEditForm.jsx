import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function GatewayEditForm({ gateway, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    name: gateway.name || '',
    displayName: gateway.displayName || '',
    description: gateway.description || '',
    icon: gateway.icon || '',
    isEnabled: gateway.isEnabled || false,
    isActive: gateway.isActive || false,
    apiKey: '',
    secretKey: ''
  })
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Only include apiKey/secretKey if non-empty to avoid overwriting
    const shouldConfirmKeys = (form.apiKey && form.apiKey.trim() !== '') || (form.secretKey && form.secretKey.trim() !== '')
    const payload = {
      name: form.name,
      displayName: form.displayName,
      description: form.description,
      icon: form.icon,
      isEnabled: form.isEnabled,
      isActive: form.isActive
    }
    if (form.apiKey && form.apiKey.trim() !== '') payload.apiKey = form.apiKey
    if (form.secretKey && form.secretKey.trim() !== '') payload.secretKey = form.secretKey

    if (shouldConfirmKeys && !showConfirm) {
      // store payload and show modal for explicit confirmation
      setPendingPayload(payload)
      setShowConfirm(true)
      return
    }

    onSubmit(payload)
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="gw-name" className="block text-sm">الاسم</label>
        <Input id="gw-name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
      </div>
      <div>
        <label htmlFor="gw-displayName" className="block text-sm">عرض الاسم</label>
        <Input id="gw-displayName" value={form.displayName} onChange={e=>setForm({...form, displayName: e.target.value})} />
      </div>
      <div>
        <label htmlFor="gw-description" className="block text-sm">الوصف</label>
        <Input id="gw-description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
      </div>
      <div>
        <label htmlFor="gw-icon" className="block text-sm">ايقونة (URL)</label>
        <Input id="gw-icon" value={form.icon} onChange={e=>setForm({...form, icon: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <input type="checkbox" checked={form.isEnabled} onChange={e=>setForm({...form, isEnabled: e.target.checked})} /> <span className="mr-2">مفعل</span>
        </label>
        <label className="block text-sm">
          <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form, isActive: e.target.checked})} /> <span className="mr-2">نشط</span>
        </label>
      </div>
      <div>
        <label htmlFor="gw-apiKey" className="block text-sm">API Key (سيتم تغييره فقط عند ملئه)</label>
        <Input id="gw-apiKey" type="password" value={form.apiKey} onChange={e=>setForm({...form, apiKey: e.target.value})} />
        {gateway.hasApiKey && !form.apiKey && <div className="text-xs text-gray-500 mt-1">مفتاح API: مُعيّن (مخفي — املأ الحقل لاستبداله)</div>}
      </div>
      <div>
        <label htmlFor="gw-secretKey" className="block text-sm">Secret Key (سيتم تغييره فقط عند ملئه)</label>
        <Input id="gw-secretKey" type="password" value={form.secretKey} onChange={e=>setForm({...form, secretKey: e.target.value})} />
        {gateway.hasSecretKey && !form.secretKey && <div className="text-xs text-gray-500 mt-1">Secret Key: مُعيّن (مخفي — املأ الحقل لاستبداله)</div>}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} type="button">إلغاء</Button>
        <Button type="submit">حفظ</Button>
      </div>
    </form>
    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
          <h3 className="text-lg font-bold mb-2">تأكيد تحديث المفاتيح</h3>
          <p className="text-sm mb-4">أدخلت مفاتيح جديدة. استبدال مفاتيح البوابة سيؤدي إلى تغيير طريقة تكامل بوابة الدفع — هل تريد المتابعة؟</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={()=>{ setShowConfirm(false); setPendingPayload(null); }}>إلغاء</Button>
            <Button onClick={()=>{ if (pendingPayload) { onSubmit(pendingPayload); setShowConfirm(false); setPendingPayload(null); } }}>تأكيد</Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
