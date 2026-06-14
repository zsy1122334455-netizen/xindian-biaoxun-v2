import React, { useState } from 'react';
import { ShieldCheck, History, Phone, ChevronRight, FileText, Building2, ShoppingBag, Receipt, User, Award, Headset, MessageSquare } from 'lucide-react';
import { ViewName, UserRole, Membership } from '../types';

interface UserCenterProps {
  onNavigate: (view: ViewName, data?: any) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  membership?: Membership;
}

export const UserCenter: React.FC<UserCenterProps> = ({ onNavigate, userRole, setUserRole, membership }) => {
  const user = {
    name: '用户1',
    phone: '13800138000'
  };

  const displayName = user.name || user.phone;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.FREE: return '普通会员';
      case UserRole.VIP: return 'VIP';
      case UserRole.SVIP: return 'SVIP';
      default: return '普通会员';
    }
  };

  return (
    <div className="min-h-screen bg-bg-page text-gray-900 pb-[calc(60px+env(safe-area-inset-bottom)+16px)] font-sans relative">
      <header 
        onClick={() => onNavigate(ViewName.MEMBER_CENTER, { initialTab: userRole === UserRole.VIP ? 'vip' : 'svip' })}
        className="bg-[#4A84FF] pt-[calc(env(safe-area-inset-top,0px)+32px)] pb-12 px-4 cursor-pointer hover:bg-[#3D77F2] active:bg-[#3169E6] transition-all"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border border-white/60 bg-white/5 shadow-inner">
                <User size={32} className="text-white" strokeWidth={1.5} />
              </div>
              {userRole !== UserRole.FREE && (
                <div className="absolute -bottom-1 -right-1 bg-[#FFC107] text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-[#4A84FF] whitespace-nowrap shadow-sm">
                  {getRoleLabel(userRole)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-white tracking-tight">ID: {displayName}</h1>
              </div>
              {userRole === UserRole.FREE && (
                <p className="text-sm text-white/90 mt-1 font-medium">
                  未开通 · 享受更多高级特性
                </p>
              )}
              {userRole !== UserRole.FREE && membership?.expiryDate && (
                <p className="text-xs text-white/90 mt-1 flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></span>
                  有效期至：{membership.expiryDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 text-white/90 hover:text-white transition-all text-xs font-semibold bg-white/10 hover:bg-white/15 active:scale-95 px-3 py-1.5 rounded-full shadow-sm select-none">
            <span>会员中心</span>
            <ChevronRight size={12} className="opacity-90 mt-0.5" />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 space-y-4 -mt-8 relative z-10">
        {/* Expiring Alert Banner */}
        {(() => {
          const getRemainingDaysInt = (): number | null => {
            if (userRole === UserRole.FREE || !membership?.expiryDate) {
              return null;
            }
            try {
              const parts = membership.expiryDate.split('-');
              const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              expDate.setHours(0, 0, 0, 0);
              const diffTime = expDate.getTime() - today.getTime();
              return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } catch {
              return null;
            }
          };

          const remainingDays = getRemainingDaysInt();
          const isExpiringSoon = remainingDays !== null && remainingDays >= 0 && remainingDays <= 7;

          if (isExpiringSoon) {
            return (
              <div 
                id="expiring_soon_alert_bar" 
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(ViewName.MEMBER_CENTER, { initialTab: userRole === UserRole.VIP ? 'vip' : 'svip' });
                }}
                className="bg-gradient-to-r from-[#FFFBF0] to-[#FFF1CD] border border-[#FFE3A1] rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-2 text-[#77470E]">
                  <Award className="text-[#EA7C13] fill-[#FFE3A1] shrink-0" size={18} />
                  <span className="text-[13px] font-semibold">
                    {remainingDays === 0 ? (
                      "会员今日到期 · 立即续费"
                    ) : remainingDays === 1 ? (
                      "会员明日到期 · 立即续费"
                    ) : (
                      <>
                        会员将于 <span className="text-[#E11D48] font-bold">{remainingDays}</span> 天后到期 · 立即续费
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-0.5 text-[#EA7C13] text-xs font-bold">
                  <span>去续费</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Quick Links */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">常用功能</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '导出记录', icon: ShieldCheck, action: () => onNavigate(ViewName.EXPORT_RECORDS) },
              { label: '项目联系', icon: Phone, action: () => onNavigate(ViewName.PROJECT_CONTACTS) },
              { label: '浏览历史', icon: History, action: () => onNavigate(ViewName.BROWSING_HISTORY) },
              { label: '我要反馈', icon: MessageSquare, action: () => onNavigate(ViewName.FEEDBACK) },
              { label: '企业信息', icon: Building2, action: () => onNavigate(ViewName.ENTERPRISE_INFO) },
            ].map((item) => (
              <button 
                key={item.label} 
                className="flex flex-col items-center space-y-2 group"
                onClick={item.action}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <item.icon className="text-primary" size={24} />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Menu List */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
          <div className="px-5 py-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">在线客服</h3>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-5">
                <Headset size={20} className="text-gray-400 shrink-0" />
              </div>
              <span className="text-sm">客服电话</span>
            </div>
            <div className="flex items-center text-primary text-sm font-medium">
              <a href="tel:4009980000" className="hover:underline transition-all">400-998-0000</a>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-5">
                <Phone size={20} className="text-gray-400 shrink-0" />
              </div>
              <span className="text-sm">销售经理</span>
            </div>
            <div className="flex items-center text-primary text-sm font-medium">
              <a href="tel:17800009999" className="hover:underline transition-all">17800009999</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};