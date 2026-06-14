import React, { useState } from 'react';
import { ChevronLeft, Building2, MapPin } from 'lucide-react';
import { ViewName, Opportunity, Enterprise } from '../types';
import { MOCK_OPPORTUNITIES, MOCK_ENTERPRISES } from '../constants';

interface Props {
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
}

const getRoleTextColor = (role?: string) => {
  switch (role) {
    case '招采单位': return 'text-blue-600';
    case '招标代理': return 'text-emerald-600';
    case '投标单位': return 'text-amber-600';
    default: return 'text-gray-900';
  }
};

const getRoleIconTheme = (role?: string) => {
  switch (role) {
    case '招采单位': return 'bg-blue-50 text-blue-500';
    case '招标代理': return 'bg-emerald-50 text-emerald-500';
    case '投标单位': return 'bg-amber-50 text-amber-500';
    default: return 'bg-gray-50 text-gray-500';
  }
};

export const BrowsingHistory: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'enterprises'>('opportunities');

  // Use mock data for history
  const historyOpportunities = MOCK_OPPORTUNITIES.slice(0, 5);
  const historyEnterprises = MOCK_ENTERPRISES.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-safe-bottom font-sans flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white sticky top-0 z-20 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">浏览历史</h1>
        <div className="w-10"></div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white px-4 pt-2 border-b border-gray-100 sticky top-[60px] z-10">
        <button
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'opportunities' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('opportunities')}
        >
          商机
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'enterprises' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('enterprises')}
        >
          企业
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'opportunities' ? (
          historyOpportunities.map(opp => (
            <div
              key={opp.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 relative active:scale-[0.99] transition-transform"
              onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opp)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug pr-6 line-clamp-2" style={{ wordBreak: 'break-all' }}>
                  {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                  {opp.isMultiBid && (
                    <span className="text-primary ml-1 text-xs shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                  )}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="h-5 flex items-center px-2 bg-gray-50 text-gray-500 text-[10px] font-medium rounded">{opp.region}</span>
                {opp.projectType && (
                  <span className="h-5 flex items-center px-2 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">{opp.projectType}</span>
                )}
                {opp.tags.map(t => (
                  <span key={t} className="h-5 flex items-center px-2 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-red-500 font-numbers">{opp.amount}</span>
                <span className="text-xs text-gray-400">{opp.date}</span>
              </div>
            </div>
          ))
        ) : (
          historyEnterprises.map(ent => (
            <div
              key={ent.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 active:scale-[0.99] transition-transform"
              onClick={() => onNavigate(ViewName.ENTERPRISE_DETAIL, ent)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${getRoleIconTheme(ent.role)}`}>
                    {ent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{ent.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="flex items-center"><Building2 size={12} className="mr-1"/>{ent.role || ent.industry}</span>
                      <span className="flex items-center"><MapPin size={12} className="mr-1"/>{ent.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">注册资本</div>
                  <div className={`text-sm font-bold font-numbers ${getRoleTextColor(ent.role)}`}>{ent.capital}</div>
                </div>
                <div className="w-px h-6 bg-gray-100"></div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">成立日期</div>
                  <div className={`text-sm font-bold font-numbers ${getRoleTextColor(ent.role)}`}>{ent.date}</div>
                </div>
                <div className="w-px h-6 bg-gray-100"></div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">法定代表</div>
                  <div className="text-sm font-bold text-gray-900 font-numbers">{ent.legalRep}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};
