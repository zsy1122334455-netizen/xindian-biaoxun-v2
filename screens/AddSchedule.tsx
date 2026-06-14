import React, { useState } from 'react';
import { ChevronLeft, Home, MoreHorizontal, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { ViewName } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AddScheduleProps {
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
  setSchedules: React.Dispatch<React.SetStateAction<any[]>>;
  selectedOpp?: any;
  onClearSelectedOpp: () => void;
  draftSchedule: {
    id?: string;
    title: string;
    content: string;
    activePhases: string[];
    selectedDate: string | null;
  };
  setDraftSchedule: React.Dispatch<React.SetStateAction<{
    id?: string;
    title: string;
    content: string;
    activePhases: string[];
    selectedDate: string | null;
  }>>;
}

export const AddSchedule: React.FC<AddScheduleProps> = ({ 
  onBack, 
  onNavigate, 
  setSchedules, 
  selectedOpp,
  onClearSelectedOpp,
  draftSchedule,
  setDraftSchedule
}) => {
  const { title, content, activePhases, selectedDate } = draftSchedule;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  
  const phases = ['有机会', '去现场', '找到关键人', '投标', '送资料', '报价'];

  const setTitle = (t: string) => setDraftSchedule(prev => ({ ...prev, title: t }));
  const setContent = (c: string) => setDraftSchedule(prev => ({ ...prev, content: c }));
  const setSelectedDate = (d: string | null) => setDraftSchedule(prev => ({ ...prev, selectedDate: d }));

  const togglePhase = (phase: string) => {
    setDraftSchedule(prev => ({
      ...prev,
      activePhases: prev.activePhases.includes(phase) 
        ? prev.activePhases.filter(p => p !== phase) 
        : [...prev.activePhases, phase]
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('请填写标题');
      return;
    }
    setShowCalendarPrompt(true);
  };

  const confirmSave = () => {
    const isEditing = !!draftSchedule.id;
    const scheduleData = {
      id: draftSchedule.id || Date.now().toString(),
      title: title || '项目1',
      content: content || '投标',
      phases: activePhases.length > 0 ? activePhases : ['去现场'],
      date: selectedDate || '2026-04-25',
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      linkedOpportunity: selectedOpp
    };

    setSchedules(prev => {
      if (isEditing) {
        return prev.map(s => s.id === draftSchedule.id ? scheduleData : s);
      }
      return [scheduleData, ...prev];
    });

    onClearSelectedOpp();
    setDraftSchedule({
      title: '',
      content: '',
      activePhases: [],
      selectedDate: null
    });
    setShowCalendarPrompt(false);
    onBack();
  };

  const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  
  // April 2026 starts on Wednesday (3)
  const aprilDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const startDayOffset = 3; // 0=Sun, 1=Mon, 2=Tue, 3=Wed...
  
  const calendarGrid = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarGrid.push(null);
  }
  aprilDays.forEach(day => calendarGrid.push(day));

  // May 2026 starts on Friday (5)
  const mayDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const mayStartDayOffset = 5;
  const mayCalendarGrid = [];
  for (let i = 0; i < mayStartDayOffset; i++) {
    mayCalendarGrid.push(null);
  }
  mayDays.forEach(day => mayCalendarGrid.push(day));

  return (
    <div className="min-h-screen bg-[#F5F8FF] flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
           <button onClick={onBack} className="p-1 active:opacity-70">
             <ChevronLeft size={24} className="text-gray-800" />
           </button>
           <button onClick={() => onNavigate(ViewName.HOME)} className="p-1 active:opacity-70">
             <Home size={22} className="text-gray-800" />
           </button>
        </div>
        <h1 className="text-lg font-bold text-gray-900">新增日程</h1>
        <button className="p-2 active:opacity-70">
          <MoreHorizontal size={24} className="text-gray-800" />
        </button>
      </header>

      <div className="flex-1">
        {/* Title Input */}
        <div className="bg-white px-4 py-4 mb-2">
          <input 
            type="text" 
            placeholder="填写标题内容" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-base placeholder:text-gray-300 outline-none"
          />
        </div>

        {/* Content Input */}
        <div className="bg-white px-4 py-4 mb-2 relative">
          <textarea 
            placeholder="填写日程内容" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[120px] text-base placeholder:text-gray-300 outline-none resize-none"
            maxLength={100}
          />
          <span className="absolute bottom-4 right-4 text-xs text-gray-400">{content.length}/100</span>
        </div>

        {/* Project Phase */}
        <div className="bg-white px-4 py-4 mb-2">
          <div className="flex items-center gap-1.5 mb-4 border-l-4 border-blue-500 pl-2">
             <h3 className="text-sm font-bold text-gray-900">项目阶段</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
             {phases.map(p => (
               <button 
                 key={p}
                 onClick={() => togglePhase(p)}
                 className={`py-2 text-sm rounded transition-colors ${activePhases.includes(p) ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 text-gray-600'}`}
               >
                 {p}
               </button>
             ))}
          </div>
        </div>

        {/* Time Reminder */}
        <div className="bg-white px-4 py-4 mb-2 divide-y divide-gray-50">
           <div 
             className="flex items-center justify-between py-1 cursor-pointer active:bg-gray-50"
             onClick={() => setShowDatePicker(true)}
            >
              <span className="text-sm text-gray-500">日程提醒时间</span>
              <div className="flex items-center gap-1">
                 <span className={`text-sm ${selectedDate ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>
                   {selectedDate || '未设置'}
                 </span>
                 <ChevronRight size={18} className="text-gray-300" />
              </div>
           </div>
        </div>

        {/* Link Business Opportunity */}
        <div className="bg-white px-4 py-4 mb-2">
           <div 
             className="flex items-center justify-between py-1 cursor-pointer active:bg-gray-50"
             onClick={() => onNavigate(ViewName.SELECT_OPPORTUNITY)}
            >
              <span className="text-sm text-gray-500">关联商机</span>
              <div className="flex items-center gap-1">
                 <span className={`text-sm max-w-[200px] truncate ${selectedOpp ? 'text-blue-600 font-medium' : 'text-gray-300'}`}>
                   {selectedOpp ? selectedOpp.title : '未选择'}
                 </span>
                 <ChevronRight size={18} className="text-gray-300" />
              </div>
           </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 bg-white border-t border-gray-100 mb-[env(safe-area-inset-bottom)]">
        <button 
          onClick={handleSave}
          className="w-full h-11 bg-blue-600 text-white rounded-full font-bold text-base active:scale-[0.98] transition-transform shadow-lg shadow-blue-100"
        >
          保存
        </button>
      </div>

      {/* Calendar Prompt Modal */}
      <AnimatePresence>
        {showCalendarPrompt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCalendarPrompt(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 text-center">
                <h3 className="text-gray-900 font-medium leading-relaxed">
                  是否将您新增的日程添加至系统日历
                </h3>
              </div>
              <div className="flex border-t border-gray-100">
                <button 
                  onClick={confirmSave}
                  className="flex-1 py-3 text-gray-500 font-medium active:bg-gray-50 border-r border-gray-100"
                >
                  取消
                </button>
                <button 
                  onClick={confirmSave}
                  className="flex-1 py-3 text-blue-600 font-bold active:bg-gray-50"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDatePicker(false)}
              className="fixed inset-0 bg-black/40 z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-[101] overflow-hidden flex flex-col max-h-[60vh]"
            >
               <div className="flex items-center justify-between px-5 pt-6 mb-4 shrink-0">
                  <div className="w-6"></div>
                  <h2 className="text-lg font-bold text-gray-900">日期选择</h2>
                  <button onClick={() => setShowDatePicker(false)} className="p-1">
                     <X size={24} className="text-gray-400" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto px-5 pb-4">
                  <div className="text-center mb-6">
                     <p className="text-gray-600 font-medium">2026年4月</p>
                  </div>

                  <div className="grid grid-cols-7 mb-4">
                     {daysOfWeek.map(day => (
                       <div key={day} className="text-center text-xs text-gray-400 py-2">
                         {day}
                       </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 mb-8">
                     {calendarGrid.map((day, idx) => (
                       <div key={idx} className="flex items-center justify-center aspect-square">
                          {day && (
                            <button 
                              onClick={() => setSelectedDate(`2026-04-${day.toString().padStart(2, '0')}`)}
                              className={`w-10 h-10 rounded-lg text-sm transition-all relative ${
                                selectedDate === `2026-04-${day.toString().padStart(2, '0')}`
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-gray-700 active:bg-gray-100'
                              }`}
                            >
                               {day}
                               {day === 15 && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                                 <span className="text-[40px] font-bold text-gray-900">4</span>
                               </div>}
                            </button>
                          )}
                       </div>
                     ))}
                  </div>

                  <div className="text-center mb-8">
                     <p className="text-gray-600 font-medium mb-4">2026年5月</p>
                     <div className="grid grid-cols-7 gap-y-1">
                        {mayCalendarGrid.map((day, idx) => (
                          <div key={`may-${idx}`} className="flex items-center justify-center aspect-square">
                             {day && (
                               <button 
                                 onClick={() => setSelectedDate(`2026-05-${day.toString().padStart(2, '0')}`)}
                                 className={`w-10 h-10 rounded-lg text-sm transition-all relative ${
                                   selectedDate === `2026-05-${day.toString().padStart(2, '0')}`
                                   ? 'bg-blue-600 text-white font-bold'
                                   : 'text-gray-700 active:bg-gray-100'
                                 }`}
                               >
                                  {day}
                               </button>
                             )}
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="shrink-0 px-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                     <span className="text-sm font-bold text-gray-900">提醒时间</span>
                     <div className="flex items-center gap-4">
                        <select className="bg-gray-100 rounded px-2 py-1 text-sm outline-none">
                           {Array.from({ length: 24 }, (_, i) => (
                             <option key={i} value={i.toString().padStart(2, '0')}>
                               {i.toString().padStart(2, '0')}
                             </option>
                           ))}
                        </select>
                        <span className="text-gray-400">:</span>
                        <select className="bg-gray-100 rounded px-2 py-1 text-sm outline-none">
                           {['00', '15', '30', '45'].map(m => (
                             <option key={m} value={m}>{m}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="flex gap-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
                     <button 
                       onClick={() => {
                         setSelectedDate(null);
                         setShowDatePicker(false);
                       }}
                       className="flex-1 h-12 border border-gray-200 rounded-full text-gray-500 font-bold active:bg-gray-50"
                     >
                       重置
                     </button>
                     <button 
                       onClick={() => setShowDatePicker(false)}
                       className="flex-1 h-12 bg-blue-600 text-white rounded-full font-bold active:opacity-90 transition-opacity"
                     >
                       确定
                     </button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
