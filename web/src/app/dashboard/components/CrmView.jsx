import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Search,
  Users,
  AlertCircle,
  Plus,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';
import { businessApi, crmApi } from '@/lib/api-client';

export default function CrmView({ user, addNotification }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crmEnabled, setCrmEnabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    requestSummary: ''
  });

  useEffect(() => {
    checkCrmStatus();
  }, []);

  useEffect(() => {
    if (crmEnabled) {
      fetchLeads();
    }
  }, [crmEnabled, searchTerm, startDate, endDate]);

  const checkCrmStatus = async () => {
    try {
      const response = await crmApi.getCrmStatus();
      setCrmEnabled(response.enabled);
      setLoading(false);
    } catch (error) {
      console.error('CRM status check error:', error);
      setCrmEnabled(false);
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await crmApi.getLeads(params);
      setLeads(response.leads || []);
    } catch (error) {
      console.error('Fetch leads error:', error);
      addNotification('فشل في تحميل بيانات العملاء', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await crmApi.exportLeads(params);
      const content = response.raw || response;
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crm-leads.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      addNotification('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addNotification('فشل في تصدير البيانات', 'error');
    }
  };

  const handleAddLead = async () => {
    try {
      await crmApi.createLead(newLead);

      addNotification('تم إضافة العميل بنجاح', 'success');
      setNewLead({ name: '', email: '', phone: '', requestSummary: '' });
      setShowAddLead(false);
      fetchLeads();
    } catch (error) {
      console.error('Add lead error:', error);
      addNotification('فشل في إضافة العميل', 'error');
    }
  };

  if (!crmEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة العملاء</h1>
            <p className="text-muted-foreground mt-2">
              نظام إدارة علاقات العملاء المتقدم
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">الخدمة غير مفعلة</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              نظام إدارة العملاء غير مفعل حالياً. يرجى التواصل مع الدعم الفني لتفعيل هذه الخدمة.
            </p>
            <Button
              onClick={() => addNotification('تم إرسال طلب التفعيل للدعم الفني', 'info')}
              className="bg-brand-500 hover:bg-brand-600"
            >
              طلب التفعيل
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة العملاء</h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة بيانات العملاء المحتملين
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddLead(true)}
            className="bg-brand-500 hover:bg-brand-600"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة عميل
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
          >
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الأسماء..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              placeholder="من تاريخ"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="إلى تاريخ"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
              }}
              variant="outline"
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="w-8 h-8 text-brand-500 ml-4" />
            <div>
              <p className="text-2xl font-bold">{leads.length}</p>
              <p className="text-muted-foreground">إجمالي العملاء</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="w-8 h-8 text-green-500 ml-4" />
            <div>
              <p className="text-2xl font-bold">
                {leads.filter(l => {
                  const today = new Date();
                  const leadDate = new Date(l.createdAt);
                  return leadDate.toDateString() === today.toDateString();
                }).length}
              </p>
              <p className="text-muted-foreground">عملاء اليوم</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Mail className="w-8 h-8 text-blue-500 ml-4" />
            <div>
              <p className="text-2xl font-bold">
                {leads.filter(l => l.email).length}
              </p>
              <p className="text-muted-foreground">لديهم بريد إلكتروني</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
          <CardDescription>
            جميع العملاء المحتملين المسجلين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-muted-foreground/30 border-t-brand-600" />
                <p className="text-sm">جارِ تحميل البيانات…</p>
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">لا توجد بيانات عملاء</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="text-right p-3 font-semibold">الاسم</th>
                    <th className="text-right p-3 font-semibold">البريد الإلكتروني</th>
                    <th className="text-right p-3 font-semibold">الهاتف</th>
                    <th className="text-right p-3 font-semibold">ملخص الطلب</th>
                    <th className="text-right p-3 font-semibold">المصدر</th>
                    <th className="text-right p-3 font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-border/70 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}
                    >
                      <td className="p-3 font-medium">{lead.name}</td>
                      <td className="p-3">
                        {lead.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {lead.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {lead.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {lead.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs truncate" title={lead.requestSummary || ''}>
                        {lead.requestSummary || '-'}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">
                          {lead.source === 'PRE_CHAT_FORM' ? 'نموذج ما قبل المحادثة' : 'إدخال يدوي'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {new Date(lead.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Lead Modal would go here */}
    </motion.div>
  );
}