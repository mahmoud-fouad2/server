const fs=require('fs');
const p='c:\\xampp\\htdocs\\chat1\\github\\client\\src\\app\\docs\\page.jsx';
const content = `"use client";

import React from 'react';

export default function DocsPage(){
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl text-center">
        <h1 className="text-3xl font-bold mb-4">توثيق فهملي (مؤقت)</h1>
        <p className="text-gray-600">صفحة التوثيق قيد التحديث. تم تبسيط هذه النسخة مؤقتاً لإصلاح خطأ تجميع.</p>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(p,content,'utf8');
console.log('wrote',p);
