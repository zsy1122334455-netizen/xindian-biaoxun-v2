import React from 'react';
import { X, Copy, FolderPlus, Tag, Share2, Mail, MessageCircle, Globe, BookOpen, Send, Cloud, CheckSquare, Laptop, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IOSShareSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onAction: () => void;
  fileName: string;
  fileSize?: string;
}

export const IOSShareSheet: React.FC<IOSShareSheetProps> = ({ isVisible, onClose, onAction, fileName, fileSize = '3.2 MB' }) => {
  const shareApps = [
    { name: '隔空投送', icon: <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-[#007AFF]"><Share2 size={28} /></div> },
    { name: '网易有道词典', icon: <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white font-bold text-xs px-1 text-center leading-tight">有道</div> },
    { name: '信息', icon: <div className="w-12 h-12 bg-[#34C759] rounded-xl flex items-center justify-center text-white"><MessageCircle size={28} fill="currentColor" /></div> },
    { name: '邮件', icon: <div className="w-12 h-12 bg-[#007AFF] rounded-xl flex items-center justify-center text-white"><Mail size={28} /></div> },
  ];

  const actions = [
    { name: '拷贝', icon: <Copy size={24} /> },
    { name: '新建快速备忘录', icon: <div className="w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center font-bold text-[10px]">m</div> },
    { name: '保存到“文件”', icon: <FolderPlus size={24} />, primary: true },
    { name: '添加标签', icon: <Tag size={24} /> },
  ];

  const listActions = [
    { name: '用 Papago 翻译', icon: <Globe size={20} className="text-gray-600" /> },
    { name: '导入到微信读书', icon: <BookOpen size={20} className="text-gray-600" /> },
    { name: '导入到 QQ 邮箱发票助手', icon: <Mail size={20} className="text-gray-600" /> },
    { name: '在 QQ 邮箱中打开', icon: <Mail size={20} className="text-gray-600" /> },
    { name: '保存到大师云空间', icon: <Cloud size={20} className="text-gray-600" /> },
    { name: '添加到待办', icon: <CheckSquare size={20} className="text-gray-600" /> },
    { name: '在网易邮箱大师中打开', icon: <Mail size={20} className="text-gray-600" /> },
    { name: '保存到夸克网盘', icon: <Cloud size={20} className="text-gray-600" /> },
    { name: '发送到电脑', icon: <Laptop size={20} className="text-gray-600" /> },
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-end justify-center">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40"
        />

        {/* iOS Share Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-[#F2F2F7] rounded-t-[20px] overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-12 bg-gray-50 border border-gray-100 rounded flex flex-col items-center justify-center shadow-sm p-1">
                <div className="text-[6px] text-gray-400 font-bold self-start px-0.5 border-b border-gray-100 w-full mb-1">PDF</div>
                <div className="w-full flex-1 flex flex-col gap-0.5">
                  <div className="w-full h-0.5 bg-gray-200"></div>
                  <div className="w-2/3 h-0.5 bg-gray-200"></div>
                  <div className="w-full h-0.5 bg-gray-200"></div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 line-clamp-1">{fileName}</span>
                <span className="text-xs text-gray-400">PDF 文稿 · {fileSize}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-[#E3E3E8] rounded-full flex items-center justify-center text-gray-600 active:bg-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+20px)]">
            {/* Row 1: Apps */}
            <div className="p-4 bg-white mb-2 overflow-x-auto">
              <div className="flex gap-6 min-w-max px-2">
                {shareApps.map((app, index) => (
                  <button 
                    key={index} 
                    onClick={onAction}
                    className="flex flex-col items-center gap-1.5 w-16 active:opacity-60"
                  >
                    {app.icon}
                    <span className="text-[10px] text-gray-700 text-center leading-tight h-5 flex items-center">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Actions */}
            <div className="p-4 bg-white mb-4 overflow-x-auto">
              <div className="flex gap-6 min-w-max px-2">
                {actions.map((action, index) => (
                  <button 
                    key={index} 
                    onClick={onAction}
                    className="flex flex-col items-center gap-1.5 w-16 active:opacity-60"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-900">
                      {action.icon}
                    </div>
                    <span className="text-[10px] text-gray-700 text-center leading-tight h-5 flex items-center">{action.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* List Actions */}
            <div className="mx-4 bg-white rounded-xl overflow-hidden mb-8">
              {listActions.map((action, index) => (
                <button 
                  key={index}
                  onClick={onAction}
                  className={`w-full px-4 py-3 flex items-center justify-between active:bg-gray-100 ${index !== listActions.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {action.icon}
                    <span className="text-[15px] text-gray-900">{action.name}</span>
                  </div>
                  <X size={16} className="text-gray-300 rotate-45" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
