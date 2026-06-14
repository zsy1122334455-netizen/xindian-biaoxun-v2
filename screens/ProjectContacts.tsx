import React from 'react';
import { ChevronLeft, Phone, User, Building2 } from 'lucide-react';
import { ViewName, UserRole } from '../types';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  role: string;
  company: string;
  projectName: string;
}

interface ProjectContactsProps {
  onBack: () => void;
  contacts: Contact[];
  onUnfollow: (id: string) => void;
  onNavigate: (view: ViewName, data?: any) => void;
  userRole?: UserRole;
}

export const ProjectContacts: React.FC<ProjectContactsProps> = ({ onBack, contacts, onUnfollow, onNavigate, userRole = UserRole.FREE }) => {
  const maskPhone = (phone: string) => {
    if (userRole === UserRole.SVIP) return phone;
    if (!phone || phone.length < 11) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(7);
  };

  return (
    <div className="min-h-screen bg-bg-page font-sans flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white sticky top-0 z-20 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">项目联系人</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-gray-400">
            <div className="w-40 h-40 mb-3 mx-auto text-gray-200">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-200">
                <rect x="40" y="30" width="120" height="140" rx="8" fill="currentColor" opacity="0.2"/>
                <rect x="55" y="60" width="90" height="12" rx="6" fill="currentColor" opacity="0.5"/>
                <rect x="55" y="90" width="60" height="12" rx="6" fill="currentColor" opacity="0.5"/>
                <rect x="55" y="120" width="75" height="12" rx="6" fill="currentColor" opacity="0.5"/>
                <circle cx="140" cy="140" r="30" fill="white"/>
                <circle cx="140" cy="140" r="26" stroke="currentColor" strokeWidth="4"/>
                <path d="M158 158L175 175" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[14px] text-gray-500">暂无关注的联系人</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold">
                    {contact.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {contact.name}
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-normal">
                        {contact.role}
                      </span>
                    </h3>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={12} /> {maskPhone(contact.phone)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onUnfollow(contact.id)}
                  className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  取消关注
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <Building2 size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 line-clamp-1">{contact.company}</span>
                </div>
                <div 
                  className="flex items-start gap-2 text-xs cursor-pointer group"
                  onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, { 
                    id: `opp-${contact.id}`,
                    title: contact.projectName,
                    tags: ['招采公告', '公开招标'],
                    region: '江苏·张家港',
                    amount: '500万',
                    date: '2025-08-21',
                    isStarred: false,
                    projectType: '工程施工',
                    type: 'procurement'
                  })}
                >
                  <span className="text-gray-400 font-medium shrink-0">关联项目:</span>
                  <span className="text-gray-700 line-clamp-2 group-hover:text-primary transition-colors underline decoration-transparent group-hover:decoration-primary/30">{contact.projectName}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
