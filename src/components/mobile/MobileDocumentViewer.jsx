// ===================================================================
// 🆕 v23: MobileDocumentViewer
// عرض الشهادات والتقارير داخل modal مع زر إغلاق واضح
// ===================================================================
import { useState, useEffect } from 'react';
import { X, Download, Printer, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MobileDocumentViewer = ({ url, title = 'عرض المستند', onClose }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
    
    // 🆕 v23: منع scroll في الخلفية
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [url]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await api.get(url, { responseType: 'text' });
      setContent(res.data);
    } catch (e) {
      toast.error('فشل تحميل المستند');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // إنشاء iframe مخفي للطباعة
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.left = '-9999px';
    printFrame.style.top = '-9999px';
    document.body.appendChild(printFrame);
    
    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();
    
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => document.body.removeChild(printFrame), 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <header className="bg-moh-primary text-white px-3 py-3 flex items-center gap-2 shadow-md flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition flex-shrink-0"
          aria-label="إغلاق"
        >
          <X size={22} />
        </button>
        
        <h2 className="flex-1 font-bold text-base truncate">{title}</h2>
        
        <button
          onClick={handlePrint}
          className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition flex-shrink-0"
          aria-label="طباعة"
          title="طباعة"
        >
          <Printer size={20} />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-moh-primary border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">جاري التحميل...</p>
            </div>
          </div>
        ) : (
          <iframe
            srcDoc={content}
            className="w-full h-full border-0 bg-white"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-modals"
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 px-3 py-2 flex gap-2 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium text-sm"
        >
          <ChevronRight size={18} />
          الرجوع
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 bg-moh-primary hover:bg-moh-primary-dark text-white py-3 rounded-lg font-medium text-sm"
        >
          <Printer size={18} />
          طباعة
        </button>
      </footer>
    </div>
  );
};

export default MobileDocumentViewer;
