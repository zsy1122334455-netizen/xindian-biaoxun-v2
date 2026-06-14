import React, { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ViewName } from '../types';

interface FeedbackProps {
  onBack: () => void;
  showToast: (msg: string) => void;
}

type FeedbackCategory = '数据不全' | '功能建议' | '系统异常' | '其他问题';
const CATEGORIES: FeedbackCategory[] = ['数据不全', '功能建议', '系统异常', '其他问题'];

export const Feedback: React.FC<FeedbackProps> = ({ onBack, showToast }) => {
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 200;

  const handleSubmit = (isSuccess: boolean) => {
    if (!selectedCategory || !feedbackText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      if (isSuccess) {
        showToast('提交成功！');
        setFeedbackText('');
        setSelectedCategory(null);
        // onBack(); // Optionally navigate back or stay to show empty form as per prompt
      } else {
        showToast('网络异常，请稍候再试！');
      }
    }, 500);
  };

  const isFormValid = selectedCategory && feedbackText.trim().length > 0;

  return (
    <div className="h-screen bg-[#F7F8FA] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white px-4 pt-safe-top pb-2 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-center h-12 relative">
          <button onClick={onBack} className="absolute left-0 flex h-10 w-10 items-center justify-start text-gray-800 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[18px] font-bold text-gray-900 whitespace-nowrap">我要反馈</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Type Selection */}
        <section className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-[14px] text-[#666666] mb-3 pb-2 border-b border-gray-200">请选择反馈类型</h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-[14px] transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#E6F7FF] border border-[#1890FF] text-[#1890FF] ring-2 ring-[#1890FF]/10'
                      : 'bg-[#EEEEEE] border border-transparent text-[#333333]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dynamic Textarea */}
        <section className={`transition-all duration-300 transform ${
          selectedCategory ? 'opacity-100 translate-y-0 flex flex-col' : 'opacity-0 translate-y-4 hidden'
        }`}>
          <label className="text-[14px] text-[#333333] mb-2 font-medium">
            {selectedCategory === '数据不全' ? '建议新增收录的信息源' : '问题与建议描述'}
          </label>
          <div className="relative">
            <textarea
              className="w-full min-h-[160px] rounded-[8px] border border-[#E2E8F0] focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] focus:outline-none p-3 text-sm text-gray-900 bg-white resize-none transition-all pb-8"
              placeholder={
                selectedCategory === '数据不全'
                  ? '请填写您希望平台优先收录的招投标网站名称、官方渠道链接，或对信息覆盖范围的具体建议（示例：某某市公共资源交易中心（http://xxx.xxx.gov.cn））...'
                  : '请详细描述您在使用过程中遇到的问题或改进建议，以便我们为您提供更好的体验...'
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value.slice(0, maxLength))}
            />
            <span className="absolute bottom-3 right-3 text-xs text-gray-400">
              {feedbackText.length}/{maxLength}
            </span>
          </div>
        </section>
        
        {/* Test Buttons - as requested for simulating success/failure */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
          <p className="text-xs text-gray-500 mb-2 font-mono text-center">测试用例模拟开关 (Toast模拟)</p>
          <div className="flex gap-2">
            <button 
              onClick={() => handleSubmit(true)}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 py-2 text-xs font-medium bg-white text-green-600 border border-green-200 rounded-md hover:bg-green-50 disabled:opacity-50 disabled:bg-gray-50"
            >
              模拟提交成功
            </button>
            <button 
              onClick={() => handleSubmit(false)}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 py-2 text-xs font-medium bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:bg-gray-50"
            >
              模拟提交异常
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white p-4 pb-safe-area shrink-0 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] border-t border-gray-100 relative">
        <button
          onClick={() => handleSubmit(true)} // Default to success for normal users if they click here
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-[12px] h-[48px] rounded-[8px] text-[16px] font-bold transition-all flex items-center justify-center ${
            !isFormValid || isSubmitting 
              ? 'bg-[#CCCCCC] text-white cursor-not-allowed' 
              : 'bg-[#1890FF] text-white active:bg-blue-600 active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <Loader2 size={24} className="animate-spin opacity-80" />
          ) : (
            '立即提交'
          )}
        </button>
      </footer>
    </div>
  );
};
