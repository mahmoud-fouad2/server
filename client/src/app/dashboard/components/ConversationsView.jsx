import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Bot, MessageSquare, Loader2 } from "lucide-react"
import { chatApi } from "@/lib/api"

export default function ConversationsView() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [conversationMessages, setConversationMessages] = useState([])
  const [replyInput, setReplyInput] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const data = await chatApi.getConversations()
      setConversations(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conv) => {
    setSelectedConversation(conv)
    try {
      const messages = await chatApi.getMessages(conv.id)
      setConversationMessages(messages)
    } catch (err) {
      console.error(err)
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!replyInput.trim() || !selectedConversation) return
    setSendingReply(true)
    try {
      const newMsg = await chatApi.reply(selectedConversation.id, replyInput)
      setConversationMessages(prev => [...prev, newMsg])
      setReplyInput("")
    } catch (err) {
      console.error("Failed to send reply", err)
      // Ideally show notification here
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
      {/* Conversations List */}
      <Card className="lg:col-span-1 flex flex-col h-full">
        <CardHeader>
          <CardTitle>المحادثات النشطة</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد محادثات</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => selectConversation(conv)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${selectedConversation?.id === conv.id ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-muted'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">زائر #{conv.id.slice(-4)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {conv.messages[0]?.content || 'لا توجد رسائل'}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="lg:col-span-2 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <CardHeader className="border-b py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">زائر #{selectedConversation.id.slice(-4)}</CardTitle>
                  <CardDescription className="text-xs">عبر {selectedConversation.channel}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
              {conversationMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'ASSISTANT' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ASSISTANT' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {msg.role === 'ASSISTANT' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.role === 'ASSISTANT' ? 'bg-brand-500 text-white rounded-tl-none' : 'bg-white dark:bg-gray-800 border border-border rounded-tr-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t p-3">
              <form onSubmit={sendReply} className="flex w-full gap-2">
                <Input 
                  value={replyInput} 
                  onChange={(e) => setReplyInput(e.target.value)} 
                  placeholder="اكتب ردك هنا..." 
                  className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <Button type="submit" disabled={sendingReply || !replyInput.trim()}>
                  {sendingReply ? <Loader2 className="animate-spin" /> : 'إرسال'}
                </Button>
              </form>
            </CardFooter>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>اختر محادثة للبدء</p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
