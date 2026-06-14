import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit2, Trash2, Plus } from 'lucide-react';
import { ViewName, SubscriptionPlan, UserRole } from '../types';

interface Props {
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
  plans: SubscriptionPlan[];
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  userRole?: UserRole;
}

export const SubscriptionManagement: React.FC<Props> = ({ onBack, onNavigate, plans, onDelete, onSetDefault, userRole }) => {
  const isFree = userRole === UserRole.FREE;

  // Compute the active plan ID for FREE users
  const activePlanId = (() => {
    if (plans.length === 0) return null;
    const defaultPlan = plans.find(p => p.isDefault);
    if (defaultPlan) return defaultPlan.id;
    return plans[0].id;
  })();

  // Automatically sync activePlanId with isDefault in parent state if they are FREE
  useEffect(() => {
    if (isFree && activePlanId) {
      const activePlan = plans.find(p => p.id === activePlanId);
      if (activePlan && !activePlan.isDefault) {
        onSetDefault(activePlanId);
      }
    }
  }, [isFree, activePlanId, plans, onSetDefault]);

  // Toast status
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    if (isFree && plan.id === activePlanId) {
      setToastMessage('普通用户至少保留 1 个订阅方案');
    } else {
      onDelete(plan.id);
      setToastMessage('删除订阅方案成功');
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex flex-col font-sans relative">
      <header className="bg-white px-4 py-3 flex items-center border-b border-gray-100 sticky top-0 z-50">
        <button onClick={onBack} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="flex-1 text-center font-bold text-lg pr-6 text-gray-900">订阅方案管理</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {plans.length === 0 ? (
          <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 min-h-[300px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Plus size={24} className="text-blue-500" />
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">暂无订阅方案</h3>
            <p className="text-[13px] text-gray-500 mb-6 max-w-[200px]">
              添加订阅方案后，系统会自动为您推送符合条件的商机
            </p>
            <button 
              onClick={() => onNavigate(ViewName.ADD_SUBSCRIPTION)} 
              className="bg-primary text-white px-6 py-2.5 rounded-full font-medium shadow-sm active:scale-95 transition-all text-sm"
            >
              创建方案
            </button>
          </div>
        ) : (
          <>
            {plans.map((plan) => {
              const isActive = !isFree || plan.id === activePlanId;
              const isDisabled = isFree && plan.id !== activePlanId;

              return (
                <div 
                  key={plan.id} 
                  className={`p-4 rounded-xl border transition-all duration-200 relative ${
                    isDisabled 
                      ? 'bg-gray-50/60 border-gray-200/80 opacity-60 shadow-none' 
                      : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold transition-colors ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                      {plan.isDefault && isActive && (
                        <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-medium select-none">默认</span>
                      )}
                      {isDisabled && (
                        <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] px-1.5 py-0.5 rounded font-medium select-none">
                          升级后可用
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 items-center">
                      <button 
                        disabled={isDisabled}
                        className={`p-1 rounded transition-colors ${
                          isDisabled 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-blue-600 cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && onNavigate(ViewName.ADD_SUBSCRIPTION, plan)}
                      >
                        <Edit2 size={15} />
                      </button>
                      {!plan.isDefault && (
                        <button 
                          disabled={isDisabled}
                          className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                            isDisabled 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-blue-500 hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                          }`}
                          onClick={() => !isDisabled && onSetDefault(plan.id)}
                        >
                          设为默认
                        </button>
                      )}
                      <button 
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                        onClick={() => handleDeleteClick(plan)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p className={isDisabled ? 'text-gray-400' : 'text-gray-600 font-medium'}>
                      关键词：{Array.isArray(plan.keywords) ? plan.keywords.join(', ') : plan.keywords}
                    </p>
                    <p className={isDisabled ? 'text-gray-400' : 'text-gray-650'}>
                      地区：{plan.region}
                    </p>
                  </div>
                </div>
              );
            })}
            
            <button 
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 active:bg-blue-50/50 transition-all font-medium"
              onClick={() => onNavigate(ViewName.ADD_SUBSCRIPTION)}
            >
              <Plus size={20} />
              新增订阅方案
            </button>
          </>
        )}
      </main>

      {toastMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white text-[13px] px-4 py-2.5 rounded-xl z-55 pointer-events-none text-center shadow-lg font-medium select-none whitespace-nowrap animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
