"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token')
      try {
        const res = await fetch('https://fahimo-api.onrender.com/api/business/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setSettings(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <div className="min-h-screen bg-background font-sans flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">إعدادات البوت</h1>
        
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>معلومات العمل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم العمل</label>
                  <Input defaultValue={settings?.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع النشاط</label>
                  <Input defaultValue={settings?.activityType} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تخصيص البوت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">نبرة الصوت</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="friendly">ودود (Friendly)</option>
                    <option value="formal">رسمي (Formal)</option>
                    <option value="funny">مرح (Funny)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">اللون الرئيسي</label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#003366] cursor-pointer ring-2 ring-offset-2 ring-primary"></div>
                    <div className="w-8 h-8 rounded-full bg-purple-600 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-green-600 cursor-pointer"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button>حفظ التغييرات</Button>
          </div>
        )}
      </main>
    </div>
  )
}
