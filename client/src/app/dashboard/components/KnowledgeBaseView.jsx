import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Globe,
  Upload,
  Trash2,
  Zap,
  Loader2,
  Save,
  Sparkles,
  AlertTriangle,
  Edit2,
  X,
} from 'lucide-react';
import { knowledgeApi } from '@/lib/api';

export default function KnowledgeBaseView({ addNotification }) {
  const [kbList, setKbList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [kbTab, setKbTab] = useState('text');
  const [loading, setLoading] = useState(true);
  const [editingKb, setEditingKb] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [kbShowAll, setKbShowAll] = useState(false);
  const [textErrors, setTextErrors] = useState([]);
  const [urlErrors, setUrlErrors] = useState([]);

  useEffect(() => {
    fetchKbList();
  }, []);

  const fetchKbList = async () => {
    try {
      const data = await knowledgeApi.list();
      setKbList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await knowledgeApi.upload(formData);
      addNotification('تم رفع الملف بنجاح');
      fetchKbList();
      e.target.value = null;
    } catch (err) {
      addNotification(`فشل الرفع: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput) return;
    // Client-side validation: match server rules (min 10 chars)
    if (textInput.trim().length < 10) {
      setTextErrors([{ field: 'text', message: 'النص قصير جداً — مطلوب 10 أحرف على الأقل' }]);
      addNotification('النص قصير جداً — مطلوب 10 أحرف على الأقل', 'error');
      return;
    }
    setUploading(true);
    setTextErrors([]);
    try {
      await knowledgeApi.addText({ text: textInput, title: textTitle });
      addNotification('تم إضافة النص بنجاح');
      setTextInput('');
      setTextTitle('');
      fetchKbList();
    } catch (err) {
      // If server returned validation details, surface them under the field
      if (err && err.data && Array.isArray(err.data.details)) {
        setTextErrors(err.data.details);
        // Show a compact notification too (guard if details array is empty)
        const first = err.data.details.length > 0 ? err.data.details[0] : null;
        if (first) {
          addNotification(`فشل: ${first.field ? first.field + ': ' : ''}${first.message}`, 'error');
        } else {
          addNotification(`فشل: ${err.message || 'خطأ في التحقق من الصحة'}`, 'error');
        }
      } else {
        // Log server validation shape for debugging
        console.error('Knowledge addText error', err);
        addNotification(`فشل: ${err.message}`, 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput) return;
    // Basic client-side URL validation to prevent pointless 400s
    try {
      const test = new URL(urlInput);
      if (!['http:', 'https:'].includes(test.protocol)) throw new Error('Invalid protocol');
    } catch (e) {
      setUrlErrors([{ field: 'url', message: 'رابط غير صالح' }]);
      addNotification('رابط غير صالح', 'error');
      return;
    }
    setUploading(true);
    setUrlErrors([]);
    try {
      await knowledgeApi.addUrl({ url: urlInput });
      addNotification('تم استجلاب الرابط بنجاح');
      setUrlInput('');
      fetchKbList();
    } catch (err) {
      if (err && err.data && Array.isArray(err.data.details)) {
        setUrlErrors(err.data.details);
        const first = err.data.details.length > 0 ? err.data.details[0] : null;
        if (first) {
          addNotification(`فشل: ${first.field ? first.field + ': ' : ''}${first.message}`, 'error');
        } else {
          addNotification(`فشل: ${err.message || 'خطأ في التحقق من الصحة'}`, 'error');
        }
      } else {
        console.error('Knowledge addUrl error', err);
        addNotification(`فشل: ${err.message}`, 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteKb = async id => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await knowledgeApi.delete(id);
      fetchKbList();
      addNotification('تم الحذف بنجاح');
    } catch (err) {
      addNotification('فشل الحذف', 'error');
    }
  };

  const handleEditKb = kb => {
    setEditingKb(kb);
    setEditContent(kb.content);
    setEditTitle(kb.metadata?.title || '');
  };

  const handleUpdateKb = async () => {
    if (!editContent || !editingKb) return;
    setUploading(true);
    try {
      await knowledgeApi.update(editingKb.id, {
        content: editContent,
        metadata: { ...editingKb.metadata, title: editTitle },
      });
      addNotification('تم التحديث بنجاح');
      setEditingKb(null);
      setEditContent('');
      setEditTitle('');
      fetchKbList();
    } catch (err) {
      addNotification(`فشل التحديث: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const extractTitleFromContent = (kb) => {
    // Prefer metadata title/filename/url; otherwise take first meaningful piece of content
    if (!kb) return '';
    const metaTitle = kb.metadata?.title || kb.metadata?.filename || kb.metadata?.url;
    if (metaTitle) return metaTitle;
    if (kb.content) {
      // Strip newlines and reduce whitespace
      const text = kb.content.replace(/\s+/g, ' ').trim();
      if (!text) return '';
      // Return first 60 characters or until sentence end
      const end = text.indexOf('. ');
      if (end > 10 && end < 120) return text.slice(0, end + 1);
      return text.slice(0, 60) + (text.length > 60 ? '...' : '');
    }
    return '';
  };

  return (
    <>
      {/* Edit Modal */}
      {editingKb && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setEditingKb(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-500" />
                تعديل المصدر
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingKb(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  العنوان
                </label>
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="bg-white dark:bg-gray-800 border-border text-gray-900 dark:text-white"
                  placeholder="عنوان المصدر"
                />
              </div>
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  المحتوى
                </label>
                <textarea
                  className="w-full p-4 rounded-xl border border-border bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm leading-relaxed focus:ring-2 focus:ring-brand-500/20 outline-none min-h-[300px]"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingKb(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleUpdateKb}
                disabled={uploading || !editContent}
                className="flex-1"
              >
                {uploading ? (
                  <Loader2 className="animate-spin ml-2" />
                ) : (
                  <Save className="ml-2 w-4 h-4" />
                )}
                حفظ التعديلات
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[60vh] lg:h-[calc(100vh-250px)]"
      >
        {/* Left Column: Active Sources */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              المصادر النشطة ({kbList.length})
            </CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {kbList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">قاعدة المعرفة فارغة</p>
                    <p className="text-xs mt-1">
                      أضف نصوصاً أو روابط لتدريب البوت
                    </p>
                  </div>
                ) : (
                  <>
                    {kbList.slice(0, kbShowAll ? kbList.length : 5).map(kb => (
                    <div
                      key={kb.id}
                      className="group flex items-center justify-between p-3 bg-card border border-border hover:border-brand-500/50 transition-all rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            kb.type === 'PDF'
                              ? 'bg-red-500/10 text-red-500'
                              : kb.type === 'URL'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-purple-500/10 text-purple-500'
                          }`}
                        >
                          {kb.type === 'PDF' && (
                            <FileText className="w-5 h-5" />
                          )}
                          {kb.type === 'URL' && <Globe className="w-5 h-5" />}
                          {kb.type === 'TEXT' && (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-sm truncate max-w-[150px] sm:max-w-[240px] md:max-w-[320px]">
                            {kb.metadata?.filename ||
                              kb.metadata?.title ||
                              extractTitleFromContent(kb) ||
                              kb.metadata?.url ||
                              'بدون عنوان'}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {kb.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {kb.type === 'TEXT' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditKb(kb)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:bg-blue-500/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteKb(kb.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    ))}
                    {kbList.length > 5 && (
                      <div className="flex justify-center mt-4">
                        <Button variant="ghost" size="sm" onClick={() => setKbShowAll(s => !s)}>
                          {kbShowAll ? 'عرض أقل' : `عرض الكل (${kbList.length})`}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Input Area */}
        <Card className="lg:col-span-2 flex flex-col h-full border-brand-500/20 shadow-lg">
          <div className="flex border-b border-border">
            <button
              onClick={() => setKbTab('text')}
              className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${kbTab === 'text' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
            >
              <FileText className="w-4 h-4 inline-block ml-2" />
              نص (Text)
            </button>
            <button
              onClick={() => setKbTab('url')}
              className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${kbTab === 'url' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
            >
              <Globe className="w-4 h-4 inline-block ml-2" />
              رابط (URL)
            </button>
            <button
              onClick={() => setKbTab('pdf')}
              className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${kbTab === 'pdf' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
            >
              <Upload className="w-4 h-4 inline-block ml-2" />
              ملف (PDF)
            </button>
          </div>

          <CardContent className="flex-1 p-6">
            <AnimatePresence mode="wait">
              {kbTab === 'text' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="text"
                  className="space-y-4 h-full flex flex-col"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      العنوان / الموضوع
                    </label>
                    <Input
                      placeholder="مثال: سياسة الاسترجاع"
                      value={textTitle}
                      onChange={e => setTextTitle(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-border focus:bg-background transition-colors text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      المحتوى
                    </label>
                    <textarea
                      className="flex-1 w-full p-4 rounded-xl border border-border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-background transition-colors resize-none text-sm leading-relaxed focus:ring-2 focus:ring-brand-500/20 outline-none"
                      placeholder="الصق النص هنا... يمكنك إضافة معلومات عن عملك، الأسعار، الخدمات، أو أي شيء تريد أن يعرفه البوت."
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                    ></textarea>
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={uploading || !textInput}
                    className="w-full h-12 text-lg shadow-lg shadow-brand-500/20"
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin ml-2" />
                    ) : (
                      <Save className="ml-2 w-5 h-5" />
                    )}
                    حفظ المعلومات
                  </Button>
                </motion.div>
              )}

              {kbTab === 'url' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="url"
                  className="flex flex-col justify-center h-full space-y-6 max-w-md mx-auto w-full"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">استجلاب من رابط</h3>
                    <p className="text-sm text-muted-foreground">
                      سيقوم البوت بزيارة الرابط وقراءة المحتوى ليتعلم منه.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Input
                      placeholder="https://example.com/about"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      className="h-12 text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <Button
                      onClick={handleUrlSubmit}
                      disabled={uploading || !urlInput}
                      className="w-full h-12"
                      variant="default"
                    >
                      {uploading ? (
                        <Loader2 className="animate-spin ml-2" />
                      ) : (
                        <Sparkles className="ml-2 w-5 h-5" />
                      )}
                      بدء المعالجة
                    </Button>
                  </div>
                  <div className="bg-yellow-500/10 p-4 rounded-lg text-xs text-yellow-600 dark:text-yellow-400 flex gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <p>
                      تأكد من أن الرابط عام ويمكن الوصول إليه. الصفحات التي
                      تتطلب تسجيل دخول لن تعمل.
                    </p>
                  </div>
                </motion.div>
              )}

              {kbTab === 'pdf' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="pdf"
                  className="flex flex-col justify-center h-full space-y-6"
                >
                  <div className="border-2 border-dashed border-brand-500/30 rounded-2xl p-12 text-center hover:bg-brand-500/5 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleFileUpload}
                      accept=".pdf"
                      disabled={uploading}
                    />
                    <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      {uploading ? (
                        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                      ) : (
                        <Upload className="w-10 h-10 text-brand-500" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      اسحب الملف هنا أو اضغط للرفع
                    </h3>
                    <p className="text-muted-foreground">
                      ملفات PDF فقط (الحد الأقصى 10 ميجابايت)
                    </p>
                    <div className="mt-6 flex justify-center gap-4">
                      <span className="px-3 py-1 bg-muted rounded-full text-xs">
                        Menu.pdf
                      </span>
                      <span className="px-3 py-1 bg-muted rounded-full text-xs">
                        Policy.pdf
                      </span>
                      <span className="px-3 py-1 bg-muted rounded-full text-xs">
                        Info.pdf
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
