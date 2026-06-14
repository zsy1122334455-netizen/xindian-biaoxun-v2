import React, { useState, useEffect } from 'react';
import { ChevronLeft, Star, ChevronDown, ChevronUp, Phone, ChevronRight, Eye, X, Copy, Check, Network, Swords, UserPlus } from 'lucide-react';
import { Enterprise, ViewName, UserRole, EnterpriseData } from '../types';
import { MOCK_OPPORTUNITIES } from '../constants';
import { REGIONS } from '../src/constants/regions';
import { ExportDialog } from '../components/ExportDialog';
import { getProjectTypeStyle, getAnnouncementTypeStyle } from '../utils';

const QUALIFICATION_DATA = [
  { label: '建筑业企业资质', secondary: ['特级', '一级', '二级', '三级'] },
  { label: '工程勘察资质', secondary: ['综合类', '专业类', '劳务类'] },
  { label: '工程设计资质', secondary: ['综合资质', '行业资质', '专业资质', '专项资质'] },
  { label: '工程监理资质', secondary: ['综合资质', '专业资质', '事务所资质'] },
  { label: '工程造价咨询资质', secondary: ['甲级', '乙级'] },
  { label: '招标代理机构资质', secondary: ['甲级', '乙级', '暂定级'] },
];

const FILTERS = [
  { label: '地区', type: 'region' },
  { label: '时间', type: 'time' },
  { label: '业务类型', type: 'tree' },
];

const BUSINESS_TYPE_TREE = [
  {
    label: '工程建设',
    industries: ['房屋建筑', '市政工程', '水利水电', '电力工程', '公路工程', '铁路工程', '港口航道', '矿山工程', '其它工程']
  },
  {
    label: '政府采购',
    industries: ['货物采购', '服务采购', '修缮工程']
  },
  {
    label: '土地矿权',
    industries: ['宅基地', '工业用地', '商服用地', '矿产出让']
  },
  {
    label: '产权交易',
    industries: ['股权转让', '增资扩扩股', '实务资产']
  },
  {
    label: '其它业务',
    industries: ['排污权', '林权', '碳排放']
  }
];

interface Props {
  enterprise?: Enterprise;
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
  userRole?: UserRole;
  enterpriseInfo?: EnterpriseData | null;
  onToggleFollow?: (id: string) => void;
  onShowPaymentModal?: (sceneId: string) => void;
  addExportRecord?: (dataType: 'opportunity' | 'enterprise', count: number, status?: 'completed' | 'failed') => void;
  exportStatusOverride?: 'completed' | 'failed';
}

const getRoleIconTheme = (role?: string) => {
  switch (role) {
    case '招采单位': return 'bg-blue-50 text-blue-500';
    case '招标代理': return 'bg-emerald-50 text-emerald-500';
    case '投标单位': return 'bg-amber-50 text-amber-500';
    default: return 'bg-gray-50 text-gray-500';
  }
};

const getRoleTheme = (role?: string) => {
  switch (role) {
    case '招采单位': return 'bg-blue-50 text-blue-600';
    case '招标代理': return 'bg-emerald-50 text-emerald-600';
    case '投标单位': return 'bg-amber-50 text-amber-600';
    default: return 'bg-gray-50 text-gray-600';
  }
};

export const EnterpriseDetail: React.FC<Props> = ({ enterprise, onBack, onNavigate, userRole = UserRole.FREE, enterpriseInfo, onToggleFollow, onShowPaymentModal, addExportRecord, exportStatusOverride }) => {
  const maskPhone = (phone: string) => {
    if (userRole === UserRole.SVIP) return phone;
    if (!phone || phone.length < 11) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(7);
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [enterprise]);

  const [activeTab, setActiveTab] = React.useState('中标业绩');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [toast, setToast] = React.useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ province: string, cities: string[] }>({ province: '全国', cities: [] });
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    时间: ['近三个月'],
    业务类型: [],
  });
  const [expandedBusinessTypes, setExpandedBusinessTypes] = useState<string[]>(['工程建设']);
  const [customStartTime, setCustomStartTime] = useState<string>('');
  const [customEndTime, setCustomEndTime] = useState<string>('');
  const [moreFilters, setMoreFilters] = useState<{
    searchScope: string;
    announcementType: string;
    biddingMethod: string[];
    deadline: string;
    deadlineStart: string;
    deadlineEnd: string;
    qualification?: { primary: string | null; secondary: string[] };
    fundingSource?: string[];
    excludeKeywords?: string[];
    excludeScope?: string;
  }>({
    searchScope: '全文',
    announcementType: '不限',
    biddingMethod: ['全部'],
    deadline: '不限',
    deadlineStart: '',
    deadlineEnd: '',
    qualification: { primary: null, secondary: [] },
    fundingSource: ['全部'],
    excludeKeywords: [],
    excludeScope: '标题'
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [confirmDial, setConfirmDial] = useState<{
    isOpen: boolean;
    name: string;
    phone: string;
    role?: string;
  } | null>(null);

  const handleInitiateCall = (name: string, phone: string, role?: string) => {
    if (confirmDial?.isOpen) return;
    setConfirmDial({
      isOpen: true,
      name,
      phone,
      role
    });
  };
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryError, setIsHistoryError] = useState(false);

  const simulateLoadHistory = () => {
    setIsHistoryLoading(true);
    setIsHistoryError(false);
    setTimeout(() => {
      // 20% chance of failure for demo, OR always fail for the specific test enterprise
      if (Math.random() < 0.2 || (enterprise?.name || '').includes('需加载异常演示')) {
        setIsHistoryError(true);
      }
      setIsHistoryLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (activeTab === '中标业绩') {
      simulateLoadHistory();
    }
  }, [activeTab]);

  const handleExport = (count: number) => {
    setToast({ show: true, message: `成功导出 ${count} 条数据` });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const [contacts, setContacts] = React.useState(
    (enterprise?.name || '').includes('无数据') ? [] : [
      { id: 1, role: '项目经理', name: '张春天', phone: '17722330000', project: '某大型工程项目招标工程项目招标工程项目招标', isStarred: true },
      { id: 2, role: '项目经理', name: '张春天', phone: '17722330000', project: '某大型工程项目招标工程项目招标工程项目招标', isStarred: true },
      { id: 3, role: '项目经理', name: '张春天', phone: '17722330000', project: '某大型工程项目招标工程项目招标工程项目招标', isStarred: true },
      { id: 4, role: '项目经理', name: '李秋水', phone: '18899887766', project: '市政道路改造工程二期标段A', isStarred: false },
    ]
  );

  const [history, setHistory] = React.useState(
    (enterprise?.name || '').includes('无数据') ? [] : MOCK_OPPORTUNITIES.map((opp, index) => ({ ...opp, id: (index + 1).toString(), isStarred: false }))
  );

  const [filteredHistory, setFilteredHistory] = React.useState(history);

  useEffect(() => {
    if ((enterprise?.name || '').includes('无数据')) {
      setFilteredHistory([]);
      return;
    }
    let result = history;

    if (selectedRegion.province !== '全国') {
      result = result.filter(opp => {
        if (selectedRegion.cities.length > 0) {
          return selectedRegion.cities.some(city => opp.region.includes(city));
        }
        return opp.region.includes(selectedRegion.province);
      });
    }

    if (moreFilters.announcementType !== '不限') {
      result = result.filter(opp => opp.tags.includes(moreFilters.announcementType));
    }

    if (moreFilters.biddingMethod && moreFilters.biddingMethod.length > 0 && !moreFilters.biddingMethod.includes('全部')) {
      result = result.filter(opp => moreFilters.biddingMethod.some(method => opp.tags.includes(method)));
    }

    if (moreFilters.fundingSource && moreFilters.fundingSource.length > 0 && !moreFilters.fundingSource.includes('全部')) {
      result = result.filter(opp => moreFilters.fundingSource!.some(source => opp.tags.includes(source)));
    }

    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (key !== '时间' && values.length > 0 && !values.includes('全部') && values.length < history.length) {
        result = result.filter(opp => values.some(val => opp.tags.includes(val) || opp.projectType === val));
      }
    });

    if (moreFilters.excludeKeywords && moreFilters.excludeKeywords.length > 0) {
      result = result.filter(opp => {
        const textToSearch = moreFilters.excludeScope === '标题' ? opp.title : opp.title + ' ' + opp.tags.join(' ');
        return !moreFilters.excludeKeywords!.some(keyword => textToSearch.includes(keyword));
      });
    }

    setFilteredHistory(result);
  }, [history, selectedRegion, selectedFilters, moreFilters, customStartTime, customEndTime]);

  const [news, setNews] = React.useState(
    (enterprise?.name || '').includes('无数据') ? [] : [
    { 
      id: 1, 
      title: '2025年广州市轨道交通八号线北延段工程施工总承包项目', 
      tags: ['工程施工', '招标公告', '公开招标'], 
      location: '广东·广州', 
      amount: '28,500万', 
      date: '5分钟前', 
      isStarred: false, 
      projectType: '工程建设',
      status: '招标中'
    },
    { 
      id: 2, 
      title: '某大型水利枢纽工程勘察设计项目变更公告', 
      tags: ['勘察设计', '变更公告', '竞争性谈判'], 
      location: '江苏·南京', 
      amount: '1,200万', 
      date: '1小时前', 
      isStarred: true, 
      projectType: '水利水电',
      status: '进行中'
    },
    { 
      id: 3, 
      title: '2025年度智慧城市大数据平台软件开发及集成服务采购项目', 
      tags: ['软件开发', '结果公告', '单一来源'], 
      location: '浙江·杭州', 
      amount: '850万', 
      date: '2小时前', 
      isStarred: false, 
      projectType: '政府采购',
      status: '已结束'
    },
    { 
      id: 4, 
      title: '关于某省道改建工程PPP项目社会资本方采购预备公告', 
      tags: ['PPP项目', '前期公告', '公开招标'], 
      location: '四川·成都', 
      amount: '15.6亿', 
      date: '昨天', 
      isStarred: false, 
      projectType: '公路工程',
      status: '预告中'
    },
  ]);

  if (!enterprise) return null;

  const handleToggleStar = (type: 'contacts' | 'history' | 'news', id: number | string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (type === 'contacts') {
      setContacts(prev => prev.map(item => item.id === id ? { ...item, isStarred: newStatus } : item));
    } else if (type === 'history') {
      setHistory(prev => prev.map(item => item.id === id ? { ...item, isStarred: newStatus } : item));
    } else if (type === 'news') {
      setNews(prev => prev.map(item => item.id === id ? { ...item, isStarred: newStatus } : item));
    }
    
    setToast({ show: true, message: newStatus ? '已收藏' : '已取消收藏' });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case '项目联系人': {
        const groupedContacts = Object.values(contacts.reduce((acc, contact) => {
          const key = `${contact.name}-${contact.phone}`;
          if (!acc[key]) {
            acc[key] = { ...contact, count: 1 };
          } else {
            acc[key].count++;
          }
          return acc;
        }, {} as Record<string, any>));

        return (
          <>
            <div className="space-y-0">
              {groupedContacts.length > 0 ? (
                groupedContacts.map((contact, idx) => (
                   <div key={idx} className="flex p-4 border-b border-gray-100 hover:bg-gray-50 transition">
                      <div className="text-sm font-medium text-gray-400 w-6 pt-0.5">{idx + 1}</div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col gap-2 text-xs">
                               <div className="flex items-center">
                                 <span className="text-gray-500 w-16">项目经理</span>
                                 <span className="text-gray-900 font-bold ml-1">{contact.name}</span>
                               </div>
                               <div className="flex items-center">
                                 <span className="text-gray-500 w-16">联系方式</span> 
                                  <span className="text-gray-900 font-bold ml-1">{(userRole === UserRole.FREE || userRole === UserRole.VIP) ? maskPhone(contact.phone) : contact.phone}</span>
                                  {(userRole === UserRole.FREE || userRole === UserRole.VIP) && (
                                    <button onClick={() => onShowPaymentModal?.('CONTACT_PHONE')} className="text-[10px] text-primary ml-1 opacity-70 hover:opacity-100">
                                      (开通SVIP查看)
                                    </button>
                                  )}
                               </div>
                            </div>
                            <div className="flex items-start gap-1">
                              <button 
                                onClick={() => {
                                  if (userRole === UserRole.FREE || userRole === UserRole.VIP) {
                                    onShowPaymentModal?.('CONTACT_PHONE');
                                    return;
                                  }
                                  setSelectedContact({
                                    name: contact.name,
                                    phone: contact.phone,
                                    role: contact.role,
                                    company: enterprise?.name || ''
                                  });
                                  setShowContactModal(true);
                                }}
                                className="p-1.5 bg-blue-50 text-primary rounded-full active:scale-90 transition-transform"
                                title="联系项目经理"
                              >
                                <Phone size={14} />
                              </button>
                              <button 
                                onClick={() => {
                                  if (userRole === UserRole.FREE || userRole === UserRole.VIP) {
                                    onShowPaymentModal?.('CONTACT_FOLLOW');
                                    return;
                                  }
                                  handleToggleStar('contacts', contact.id, contact.isStarred);
                                }} 
                                className="p-1.5 active:scale-90 transition-transform"
                              >
                                <Star size={16} className={contact.isStarred ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                              </button>
                            </div>
                         </div>
                         {contact.count > 1 ? (
                           <div 
                              className="flex items-center justify-between text-xs cursor-pointer group mt-2 bg-blue-50/40 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              onClick={() => onNavigate(ViewName.CONTACT_PROJECTS, { contactName: contact.name, enterpriseName: enterprise?.name })}
                           >
                              <div className="flex items-center gap-2">
                                <span className="text-primary bg-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">关联项目</span>
                                <span className="text-gray-600 font-medium group-hover:text-primary transition-colors">共 {contact.count} 个负责项目</span>
                              </div>
                              <div className="flex items-center text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                                <span>查看列表</span>
                                <ChevronRight size={14} />
                              </div>
                           </div>
                         ) : (
                           <div 
                              className="flex items-start gap-2 text-xs cursor-pointer group mt-2"
                              onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, { 
                                 id: `opp-${contact.id}`,
                                 title: contact.project,
                                 tags: ['招采公告', '公开招标'],
                                 region: '江苏·张家港',
                                 amount: '500万',
                                 date: '2025-08-21',
                                 isStarred: false,
                                 projectType: '工程施工',
                                 type: 'procurement'
                               })}
                           >
                              <span className="text-primary bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap group-hover:bg-blue-100 transition-colors">负责项目</span>
                              <span className="text-gray-500 line-clamp-1 leading-relaxed group-hover:text-primary transition-colors underline decoration-transparent group-hover:text-primary/30">{contact.project}</span>
                           </div>
                         )}
                      </div>
                   </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <UserPlus size={32} />
                  </div>
                  <p className="text-gray-400 text-sm">暂无相关数据</p>
                </div>
              )}
            </div>
          </>
        );
      }
      case '中标业绩':
        return (
          <>
            <div className="relative z-30">
              <div className="flex px-2 py-3 items-center bg-white border-b border-gray-50 shadow-sm justify-between">
                {FILTERS.map((filter) => {
                  let displayText = filter.label;
                  if (filter.label === '地区') {
                    if (selectedRegion.province === '全国' && selectedRegion.cities.length === 0) {
                      displayText = '全国';
                    } else if (selectedRegion.cities.length > 0) {
                      displayText = selectedRegion.cities.join(',');
                    } else {
                      displayText = selectedRegion.province;
                    }
                  } else {
                    const selected = selectedFilters[filter.label];
                    if (filter.label === '时间' && selected?.[0] === '自定义') {
                      displayText = `${customStartTime.split('-').slice(1).join('/') || '始'}~${customEndTime.split('-').slice(1).join('/') || '末'}`;
                    } else if (filter.label === '业务类型') {
                      if (selected && selected.length > 0) {
                        const topLevels = BUSINESS_TYPE_TREE.filter(b => selected.includes(b.label)).map(b => b.label);
                        if (topLevels.length > 0) {
                          displayText = topLevels.join(',');
                        } else {
                          displayText = selected.slice(0, 1).join(',') + (selected.length > 1 ? `...(${selected.length})` : '');
                        }
                      }
                    } else if (selected && selected.length > 0 && selected[0] !== '不限' && selected[0] !== '全部') {
                      displayText = selected.join(',');
                    }
                  }
                  
                  const isActive = activeFilter === filter.label;
                  
                  return (
                    <button 
                      key={filter.label} 
                      className={`flex items-center justify-center gap-1 flex-1 min-w-0 px-1 ${isActive ? 'text-primary' : 'text-gray-600'}`}
                      onClick={() => setActiveFilter(isActive ? null : filter.label)}
                    >
                      <span className="text-[14px] truncate">{displayText}</span>
                      <ChevronDown size={14} className={`shrink-0 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                    </button>
                  );
                })}
              </div>
              {activeFilter && (
                <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2">
                  {activeFilter === '地区' ? (
                    <div className="flex flex-col h-[400px]">
                      <div className="flex flex-1 overflow-hidden">
                        <div className="w-1/3 bg-[#F7F8FA] overflow-y-auto">
                          <button 
                            className={`w-full text-center px-4 py-3 text-[15px] ${selectedRegion.province === '全国' ? 'bg-white text-primary' : 'text-gray-600'}`}
                            onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
                          >
                            全国
                          </button>
                          {REGIONS.map(r => (
                            <button 
                              key={r.name}
                              className={`w-full text-center px-4 py-3 text-[15px] ${selectedRegion.province === r.name ? 'bg-white text-primary' : 'text-gray-600'}`}
                              onClick={() => setSelectedRegion({ ...selectedRegion, province: r.name })}
                            >
                              {r.name}
                            </button>
                          ))}
                        </div>
                        <div className="w-2/3 overflow-y-auto bg-white">
                          {selectedRegion.province === '全国' ? (
                            <button 
                              className="w-full text-left px-6 py-3 text-[15px] flex justify-between items-center text-primary"
                              onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
                            >
                              全国
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </button>
                          ) : (
                            REGIONS.find(r => r.name === selectedRegion.province)?.cities.map(city => (
                              <button 
                                key={city}
                                className={`w-full text-left px-6 py-3 text-[15px] flex justify-between items-center ${selectedRegion.cities.includes(city) ? 'text-primary' : 'text-gray-800'}`}
                                onClick={() => {
                                  const newCities = selectedRegion.cities.includes(city)
                                    ? selectedRegion.cities.filter(c => c !== city)
                                    : [...selectedRegion.cities, city];
                                  setSelectedRegion({ ...selectedRegion, cities: newCities });
                                }}
                              >
                                {city}
                                {selectedRegion.cities.includes(city) && (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="bg-white border-t border-gray-100 flex flex-col">
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-50">
                          <span className="text-[15px] text-gray-800 shrink-0">已选择({selectedRegion.province === '全国' ? 1 : selectedRegion.cities.length})</span>
                          <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {selectedRegion.province === '全国' ? (
                              <div className="flex items-center gap-1 px-2 py-1 bg-[#F7F8FA] rounded text-[13px] text-gray-600">
                                全国
                                <button onClick={() => setSelectedRegion({ province: '全国', cities: [] })} className="text-gray-400 hover:text-gray-600">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                            ) : (
                              selectedRegion.cities.map(city => (
                                <div key={city} className="flex items-center gap-1 px-2 py-1 bg-[#F7F8FA] rounded text-[13px] text-gray-600 whitespace-nowrap">
                                  {city}
                                  <button 
                                    onClick={() => setSelectedRegion({ ...selectedRegion, cities: selectedRegion.cities.filter(c => c !== city) })} 
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="flex p-4 border-t border-[#F0F0F0] gap-3">
                          <button 
                            className="flex-1 py-2 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
                            onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
                          >
                            清空
                          </button>
                          <button 
                            className="flex-1 py-2 bg-[#1677FF] text-white rounded-md text-[14px] font-medium"
                            onClick={() => setActiveFilter(null)}
                          >
                            筛选
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : activeFilter === '时间' ? (
                    <div className="flex flex-col bg-white max-h-[500px]">
                      <div className="flex-1 overflow-y-auto p-4">
                        {['不限', '今天', '近3天', '近7天', '近30天', '近60天', '近90天', '近180天', '近一年'].map(option => {
                          const isSelected = selectedFilters['时间']?.[0] === option || (option === '不限' && !selectedFilters['时间']?.length);
                          return (
                            <button 
                              key={option}
                              className="w-full flex justify-between items-center py-3"
                              onClick={() => {
                                setSelectedFilters(prev => ({ ...prev, 时间: [option] }));
                              }}
                            >
                              <span className={`text-[14px] ${isSelected ? 'text-[#1677FF]' : 'text-[#333333]'}`}>{option}</span>
                              <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${isSelected ? 'bg-[#1677FF] border-[#1677FF]' : 'border-[#D9D9D9]'}`}>
                                {isSelected && (
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[14px] text-[#333333] whitespace-nowrap">自定义:</span>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1 h-8 bg-white border border-[#E5E5E5] rounded flex items-center px-2 relative overflow-hidden">
                              <input 
                                type="date" 
                                className="absolute inset-0 opacity-0 w-full h-full z-10" 
                                value={customStartTime}
                                onChange={(e) => {
                                  setCustomStartTime(e.target.value);
                                  setSelectedFilters(prev => ({ ...prev, 时间: ['自定义'] }));
                                }}
                              />
                              <svg className="w-4 h-4 text-gray-400 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className={`text-[12px] whitespace-nowrap ${customStartTime ? 'text-[#333333]' : 'text-gray-400'}`}>
                                {customStartTime || '开始时间'}
                              </span>
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="flex-1 h-8 bg-white border border-[#E5E5E5] rounded flex items-center px-2 relative overflow-hidden">
                              <input 
                                type="date" 
                                className="absolute inset-0 opacity-0 w-full h-full z-10" 
                                value={customEndTime}
                                onChange={(e) => {
                                  setCustomEndTime(e.target.value);
                                  setSelectedFilters(prev => ({ ...prev, 时间: ['自定义'] }));
                                }}
                              />
                              <svg className="w-4 h-4 text-gray-400 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className={`text-[12px] whitespace-nowrap ${customEndTime ? 'text-[#333333]' : 'text-gray-400'}`}>
                                {customEndTime || '结束时间'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex p-4 border-t border-[#F0F0F0] gap-3">
                        <button 
                          className="flex-1 py-2 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
                          onClick={() => {
                            setSelectedFilters(prev => ({ ...prev, 时间: ['不限'] }));
                            setCustomStartTime('');
                            setCustomEndTime('');
                          }}
                        >
                          清空
                        </button>
                        <button 
                          className="flex-1 py-2 bg-[#1677FF] text-white rounded-md text-[14px] font-medium"
                          onClick={() => setActiveFilter(null)}
                        >
                          筛选
                        </button>
                      </div>
                    </div>
                  ) : activeFilter === '业务类型' ? (
                    <div className="flex flex-col max-h-[500px]">
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-col gap-2">
                          {BUSINESS_TYPE_TREE.map(item => {
                            const isExpanded = expandedBusinessTypes.includes(item.label);
                            const isAllSelected = selectedFilters['业务类型']?.includes(item.label);
                            
                            return (
                              <div key={item.label} className="border-b border-gray-50 pb-2">
                                <div 
                                  className="flex items-center justify-between py-3 cursor-pointer"
                                  onClick={() => {
                                    if (isExpanded) {
                                      setExpandedBusinessTypes(prev => prev.filter(i => i !== item.label));
                                    } else {
                                      setExpandedBusinessTypes(prev => [...prev, item.label]);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="flex items-center justify-center p-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const current = selectedFilters['业务类型'] || [];
                                        let next;
                                        if (isAllSelected) {
                                          next = current.filter(val => val !== item.label && !item.industries.includes(val));
                                        } else {
                                          next = Array.from(new Set([...current, item.label, ...item.industries]));
                                        }
                                        setSelectedFilters({ ...selectedFilters, 业务类型: next });
                                      }}
                                    >
                                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isAllSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                        {isAllSelected && (
                                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                    <span className={`text-[14px] font-medium ${isAllSelected ? 'text-primary' : 'text-gray-900'}`}>{item.label}</span>
                                  </div>
                                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                                
                                {isExpanded && (
                                  <div className="grid grid-cols-2 gap-2 pl-7 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {item.industries.map(industry => {
                                      const isSelected = selectedFilters['业务类型']?.includes(industry);
                                      return (
                                        <button
                                          key={industry}
                                          className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left text-[13px] transition-colors ${
                                            isSelected ? 'bg-blue-50 text-primary' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                          }`}
                                          onClick={() => {
                                            const current = selectedFilters['业务类型'] || [];
                                            let next;
                                            if (isSelected) {
                                              next = current.filter(i => i !== industry);
                                            } else {
                                              next = [...current, industry];
                                            }
                                            
                                            const allIndustriesSelected = item.industries.every(ind => next.includes(ind));
                                            if (allIndustriesSelected) {
                                              next = Array.from(new Set([...next, item.label]));
                                            } else {
                                              next = next.filter(val => val !== item.label);
                                            }
                                            
                                            setSelectedFilters({ ...selectedFilters, 业务类型: next });
                                          }}
                                        >
                                          <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                            {isSelected && (
                                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                          <span className="truncate">{industry}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex p-4 border-t border-[#F0F0F0] gap-3">
                        <button 
                          className="flex-1 py-2 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
                          onClick={() => setSelectedFilters({ ...selectedFilters, 业务类型: [] })}
                        >
                          清空
                        </button>
                        <button 
                          className="flex-1 py-2 bg-[#1677FF] text-white rounded-md text-[14px] font-medium"
                          onClick={() => setActiveFilter(null)}
                        >
                          筛选
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
              <div className="text-xs text-gray-400">
                共找到 <span className="text-primary font-medium">{filteredHistory.length}</span> 条项目业绩
              </div>
              <button 
                className="text-[#1677FF] text-[13px] flex items-center gap-1 font-medium"
                onClick={() => { if (userRole === UserRole.FREE) { onShowPaymentModal?.('EXPORT_LOCKED'); } else { setIsExportDialogOpen(true); } }}
              >
                导出数据
              </button>
            </div>
            <div className="space-y-3 p-4 bg-gray-50 min-h-[400px] flex flex-col">
              {isHistoryLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-sm">正在获取业绩数据...</p>
                </div>
              ) : isHistoryError ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <X size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-medium mb-1">加载失败，请稍后重试</p>
                    <p className="text-gray-400 text-xs">网络连接超时或服务器异常</p>
                  </div>
                  <button 
                    onClick={simulateLoadHistory}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                  >
                    重试
                  </button>
                </div>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((opp, idx) => (
                   <div 
                      key={idx} 
                      onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opp)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative active:scale-[0.98] transition-transform cursor-pointer flex flex-col"
                   >
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="text-[16px] font-bold text-gray-900 leading-[1.5] line-clamp-2 flex-1 pr-6" style={{ wordBreak: 'break-all' }}>
                            {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                            {opp.isMultiBid && (
                               <span className="text-primary ml-1 text-xs shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                            )}
                         </h3>
                         <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               handleToggleStar('history', opp.id, opp.isStarred);
                            }}
                            className="absolute top-4 right-4 p-1"
                         >
                            <Star 
                               size={20} 
                               className={opp.isStarred ? "text-orange-400 fill-orange-400" : "text-gray-300"} 
                            />
                         </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] flex-wrap mb-3">
                         <span className="h-5 flex items-center px-1.5 rounded bg-[#E6F4FF] text-[#1677FF]">
                            {(opp.region || '').replace('·', ' ')}
                         </span>
                         {opp.projectType && (
                            <span className={`h-5 flex items-center px-1.5 rounded text-[11px] ${getProjectTypeStyle(opp.projectType)}`}>
                               {opp.projectType}
                            </span>
                         )}
                         {(() => {
                           const tags = opp.tags || [];
                           const orgMethod = tags.find(t => t.includes('招标') || t.includes('竞价') || t.includes('谈判') || t.includes('磋商')) || '';
                           const announcementType = tags.find(t => t.includes('公告') || t.includes('计划') || t.includes('公示')) || '';
                           const tagsToShow = [announcementType, orgMethod].filter(Boolean);
                           const uniqueTags = Array.from(new Set(tagsToShow));
                           
                           return uniqueTags.map((tag) => {
                             const isOrgMethod = tag === orgMethod && tag !== announcementType;
                             const styleClass = isOrgMethod 
                               ? 'bg-[#F5F5F5] text-[#666666]' 
                               : getAnnouncementTypeStyle(tag);
                               
                             return (
                               <span key={tag} className={`h-5 flex items-center px-1.5 rounded text-[11px] ${styleClass}`}>
                                 {tag}
                               </span>
                             );
                           });
                         })()}
                         {opp.status && (
                           <span className={`flex items-center gap-1 px-1.5 h-5 rounded text-[11px] font-medium ${
                             opp.status.includes('废标') || opp.status.includes('流标') || opp.status.includes('截止') || opp.status.includes('结束')
                               ? 'text-[#FF4D4F] bg-[#FFF1F0]' 
                               : 'bg-[#E6F4FF] text-[#1677FF]'
                           }`}>
                              {opp.status}
                           </span>
                         )}
                      </div>
                      <div className="space-y-1.5 mb-3 text-[13px]">
                        <div className="flex items-start gap-1">
                          <span className="text-[#999999] shrink-0">招采单位:</span>
                          <span className="text-[#1677FF] font-medium truncate">2025年广有限公司</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-[#999999] shrink-0">代理单位:</span>
                          <span className="text-[#1677FF] font-medium truncate">2025招标代理机构</span>
                        </div>
                      </div>
                      <div className="mt-auto flex justify-between items-center pt-2.5 border-t border-gray-100">
                         <span className="text-[18px] text-[#FF4D4F] font-bold font-numbers">{opp.amount}</span>
                         <span className="text-[12px] text-[#999999] font-numbers">
                           5分钟前
                         </span>
                      </div>
                   </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                    <Swords size={32} />
                  </div>
                  <p className="text-gray-400 text-sm">暂无相关数据</p>
                </div>
              )}
            </div>
          </>
        );
      case '最新动态':
        return (
          <div className="bg-gray-50 min-h-[400px] p-4 rounded-b-xl border-t border-gray-100">
            {news.length > 0 ? (
              <>
                <div className="text-center mb-4 flex items-center justify-center">
                  <div className="w-12 h-[1px] bg-gray-200"></div>
                  <p className="text-xs text-gray-400 mx-3">--近一年内有 <span className="text-primary font-medium font-numbers">{news.length}</span> 条最新动态--</p>
                  <div className="w-12 h-[1px] bg-gray-200"></div>
                </div>
                <div className="flex flex-col gap-3">
                  {news.map((item, idx) => (
                     <div 
                        key={idx} 
                        onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, item)}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative active:scale-[0.98] transition-transform cursor-pointer flex flex-col"
                     >
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="text-[16px] font-bold text-gray-900 leading-[1.5] line-clamp-2 flex-1 pr-6">
                              {item.title}
                           </h3>
                           <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleToggleStar('news', item.id, item.isStarred);
                              }}
                              className="absolute top-4 right-4 p-1"
                           >
                              <Star 
                                 size={20} 
                                 className={item.isStarred ? "text-orange-400 fill-orange-400" : "text-gray-300"} 
                              />
                           </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                           <span className="h-5 flex items-center px-1.5 text-[11px] rounded bg-[#E6F4FF] text-[#1677FF]">
                              {(item.location || '').replace('·', ' ')}
                           </span>
                           {item.projectType && (
                              <span className={`h-5 flex items-center px-1.5 rounded text-[11px] ${getProjectTypeStyle(item.projectType)}`}>
                                 {item.projectType}
                              </span>
                           )}
                           {(() => {
                             const tags = item.tags || [];
                             const orgMethod = tags.find(t => t.includes('招标') || t.includes('竞价') || t.includes('谈判') || t.includes('磋商')) || '';
                             const announcementType = tags.find(t => t.includes('公告') || t.includes('计划') || t.includes('公示')) || '';
                             const tagsToShow = [announcementType, orgMethod].filter(Boolean);
                             const uniqueTags = Array.from(new Set(tagsToShow));
                             
                             return uniqueTags.map((tag) => {
                               const isOrgMethod = tag === orgMethod && tag !== announcementType;
                               const styleClass = isOrgMethod 
                                 ? 'bg-[#F5F5F5] text-[#666666]' 
                                 : getAnnouncementTypeStyle(tag);
                                 
                               return (
                                 <span key={tag} className={`h-5 flex items-center px-1.5 rounded text-[11px] ${styleClass}`}>
                                   {tag}
                                 </span>
                               );
                             });
                           })()}
                           {(item as any).status && (
                               <span className={`flex items-center gap-1 px-1.5 h-5 rounded text-[11px] font-medium ${
                                 (item as any).status.includes('废标') || (item as any).status.includes('流标') || (item as any).status.includes('截止') || (item as any).status.includes('结束')
                                   ? 'text-[#FF4D4F] bg-[#FFF1F0]' 
                                   : 'bg-[#E6F4FF] text-[#1677FF]'
                               }`}>
                                  {(item as any).status}
                               </span>
                             )}
                        </div>
                        <div className="space-y-1.5 mb-3 text-[13px]">
                          <div className="flex items-start gap-1">
                            <span className="text-[#999999] shrink-0">招采单位:</span>
                            <span className="text-[#1677FF] font-medium truncate">2025年广有限公司</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-[#999999] shrink-0">代理单位:</span>
                            <span className="text-[#1677FF] font-medium truncate">2025招标代理机构</span>
                          </div>
                        </div>
                        <div className="mt-auto flex justify-between items-center pt-2.5 border-t border-gray-100">
                           <span className="text-[18px] text-[#FF4D4F] font-bold font-numbers">{item.amount}</span>
                           <span className="text-[12px] text-[#999999] font-numbers">
                             5分钟前
                           </span>
                        </div>
                     </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <Network size={32} />
                </div>
                <p className="text-gray-400 text-sm">暂无相关数据</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const toggleFollow = () => {
    if (enterprise && onToggleFollow) {
      onToggleFollow(enterprise.id);
    }
  };

  return (
    <div className="bg-bg-page min-h-screen flex flex-col font-sans pb-10">
      {toast.show && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-[60] animate-fade-in">
          {toast.message}
        </div>
      )}
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100 transition">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-center flex-1 text-gray-900">企业详情</h1>
        <div className="w-8"></div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
        <div className="bg-white m-3 p-4 rounded-xl shadow-sm">
          <div className="flex items-start mb-4">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">{enterprise?.name || '未知企业'}</h2>
                <button 
                  className="p-1"
                  onClick={toggleFollow}
                >
                  <Eye 
                    size={24}
                    color={enterprise.isFollowed ? "#1677FF" : "#999999"}
                    fill={enterprise.isFollowed ? "#E6F4FF" : "none"}
                    strokeWidth={2}
                  />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="h-5 flex items-center px-1.5 text-xs rounded bg-[#E6F4FF] text-[#1677FF]">{(enterprise.location || '').replace('·', ' ')}</span>
                {enterprise.role && (
                  <span className={`h-5 flex items-center text-xs px-1.5 rounded ${getRoleTheme(enterprise.role.split('、')[0])}`}>{enterprise.role}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex bg-gray-50 rounded-lg p-3 mb-3 shrink-0">
            <div className={`text-center flex-1 ${enterprise.capital ? 'border-r border-gray-200 px-1' : 'px-1 border-r border-gray-200'}`}>
              <p className="text-xs text-gray-500 mb-1">法定代表人</p>
              <p className="text-sm font-medium text-gray-900 truncate">{enterprise.legalRep}</p>
            </div>
            {enterprise.capital && (
              <div className="text-center flex-1 border-r border-gray-200 px-1">
                <p className="text-xs text-gray-500 mb-1">注册资本</p>
                <p className="text-sm font-medium text-gray-900 font-numbers truncate">{enterprise.capital}</p>
              </div>
            )}
            <div className={`text-center flex-1 px-1`}>
              <p className="text-xs text-gray-500 mb-1">成立日期</p>
              <p className="text-sm font-medium text-gray-900 font-numbers truncate">{enterprise.date}</p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 pt-3 space-y-3">
            <div className="flex">
              <span className="w-24 flex-shrink-0">社会信用代码:</span>
              <span className="text-gray-900 leading-relaxed">{enterprise.creditCode || '未公开'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 flex-shrink-0">联系方式:</span>
              <div className="flex-1 flex justify-between items-center">
                {!enterprise.contactPhone ? (
                  <span className="text-gray-900 leading-relaxed">未公开</span>
                ) : (
                  <>
                    <span className="text-gray-900 leading-relaxed">
                      {enterprise.contactPerson || '负责人'}{' '}
                      {(userRole === UserRole.FREE || userRole === UserRole.VIP) 
                        ? maskPhone(enterprise.contactPhone) 
                        : enterprise.contactPhone}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          if (userRole === UserRole.FREE || userRole === UserRole.VIP) {
                            onShowPaymentModal?.('CONTACT_PHONE');
                            return;
                          }
                          setSelectedContact({
                            name: enterprise.contactPerson || '负责人',
                            phone: enterprise.contactPhone,
                            role: '项目经理',
                            company: enterprise?.name || ''
                          });
                          setShowContactModal(true);
                        }}
                        className="w-6 h-6 bg-blue-50 text-primary rounded flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Phone size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {(enterprise.address || enterprise.businessScope) && (
            isExpanded ? (
              <div className="text-xs text-gray-500 border-t border-gray-100 mt-3 pt-3 space-y-3">
                {enterprise.address && (
                  <div className="flex">
                    <span className="w-24 flex-shrink-0">注册地址:</span>
                    <span className="text-gray-900 leading-relaxed">{enterprise.address}</span>
                  </div>
                )}
                {enterprise.businessScope && (
                  <div className="flex">
                    <span className="w-24 flex-shrink-0">业务范围:</span>
                    <span className="text-gray-900 leading-relaxed">{enterprise.businessScope}</span>
                  </div>
                )}
                <div className="text-center pt-2">
                  <button onClick={() => setIsExpanded(false)} className="text-primary flex items-center justify-center w-full gap-1 text-xs">
                    收起 <ChevronUp size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center text-xs text-gray-500 border-t border-gray-100 mt-3 pt-3">
                <button onClick={() => setIsExpanded(true)} className="text-primary flex items-center gap-1">
                  更多 <ChevronDown size={14} />
                </button>
              </div>
            )
          )}
        </div>



        <div className="bg-white rounded-t-xl shadow-sm min-h-[500px]">
           <div className="flex border-b border-gray-100 px-2 sticky top-0 bg-white z-10 rounded-t-xl">
              {['项目联系人', '中标业绩', '最新动态'].map(tab => (
                <button 
                  key={tab}
                  className={`flex-1 py-4 text-sm ${activeTab === tab ? 'font-bold text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                  onClick={() => {
                    setActiveTab(tab);
                    setActiveFilter(null);
                  }}
                >
                  {tab}
                </button>
              ))}
           </div>
           
           {renderTabContent()}
        </div>
      </main>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
        userRole={userRole}
        totalItems={100}
        dataType="enterprise"
        addExportRecord={addExportRecord}
        onViewRecords={() => onNavigate(ViewName.EXPORT_RECORDS)}
        exportStatusOverride={exportStatusOverride}
        onUpgrade={() => onShowPaymentModal?.('EXPORT_LOCKED')}
      />

      {showContactModal && selectedContact && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
          <div 
            className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[16px] text-gray-900">联系人详情</h3>
              <button 
                onClick={() => setShowContactModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="bg-gray-50 border border-gray-100 block p-3 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">
                      {selectedContact.name}
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-100 text-primary">
                        {selectedContact.role}
                      </span>
                    </h4>
                    <p className="text-[12px] text-gray-500 mt-1">{selectedContact.company}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 bg-white p-3 rounded-lg border border-gray-100">
                  <span 
                    onClick={() => {
                      if (userRole === UserRole.SVIP) {
                        handleInitiateCall(selectedContact.name, selectedContact.phone, selectedContact.role);
                      }
                    }}
                    className={`text-[16px] font-bold text-gray-800 font-numbers ${userRole === UserRole.SVIP ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                  >
                    {selectedContact.phone}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedContact.phone);
                        setToast({ show: true, message: '已复制号码' });
                        setTimeout(() => setToast({ show: false, message: '' }), 2000);
                      }}
                      className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100"
                      title="复制号码"
                    >
                      <Copy size={16} />
                    </button>
                    <a 
                      href={userRole === UserRole.SVIP ? undefined : `tel:${selectedContact.phone}`}
                      onClick={(e) => {
                        if (userRole === UserRole.SVIP) {
                          e.preventDefault();
                          handleInitiateCall(selectedContact.name, selectedContact.phone, selectedContact.role);
                        }
                      }}
                      className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 ml-1 cursor-pointer"
                      title="一键拨打"
                    >
                      <Phone size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dial Confirmation Dialog for SVIP */}
      {confirmDial && confirmDial.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmDial(null)}>
          <div className="bg-white rounded-3xl w-full max-w-[300px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-primary flex items-center justify-center mb-4">
              <Phone size={24} />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-1">{confirmDial.name}</h3>
            {confirmDial.role && (
              <span className="text-[12px] text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded border border-gray-100 mb-4">
                {confirmDial.role}
              </span>
            )}
            <p className="text-[18px] font-bold text-gray-800 font-numbers mb-6 tracking-tight">{confirmDial.phone}</p>
            <div className="w-full flex gap-3">
              <button 
                onClick={() => setConfirmDial(null)}
                className="flex-1 py-2.5 rounded-xl text-gray-500 bg-gray-100 hover:bg-gray-200 text-sm font-bold transition-all active:scale-[0.98] select-none cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  window.location.href = `tel:${confirmDial.phone}`;
                  setConfirmDial(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-white bg-primary hover:bg-primary-dark text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] select-none cursor-pointer"
              >
                拨打
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
