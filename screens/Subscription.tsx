import React, { useState, useEffect } from 'react';
import { ViewName, Opportunity, Enterprise, UserRole, SubscriptionPlan } from '../types';
import { Settings, ChevronDown, Plus, Filter, Star, Building2, MapPin, Search, Download, Lock, XCircle, Clock, Eye } from 'lucide-react';
import { MOCK_OPPORTUNITIES, MOCK_ENTERPRISES } from '../constants';
import { ExportDialog } from '../components/ExportDialog';
import { REGIONS } from '../src/constants/regions';
import { getProjectTypeStyle, getAnnouncementTypeStyle } from '../utils';

interface Props {
    onNavigate: (view: ViewName, data?: any) => void;
    opportunities: Opportunity[];
    enterprises: Enterprise[];
    onToggleStar: (id: string) => void;
    onToggleFollow: (id: string) => void;
    userRole: UserRole;
    plans: SubscriptionPlan[];
    onSetDefault: (id: string) => void;
    onShowPaymentModal?: (sceneId: string) => void;
    addExportRecord?: (dataType: 'opportunity' | 'enterprise', count: number, status?: 'completed' | 'failed') => void;
    exportStatusOverride?: 'completed' | 'failed';
}

const getRoleTextColor = (role?: string) => {
  switch (role) {
    case '招采单位': return 'text-blue-600';
    case '招标代理': return 'text-emerald-600';
    case '投标单位': return 'text-amber-600';
    default: return 'text-[#333333]';
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

const getRoleTheme = (role?: string) => {
  switch (role) {
    case '招采单位': return 'bg-blue-50 text-blue-600';
    case '招标代理': return 'bg-emerald-50 text-emerald-600';
    case '投标单位': return 'bg-amber-50 text-amber-600';
    default: return 'bg-gray-50 text-gray-600';
  }
};

export const Subscription: React.FC<Props> = ({ 
  onNavigate, 
  opportunities = [], 
  enterprises = [], 
  onToggleStar, 
  onToggleFollow, 
  userRole,
  plans = [],
  onSetDefault,
  onShowPaymentModal,
  addExportRecord,
  exportStatusOverride
}) => {
  const [activeTab, setActiveTab] = useState<'subscription' | 'opportunities' | 'enterprises'>('subscription');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [filteredEnterprises, setFilteredEnterprises] = useState<Enterprise[]>([]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTabReselect = (e: CustomEvent) => {
      if (e.detail === ViewName.SUBSCRIPTION) {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('tabReselected', handleTabReselect as EventListener);
    return () => window.removeEventListener('tabReselected', handleTabReselect as EventListener);
  }, []);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const [isSchemeExpanded, setIsSchemeExpanded] = useState(false);
  const [currentScheme, setCurrentScheme] = useState<SubscriptionPlan | undefined>(plans.find(p => p.isDefault) || plans[0]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const subscribedOpportunities = React.useMemo(() => {
    if (plans.length === 0 || !currentScheme) {
      return [];
    }
    return filteredOpportunities;
  }, [filteredOpportunities, currentScheme, plans]);

  // Enterprise Filter States
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ province: string, cities: string[] }>({ province: '全国', cities: [] });
  const [selectedRole, setSelectedRole] = useState<string>('企业角色');
  const [selectedCapital, setSelectedCapital] = useState<string>('注册资本');
  const [moreFilters, setMoreFilters] = useState({
    establishedYears: '不限',
    enterpriseType: '不限'
  });

  // Opportunity Filter States
  const [oppSelectedRegion, setOppSelectedRegion] = useState<{ province: string, cities: string[] }>({ province: '全国', cities: [] });
  const [oppSelectedTime, setOppSelectedTime] = useState<string>('时间');
  const [oppSelectedType, setOppSelectedType] = useState<string>('项目类型');
  const [oppMoreFilters, setOppMoreFilters] = useState({
    status: '不限',
    amount: '不限'
  });

  useEffect(() => {
    setActiveFilter(null);
  }, [activeTab]);

  useEffect(() => {
    if (plans.length === 0) {
      setCurrentScheme(undefined);
      return;
    }
    const isFree = userRole === UserRole.FREE;
    if (isFree) {
      const activePlan = plans.find(p => p.isDefault) || plans[0];
      if (activePlan && (!currentScheme || currentScheme.id !== activePlan.id)) {
        setCurrentScheme(activePlan);
      }
    } else {
      const defaultPlan = plans.find(p => p.isDefault) || plans[0];
      if (defaultPlan && (!currentScheme || !plans.some(p => p.id === currentScheme.id))) {
        setCurrentScheme(defaultPlan);
      }
    }
  }, [plans, userRole, currentScheme?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSchemeExpanded(false);
      }
    };

    if (isSchemeExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSchemeExpanded]);

  useEffect(() => {
    const lowerQuery = (searchQuery || '').toLowerCase();
    
    // Filter Opportunities
    if (opportunities) {
      let filteredOpp = [...opportunities];

      // 1. 先按 currentScheme 过滤商机（仅当 currentScheme 存在时）
      if (currentScheme) {
        // - 关键词 currentScheme.keywords：非空时，opp 的 title 或 tags 命中其中任意一个才保留（OR）。
        if (currentScheme.keywords && currentScheme.keywords.length > 0) {
          const kwList = currentScheme.keywords.filter(Boolean).map(k => k.trim());
          if (kwList.length > 0) {
            filteredOpp = filteredOpp.filter(opp => {
              const titleLower = (opp.title || '').toLowerCase();
              const tagsLower = (opp.tags || []).map(t => (t || '').toLowerCase());
              return kwList.some(kw => {
                const kwLower = kw.toLowerCase();
                return titleLower.includes(kwLower) || tagsLower.some(t => t.includes(kwLower));
              });
            });
          }
        }

        // - 排除词 currentScheme.excludeKeywords：opp 的 title 或 tags 命中任意一个则剔除（NOT）。
        if (currentScheme.excludeKeywords && currentScheme.excludeKeywords.length > 0) {
          const exKwList = currentScheme.excludeKeywords.filter(Boolean).map(k => k.trim());
          if (exKwList.length > 0) {
            filteredOpp = filteredOpp.filter(opp => {
              const titleLower = (opp.title || '').toLowerCase();
              const tagsLower = (opp.tags || []).map(t => (t || '').toLowerCase());
              const matchesEx = exKwList.some(exKw => {
                const exKwLower = exKw.toLowerCase();
                return titleLower.includes(exKwLower) || tagsLower.some(t => t.includes(exKwLower));
              });
              return !matchesEx;
            });
          }
        }

        // - 地区 currentScheme.region：非「全国」/空时，按 opp.region 过滤（与页面手动地区筛选相同的匹配方式）。
        if (currentScheme.region && currentScheme.region !== '全国') {
          const regionStr = currentScheme.region.trim();
          if (regionStr) {
            const isProvince = REGIONS.some(r => r.name === regionStr);
            if (isProvince) {
              filteredOpp = filteredOpp.filter(opp => (opp.region || '').includes(regionStr));
            } else {
              const cities = regionStr.split(',').map(c => c.trim()).filter(Boolean);
              if (cities.length > 0) {
                filteredOpp = filteredOpp.filter(opp => {
                  const oppRegion = opp.region || '';
                  return cities.some(city => oppRegion.includes(city));
                });
              }
            }
          }
        }

        // - 项目类型 currentScheme.projectTypes：非空时，opp.projectType 在该列表内才保留（OR）。
        if (currentScheme.projectTypes && currentScheme.projectTypes.length > 0) {
          const typesList = currentScheme.projectTypes.filter(Boolean);
          const hasNoLimit = typesList.includes('不限');
          if (typesList.length > 0 && !hasNoLimit) {
            filteredOpp = filteredOpp.filter(opp => {
              return opp.projectType && typesList.includes(opp.projectType);
            });
          }
        }
      }

      // 2. 之后再跑现有手动筛选（检索词、地区/类型/状态）
      if (lowerQuery) {
        filteredOpp = filteredOpp.filter(opp => 
          (opp.title || '').toLowerCase().includes(lowerQuery) ||
          (opp.tags || []).some(tag => (tag || '').toLowerCase().includes(lowerQuery)) ||
          (opp.region || '').toLowerCase().includes(lowerQuery)
        );
      }

      // Apply Region Filter
      if (oppSelectedRegion.province !== '全国') {
        filteredOpp = filteredOpp.filter(opp => {
          if (oppSelectedRegion.cities.length > 0) {
            return oppSelectedRegion.cities.some(city => opp.region.includes(city));
          }
          return opp.region.includes(oppSelectedRegion.province);
        });
      }

      // Apply Type Filter
      if (oppSelectedType !== '项目类型') {
        filteredOpp = filteredOpp.filter(opp => {
          if (oppSelectedType === '工程施工') return opp.tags.includes('工程施工') || opp.type === 'engineering';
          if (oppSelectedType === '物资采购') return opp.tags.includes('物资采购') || opp.type === 'procurement';
          if (oppSelectedType === '服务采购') return opp.tags.includes('服务采购') || opp.type === 'service';
          return true;
        });
      }

      // Apply More Filters
      if (oppMoreFilters.status !== '不限') {
         filteredOpp = filteredOpp.filter(opp => opp.status === oppMoreFilters.status);
      }

      setFilteredOpportunities(filteredOpp);
    }

    // Filter Enterprises
    if (enterprises) {
      let filteredEnt = enterprises.filter(ent => 
        (ent.name || '').toLowerCase().includes(lowerQuery) ||
        (ent.role || ent.industry || '').toLowerCase().includes(lowerQuery) ||
        (ent.location || '').toLowerCase().includes(lowerQuery)
      );

      // Apply Region Filter
      if (selectedRegion.province !== '全国') {
        filteredEnt = filteredEnt.filter(ent => {
          if (selectedRegion.cities.length > 0) {
            return selectedRegion.cities.some(city => ent.location.includes(city));
          }
          return ent.location.includes(selectedRegion.province);
        });
      }

      // Apply Role Filter (Mock logic as mock data might not have role)
      if (selectedRole !== '企业角色') {
        // In a real app, we'd filter by ent.role
        // For now, we'll just keep it as is or simulate
      }

      // Apply Capital Filter
      if (selectedCapital !== '注册资本') {
        // Mock filtering logic for capital
        filteredEnt = filteredEnt.filter(ent => {
          const cap = ent.capital || '';
          if (selectedCapital === '100万以内') return cap.includes('万') && parseFloat(cap) < 100;
          if (selectedCapital === '100-500万') return cap.includes('万') && parseFloat(cap) >= 100 && parseFloat(cap) <= 500;
          return true;
        });
      }

      setFilteredEnterprises(filteredEnt);
    }
  }, [searchQuery, opportunities, enterprises, selectedRegion, selectedRole, selectedCapital, moreFilters, oppSelectedRegion, oppSelectedTime, oppSelectedType, oppMoreFilters, currentScheme?.id]);

  const handleExport = (count: number) => {
    setToast({ show: true, message: `成功导出 ${count} 条数据` });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const getTotalItems = () => {
    switch (activeTab) {
      case 'subscription':
        return subscribedOpportunities.length;
      case 'opportunities':
        return filteredOpportunities.filter(o => o.isStarred).length;
      case 'enterprises':
        return filteredEnterprises.filter(e => e.isFollowed).length;
      default:
        return 0;
    }
  };

  const renderOpportunityFilters = () => (
    <>
      {activeFilter === '地区' && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 z-50">
          <div className="flex flex-col h-[350px]">
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 bg-[#F7F8FA] overflow-y-auto">
                <button 
                  className={`w-full text-center px-4 py-3 text-[14px] ${oppSelectedRegion.province === '全国' ? 'bg-white text-primary' : 'text-gray-600'}`}
                  onClick={() => setOppSelectedRegion({ province: '全国', cities: [] })}
                >
                  全国
                </button>
                {REGIONS.map(r => (
                  <button 
                    key={r.name}
                    className={`w-full text-center px-4 py-3 text-[14px] ${oppSelectedRegion.province === r.name ? 'bg-white text-primary' : 'text-gray-600'}`}
                    onClick={() => setOppSelectedRegion({ ...oppSelectedRegion, province: r.name })}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              <div className="w-2/3 overflow-y-auto bg-white">
                {oppSelectedRegion.province === '全国' ? (
                  <button 
                    className="w-full text-left px-6 py-3 text-[14px] flex justify-between items-center text-primary"
                    onClick={() => setOppSelectedRegion({ province: '全国', cities: [] })}
                  >
                    全国
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                ) : (
                  REGIONS.find(r => r.name === oppSelectedRegion.province)?.cities.map(city => (
                    <button 
                      key={city}
                      className={`w-full text-left px-6 py-3 text-[14px] flex justify-between items-center ${oppSelectedRegion.cities.includes(city) ? 'text-primary' : 'text-gray-800'}`}
                      onClick={() => {
                        const newCities = oppSelectedRegion.cities.includes(city)
                          ? oppSelectedRegion.cities.filter(c => c !== city)
                          : [...oppSelectedRegion.cities, city];
                        setOppSelectedRegion({ ...oppSelectedRegion, cities: newCities });
                      }}
                    >
                      {city}
                      {oppSelectedRegion.cities.includes(city) && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50">
                <span className="text-[13px] text-gray-800 shrink-0">已选择({oppSelectedRegion.province === '全国' ? 1 : oppSelectedRegion.cities.length})</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {oppSelectedRegion.province === '全国' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#F7F8FA] rounded text-[12px] text-gray-600">
                      全国
                      <button onClick={() => setOppSelectedRegion({ province: '全国', cities: [] })} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={12} />
                      </button>
                    </div>
                  ) : (
                    oppSelectedRegion.cities.map(city => (
                      <div key={city} className="flex items-center gap-1 px-2 py-1 bg-[#F7F8FA] rounded text-[12px] text-gray-600 whitespace-nowrap">
                        {city}
                        <button 
                          onClick={() => setOppSelectedRegion({ ...oppSelectedRegion, cities: oppSelectedRegion.cities.filter(c => c !== city) })} 
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex p-3 border-t border-[#F0F0F0] gap-3">
                <button 
                  className="flex-1 py-2 bg-[#F0F5FF] text-primary rounded-md text-[14px] font-medium"
                  onClick={() => setOppSelectedRegion({ province: '全国', cities: [] })}
                >
                  清空
                </button>
                <button 
                  className="flex-1 py-2 bg-primary text-white rounded-md text-[14px] font-medium"
                  onClick={() => setActiveFilter(null)}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeFilter === '时间' && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 p-4 z-50">
          <div className="grid grid-cols-2 gap-2">
            {['不限', '今天', '近3天', '近7天', '近30天', '近90天', '近180天', '近一年'].map(time => (
              <button
                key={time}
                className={`w-full text-center px-4 py-2 text-[13px] rounded-lg ${oppSelectedTime === time || (oppSelectedTime === '时间' && time === '不限') ? 'bg-[#F0F5FF] text-primary' : 'bg-[#F7F8FA] text-gray-800'}`}
                onClick={() => {
                  setOppSelectedTime(time === '不限' ? '时间' : time);
                  setActiveFilter(null);
                }}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFilter === '项目类型' && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 p-4 z-50 overflow-y-auto max-h-[350px]">
          <div className="grid grid-cols-2 gap-2">
            {['不限', '工程建设', '政府采购', '土地使用权', '矿业权', '国有产权', '碳排放权', '排污权', '药品采购权', '二类疫苗', '林权', '其他'].map(type => (
              <button
                key={type}
                className={`w-full text-center px-4 py-2 text-[13px] rounded-lg ${oppSelectedType === type || (oppSelectedType === '项目类型' && type === '不限') ? 'bg-[#F0F5FF] text-primary' : 'bg-[#F7F8FA] text-gray-800'}`}
                onClick={() => {
                  setOppSelectedType(type === '不限' ? '项目类型' : type);
                  setActiveFilter(null);
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFilter === '更多' && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 z-50">
          <div className="flex flex-col max-h-[350px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <div className="text-xs text-gray-500 mb-3">商机状态</div>
                <div className="flex flex-wrap gap-3">
                  {['不限', '预告', '报名中', '评审中', '公示期', '已结束'].map(opt => (
                    <button
                      key={opt}
                      className={`px-4 py-1.5 rounded-md text-[13px] ${oppMoreFilters.status === opt ? 'bg-blue-50 text-primary' : 'bg-gray-50 text-gray-700'}`}
                      onClick={() => setOppMoreFilters({...oppMoreFilters, status: opt})}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-3">项目金额</div>
                <div className="flex flex-wrap gap-3">
                  {['不限', '100万以下', '100-500万', '500-1000万', '1000-5000万', '5000万以上'].map(opt => (
                    <button
                      key={opt}
                      className={`px-4 py-1.5 rounded-md text-[13px] ${oppMoreFilters.amount === opt ? 'bg-blue-50 text-primary' : 'bg-gray-50 text-gray-700'}`}
                      onClick={() => setOppMoreFilters({...oppMoreFilters, amount: opt})}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex p-4 border-t border-[#F0F0F0] gap-3">
              <button 
                className="flex-1 py-2 bg-[#F0F5FF] text-primary rounded-md text-[14px] font-medium"
                onClick={() => setOppMoreFilters({ status: '不限', amount: '不限' })}
              >
                重置
              </button>
              <button 
                className="flex-1 py-2 bg-primary text-white rounded-md text-[14px] font-medium"
                onClick={() => setActiveFilter(null)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderSubscriptionContent = () => (
    <>
      {/* Filter Chips */}
      <div className="bg-white px-4 py-3 space-y-3 shadow-sm sticky top-0 z-30 border-b border-gray-100">
         <div className="flex items-center justify-between gap-2">
            {/* Scheme Selector */}
            <button 
                className={`flex-shrink-0 px-3 py-1.5 text-white text-sm font-medium rounded-full shadow-sm flex items-center gap-1 max-w-[140px] ${plans.length === 0 ? 'bg-gray-300 pointer-events-none' : 'bg-primary active:opacity-90'}`}
                onClick={() => plans.length > 0 && setIsSchemeExpanded(!isSchemeExpanded)}
            >
               <span className="truncate">{plans.length === 0 ? '暂无方案' : (currentScheme?.name || '选择方案')}</span>
               {plans.length > 0 && currentScheme?.isDefault && <span className="text-[10px] bg-white/20 px-1 rounded flex-shrink-0">默认</span>}
               {plans.length > 0 && <ChevronDown size={14} className={`ml-1 transition-transform flex-shrink-0 ${isSchemeExpanded ? 'rotate-180' : ''}`} />}
            </button>

            <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 flex-1">
                <button 
                    className="flex-1 px-2 py-1.5 bg-gray-50 text-gray-600 text-[13px] font-medium rounded-full flex items-center justify-center whitespace-nowrap active:bg-gray-100 relative overflow-hidden"
                    onClick={() => onNavigate(ViewName.ADD_SUBSCRIPTION)}
                >
                    {(userRole === UserRole.FREE && plans.length >= 1) && <Lock size={10} className="absolute top-1 right-2 text-gray-400" />}
                    <Plus size={14} className="mr-1"/> 新建
                </button>
                <button 
                    className="flex-1 px-2 py-1.5 bg-gray-50 text-gray-600 text-[13px] font-medium rounded-full flex items-center justify-center whitespace-nowrap active:bg-gray-100 relative overflow-hidden"
                    onClick={() => onNavigate(ViewName.SUBSCRIPTION_MANAGEMENT)}
                >
                    <Settings size={14} className="mr-1"/> 管理
                </button>
                <button 
                    className="flex-shrink-0 w-8 h-8 bg-blue-50 text-primary rounded-full flex items-center justify-center active:bg-blue-100 border border-blue-100"
                    onClick={() => { if (userRole === UserRole.FREE) { onShowPaymentModal?.('EXPORT_LOCKED'); } else { setIsExportDialogOpen(true); } }}
                >
                    <Download size={14} />
                </button>
            </div>
         </div>

         {/* Dropdown Menu */}
         {isSchemeExpanded && (
            <div 
                ref={dropdownRef}
                className="absolute top-[52px] left-4 bg-white shadow-xl border border-gray-100 rounded-xl p-2 z-[100] w-56 animate-fade-in-down origin-top-left"
            >
                <div className="text-xs text-gray-400 px-2 py-1 mb-1">切换订阅方案</div>
                <div className="max-h-[190px] overflow-y-auto space-y-1 custom-scrollbar">
                    {plans.map(scheme => {
                        const isFree = userRole === UserRole.FREE;
                        const isSchemeActive = !isFree || (plans.find(p => p.isDefault)?.id || plans[0]?.id) === scheme.id;
                        
                        return (
                            <button
                                key={scheme.id}
                                className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between transition-colors ${
                                    currentScheme?.id === scheme.id 
                                    ? 'bg-blue-50 text-primary font-medium' 
                                    : isSchemeActive 
                                      ? 'hover:bg-gray-50 text-gray-700' 
                                      : 'opacity-50 text-gray-405 cursor-pointer'
                                }`}
                                onClick={() => {
                                    if (!isSchemeActive) {
                                        if (onShowPaymentModal) {
                                            onShowPaymentModal('MORE_FILTER');
                                        }
                                        return;
                                    }
                                    setCurrentScheme(scheme);
                                    setIsSchemeExpanded(false);
                                }}
                            >
                                <span className="truncate flex items-center gap-1.5">
                                    {!isSchemeActive && <Lock size={11} className="text-gray-450 shrink-0" />}
                                    {scheme.name}
                                </span>
                                {scheme.isDefault && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 flex-shrink-0 select-none">默认</span>
                                )}
                                {!isSchemeActive && (
                                    <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200/50 px-1 py-0.5 rounded select-none shrink-0 ml-2">升级可用</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
         )}
      </div>

      <main className="px-[16px] py-[16px] pb-[24px] space-y-3">
     {plans.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Plus size={24} className="text-blue-500" />
          </div>
          <h3 className="text-[18px] font-bold text-gray-900 mb-2">暂无订阅方案</h3>
          <p className="text-[14px] text-gray-500 mb-8 max-w-[240px] leading-relaxed">
            立即创建订阅方案，我们将为您实时推送<span className="text-blue-600 font-medium">独家高价值商机</span>
          </p>
          <button
            onClick={() => onNavigate(ViewName.ADD_SUBSCRIPTION)}
            className="bg-primary text-white px-8 py-3 rounded-full font-medium active:scale-95 transition-transform shadow-md shadow-primary/20"
          >
            去创建方案
          </button>
        </div>
      ) : (
         subscribedOpportunities && subscribedOpportunities.length > 0 ? (
             subscribedOpportunities.map((opp) => {
                 const statusText = opp.status || '招标';
                  const isBidding = statusText.includes('招标') || statusText.includes('报名') || statusText.includes('小时') || statusText.includes('截止');
                  const isWon = statusText.includes('中标') || statusText.includes('公示') || statusText.includes('结束') || statusText.includes('废标') || statusText.includes('流标');
                  const isProposed = !isBidding && !isWon;
    
                  const purchasingUnit = opp.title.substring(0, 6) + (opp.title.includes('公司') ? '' : '有限公司');
                  const agencyUnit = opp.title.substring(0, 4) + '招标代理机构';
                  const constructionUnit = opp.title.substring(0, 4) + '建设集团';
                  const deadline = opp.deadline || (opp.date.includes(':') ? opp.date : opp.date + ' 23:59');
    
                  const isRedStatus = statusText.includes('废标') || statusText.includes('流标') || statusText.includes('截止');
                  const statusBg = isRedStatus ? 'bg-[#FFF1F0]' : 'bg-[#E6F4FF]';
                  const statusColor = isRedStatus ? 'text-[#FF4D4F]' : 'text-[#1677FF]';
    
                  return (
                    <article 
                      key={opp.id} 
                      onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opp)}
                      className="bg-white p-4 rounded-xl shadow-sm active:bg-gray-50 transition-all active:scale-[0.99] border border-gray-100"
                    >
                      <h3 className="text-[15px] font-medium text-[#333333] leading-snug mb-2.5 flex justify-between items-start">
                        <span className="flex-1 line-clamp-2" style={{ wordBreak: 'break-all' }}>
                          {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                          {opp.isMultiBid && (
                            <span className="text-primary ml-1 text-xs shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                          )}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(opp.id);
                          }}
                          className="shrink-0 ml-2 p-1 active:scale-90 transition-transform"
                        >
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill={opp.isStarred ? "#FACC15" : "none"} 
                            stroke={opp.isStarred ? "#FACC15" : "#999999"} 
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
                        {(opp.region || '').replace('·', ' ')}
                      </span>
                      {opp.projectType && (
                        <span className={`h-5 flex items-center px-1.5 text-[11px] rounded ${getProjectTypeStyle(opp.projectType)}`}>
                          {opp.projectType}
                        </span>
                      )}
                      {(() => {
                        const orgMethod = opp.tags.find(t => t.includes('招标') || t.includes('竞价') || t.includes('谈判') || t.includes('磋商')) || '公开招标';
                        const announcementType = opp.tags.find(t => t.includes('公告') || t.includes('计划') || t.includes('公示')) || '招标公告';
                        const tagsToShow = [announcementType, orgMethod].filter(Boolean);
                        const uniqueTags = Array.from(new Set(tagsToShow));
                        
                        return uniqueTags.map((tag) => {
                          const isOrgMethod = tag === orgMethod && tag !== announcementType;
                          const styleClass = isOrgMethod 
                            ? 'bg-[#F5F5F5] text-[#666666]' 
                            : getAnnouncementTypeStyle(tag);
                            
                          return (
                            <span key={tag} className={`h-5 flex items-center px-1.5 text-[11px] rounded ${styleClass}`}>
                              {tag}
                            </span>
                          );
                        });
                      })()}
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
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
              <div className="w-40 h-40 mb-4 mx-auto text-gray-200">
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
              <p className="text-[14px] text-gray-500">暂无相关商机</p>
            </div>
         )
      )}
      </main>
    </>
  );

  const renderOpportunitiesContent = () => (
    <>
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
         <div className="px-2 py-3">
           <div className="flex items-center gap-1">
               <div className="flex flex-1 items-center gap-1 min-w-0 pr-2">
                   {[
                     { id: '地区', label: oppSelectedRegion.province === '全国' && oppSelectedRegion.cities.length === 0 ? '地区' : (oppSelectedRegion.cities.length > 0 ? (oppSelectedRegion.cities.length > 1 ? `${oppSelectedRegion.cities[0]}...` : oppSelectedRegion.cities[0]) : oppSelectedRegion.province) },
                     { id: '时间', label: oppSelectedTime === '时间' ? '近三个月' : oppSelectedTime },
                     { id: '项目类型', label: oppSelectedType === '项目类型' ? '业务类型' : oppSelectedType }
                   ].map(f => (
                       <button 
                        key={f.id} 
                        onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
                        className={`flex items-center justify-center gap-0.5 flex-1 min-w-0 px-1 py-1.5 rounded-lg transition-colors ${activeFilter === f.id ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
                       >
                          <span className="text-[13px] truncate">{f.label}</span>
                          <ChevronDown size={12} className={`shrink-0 text-gray-400 ml-0.5 transition-transform ${activeFilter === f.id ? 'rotate-180 text-primary' : ''}`}/>
                       </button>
                   ))}
               </div>
               <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>
               <button 
                   onClick={() => setActiveFilter(activeFilter === '更多' ? null : '更多')}
                   className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${activeFilter === '更多' ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
               >
                   <Filter size={16} />
               </button>
           </div>
         </div>

         <div className="flex px-4 py-3 items-center justify-between border-t border-[#F0F0F0] bg-white">
            <div className="text-[13px] text-[#666666]">
               共<span className="text-[#FF4D4F] mx-1 font-medium font-numbers">{filteredOpportunities.filter(o => o.isStarred).length > 0 ? '5000+' : '0'}</span>条数据
            </div>
            <button 
               onClick={() => { if (userRole === UserRole.FREE) { onShowPaymentModal?.('EXPORT_LOCKED'); } else { setIsExportDialogOpen(true); } }}
               className="text-[#1677FF] text-[13px] font-medium active:opacity-70"
            >
               导出数据
            </button>
         </div>

         {/* Opportunity Filters Dropdown */}
         {renderOpportunityFilters()}
      </div>

      <main className="px-[16px] py-[16px] pb-[24px] space-y-3">
         {(filteredOpportunities && filteredOpportunities.filter(o => o.isStarred).length > 0) ? (
           filteredOpportunities.filter(o => o.isStarred).map((opp) => {
             const statusText = opp.status || '招标';
              const isBidding = statusText.includes('招标') || statusText.includes('报名') || statusText.includes('小时') || statusText.includes('截止');
              const isWon = statusText.includes('中标') || statusText.includes('公示') || statusText.includes('结束') || statusText.includes('废标') || statusText.includes('流标');
              const isProposed = !isBidding && !isWon;

              const purchasingUnit = opp.title.substring(0, 6) + (opp.title.includes('公司') ? '' : '有限公司');
              const agencyUnit = opp.title.substring(0, 4) + '招标代理机构';
              const constructionUnit = opp.title.substring(0, 4) + '建设集团';
              const deadline = opp.deadline || (opp.date.includes(':') ? opp.date : opp.date + ' 23:59');

              const isRedStatus = statusText.includes('废标') || statusText.includes('流标') || statusText.includes('截止');
              const statusBg = isRedStatus ? 'bg-[#FFF1F0]' : 'bg-[#E6F4FF]';
              const statusColor = isRedStatus ? 'text-[#FF4D4F]' : 'text-[#1677FF]';

              return (
                <article 
                  key={opp.id} 
                  onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opp)}
                  className="bg-white p-4 rounded-xl shadow-sm active:bg-gray-50 transition-all active:scale-[0.99] border border-gray-100"
                >
                  <h3 className="text-[15px] font-medium text-[#333333] leading-snug mb-2.5 flex justify-between items-start">
                    <span className="flex-1 line-clamp-2" style={{ wordBreak: 'break-all' }}>
                      {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                      {opp.isMultiBid && (
                        <span className="text-primary ml-1 text-xs shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                      )}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(opp.id);
                      }}
                      className="shrink-0 ml-2 p-1 active:scale-90 transition-transform"
                    >
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill={opp.isStarred ? "#FACC15" : "none"} 
                        stroke={opp.isStarred ? "#FACC15" : "#999999"} 
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
                    {(opp.region || '').replace('·', ' ')}
                  </span>
                  {opp.projectType && (
                    <span className={`h-5 flex items-center px-1.5 text-[11px] rounded ${getProjectTypeStyle(opp.projectType)}`}>
                      {opp.projectType}
                    </span>
                  )}
                  {(() => {
                    const orgMethod = opp.tags.find(t => t.includes('招标') || t.includes('竞价') || t.includes('谈判') || t.includes('磋商')) || '公开招标';
                    const announcementType = opp.tags.find(t => t.includes('公告') || t.includes('计划') || t.includes('公示')) || '招标公告';
                    const tagsToShow = [announcementType, orgMethod].filter(Boolean);
                    const uniqueTags = Array.from(new Set(tagsToShow));
                    
                    return uniqueTags.map((tag) => {
                      const isOrgMethod = tag === orgMethod && tag !== announcementType;
                      const styleClass = isOrgMethod 
                        ? 'bg-[#F5F5F5] text-[#666666]' 
                        : getAnnouncementTypeStyle(tag);
                        
                      return (
                        <span key={tag} className={`h-5 flex items-center px-1.5 text-[11px] rounded ${styleClass}`}>
                          {tag}
                        </span>
                      );
                    });
                  })()}
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
           <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
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
             <p className="text-[14px] text-gray-500">暂无收藏商机</p>
           </div>
         )}
      </main>
    </>
  );

  const renderEnterprisesContent = () => (
    <>
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
         <div className="px-2 py-3">
           <div className="flex items-center gap-1">
               <div className="flex flex-1 items-center gap-1 min-w-0 pr-2">
                   {[
                     { id: '所在地区', label: selectedRegion.province === '全国' && selectedRegion.cities.length === 0 ? '所在地区' : (selectedRegion.cities.length > 0 ? selectedRegion.cities.join(',') : selectedRegion.province) },
                     { id: '企业角色', label: selectedRole },
                     { id: '注册资本', label: selectedCapital }
                   ].map(f => (
                       <button 
                        key={f.id} 
                        onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
                        className={`flex items-center justify-center gap-0.5 flex-1 min-w-0 px-1 py-1.5 rounded-lg transition-colors ${activeFilter === f.id ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
                       >
                          <span className="text-[13px] truncate">{f.label}</span>
                          <ChevronDown size={12} className={`shrink-0 text-gray-400 ml-0.5 transition-transform ${activeFilter === f.id ? 'rotate-180 text-primary' : ''}`}/>
                       </button>
                   ))}
               </div>
               <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>
               <button 
                   onClick={() => setActiveFilter(activeFilter === '更多' ? null : '更多')}
                   className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${activeFilter === '更多' ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
               >
                   <Filter size={16} />
               </button>
           </div>
         </div>

         <div className="flex px-4 py-3 items-center justify-between border-t border-[#F0F0F0] bg-white">
            <div className="text-[13px] text-[#666666]">
               共<span className="text-[#FF4D4F] mx-1 font-medium font-numbers">{filteredEnterprises.filter(e => e.isFollowed).length > 0 ? '500+' : '0'}</span>条数据
            </div>
            <button 
               onClick={() => { if (userRole === UserRole.FREE) { onShowPaymentModal?.('EXPORT_LOCKED'); } else { setIsExportDialogOpen(true); } }}
               className="text-[#1677FF] text-[13px] font-medium active:opacity-70"
            >
               导出数据
            </button>
         </div>

         {/* Filter Dropdowns */}
         {activeFilter === '所在地区' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 z-50">
              <div className="flex flex-col h-[350px]">
                <div className="flex flex-1 overflow-hidden">
                  <div className="w-1/3 bg-[#F7F8FA] overflow-y-auto">
                    <button 
                      className={`w-full text-center px-4 py-3 text-[14px] ${selectedRegion.province === '全国' ? 'bg-white text-primary' : 'text-gray-600'}`}
                      onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
                    >
                      全国
                    </button>
                    {REGIONS.map(r => (
                      <button 
                        key={r.name}
                        className={`w-full text-center px-4 py-3 text-[14px] ${selectedRegion.province === r.name ? 'bg-white text-primary' : 'text-gray-600'}`}
                        onClick={() => setSelectedRegion({ ...selectedRegion, province: r.name })}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                  <div className="w-2/3 overflow-y-auto bg-white">
                    {selectedRegion.province === '全国' ? (
                      <button 
                        className="w-full text-left px-6 py-3 text-[14px] flex justify-between items-center text-primary"
                        onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
                      >
                        全国
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>
                    ) : (
                      REGIONS.find(r => r.name === selectedRegion.province)?.cities.map(city => (
                        <button 
                          key={city}
                          className={`w-full text-left px-6 py-3 text-[14px] flex justify-between items-center ${selectedRegion.cities.includes(city) ? 'text-primary' : 'text-gray-800'}`}
                          onClick={() => {
                            const newCities = selectedRegion.cities.includes(city)
                              ? selectedRegion.cities.filter(c => c !== city)
                              : [...selectedRegion.cities, city];
                            setSelectedRegion({ ...selectedRegion, cities: newCities });
                          }}
                        >
                          {city}
                          {selectedRegion.cities.includes(city) && (
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50">
                    <span className="text-[13px] text-gray-800 shrink-0">已选择({selectedRegion.province === '全国' ? 1 : selectedRegion.cities.length})</span>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {selectedRegion.province === '全国' ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#F7F8FA] rounded text-[12px] text-gray-600">
                          全国
                          <button onClick={() => setSelectedRegion({ province: '全国', cities: [] })} className="text-gray-400 hover:text-gray-600">
                            <XCircle size={12} />
                          </button>
                        </div>
                      ) : (
                        selectedRegion.cities.map(city => (
                          <div key={city} className="flex items-center gap-1 px-2 py-1 bg-[#F7F8FA] rounded text-[12px] text-gray-600 whitespace-nowrap">
                            {city}
                            <button 
                              onClick={() => setSelectedRegion({ ...selectedRegion, cities: selectedRegion.cities.filter(c => c !== city) })} 
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <XCircle size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex p-3 border-t border-[#F0F0F0] gap-3">
                    <button 
                      className="flex-1 py-2 bg-[#F0F5FF] text-primary rounded-md text-[14px] font-medium"
                      onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
                    >
                      清空
                    </button>
                    <button 
                      className="flex-1 py-2 bg-primary text-white rounded-md text-[14px] font-medium"
                      onClick={() => setActiveFilter(null)}
                    >
                      确定
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFilter === '企业角色' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 p-4 z-50">
              <div className="grid grid-cols-1 gap-2">
                {['不限', '招采单位', '招标代理', '投标单位'].map(role => (
                  <button
                    key={role}
                    className={`w-full text-left px-4 py-3 text-[14px] rounded-lg ${(selectedRole === role || (role === '不限' && selectedRole === '企业角色')) ? 'bg-[#F0F5FF] text-primary' : 'bg-[#F7F8FA] text-gray-800'}`}
                    onClick={() => {
                      setSelectedRole(role === '不限' ? '企业角色' : role);
                      setActiveFilter(null);
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFilter === '注册资本' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 p-4 z-50">
              <div className="grid grid-cols-2 gap-2">
                {['不限', '100万以内', '100-500万', '500-1000万', '1000-5000万', '5000万以上'].map(capital => (
                  <button
                    key={capital}
                    className={`w-full text-center px-4 py-2 text-[13px] rounded-lg ${selectedCapital === capital || (selectedCapital === '注册资本' && capital === '不限') ? 'bg-[#F0F5FF] text-primary' : 'bg-[#F7F8FA] text-gray-800'}`}
                    onClick={() => {
                      setSelectedCapital(capital === '不限' ? '注册资本' : capital);
                      setActiveFilter(null);
                    }}
                  >
                    {capital}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFilter === '更多' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 z-50">
              <div className="flex flex-col max-h-[350px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-3">成立年限</div>
                    <div className="flex flex-wrap gap-3">
                      {['不限', '1年内', '1-3年', '3-5年', '5-10年', '10年以上'].map(opt => (
                        <button
                          key={opt}
                          className={`px-4 py-1.5 rounded-md text-[13px] ${moreFilters.establishedYears === opt ? 'bg-blue-50 text-primary' : 'bg-gray-50 text-gray-700'}`}
                          onClick={() => setMoreFilters({...moreFilters, establishedYears: opt})}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-3">企业类型</div>
                    <div className="flex flex-wrap gap-3">
                      {['不限', '国企', '央企', '民营企业', '外商投资企业', '其他'].map(opt => (
                        <button
                          key={opt}
                          className={`px-4 py-1.5 rounded-md text-[13px] ${moreFilters.enterpriseType === opt ? 'bg-blue-50 text-primary' : 'bg-gray-50 text-gray-700'}`}
                          onClick={() => setMoreFilters({...moreFilters, enterpriseType: opt})}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex p-4 border-t border-[#F0F0F0] gap-3">
                  <button 
                    className="flex-1 py-2 bg-[#F0F5FF] text-primary rounded-md text-[14px] font-medium"
                    onClick={() => setMoreFilters({ establishedYears: '不限', enterpriseType: '不限' })}
                  >
                    重置
                  </button>
                  <button 
                    className="flex-1 py-2 bg-primary text-white rounded-md text-[14px] font-medium"
                    onClick={() => setActiveFilter(null)}
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      <main className="px-[16px] py-[16px] pb-[24px] space-y-3">
         {(filteredEnterprises && filteredEnterprises.filter(e => e.isFollowed).length > 0) ? (
           filteredEnterprises.filter(e => e.isFollowed).map((ent, index) => {
             return (
             <article 
               key={ent.id}
               onClick={() => onNavigate(ViewName.ENTERPRISE_DETAIL, ent)}
               className="bg-white rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E8EEF8] relative active:scale-[0.99] transition-transform"
             >
               <div className="flex items-start mb-4">
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start">
                     <h3 className="text-[16px] font-bold text-[#222222] leading-snug truncate pr-2">
                       {ent.name}
                     </h3>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         onToggleFollow(ent.id);
                       }}
                       className="shrink-0 p-1"
                     >
                       <Eye 
                         size={20}
                         color={ent.isFollowed ? "#1677FF" : "#999999"}
                         fill={ent.isFollowed ? "#E6F4FF" : "none"}
                         strokeWidth={ent.isFollowed ? 2 : 2}
                       />
                     </button>
                   </div>
                   <div className="flex items-baseline text-[12px] text-[#999999] mt-1.5 flex-wrap gap-2">
                     <span className="px-1.5 py-[2px] text-[11px] rounded bg-[#E6F4FF] text-[#1677FF]">{(ent.location || '').replace('·', ' ')}</span>
                     <span className={`px-1.5 py-[2px] text-[11px] rounded ${getRoleTheme(ent.role?.split('、')[0])}`}>{ent.role || ent.industry}</span>
                     <span className="truncate">{ent.date}</span>
                   </div>
                 </div>
               </div>
               
               <div className="border-t border-[#F0F0F0] pt-3 flex justify-between">
                 <div className="flex flex-col items-center flex-1 border-r border-[#F0F0F0] last:border-r-0">
                   <span className="text-[11px] text-[#999999] mb-1">法定代表人</span>
                   <span className="text-[13px] text-[#333333] font-medium truncate w-full text-center px-1">{ent.legalRep}</span>
                 </div>
                 <div className="flex flex-col items-center flex-1 border-r border-[#F0F0F0] last:border-r-0">
                   <span className="text-[11px] text-[#999999] mb-1">注册资本</span>
                   <span className="text-[13px] text-[#333333] font-medium truncate w-full text-center px-1">{ent.capital}</span>
                 </div>
                 <div className="flex flex-col items-center flex-1 border-r border-[#F0F0F0] last:border-r-0">
                   <span className="text-[11px] text-[#999999] mb-1">项目联系人</span>
                   <span className="text-[13px] text-[#333333] font-medium truncate w-full text-center px-1">{ent.projectContacts || 6}</span>
                 </div>
                 <div className="flex flex-col items-center flex-1 last:border-r-0">
                   <span className="text-[11px] text-[#999999] mb-1">中标业绩</span>
                   <span className="text-[13px] text-[#333333] font-medium truncate w-full text-center px-1">{ent.winningBids || 3000}</span>
                 </div>
               </div>
             </article>
           );
         })
         ) : (
           <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
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
             <p className="text-[14px] text-gray-500">暂无关注企业</p>
           </div>
         )}
      </main>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-bg-page font-sans">
      <header className="bg-white z-40 shrink-0">
        <div className="bg-gradient-to-r from-[#3B7BFF] to-[#6B9DFF] pt-safe-top pb-3 px-4">
          <div className="flex items-center justify-center h-12 relative">
            <h1 className="text-[20px] font-semibold text-white text-center absolute left-1/2 -translate-x-1/2 whitespace-nowrap">订阅</h1>
          </div>
        </div>

        <div className="flex justify-around pt-[16px] border-b border-gray-100 bg-white">
          {/* ... tabs ... */}
          <div className={`relative pb-3 border-b-[3px] transition-colors ${activeTab === 'subscription' ? 'border-[#1677ff]' : 'border-transparent'}`}>
            <button 
                className={`text-[16px] font-medium ${activeTab === 'subscription' ? 'text-[#1677ff]' : 'text-[#666666]'}`}
                onClick={() => {
                  setActiveTab('subscription');
                  setActiveFilter(null);
                }}
            >
                订阅商机
            </button>
          </div>
          <div className={`relative pb-3 border-b-[3px] transition-colors ${activeTab === 'opportunities' ? 'border-[#1677ff]' : 'border-transparent'}`}>
            <button 
                className={`text-[16px] font-medium ${activeTab === 'opportunities' ? 'text-[#1677ff]' : 'text-[#666666]'}`}
                onClick={() => {
                  setActiveTab('opportunities');
                  setActiveFilter(null);
                }}
            >
                收藏商机
            </button>
          </div>
          <div className={`relative pb-3 border-b-[3px] transition-colors ${activeTab === 'enterprises' ? 'border-[#1677ff]' : 'border-transparent'}`}>
            <button 
                className={`text-[16px] font-medium ${activeTab === 'enterprises' ? 'text-[#1677ff]' : 'text-[#666666]'}`}
                onClick={() => {
                  setActiveTab('enterprises');
                  setActiveFilter(null);
                }}
            >
                关注企业
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-[calc(60px+env(safe-area-inset-bottom)+16px)]">
        {activeTab === 'subscription' && renderSubscriptionContent()}
        {activeTab === 'opportunities' && renderOpportunitiesContent()}
        {activeTab === 'enterprises' && renderEnterprisesContent()}
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-[60] animate-fade-in">
          {toast.message}
        </div>
      )}

      <ExportDialog 
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
        userRole={userRole}
        totalItems={getTotalItems()}
        dataType={activeTab === 'enterprises' ? 'enterprise' : 'opportunity'}
        addExportRecord={addExportRecord}
        onViewRecords={() => onNavigate(ViewName.EXPORT_RECORDS)}
        exportStatusOverride={exportStatusOverride}
        onUpgrade={() => {
          onShowPaymentModal?.('EXPORT_LOCKED');
        }}
      />
    </div>
  );
};