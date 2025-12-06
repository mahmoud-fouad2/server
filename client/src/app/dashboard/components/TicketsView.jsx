import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Headphones, User, Share2, Loader2 } from 'lucide-react';
import { ticketApi } from '@/lib/api';

export default function TicketsView({ addNotification }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'MEDIUM',
  });
  const [ticketReply, setTicketReply] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await ticketApi.list();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async e => {
    e.preventDefault();
    setCreatingTicket(true);
    try {
      await ticketApi.create(newTicket);
      addNotification('تم إنشاء التذكرة بنجاح');
      setNewTicket({ subject: '', message: '', priority: 'MEDIUM' });
      fetchTickets();
      setSelectedTicket(null); // Go back to list
    } catch (err) {
      addNotification('فشل إنشاء التذكرة', 'error');
    } finally {
      setCreatingTicket(false);
    }
  };

  const selectTicket = async ticket => {
    setSelectedTicket(ticket);
    try {
      const data = await ticketApi.get(ticket.id);
      setTicketMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const sendTicketReply = async e => {
    e.preventDefault();
    if (!ticketReply.trim()) return;
    try {
      const newMsg = await ticketApi.reply(selectedTicket.id, ticketReply);
      setTicketMessages(prev => [...prev, newMsg]);
      setTicketReply('');
    } catch (err) {
      addNotification('فشل الإرسال', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]"
    >
      {/* Tickets List & Create */}
      <Card className="lg:col-span-1 flex flex-col h-full">
        <CardHeader>
          <CardTitle>تذاكر الدعم</CardTitle>
          <CardDescription>تواصل مع فريق الدعم الفني</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <Button
            className="w-full mb-4"
            onClick={() => setSelectedTicket(null)}
          >
            <Plus className="w-4 h-4 ml-2" /> تذكرة جديدة
          </Button>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تذاكر
            </div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => selectTicket(ticket)}
                className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedTicket?.id === ticket.id ? 'bg-brand-500/10 border-brand-500' : 'bg-card hover:bg-muted border-border'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm truncate">
                    {ticket.subject}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      ticket.status === 'OPEN'
                        ? 'bg-green-100 text-green-700'
                        : ticket.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {new Date(ticket.updatedAt).toLocaleDateString('ar-SA')}
                  </span>
                  <span
                    className={`font-medium ${ticket.priority === 'URGENT' ? 'text-red-500' : ''}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail / Create Form */}
      <Card className="lg:col-span-2 flex flex-col h-full">
        {!selectedTicket ? (
          <div className="p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-6">إنشاء تذكرة جديدة</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">الموضوع</label>
                <Input
                  required
                  value={newTicket.subject}
                  onChange={e =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  placeholder="عنوان المشكلة"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الأولوية</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={newTicket.priority}
                  onChange={e =>
                    setNewTicket({ ...newTicket, priority: e.target.value })
                  }
                >
                  <option value="LOW">منخفضة</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="HIGH">عالية</option>
                  <option value="URGENT">عاجلة</option>
                </select>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">تفاصيل المشكلة</label>
                <textarea
                  required
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newTicket.message}
                  onChange={e =>
                    setNewTicket({ ...newTicket, message: e.target.value })
                  }
                  placeholder="اشرح مشكلتك بالتفصيل..."
                ></textarea>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={creatingTicket}
              >
                {creatingTicket ? (
                  <Loader2 className="animate-spin ml-2" />
                ) : (
                  'إرسال التذكرة'
                )}
              </Button>
            </form>
          </div>
        ) : (
          <>
            <CardHeader className="border-b py-4 bg-muted/30">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {selectedTicket.subject}
                  </CardTitle>
                  <CardDescription>
                    تذكرة #{selectedTicket.id.slice(-4)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedTicket.status === 'OPEN'
                        ? 'bg-green-100 text-green-700'
                        : selectedTicket.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
              {ticketMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.isAdmin ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-700'}`}
                  >
                    {msg.isAdmin ? (
                      <Headphones className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] space-y-1`}>
                    <div
                      className={`flex items-center gap-2 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}
                    >
                      <span className="text-xs font-bold">
                        {msg.sender?.name ||
                          (msg.isAdmin ? 'الدعم الفني' : 'أنت')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString('ar-SA')}
                      </span>
                    </div>
                    <div
                      className={`p-4 rounded-xl shadow-sm text-sm leading-relaxed ${msg.isAdmin ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-border rounded-tl-none'}`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t p-4 bg-background">
              <form onSubmit={sendTicketReply} className="flex w-full gap-3">
                <Input
                  value={ticketReply}
                  onChange={e => setTicketReply(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  className="flex-1 bg-muted/50"
                  disabled={selectedTicket.status === 'CLOSED'}
                />
                <Button
                  type="submit"
                  disabled={
                    !ticketReply.trim() || selectedTicket.status === 'CLOSED'
                  }
                >
                  <Share2 className="w-4 h-4 ml-2" /> إرسال
                </Button>
              </form>
            </CardFooter>
          </>
        )}
      </Card>
    </motion.div>
  );
}
