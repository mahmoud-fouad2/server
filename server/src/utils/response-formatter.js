/**
 * 🎨 تنسيق ردود البوت بشكل منظم وجميل
 * 
 * يحول النص العادي إلى:
 * - نقاط bullet منظمة
 * - أرقام للخطوات
 * - فصل بين الأقسام
 * - إزالة التكرار
 */

class ResponseFormatter {
  /**
   * تنسيق الرد الرئيسي
   */
  format(text) {
    if (!text || typeof text !== 'string') return text;

    let formatted = text;

    // 1. إزالة التكرار الزائد من الترحيبات
    formatted = this.removeDuplicateGreetings(formatted);

    // 2. تنظيف النص من الرموز الزائدة
    formatted = this.cleanUpText(formatted);

    // 3. تحويل القوائم إلى bullet points
    formatted = this.formatLists(formatted);

    // 4. تنسيق الأرقام والخطوات
    formatted = this.formatNumbers(formatted);

    // 5. إضافة فواصل بين الأقسام
    formatted = this.addSectionBreaks(formatted);

    // 6. إزالة الأسطر الفارغة المتعددة
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted.trim();
  }

  /**
   * إزالة الترحيبات المتكررة
   */
  removeDuplicateGreetings(text) {
    const greetings = [
      'مرحباً', 'أهلاً', 'يا هلا', 'مرحبا', 'اهلا',
      'يسعدني', 'تشرفنا', 'منورني', 'فالك طيب'
    ];

    let lines = text.split('\n');
    let seenGreeting = false;

    lines = lines.filter(line => {
      const lowerLine = line.toLowerCase().trim();
      const hasGreeting = greetings.some(g => lowerLine.startsWith(g));
      
      if (hasGreeting) {
        if (seenGreeting) return false; // إزالة الترحيب المكرر
        seenGreeting = true;
      }
      
      return true;
    });

    return lines.join('\n');
  }

  /**
   * تنظيف النص من الرموز والمسافات الزائدة
   */
  cleanUpText(text) {
    return text
      // إزالة الرموز المكررة
      .replace(/[•●◦▪▫]{2,}/g, '•')
      .replace(/[-–—]{3,}/g, '---')
      // تنظيف المسافات
      .replace(/[ \t]+/g, ' ')
      .replace(/^ +| +$/gm, '')
      // إزالة نجوم markdown الزائدة
      .replace(/\*{3,}/g, '**');
  }

  /**
   * تحويل القوائم غير المنسقة إلى bullet points
   */
  formatLists(text) {
    const lines = text.split('\n');
    const formatted = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim() || '';

      // إذا كان السطر يبدأ بـ: - أو * أو •
      if (/^[-*•●]/.test(line)) {
        formatted.push(line.replace(/^[-*]/, '•'));
      }
      // إذا كان السطر يحتوي على كلمات دالة على عناصر قائمة
      else if (this.isListItem(line, nextLine)) {
        formatted.push(`• ${line}`);
      } else {
        formatted.push(line);
      }
    }

    return formatted.join('\n');
  }

  /**
   * التحقق إذا كان النص عنصر في قائمة
   */
  isListItem(line, nextLine) {
    // كلمات دالة
    const listKeywords = [
      'أولاً', 'ثانياً', 'ثالثاً', 'رابعاً',
      'الخدمة', 'المنتج', 'السعر', 'الميزة',
      'يمكنك', 'نقدم', 'نوفر', 'لدينا'
    ];

    // إذا كان السطر قصير ويبدأ بكلمة مفتاحية
    if (line.length < 100 && listKeywords.some(k => line.startsWith(k))) {
      return true;
    }

    // إذا كان السطر التالي أيضاً يبدو كعنصر قائمة
    if (nextLine && listKeywords.some(k => nextLine.startsWith(k))) {
      return true;
    }

    return false;
  }

  /**
   * تنسيق الأرقام والخطوات
   */
  formatNumbers(text) {
    const lines = text.split('\n');
    const formatted = [];

    for (let line of lines) {
      // تحويل: 1- إلى 1.
      line = line.replace(/^(\d+)-\s*/, '$1. ');
      // تحويل: (1) إلى 1.
      line = line.replace(/^\((\d+)\)\s*/, '$1. ');
      
      formatted.push(line);
    }

    return formatted.join('\n');
  }

  /**
   * إضافة فواصل بين الأقسام المختلفة
   */
  addSectionBreaks(text) {
    const sectionHeaders = [
      'الأسعار:', 'المواعيد:', 'العنوان:', 'التواصل:',
      'الخدمات:', 'المنتجات:', 'المميزات:', 'الشروط:',
      'ملاحظة:', 'مهم:', 'تنبيه:', 'معلومة:'
    ];

    let result = text;

    sectionHeaders.forEach(header => {
      // إضافة سطر فارغ قبل العناوين
      const regex = new RegExp(`([^\n])(${header})`, 'g');
      result = result.replace(regex, '$1\n\n$2');
    });

    return result;
  }

  /**
   * اختصار النص الطويل (تقليل الرغي)
   */
  truncate(text, maxLength = 500) {
    if (!text || text.length <= maxLength) return text;

    // قص النص عند آخر جملة كاملة
    const truncated = text.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('؟');
    const lastExclamation = truncated.lastIndexOf('!');

    const cutPoint = Math.max(lastSentence, lastQuestion, lastExclamation);

    if (cutPoint > 0) {
      return truncated.substring(0, cutPoint + 1);
    }

    return truncated + '...';
  }

  /**
   * إزالة المعلومات الزائدة من قاعدة المعرفة
   */
  summarizeKnowledge(knowledgeArray, maxItems = 3, maxChars = 300) {
    if (!knowledgeArray || knowledgeArray.length === 0) return [];

    return knowledgeArray.slice(0, maxItems).map(kb => {
      const content = kb.content || kb.answer || kb.question || '';
      
      return {
        ...kb,
        content: this.truncate(content, maxChars)
      };
    });
  }
}

export default new ResponseFormatter();
