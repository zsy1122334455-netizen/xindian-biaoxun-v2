import React from 'react';
import { ChevronLeft, MoreHorizontal, Bell, ChevronRight } from 'lucide-react';
import { ViewName } from '../types';

interface MessageListProps {
  onBack: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({ onBack }) => {
  const messages = [
    {
      id: 1,
      date: '2023-12-04 09:27:46',
      title: '标讯提醒',
      content: '您的订单 260113556110 处于未支付状态，为了使您获取更多招标信息，请您及时付款。',
    },
    {
      id: 2,
      date: '2023-12-01 18:27:42',
      title: '标讯提醒',
      content: '您的订单 260113556110 处于未支付状态，为了使您获取更多招标信息，请您及时付款。',
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F6F8]">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 pt-safe-top">
        <div className="flex items-center justify-between px-4 h-12">
          <button 
            onClick={onBack}
            className="p-1 -ml-1 active:opacity-70"
          >
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-[17px] font-bold text-gray-900">应用服务</h1>
          <button className="p-1 -mr-1 active:opacity-70">
            <MoreHorizontal size={24} className="text-gray-900" />
          </button>
        </div>
      </header>

      {/* Message List */}
      <main className="flex-1 p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-[#1677FF] flex items-center justify-center">
                  <Bell size={18} className="text-white" />
                </div>
                <span className="text-[13px] text-gray-400">{message.date}</span>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 mb-2 text-center text-black">{message.title}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                {message.content}
              </p>
            </div>
            <button className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 transition-colors">
              <span className="text-[15px] text-gray-900">查看详情</span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        ))}
      </main>
    </div>
  );
};
