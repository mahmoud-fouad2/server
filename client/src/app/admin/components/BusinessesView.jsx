import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Briefcase, Edit, Trash2 } from 'lucide-react'
import { adminApi } from '@/lib/api'

export default function BusinessesView() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetch = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, ...(search ? { search } : {}) }
      const res = await adminApi.getBusinesses(params)
      setBusinesses(res.data || [])
      setTotalPages(res.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch businesses', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [page])

  const handleSearch = async () => { setPage(1); fetch() }

  const handleActivate = async (id) => {
    if (!confirm('هل تريد تفعيل/إلغاء تفعيل هذه الشركة؟')) return
    try {
      await adminApi.activateBusiness(id)
      fetch()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل تريد حذف هذه الشركة؟')) return
    try {
      await adminApi.deleteBusiness(id)
      fetch()
    } catch (err) { console.error(err) }
  }

  return (
    <Card className="border-none shadow-md bg-white dark:bg-gray-800">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>قائمة الشركات ({businesses.length})</CardTitle>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="بحث عن شركة..." className="w-full md:w-64 pr-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=> e.key==='Enter' && handleSearch()} />
          </div>
          <Button className="bg-brand-600 hover:bg-brand-700" onClick={()=>router.push('/admin/businesses/create')}>➕ إضافة شركة</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">جاري التحميل...</div>
          ) : businesses.length === 0 ? (
            <div className="p-12 text-center text-gray-500">لا توجد شركات</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الشركة</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المالك</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الباقة</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businesses.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">{b.name}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{b.ownerName || b.ownerEmail}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">{b.planType}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${b.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{b.isActive ? 'نشطة' : 'معطلة'}</span></td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(b.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex gap-2"><button onClick={()=>router.push(`/admin/businesses/${b.id}`)} className="text-blue-600">عرض</button><button onClick={()=>router.push(`/admin/businesses/${b.id}/edit`)} className="text-green-600">تعديل</button><button onClick={()=>handleActivate(b.id)} className="text-yellow-600">تفعيل/إيقاف</button><button onClick={()=>handleDelete(b.id)} className="text-red-600">حذف</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-600">صفحة {page} من {totalPages}</div>
            <div className="flex gap-2">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 border rounded-lg">← السابق</button>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-4 py-2 border rounded-lg">التالي →</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
