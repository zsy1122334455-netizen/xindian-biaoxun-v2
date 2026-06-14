import React from 'react';
import { ChevronLeft, Filter, Search } from 'lucide-react';
import { ViewName, Opportunity } from '../types';
import { MOCK_OPPORTUNITIES } from '../constants';

interface Props {
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
  contactName: string;
  enterpriseName: string;
}

export const ContactProjects: React.FC<Props> = ({ onBack, onNavigate, contactName, enterpriseName }) => {
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>(
    MOCK_OPPORTUNITIES.map(opp => ({ ...opp, isStarred: false }))
  );
  
  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpportunities(prev => prev.map(opp => 
      opp.id === id ? { ...opp, isStarred: !opp.isStarred } : opp
    ));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-[#3B82F6] text-white sticky top-0 z-20">
        <div className="flex items-center justify-center h-[52px] px-4 relative">
          <button onClick={onBack} className="absolute left-4 top-1/2 -translate-y-1/2 p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[17px] font-bold">关联项目</h1>
        </div>
      </header>

      <div className="px-4 py-3 bg-white mb-2 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">{enterpriseName}</div>
        <div className="text-lg font-bold text-gray-900">{contactName} 负责的项目</div>
        <div className="text-xs text-blue-600 mt-1 bg-blue-50 w-max px-2 py-0.5 rounded">共 {opportunities.length} 个项目</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div 
              key={opp.id} 
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opp)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {opp.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded font-medium">
                      {tag}
                    </span>
                  ))}
                  {opp.type === 'engineering' && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] rounded font-medium">工程施工</span>}
                  {opp.type === 'procurement' && <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] rounded font-medium">物资采购</span>}
                  {opp.type === 'service' && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded font-medium">服务类</span>}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">{opp.date}</span>
              </div>
              
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-3 line-clamp-2" style={{ wordBreak: 'break-all' }}>
                {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                {opp.isMultiBid && (
                  <span className="text-primary ml-1 text-xs shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                )}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-gray-500">{opp.region}</span>
                  <span className="text-[12px] font-bold text-[#FF4D4F]">{opp.amount}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-1">项目经理:</span>
                  <span className="text-gray-900">{contactName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
