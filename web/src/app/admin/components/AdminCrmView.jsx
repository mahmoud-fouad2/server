import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adminApi, apiCall } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function AdminCrmView() {
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [stats, setStats] = useState({ total: 0, businessesWithCrm: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState([])

  const fetch = async () => {
    setLoading(true)
    try {
      const s = await adminApi.getAdminCrmStats()
      setStats(s || {})
      const res = await adminApi.getAdminCrmLeads({ search })
      setLeads(res.data || res || [])
    } catch (err) {
      console.error('Failed to fetch CRM data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async (id) => {
    if (!confirm('هل تريد حذف هذا العميل المحتمل؟')) return
    try {
      await adminApi.deleteAdminCrmLead(id)
      fetch()
    } catch (err) { console.error(err) }
  }

  const openLead = async (lead) => {
    setSelectedLead(lead)
    // fetch lead notes and include details
    try {
      const res = await adminApi.getAdminCrmLeadById(lead.id)
      setSelectedLead(res.data)
      // fetch notes via business endpoint
      const notesRes = await apiCall(`/api/crm/leads/${lead.id}/notes`)
      const notesList = notesRes && Array.isArray(notesRes.data) ? notesRes.data : (Array.isArray(notesRes) ? notesRes : [])
      setNotes(notesList)
    } catch (err) {
      console.error('Failed to open lead', err)
    }
  }

  const fetchUsers = async (query = '') => {
    try {
      const res = await adminApi.getUsers()
      const list = res && res.data ? res.data : res || []
      const filtered = list.filter(u => (u.name || u.email || '').toLowerCase().includes(query.toLowerCase()))
      setUserResults(filtered)
    } catch (err) {
      console.error('Failed to fetch users', err)
      setUserResults([])
    }
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    try {
      await apiCall(`/api/crm/leads/${selectedLead.id}/notes`, { method: 'POST', body: { message: noteText } })
      setNoteText('')
      // refresh notes
      const notesRes = await apiCall(`/api/crm/leads/${selectedLead.id}/notes`)
      const notesList = notesRes && Array.isArray(notesRes.data) ? notesRes.data : (Array.isArray(notesRes) ? notesRes : [])
      setNotes(notesList)
    } catch (err) { console.error(err) }
  }

  const updateStatus = async (newStatus) => {
    try {
      await apiCall(`/api/crm/leads/${selectedLead.id}/status`, { method: 'PUT', body: { status: newStatus } })
      // refresh lead
      const res = await adminApi.getAdminCrmLeadById(selectedLead.id)
      setSelectedLead(res.data)
      fetch()
    } catch (err) { console.error(err) }
  }

  const assignTo = async (userId) => {
    try {
      await apiCall(`/api/crm/leads/${selectedLead.id}/assign`, { method: 'PUT', body: { userId } })
      const res = await adminApi.getAdminCrmLeadById(selectedLead.id)
      setSelectedLead(res.data)
      fetch()
    } catch (err) { console.error(err) }
  }

  const handleBulkAssign = async (userId) => {
    try {
      await adminApi.bulkUpdateCrmLeads({ leadIds: selectedIds, updates: { assignedTo: userId } })
      setSelectedIds([])
      setBulkAction('')
      fetch()
    } catch (err) { console.error(err) }
  }

  const handleBulkAction = async () => {
    try {
      if (bulkAction.startsWith('status-')) {
        const status = bulkAction.split('-')[1]
        await adminApi.bulkUpdateCrmLeads({ leadIds: selectedIds, updates: { status } })
        setSelectedIds([])
        setBulkAction('')
        fetch()
      }
    } catch (err) { console.error(err) }
  }

  return (
    <Card className="border-none shadow-md bg-white dark:bg-gray-800">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>CRM - العملاء المحتملون</CardTitle>
        <div className="flex gap-2 items-center">
          <Input placeholder="ابحث عن اسم أو بريد..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=> e.key==='Enter' && fetch()} className="w-64" />
          <Button onClick={fetch} className="bg-brand-600 hover:bg-brand-700">بحث</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">المجموع: <strong>{stats.total}</strong></div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">شركات مع CRM: <strong>{stats.businessesWithCrm}</strong></div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">لا توجد عملاء محتملين</div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-right text-xs text-gray-500"><input type="checkbox" onChange={e=>{ if (e.target.checked) setSelectedIds(leads.map(l=>l.id)); else setSelectedIds([]) }} checked={selectedIds.length===leads.length && leads.length>0} /></th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">الاسم</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">البريد</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">الهاتف</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">الشركة</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">التاريخ</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(l.id)} onChange={e=>{ if (e.target.checked) setSelectedIds(prev=>[...prev, l.id]); else setSelectedIds(prev=>prev.filter(id=>id!==l.id)) }} /></td>
                    <td className="px-4 py-3 text-sm">{l.name}</td>
                    <td className="px-4 py-3 text-sm">{l.email}</td>
                    <td className="px-4 py-3 text-sm">{l.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm">{l.business?.name || l.businessName}</td>
                    <td className="px-4 py-3 text-sm">{new Date(l.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button onClick={()=>openLead(l)} className="text-blue-600">عرض</button>
                        <button onClick={()=>handleDelete(l.id)} className="text-red-600">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <select value={bulkAction} onChange={e=>setBulkAction(e.target.value)} className="px-2 py-1 border rounded">
              <option value="">إجراءات جماعية</option>
              <option value="assign">تعيين لمستخدم</option>
              <option value="status-NEW">تعيين الحالة: جديد</option>
              <option value="status-CONTACTED">تعيين الحالة: تم التواصل</option>
              <option value="status-QUALIFIED">تعيين الحالة: مؤهل</option>
              <option value="status-LOST">تعيين الحالة: مفقود</option>
              <option value="status-WON">تعيين الحالة: تم التعامل</option>
            </select>
            {bulkAction === 'assign' && (
              <div className="flex items-center gap-2">
                <input placeholder="ابحث عن مستخدم..." value={userSearch} onChange={e=>{ setUserSearch(e.target.value); fetchUsers(e.target.value) }} className="px-2 py-1 border rounded" />
                <div className="max-h-40 overflow-auto w-64 bg-white rounded border">
                  {userResults.map(u=> (
                    <div key={u.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>{ handleBulkAssign(u.id) }}>{u.name || u.email}</div>
                  ))}
                </div>
              </div>
            )}
            <button className="px-3 py-1 bg-brand-600 text-white rounded" onClick={handleBulkAction}>تنفيذ</button>
          </div>
          </>
        )}

        {/* Lead detail modal */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-11/12 md:w-3/4 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{selectedLead.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedLead.email} • {selectedLead.phone}</p>
                </div>
                <div className="flex gap-2">
                  <select value={selectedLead.status} onChange={(e)=>updateStatus(e.target.value)} className="rounded-md border px-2 py-1">
                    <option value="NEW">جديد</option>
                    <option value="CONTACTED">تم التواصل</option>
                    <option value="QUALIFIED">مؤهل</option>
                    <option value="LOST">مفقود</option>
                    <option value="WON">تم التعامل</option>
                  </select>
                  <button onClick={()=>setSelectedLead(null)} className="px-3 py-1 bg-gray-200 rounded-md">إغلاق</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <h4 className="font-medium">الطلب</h4>
                  <p className="mt-2">{selectedLead.requestSummary}</p>
                </div>
                <div>
                  <h4 className="font-medium">التعيين</h4>
                  <p className="mt-2">{selectedLead.assigned?.name || 'غير معين'}</p>
                    <div className="mt-2">
                      <button onClick={()=>assignTo(null)} className="text-sm text-blue-600">إلغاء التعيين</button>
                      <button onClick={() => { setShowPicker(!showPicker); fetchUsers(''); }} className="text-sm text-green-600 ml-3">تعيين</button>
                      {showPicker && (
                        <div className="mt-2 p-2 border rounded bg-white dark:bg-gray-700">
                          <input placeholder="ابحث عن مستخدم..." value={userSearch} onChange={e=>{ setUserSearch(e.target.value); fetchUsers(e.target.value) }} className="w-full px-2 py-1 border rounded" />
                          <div className="max-h-40 overflow-auto mt-2">
                            {userResults.length === 0 ? <div className="text-sm text-muted-foreground">لا توجد نتائج</div> : userResults.map(u => (
                              <div key={u.id} className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={()=>{ assignTo(u.id); setShowPicker(false); }}>
                                <div className="text-sm font-medium">{u.name || u.email}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">الملاحظات</h4>
                <div className="space-y-2 max-h-48 overflow-auto mb-2">
                  {notes.length === 0 ? <div className="text-sm text-muted-foreground">لا توجد ملاحظات</div> : notes.map(n => (
                    <div key={n.id} className="p-3 bg-gray-50 rounded">
                      <div className="text-xs text-muted-foreground">{n.author?.name || 'نظام'} • {new Date(n.createdAt).toLocaleString('ar-EG')}</div>
                      <div className="mt-1 text-sm">{n.message}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="أضف ملاحظة..." className="flex-1 px-3 py-2 border rounded" />
                  <button onClick={addNote} className="px-4 py-2 bg-brand-600 text-white rounded">إضافة</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
