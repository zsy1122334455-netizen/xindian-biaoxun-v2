import React from 'react';
import { Home, Briefcase, Building2, Star, User } from 'lucide-react';
import { ViewName, NavProps } from '../types';

export const BottomNav: React.FC<NavProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { view: ViewName.HOME, label: '首页', icon: Home },
    { view: ViewName.OPPORTUNITY_LIST, label: '商机', icon: Briefcase },
    { view: ViewName.ENTERPRISE_LIST, label: '企业', icon: Building2 },
    { view: ViewName.SUBSCRIPTION, label: '订阅', icon: Star },
    { view: ViewName.USER_CENTER, label: '我的', icon: User },
  ];

  const isHidden = [
    ViewName.ANNOUNCEMENT_DETAIL, 
    ViewName.ENTERPRISE_DETAIL,
    ViewName.ADD_SUBSCRIPTION,
    ViewName.SUBSCRIPTION_MANAGEMENT,
    ViewName.MEMBER_CENTER,
    ViewName.PROJECT_CONTACTS,
    ViewName.FEEDBACK
  ].includes(currentView);

  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-[calc(60px+env(safe-area-inset-bottom))] pb-safe-bottom z-40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        const Icon = item.icon;
        return (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} className={isActive ? "text-primary opacity-20 absolute" : "hidden"} />
             <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};