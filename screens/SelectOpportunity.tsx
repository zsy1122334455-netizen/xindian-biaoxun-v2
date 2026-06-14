import React, { useState } from 'react';
import { ChevronLeft, Star, Search, MapPin, ChevronDown, Filter, Download, Globe } from 'lucide-react';
import { Opportunity } from '../types';
import { getProjectTypeStyle, getAnnouncementTypeStyle } from '../utils';

interface SelectOpportunityProps {
  onBack: () => void;
  onSelect: (opportunity: Opportunity) => void;
  opportunities: Opportunity[];
}

export const SelectOpportunity: React.FC<SelectOpportunityProps> = ({ onBack, onSelect, opportunities }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const starredOpportunities = (opportunities || []).filter(o => o?.isStarred);
  const filteredOpportunities = starredOpportunities.filter(o => 
    (o?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F8FF] flex flex-col font-sans text-gray-900">
      {/* Header - Matching P2 Subscription Style */}
      <header className="bg-blue-600 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-center relative">
          <button onClick={onBack} className="absolute left-0 p-1 text-white active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide">选择商机</h1>
        </div>
      </header>


      {/* Filters Row */}
      <div className="bg-white px-2 py-3 border-b border-gray-100 flex items-center shadow-sm">
        <div className="flex flex-1 items-center gap-1 min-w-0 pr-2">
           {[
             { id: '地区', label: '地区' },
             { id: '时间', label: '近三个月' },
             { id: '项目类型', label: '业务类型' }
           ].map(f => (
               <button 
                key={f.id} 
                className={`flex items-center justify-center gap-0.5 flex-1 min-w-0 px-1 py-1.5 rounded-lg transition-colors text-gray-600 active:bg-gray-50`}
               >
                  <span className="text-[13px] truncate">{f.label}</span>
                  <ChevronDown size={12} className={`shrink-0 text-gray-400 ml-0.5 transition-transform`}/>
               </button>
           ))}
        </div>
        <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>
        <button 
            className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-gray-600 active:bg-gray-50`}
        >
            <Filter size={16} />
        </button>
      </div>

      {/* Data Info row */}
      <div className="flex px-4 py-3 items-center justify-between border-t border-[#F0F0F0] bg-white">
        <div className="text-[13px] text-[#666666]">
          共<span className="text-[#FF4D4F] mx-1 font-medium font-numbers">{filteredOpportunities.length > 0 ? '5000+' : '0'}</span>条数据
        </div>
        <button className="text-[#1677FF] text-[13px] font-medium active:opacity-70">
          导出数据
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[16px] space-y-3">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp) => {
             const statusText = opp?.status || '招标';
             const isBidding = statusText.includes('招标') || statusText.includes('报名') || statusText.includes('小时') || statusText.includes('截止');
             const isWon = statusText.includes('中标') || statusText.includes('公示') || statusText.includes('结束') || statusText.includes('废标') || statusText.includes('流标');
             const isProposed = !isBidding && !isWon;

             const titleInfo = opp?.title || '';
             const purchasingUnit = titleInfo.substring(0, 6) + (titleInfo.includes('公司') ? '' : '有限公司');
             const agencyUnit = titleInfo.substring(0, 4) + '招标代理机构';
             const constructionUnit = titleInfo.substring(0, 4) + '建设集团';
             const dateInfo = opp?.date || '';
             const deadline = opp?.deadline || (dateInfo.includes(':') ? dateInfo : dateInfo + ' 23:59');

             const isRedStatus = statusText.includes('废标') || statusText.includes('流标') || statusText.includes('截止');
             const statusBg = isRedStatus ? 'bg-[#FFF1F0]' : 'bg-[#E6F4FF]';
             const statusColor = isRedStatus ? 'text-[#FF4D4F]' : 'text-[#1677FF]';

             return (
               <article 
                 key={opp.id} 
                 onClick={() => onSelect(opp)}
                 className="bg-white p-4 rounded-xl shadow-sm active:bg-gray-50 transition-all active:scale-[0.99] border border-gray-100 cursor-pointer"
               >
                 <h3 className="text-[15px] font-medium text-[#333333] leading-snug mb-2.5 flex justify-between items-start">
                   <span className="flex-1 line-clamp-2" style={{ wordBreak: 'break-all' }}>
                     {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                     {opp.isMultiBid && (
                       <span className="text-primary ml-1 text-[11px] shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                     )}
                   </span>
                   <button className="shrink-0 ml-2 p-1 active:scale-90 transition-transform">
                     <svg 
                       width="20" 
                       height="20" 
                       viewBox="0 0 24 24" 
                       fill="#FACC15" 
                       stroke="#FACC15" 
                       strokeWidth="2" 
                       strokeLinecap="round" 
                       strokeLinejoin="round"
                     >
                       <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                     </svg>
                   </button>
                 </h3>
                 
                 <div className="flex flex-wrap gap-2 mb-3">
                   <span className="h-5 flex items-center px-1.5 text-[11px] rounded bg-[#E6F4FF] text-[#1677FF]">
                     {opp.region}
                   </span>
                   {opp.projectType && (
                     <span className={`h-5 flex items-center px-1.5 text-[11px] rounded ${getProjectTypeStyle(opp.projectType)}`}>
                       {opp.projectType}
                     </span>
                   )}
                   <span className="h-5 flex items-center px-1.5 text-[11px] rounded bg-[#FFF0E6] text-[#FF7A45]">
                     招标公告
                   </span>
                   <span className={`h-5 flex items-center px-1.5 text-[11px] rounded ${statusBg} ${statusColor}`}>
                     {statusText}
                   </span>
                 </div>
                 
                 <div className="space-y-1.5 text-[13px] mb-3">
                    {isProposed && (
                      <div className="flex">
                        <span className="text-[#999999] shrink-0">招采单位：</span>
                        <span className="text-[#1677FF] truncate">{purchasingUnit}</span>
                      </div>
                    )}
                    
                    {isBidding && (
                      <>
                        <div className="flex">
                          <span className="text-[#999999] shrink-0">招采单位：</span>
                          <span className="text-[#1677FF] truncate">{purchasingUnit}</span>
                        </div>
                        <div className="flex">
                          <span className="text-[#999999] shrink-0">代理单位：</span>
                          <span className="text-[#1677FF] truncate">{agencyUnit}</span>
                        </div>
                      </>
                    )}

                    {isWon && (
                      <>
                        <div className="flex">
                          <span className="text-[#999999] shrink-0">招采单位：</span>
                          <span className="text-[#1677FF] truncate">{purchasingUnit}</span>
                        </div>
                        <div className="flex">
                          <span className="text-[#999999] shrink-0">建设单位：</span>
                          <span className="text-[#1677FF] truncate">{constructionUnit}</span>
                        </div>
                      </>
                    )}
                 </div>

                 <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <div className="text-[16px] font-bold text-[#FF4D4F] font-numbers">
                      {opp.amount || '--'}
                    </div>
                    <div className="text-[12px] text-[#999999]">
                      {opp.date}
                    </div>
                 </div>
               </article>
             );
          })
        ) : (
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
            <p className="text-[14px] text-gray-500">暂无收藏的商机</p>
          </div>
        )}

        {filteredOpportunities.length > 0 && (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-300">
            <Globe size={18} />
            <p className="text-sm">没有更多数据了</p>
          </div>
        )}
      </div>
    </div>
  );
};
