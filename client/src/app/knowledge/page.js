"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Check, Loader2 } from "lucide-react"

export default function KnowledgePage() {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setMessage("")
    
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      
      if (res.ok) {
        setMessage("تم رفع الملف بنجاح! سيتم تدريب البوت عليه فوراً.")
      } else {
        setMessage("فشل الرفع. حاول مرة أخرى.")
      }
    } catch (error) {
      setMessage("حدث خطأ أثناء الرفع.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">قاعدة المعرفة</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة مصدر جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:bg-muted/50 transition-colors relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleUpload}
                  accept=".pdf,.txt"
                  disabled={uploading}
                />
                <div className="flex flex-col items-center gap-4">
                  {uploading ? (
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-lg">اضغط لرفع ملف PDF أو Text</p>
                    <p className="text-sm text-muted-foreground">الحد الأقصى 10 ميجابايت</p>
                  </div>
                </div>
              </div>
              {message && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${message.includes('نجاح') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {message.includes('نجاح') && <Check className="w-4 h-4" />}
                  {message}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المصادر الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">قائمة الملفات التي تم تدريب البوت عليها ستظهر هنا قريباً.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
