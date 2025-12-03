import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Trash2, Loader2 } from "lucide-react"
import { teamApi } from "@/lib/api"

export default function TeamView({ addNotification }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '' })
  const [addingMember, setAddingMember] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const data = await teamApi.list()
      setTeamMembers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAddingMember(true)
    try {
      await teamApi.add(newMember)
      addNotification("تم إضافة الموظف بنجاح")
      setNewMember({ name: '', email: '', password: '' })
      fetchTeamMembers()
    } catch (err) {
      addNotification(err.message || "فشل الإضافة", 'error')
    } finally {
      setAddingMember(false)
    }
  }

  const handleDeleteMember = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return
    try {
      await teamApi.delete(id)
      addNotification("تم الحذف بنجاح")
      fetchTeamMembers()
    } catch (err) {
      addNotification("فشل الحذف", 'error')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">فريق العمل</h2>
          <p className="text-muted-foreground">إدارة موظفي خدمة العملاء والصلاحيات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Add Member Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>إضافة موظف جديد</CardTitle>
            <CardDescription>سيتم إرسال بيانات الدخول للموظف</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الاسم</label>
                <Input 
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="اسم الموظف"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <Input 
                  required
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="email@example.com"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">كلمة المرور</label>
                <Input 
                  required
                  type="password"
                  value={newMember.password}
                  onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                  placeholder="******"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <Button type="submit" className="w-full" disabled={addingMember}>
                {addingMember ? <Loader2 className="animate-spin ml-2" /> : <User className="ml-2 w-4 h-4" />}
                إضافة الموظف
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>الموظفين الحاليين ({teamMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا يوجد موظفين حالياً
                </div>
              ) : (
                teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-right hidden sm:block">
                        <div className="font-bold text-brand-500">AGENT</div>
                        <div className="text-xs text-muted-foreground">منذ {new Date(member.createdAt).toLocaleDateString('ar-SA')}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
