import React, { useState } from 'react';
import { ChevronLeft, Calendar, FileSearch, Plus, MoreHorizontal, Trash2, Edit3, Compass, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewName } from '../types';

interface MyScheduleProps {
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
  schedules: any[];
  setSchedules: React.Dispatch<React.SetStateAction<any[]>>;
  setDraftSchedule: React.Dispatch<React.SetStateAction<any>>;
  setSelectedOpportunityForSchedule: React.Dispatch<React.SetStateAction<any>>;
}

export const MySchedule: React.FC<MyScheduleProps> = ({ onBack, onNavigate, schedules, setSchedules, setDraftSchedule, setSelectedOpportunityForSchedule }) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  
  // April 2026 starts on Wednesday (3)
  const aprilDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const startDayOffset = 3; // 0=Sun, 1=Mon, 2=Tue, 3=Wed...
  
  const calendarGrid = Array(startDayOffset).fill(null).concat(aprilDays);

  // May 2026 starts on Friday (5)
  const mayDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const mayStartDayOffset = 5;
  const mayCalendarGrid = Array(mayStartDayOffset).fill(null).concat(mayDays);

  const handleDelete = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const filteredSchedules = selectedDate 
    ? schedules.filter(s => s.date === selectedDate)
    : schedules;

  return (
    <div className="min-h-screen bg-[#F5F8FF] flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 active:opacity-70">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">我的日程</h1>
        <button className="p-2 active:opacity-70">
          <MoreHorizontal size={24} className="text-gray-800" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Date Selector */}
        <div 
          className="bg-white px-4 py-3 border-b border-gray-50 flex items-center justify-between active:bg-gray-50 cursor-pointer mb-2"
          onClick={() => setIsDatePickerOpen(true)}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
              <Calendar size={14} className="text-orange-400" />
            </div>
            <span className="text-sm text-gray-700">{selectedDate || '选择日期'}</span>
          </div>
          <ChevronLeft size={20} className="text-gray-300 rotate-180" />
        </div>

        {filteredSchedules.length > 0 ? (
          <div className="py-2">
            {/* Grouped by Date */}
            <div className="flex justify-center mb-4">
               <div className="relative inline-block pb-1">
                  <span className="text-lg font-bold text-gray-900">{filteredSchedules[0].date}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"></div>
               </div>
            </div>

            <div className="px-4 space-y-3">
              {filteredSchedules.map(schedule => (
                <div key={schedule.id} className="bg-white rounded-lg shadow-sm border-l-[3px] border-orange-400 overflow-hidden">
                  <div className="p-4">
                    <div className="mb-1">
                       <h3 className="text-base font-bold text-orange-400 leading-none">{schedule.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-3">
                       <Compass size={14} className="text-orange-400" />
                       <div className="flex gap-2">
                          {schedule.phases.map((p: string) => (
                            <span key={p} className="text-xs text-gray-400">{p}</span>
                          ))}
                       </div>
                    </div>

                    <div className="bg-[#F4F7FF] px-3 py-4 rounded-md mb-3">
                       <p className="text-lg font-medium text-gray-800 leading-none">{schedule.content}</p>
                    </div>

                    <div className="flex items-center justify-between text-[13px] text-gray-400 pt-1">
                      <span>{schedule.time}</span>
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => handleDelete(schedule.id)}
                          className="flex items-center gap-1.5 active:opacity-70"
                        >
                          <Trash2 size={15} />
                          <span>删除</span>
                        </button>
                        <button 
                          className="flex items-center gap-1.5 active:opacity-70"
                          onClick={() => {
                            setDraftSchedule({
                              id: schedule.id,
                              title: schedule.title || '',
                              content: schedule.content || '',
                              activePhases: schedule.phases || [],
                              selectedDate: schedule.date || null
                            });
                            setSelectedOpportunityForSchedule(schedule.linkedOpportunity || undefined);
                            onNavigate(ViewName.ADD_SCHEDULE);
                          }}
                        >
                          <Edit3 size={15} />
                          <span>编辑</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-gray-300">
               <Globe size={18} />
               <p className="text-sm">没有更多数据了</p>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative mb-4">
              <FileSearch size={100} className="text-blue-200" strokeWidth={1} />
            </div>
            <p className="text-gray-400 text-sm">暂无数据</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => {
          setDraftSchedule({
            title: '',
            content: '',
            activePhases: [],
            selectedDate: null
          });
          setSelectedOpportunityForSchedule(undefined);
          onNavigate(ViewName.ADD_SCHEDULE);
        }}
        className="fixed right-6 bottom-10 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white active:scale-95 transition-transform z-50 text-3xl font-light"
      >
        <Plus size={36} strokeWidth={2.5} />
      </button>

      {/* Date Picker Bottom Sheet Modal */}
      <AnimatePresence>
        {isDatePickerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDatePickerOpen(false)}
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
                  <button onClick={() => setIsDatePickerOpen(false)} className="p-1">
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

               <div className="flex gap-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shrink-0 px-5 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setSelectedDate('');
                      setIsDatePickerOpen(false);
                    }}
                    className="flex-1 h-12 border border-gray-200 rounded-full text-gray-500 font-bold active:bg-gray-50"
                  >
                    重置
                  </button>
                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="flex-1 h-12 bg-blue-600 text-white rounded-full font-bold active:opacity-90 transition-opacity"
                  >
                    确定
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
