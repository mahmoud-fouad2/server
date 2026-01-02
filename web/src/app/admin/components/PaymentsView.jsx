import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import GatewayEditForm from './GatewayEditForm'

export default function PaymentsView() {
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [gateways, setGateways] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [loadingGateways, setLoadingGateways] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ businessId: '', amount: '', currency: 'SAR', description: '', messageQuota: '', planType: '' })
  const addNotification = useAppStore(state => state.addNotification)

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const res = await adminApi.getInvoices({ search })
      setInvoices(res.data || [])
    } catch (err) {
      console.error('Failed to fetch invoices', err)
    } finally { setLoadingInvoices(false) }
  }

  const fetchInvoiceDetails = async (id) => {
    try {
      const res = await adminApi.getInvoice(id)
      setSelectedInvoice(res.data)
    } catch (err) {
      console.error('Failed to fetch invoice details', err)
    }
  }

  const fetchGateways = async () => {
    setLoadingGateways(true)
    try {
      const res = await adminApi.getPaymentGateways()
      // debug: ensure tests can observe what the API returned
      // eslint-disable-next-line no-console
      console.debug('fetchGateways result', res)
      setGateways(res.data || [])
    } catch (err) {
      console.error('Failed to fetch gateways', err)
    } finally { setLoadingGateways(false) }
  }

  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true)
    try {
      const res = await adminApi.getSubscriptions()
      setSubscriptions(res.data || [])
    } catch (err) {
      console.error('Failed to fetch subscriptions', err)
    } finally { setLoadingSubscriptions(false) }
  }

  useEffect(()=>{ fetchInvoices(); fetchGateways() }, [])
  useEffect(()=>{ fetchSubscriptions() }, [])

  const fetchBusinesses = async () => {
    try {
      const res = await adminApi.getBusinesses({ limit: 100 })
      setBusinesses(res.data || [])
    } catch (err) {
      console.error('Failed to fetch businesses', err)
    }
  }

  const toggleGatewayActive = async (g) => {
    const active = !g.isEnabled
    try {
      await adminApi.updatePaymentGateway(g.id, { isEnabled: active })
      fetchGateways()
    } catch (err) { console.error(err) }
  }

  const [editingGateway, setEditingGateway] = useState(null)

  const openEdit = (g) => setEditingGateway(g)

  const submitGatewayEdit = async (updates) => {
    try {
      await adminApi.updatePaymentGateway(editingGateway.id, updates)
      addNotification({ message: 'تم تحديث بوابة الدفع', type: 'success' })
      setEditingGateway(null)
      fetchGateways()
    } catch (err) {
      console.error('Failed to update gateway', err)
      addNotification({ message: err.message || 'فشل تحديث بوابة الدفع', type: 'error' })
    }
  }

  const openCreateModal = async () => {
    setShowCreateModal(true)
    // lazy load businesses
    if (businesses.length === 0) await fetchBusinesses()
  }

  const submitCreate = async () => {
    if (!form.businessId || !form.amount || !form.description) {
      addNotification({ message: 'businessId, amount and description are required', type: 'error' })
      return
    }
    setCreating(true)
    try {
      await adminApi.createCustomPayment({
        businessId: form.businessId,
        amount: parseFloat(form.amount),
        currency: form.currency,
        description: form.description,
        messageQuota: form.messageQuota ? parseInt(form.messageQuota) : undefined,
        planType: form.planType || undefined
      })
      addNotification({ message: 'تم إنشاء دفعة مخصصة بنجاح', type: 'success' })
      setShowCreateModal(false)
      setForm({ businessId: '', amount: '', currency: 'SAR', description: '', messageQuota: '', planType: '' })
      fetchInvoices()
      fetchSubscriptions()
    } catch (err) {
      console.error('Create custom payment failed', err)
      addNotification({ message: err.message || 'فشل إنشاء الدفعة', type: 'error' })
    } finally { setCreating(false) }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>الفواتير ({invoices.length})</CardTitle>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Input placeholder="بحث بالفاتورة/العميل..." className="w-full md:w-64 pr-10" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=> e.key==='Enter' && fetchInvoices()} />
            </div>
            <Button onClick={fetchInvoices}>بحث</Button>
            <Button variant="secondary" onClick={openCreateModal}>إنشاء دفعة مخصصة</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loadingInvoices ? <div className="p-6 text-center">جاري التحميل...</div> : (
              invoices.length === 0 ? <div className="p-6 text-center text-gray-500">لا توجد فواتير</div> : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium">رقم الفاتورة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">العميل</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">المبلغ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">تاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium"><button onClick={()=>fetchInvoiceDetails(inv.id)} className="text-blue-600 underline">{inv.number}</button></td>
                        <td className="px-4 py-4 text-sm">{inv.customerName || inv.customerEmail}</td>
                        <td className="px-4 py-4 text-sm">{inv.amount} {inv.currency}</td>
                        <td className="px-4 py-4 text-sm">{inv.status}</td>
                        <td className="px-4 py-4 text-sm">{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Gateway Modal */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">تعديل بوابة الدفع</h3>
              <button onClick={()=>setEditingGateway(null)} className="p-2">✕</button>
            </div>
            <GatewayEditForm gateway={editingGateway} onCancel={()=>setEditingGateway(null)} onSubmit={submitGatewayEdit} />
          </div>
        </div>
      )}

      {/* Create Custom Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">إنشاء دفعة مخصصة</h3>
              <button onClick={()=>setShowCreateModal(false)} className="p-2">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="create-business" className="block text-sm">العمل</label>
                <select id="create-business" className="w-full border p-2 rounded" value={form.businessId} onChange={e=>setForm({...form,businessId:e.target.value})}>
                  <option value="">اختَر عميل</option>
                  {businesses.map(b=> (<option key={b.id} value={b.id}>{b.name || b.id}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="create-amount" className="block text-sm">المبلغ</label>
                <Input id="create-amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
              </div>
              <div>
                <label htmlFor="create-currency" className="block text-sm">العملة</label>
                <Input id="create-currency" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} />
              </div>
              <div>
                <label htmlFor="create-description" className="block text-sm">الوصف</label>
                <Input id="create-description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              </div>
              <div>
                <label htmlFor="create-messageQuota" className="block text-sm">حصة الرسائل (اختياري)</label>
                <Input id="create-messageQuota" value={form.messageQuota} onChange={e=>setForm({...form,messageQuota:e.target.value})} />
              </div>
              <div>
                <label htmlFor="create-planType" className="block text-sm">نوع الخطة (اختياري)</label>
                <Input id="create-planType" value={form.planType} onChange={e=>setForm({...form,planType:e.target.value})} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={()=>setShowCreateModal(false)}>إلغاء</Button>
                <Button onClick={submitCreate} disabled={creating}>{creating ? 'جاري الإنشاء...' : 'إنشاء'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">تفاصيل الفاتورة #{selectedInvoice.number}</h3>
              <button onClick={()=>setSelectedInvoice(null)} className="p-2">✕</button>
            </div>
            <div className="space-y-2">
              <div>العميل: <strong>{selectedInvoice.customerName || selectedInvoice.customerEmail}</strong></div>
              <div>المبلغ: <strong>{selectedInvoice.amount} {selectedInvoice.currency}</strong></div>
              <div>الحالة: <strong>{selectedInvoice.status}</strong></div>
              <div>معلومات الدفع: <pre className="text-xs p-2 bg-gray-50 rounded">{JSON.stringify(selectedInvoice.gateway || {}, null, 2)}</pre></div>
              <div>الوصف: {selectedInvoice.customDescription}</div>
              <div className="text-right mt-4"><button onClick={()=>setSelectedInvoice(null)} className="px-4 py-2 bg-brand-600 text-white rounded">إغلاق</button></div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gateways الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGateways ? <div className="p-6 text-center">جاري التحميل...</div> : (
            gateways.length === 0 ? <div className="p-6 text-center text-gray-500">لا توجد بوابات دفع</div> : (
              <div className="space-y-4">
                {gateways.map(g => (
                  <div key={g.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium">{g.name} {g.hasApiKey ? <span className="ml-2 text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-800">مفتاح API: مُعيّن</span> : null}{g.hasSecretKey ? <span className="ml-2 text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-800">Secret: مُعيّن</span> : null}</div>
                      <div className="text-xs text-muted-foreground">{g.description}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className={`px-2 py-1 text-xs rounded ${g.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{g.isEnabled ? 'مفعلة' : 'موقوفة'}</div>
                      <Button onClick={()=>toggleGatewayActive(g)}>{g.isEnabled ? 'إيقاف' : 'تفعيل'}</Button>
                      <Button variant="ghost" onClick={()=>openEdit(g)}>تعديل</Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الاشتراكات</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSubscriptions ? <div className="p-6 text-center">جاري التحميل...</div> : (
            subscriptions.length === 0 ? <div className="p-6 text-center text-gray-500">لا توجد اشتراكات</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium">العمل</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">الخطة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">من تاريخ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium">حتى تاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm">{s.business?.name || s.businessId}</td>
                        <td className="px-4 py-4 text-sm">{s.planType}</td>
                        <td className="px-4 py-4 text-sm">{s.isActive ? 'نشطة' : 'منتهية'}</td>
                        <td className="px-4 py-4 text-sm">{new Date(s.startDate).toLocaleDateString('ar-EG')}</td>
                        <td className="px-4 py-4 text-sm">{new Date(s.endDate).toLocaleDateString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
