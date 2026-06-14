import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Bell, Star, ChevronDown, Filter, Eye, X } from 'lucide-react';
import { ViewName, Enterprise, UserRole } from '../types';
import { REGIONS } from '../src/constants/regions';
import { ExportDialog } from '../components/ExportDialog';
import { VipPromptModal } from '../components/VipPromptModal';

interface Props {
  onNavigate: (view: ViewName, data?: any) => void;
  enterprises: Enterprise[];
  initialQuery?: string;
  onToggleFollow: (id: string) => void;
  userRole?: UserRole;
  feedStatusOverride?: 'auto' | 'loading' | 'error' | 'empty' | 'ready';
  listState: any;
  setListState: React.Dispatch<React.SetStateAction<any>>;
  onShowPaymentModal?: (sceneId: string) => void;
  addExportRecord?: (dataType: 'opportunity' | 'enterprise', count: number, status?: 'completed' | 'failed') => void;
  exportStatusOverride?: 'completed' | 'failed';
}

const CARD_THEMES = [
  { iconBg: 'bg-blue-50', iconColor: 'text-blue-500', tagBg: 'bg-blue-50', tagText: 'text-blue-600', statText: 'text-blue-600' },
  { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', tagBg: 'bg-emerald-50', tagText: 'text-emerald-600', statText: 'text-emerald-600' },
  { iconBg: 'bg-violet-50', iconColor: 'text-violet-500', tagBg: 'bg-violet-50', tagText: 'text-violet-600', statText: 'text-violet-600' },
  { iconBg: 'bg-amber-50', iconColor: 'text-amber-500', tagBg: 'bg-amber-50', tagText: 'text-amber-600', statText: 'text-amber-600' },
  { iconBg: 'bg-rose-50', iconColor: 'text-rose-500', tagBg: 'bg-rose-50', tagText: 'text-rose-600', statText: 'text-rose-600' },
];

const getRoleTextColor = (role?: string) => {
  switch (role) {
    case '招采单位': return 'text-blue-600';
    case '招标代理': return 'text-emerald-600';
    case '投标单位': return 'text-amber-600';
    default: return 'text-[#333333]';
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

const getRoleIconTheme = (role?: string) => {
  switch (role) {
    case '招采单位': return 'bg-blue-50 text-blue-500';
    case '招标代理': return 'bg-emerald-50 text-emerald-500';
    case '投标单位': return 'bg-amber-50 text-amber-500';
    default: return 'bg-gray-50 text-gray-500';
  }
};

export const EnterpriseList: React.FC<Props> = ({ onNavigate: propOnNavigate, enterprises, initialQuery = '', onToggleFollow, userRole = UserRole.FREE, feedStatusOverride = 'auto', listState, setListState, onShowPaymentModal, addExportRecord, exportStatusOverride }) => {
  const [searchQuery, setSearchQuery] = useState(listState.searchQuery);
  const [localSearchQuery, setLocalSearchQuery] = useState(listState.searchQuery || '');
  const [filteredEnterprises, setFilteredEnterprises] = useState(enterprises);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ province: string, cities: string[] }>(listState.selectedRegion);
  const [selectedRole, setSelectedRole] = useState<string>(listState.selectedRole);
  const [selectedCapital, setSelectedCapital] = useState<string>(listState.selectedCapital);
  const [moreFilters, setMoreFilters] = useState(listState.moreFilters);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [isLoading, setIsLoading] = useState(!listState.hasLoadedOnce);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const showSkeleton = feedStatusOverride === 'loading' || isLoading;
  const showError = feedStatusOverride === 'error' || isNetworkError;
  const showEmptyOverride = feedStatusOverride === 'empty';

  useEffect(() => {
    if (feedStatusOverride === 'error') {
      setIsNetworkError(true);
    } else if (feedStatusOverride === 'ready' || feedStatusOverride === 'auto') {
      setIsNetworkError(false);
    }
  }, [feedStatusOverride]);

  const sortBy = listState.sortBy;

  const prevFiltersRef = React.useRef({
    searchQuery,
    selectedRegion,
    selectedRole,
    selectedCapital,
    moreFilters
  });

  // Lazy bottom scroll loading states
  const [visibleCount, setVisibleCount] = useState(listState.visibleCount);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'noMore' | 'error'>('idle');
  const [hasFailedOnce, setHasFailedOnce] = useState(false);

  const loadMoreData = () => {
    setLoadState('loading');
    setTimeout(() => {
      // Simulate an error on the second page to satisfy testing criteria and demonstrate recoverability
      if (userRole !== UserRole.FREE && !hasFailedOnce && visibleCount === 8 && filteredEnterprises.length > 8) {
        setLoadState('error');
        setHasFailedOnce(true);
        return;
      }
      
      let nextCount = visibleCount + 5;
      setVisibleCount(nextCount);
      if (nextCount >= filteredEnterprises.length) {
        setLoadState('noMore');
      } else {
        setLoadState('idle');
      }
    }, 1000);
  };

  const handleRetry = () => {
    setLoadState('loading');
    setTimeout(() => {
      let nextCount = visibleCount + 5;
      setVisibleCount(nextCount);
      if (nextCount >= filteredEnterprises.length) {
        setLoadState('noMore');
      } else {
        setLoadState('idle');
      }
    }, 1000);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isLoading || loadState === 'loading' || loadState === 'noMore' || loadState === 'error') return;
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 40;
    if (isAtBottom) {
      loadMoreData();
    }
  };

  const scrollRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const handleTabReselect = (e: CustomEvent) => {
      if (e.detail === ViewName.ENTERPRISE_LIST) {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('tabReselected', handleTabReselect as EventListener);
    return () => window.removeEventListener('tabReselected', handleTabReselect as EventListener);
  }, []);

  const isFirstMountRef = React.useRef(true);

  const onNavigate = (view: ViewName, data?: any) => {
    const container = document.getElementById('main-scroll-container') || scrollRef.current;
    const scrollTop = container ? container.scrollTop : 0;
    setListState({
      searchQuery,
      selectedRegion,
      selectedRole,
      selectedCapital,
      moreFilters,
      sortBy,
      visibleCount,
      hasLoadedOnce: true,
      scrollTop
    });
    propOnNavigate(view, data);
  };

  useEffect(() => {
    if (listState.scrollTop > 0) {
      const restoreScroll = () => {
        const container = document.getElementById('main-scroll-container') || scrollRef.current;
        if (container) {
          container.scrollTop = listState.scrollTop;
        }
      };
      requestAnimationFrame(restoreScroll);
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 150);
    }
  }, []);

  // Independent cold loading Effect
  useEffect(() => {
    if (!listState.hasLoadedOnce) {
      setIsLoading(true);
      setVisibleCount(8);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setListState((prev: any) => ({ ...prev, hasLoadedOnce: true }));
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [listState.hasLoadedOnce]);

  useEffect(() => {
    let result = [...enterprises];

    // 1. Search Query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(ent => 
        ent.name.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Region Filter
    if (selectedRegion.province !== '全国') {
      if (selectedRegion.cities.length > 0) {
        result = result.filter(ent => {
          const regionClean = (ent.location || '').replace('·', '');
          return selectedRegion.cities.some(city => regionClean.includes(city));
        });
      } else {
        result = result.filter(ent => {
          const regionClean = (ent.location || '').replace('·', '');
          return regionClean.includes(selectedRegion.province);
        });
      }
    }

    // 3. Role Filter
    if (selectedRole !== '企业角色' && selectedRole !== '不限') {
      result = result.filter(ent => (ent.role || '').includes(selectedRole));
    }

    // 4. Capital Filter
    if (selectedCapital !== '注册资本' && selectedCapital !== '不限') {
      result = result.filter(ent => {
        if (!ent.capital) return false;
        const capValue = parseFloat(ent.capital.replace(/[^0-9.]/g, ''));
        if (isNaN(capValue)) return true;
        if (selectedCapital === '100万以内') return capValue < 100;
        if (selectedCapital === '100-500万') return capValue >= 100 && capValue <= 500;
        if (selectedCapital === '500-1000万') return capValue >= 500 && capValue <= 1000;
        if (selectedCapital === '1000-5000万') return capValue >= 1000 && capValue <= 5000;
        if (selectedCapital === '5000万以上') return capValue > 5000;
        return true;
      });
    }

    let sortedResult = [...result];
    setFilteredEnterprises(sortedResult);
    
    if (!listState.hasLoadedOnce) {
      // During cold loading phase, only update the filtered result, do nothing else
      return;
    }

    if (isFirstMountRef.current && listState.hasLoadedOnce) {
      setIsLoading(false);
      setVisibleCount(listState.visibleCount);
      setLoadState(sortedResult.length <= listState.visibleCount ? 'noMore' : 'idle');
      isFirstMountRef.current = false;
      prevFiltersRef.current = {
        searchQuery,
        selectedRegion,
        selectedRole,
        selectedCapital,
        moreFilters
      };
    } else {
      const isFiltersChanged = 
        prevFiltersRef.current.searchQuery !== searchQuery ||
        JSON.stringify(prevFiltersRef.current.selectedRegion) !== JSON.stringify(selectedRegion) ||
        prevFiltersRef.current.selectedRole !== selectedRole ||
        prevFiltersRef.current.selectedCapital !== selectedCapital ||
        JSON.stringify(prevFiltersRef.current.moreFilters) !== JSON.stringify(moreFilters);

      if (!isFiltersChanged) {
        // 纯排序切换：不显示大骨架屏，直接呈现
        setIsLoading(false);
        setVisibleCount(8);
        setLoadState(sortedResult.length <= 8 ? 'noMore' : 'idle');
        isFirstMountRef.current = false;
      } else {
        // 其它筛选变化：需要完整骨架屏加载过渡
        setIsLoading(true);
        setVisibleCount(8);
        setLoadState(sortedResult.length <= 8 ? 'noMore' : 'idle');
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 450);
        isFirstMountRef.current = false;
        
        prevFiltersRef.current = {
          searchQuery,
          selectedRegion,
          selectedRole,
          selectedCapital,
          moreFilters
        };
        
        return () => clearTimeout(timer);
      }
    }

    prevFiltersRef.current = {
      searchQuery,
      selectedRegion,
      selectedRole,
      selectedCapital,
      moreFilters
    };
  }, [searchQuery, selectedRegion, selectedRole, selectedCapital, moreFilters, enterprises, sortBy]);

  const handleSearch = (query: string) => {
    if (query.toLowerCase() === 'error' || query === '加载失败' || query === '网络失败') {
      setIsNetworkError(true);
    } else {
      setIsNetworkError(false);
    }
    setSearchQuery(query);
    setLocalSearchQuery(query);
  };

  const handleExport = (count: number) => {
    setToast({ show: true, message: `成功导出 ${count} 条企业数据` });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const getFilterCounts = () => {
    const regionCount = (selectedRegion.province !== '全国' || selectedRegion.cities.length > 0) ? 1 : 0;
    const roleCount = selectedRole !== '企业角色' ? 1 : 0;
    const capitalCount = selectedCapital !== '注册资本' ? 1 : 0;
    const moreCount = (moreFilters.establishedYears && moreFilters.establishedYears !== '不限') ? 1 : 0;

    return {
      regionCount,
      roleCount,
      capitalCount,
      moreCount,
      totalCount: regionCount + roleCount + capitalCount + moreCount
    };
  };

  const filterCounts = getFilterCounts();
  const isSearchActive = searchQuery.trim() !== '';
  const isFilterActiveAny = filterCounts.totalCount >= 1;

  const clearAllFilters = () => {
    setSelectedRegion({ province: '全国', cities: [] });
    setSelectedRole('企业角色');
    setSelectedCapital('注册资本');
    setMoreFilters({
      establishedYears: '不限'
    });
    setActiveFilter(null);
    setVisibleCount(8);
    const container = document.getElementById('main-scroll-container') || scrollRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F7FA] font-sans">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-5 py-3 rounded-xl text-[14px] z-[110] animate-fade-in text-center whitespace-pre-line leading-relaxed shadow-2xl backdrop-blur-sm">
          {toast.message}
        </div>
      )}
      <header className="bg-white z-20 shrink-0">
        <div className="bg-gradient-to-r from-[#3B7BFF] to-[#6B9DFF] pt-safe-top pb-3">
          <div className="flex items-center justify-center h-12 px-4 relative">
            <h1 className="text-[20px] font-semibold text-white text-center absolute left-1/2 -translate-x-1/2 whitespace-nowrap">查企业</h1>
          </div>
  
          <div className="flex gap-2 px-[16px]">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input 
                className="block w-full h-[40px] pl-10 pr-10 text-[14px] bg-white border-none rounded-lg focus:ring-1 focus:ring-white placeholder-gray-400 outline-none shadow-sm" 
                placeholder="搜索企业名称" 
                type="text" 
                value={localSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSearchQuery(val);
                  if (val === '') handleSearch('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(localSearchQuery)}
              />
              {localSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearchQuery('');
                    handleSearch('');
                  }}
                  className="absolute inset-y-0 right-3 flex items-center justify-center flex-shrink-0 active:opacity-70"
                >
                  <div className="w-4 h-4 rounded-full bg-[#BCC1CB] flex items-center justify-center">
                    <X size={10} className="text-white" strokeWidth={3} />
                  </div>
                </button>
              )}
            </div>
            <button 
              className="h-[40px] px-5 rounded-lg bg-white/20 border border-white/40 text-white font-medium text-[14px] active:bg-white/30 transition-colors"
              onClick={() => handleSearch(localSearchQuery)}
            >
               搜索
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="relative z-30">
          <div className="flex items-center px-2 py-3 bg-white border-b border-gray-50 shadow-sm gap-1">
            <div className="flex flex-1 items-center gap-1 min-w-0 pr-2">
              <button 
                className={`flex items-center justify-center gap-1 flex-1 min-w-0 px-1 py-1.5 rounded-lg transition-colors ${(activeFilter === '所在地区' || filterCounts.regionCount >= 1) ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
                onClick={() => setActiveFilter(activeFilter === '所在地区' ? null : '所在地区')}
              >
                <span className="text-[13px] truncate">
                  {selectedRegion.province === '全国' && selectedRegion.cities.length === 0 
                    ? '所在地区' 
                    : selectedRegion.cities.length > 0 
                      ? selectedRegion.cities.join(',') 
                      : selectedRegion.province}
                </span>
                {filterCounts.regionCount >= 1 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E6F7FF] text-[#1677FF] rounded-md leading-none shrink-0 border border-[#B3E1FF]/30 font-numbers">
                    {filterCounts.regionCount}
                  </span>
                )}
                <ChevronDown size={12} className={`shrink-0 transition-transform ${activeFilter === '所在地区' ? 'rotate-180 text-primary' : ''}`} />
              </button>
              <button 
                className={`flex items-center justify-center gap-1 flex-1 min-w-0 px-1 py-1.5 rounded-lg transition-colors ${(activeFilter === '角色' || filterCounts.roleCount >= 1) ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
                onClick={() => setActiveFilter(activeFilter === '角色' ? null : '角色')}
              >
                <span className="text-[13px] truncate">{selectedRole}</span>
                {filterCounts.roleCount >= 1 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E6F7FF] text-[#1677FF] rounded-md leading-none shrink-0 border border-[#B3E1FF]/30 font-numbers">
                    {filterCounts.roleCount}
                  </span>
                )}
                <ChevronDown size={12} className={`shrink-0 transition-transform ${activeFilter === '角色' ? 'rotate-180 text-primary' : ''}`} />
              </button>
              <button 
                className={`flex items-center justify-center gap-1 flex-1 min-w-0 px-1 py-1.5 rounded-lg transition-colors ${(activeFilter === '注册资本' || filterCounts.capitalCount >= 1) ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
                onClick={() => setActiveFilter(activeFilter === '注册资本' ? null : '注册资本')}
              >
                <span className="text-[13px] truncate">{selectedCapital}</span>
                {filterCounts.capitalCount >= 1 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E6F7FF] text-[#1677FF] rounded-md leading-none shrink-0 border border-[#B3E1FF]/30 font-numbers">
                    {filterCounts.capitalCount}
                  </span>
                )}
                <ChevronDown size={12} className={`shrink-0 transition-transform ${activeFilter === '注册资本' ? 'rotate-180 text-primary' : ''}`} />
              </button>
            </div>
            <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>
            <button 
                onClick={() => setActiveFilter(activeFilter === '更多' ? null : '更多')}
                className={`relative flex-shrink-0 flex items-center justify-center gap-1 h-8 rounded-lg transition-colors px-2 ${(activeFilter === '更多' || filterCounts.moreCount >= 1) ? 'text-primary bg-primary/5' : 'text-gray-600 active:bg-gray-50'}`}
            >
                <Filter size={14} className="shrink-0" />
                <span className="text-[12px] font-medium shrink-0">更多</span>
                {filterCounts.moreCount >= 1 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E6F7FF] text-[#1677FF] rounded-md leading-none shrink-0 border border-[#B3E1FF]/30 font-numbers">
                    {filterCounts.moreCount}
                  </span>
                )}
            </button>
          </div>
          {filterCounts.totalCount >= 1 && (
            <div className="flex justify-end px-4 py-1.5 bg-gray-50/50 border-b border-gray-100 items-center animate-in fade-in duration-200">
              <button 
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
              >
                <X size={12} strokeWidth={2.5} />
                <span>清除筛选 ({filterCounts.totalCount})</span>
              </button>
            </div>
          )}
          
          <div className="flex px-4 py-3 items-center justify-between border-b border-[#F0F0F0] bg-white">
            <div className="flex items-center gap-3">
              <div className="text-[13px] text-[#666666]">
                 共<span className="text-[#FF4D4F] mx-1 font-medium font-numbers">{showError ? '0' : (showEmptyOverride ? '0' : (filteredEnterprises.length > 0 ? '500+' : '0'))}</span>条数据
              </div>
            </div>
            <button 
               onClick={() => { if (userRole === UserRole.FREE) { onShowPaymentModal?.('EXPORT_LOCKED'); } else { setIsExportDialogOpen(true); } }}
               className="text-[#1677FF] text-[13px] font-medium active:opacity-70"
            >
               导出数据
            </button>
          </div>


          {activeFilter === '所在地区' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col h-[300px]">
                <div className="flex flex-1 min-h-0 overflow-hidden">
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
            </div>
          )}
          {activeFilter === '角色' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 flex flex-col">
              <div className="p-4 flex-1 min-h-0 overflow-y-auto max-h-[250px]">
                <div className="grid grid-cols-1 gap-2">
                  {['不限', '招采单位', '招标代理', '投标单位'].map(role => (
                    <button
                      key={role}
                      className={`w-full text-left px-4 py-3 text-[15px] rounded-lg ${(selectedRole === role || (role === '不限' && selectedRole === '企业角色')) ? 'bg-[#F0F5FF] text-primary' : 'bg-[#F7F8FA] text-gray-800'}`}
                      onClick={() => setSelectedRole(role === '不限' ? '企业角色' : role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex p-4 border-t border-[#F0F0F0] gap-3 shrink-0">
                <button 
                  className="flex-1 py-2 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
                  onClick={() => setSelectedRole('企业角色')}
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
          )}
          {activeFilter === '注册资本' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 flex flex-col">
              <div className="p-4 flex-1 min-h-0 overflow-y-auto max-h-[250px]">
                <div className="grid grid-cols-2 gap-2">
                  {['不限', '100万以内', '100-500万', '500-1000万', '1000-5000万', '5000万以上'].map(capital => (
                    <button
                      key={capital}
                      className={`w-full text-center px-4 py-2 text-[14px] rounded-lg ${selectedCapital === capital || (selectedCapital === '注册资本' && capital === '不限') ? 'bg-[#F0F5FF] text-primary' : 'bg-[#F7F8FA] text-gray-800'}`}
                      onClick={() => setSelectedCapital(capital === '不限' ? '注册资本' : capital)}
                    >
                      {capital}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex p-4 border-t border-[#F0F0F0] gap-3 shrink-0">
                <button 
                  className="flex-1 py-2 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
                  onClick={() => setSelectedCapital('注册资本')}
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
          )}
          {activeFilter === '更多' && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2">
              <div className="flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 max-h-[300px]">
                  {/* 成立年限 */}
                  <div>
                    <div className="text-sm text-gray-500 mb-3">成立年限</div>
                    <div className="flex flex-wrap gap-3">
                      {['不限', '1年内', '1-3年', '3-5年', '5-10年', '10年以上'].map(opt => (
                        <button
                          key={opt}
                          className={`px-4 py-1.5 rounded-md text-sm ${moreFilters.establishedYears === opt ? 'bg-blue-50 text-primary' : 'bg-gray-50 text-gray-700'}`}
                          onClick={() => setMoreFilters({...moreFilters, establishedYears: opt})}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex p-4 border-t border-[#F0F0F0] gap-3">
                  <button 
                    className="flex-1 py-2 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
                    onClick={() => setMoreFilters({ establishedYears: '不限' })}
                  >
                    清空
                  </button>
                  <button 
                    className="flex-1 py-2 bg-[#1677FF] text-white rounded-md text-[14px] font-medium"
                    onClick={() => setActiveFilter(null)}
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Results List */}
      <main ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24 relative">
        {showSkeleton ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#E8EEF8]/80 flex flex-col gap-4 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-4.5 bg-gray-100 rounded-md w-14"></div>
                    <div className="h-4.5 bg-gray-100 rounded-md w-16"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-12"></div>
                  </div>
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded-full shrink-0"></div>
              </div>
              <div className="border-t border-[#F0F0F0]/60 pt-3.5 flex justify-between gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 gap-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (showError || showEmptyOverride || filteredEnterprises.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {showError ? (
              // 1. 网络失败 Empty State
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 mb-4 text-[#FF4D4F]/85 flex items-center justify-center bg-red-50 rounded-full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-bold text-[16px] mb-1">加载失败</h3>
                <p className="text-gray-500 text-[13.5px] max-w-[280px] mb-5">网络连接出现异常，请检查您的网络设置或点击重试</p>
                <button 
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsNetworkError(false);
                      setIsLoading(false);
                    }, 600);
                  }}
                  className="px-6 py-2.5 bg-[#1677FF] hover:bg-[#4096ff] text-white text-[14px] font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
                >
                  重试
                </button>
              </div>
            ) : (showEmptyOverride || (enterprises.length === 0 && !isSearchActive && !isFilterActiveAny)) ? (
              // 2. 首次无数据 Empty State
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 mb-4 text-gray-300 flex items-center justify-center bg-gray-50 rounded-full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18m-18 0v-7.5A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v7.5m-18 0v-4.5A2.25 2.25 0 014.5 9h15a2.25 2.25 0 012.25 2.25v4.5m-18 3h18a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25h-3.86a2.25 2.25 0 01-2.008-1.24l-.885-1.77a2.25 2.25 0 00-2.007-1.24h-1.98a2.25 2.25 0 00-2.007 1.24l-.885 1.77a2.25 2.25 0 01-2.007 1.24H4.5a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-bold text-[16px] mb-1">暂无企业数据</h3>
                <p className="text-gray-500 text-[13.5px] max-w-[280px] mb-5">新标讯企业库尚未入库任何企业记录，请耐心等待抓取完成！</p>
              </div>
            ) : (isSearchActive || isFilterActiveAny) ? (
              // 3. 搜索或筛选无结果 (有条件的空态)
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 mb-4 text-[#FFAC33] flex items-center justify-center bg-amber-50 rounded-full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-bold text-[16px] mb-1">未找到符合条件的结果</h3>
                <p className="text-gray-500 text-[13.5px] max-w-[280px] mb-5">试试减少筛选条件，或调整关键词</p>
                <button 
                  onClick={() => {
                    if (isFilterActiveAny) {
                      clearAllFilters();
                    } else {
                      handleSearch('');
                    }
                  }}
                  className="px-6 py-2.5 bg-[#1677FF] hover:bg-[#4096ff] text-white text-[14px] font-semibold rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  {isFilterActiveAny ? '清除筛选' : '清除搜索'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 mb-4 text-gray-300 flex items-center justify-center bg-gray-50 rounded-full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18m-18 0v-7.5A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v7.5m-18 0v-4.5A2.25 2.25 0 014.5 9h15a2.25 2.25 0 012.25 2.25v4.5m-18 3h18a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25h-3.86a2.25 2.25 0 01-2.008-1.24l-.885-1.77a2.25 2.25 0 00-2.007-1.24h-1.98a2.25 2.25 0 00-2.007 1.24l-.885 1.77a2.25 2.25 0 01-2.007 1.24H4.5a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-bold text-[16px] mb-1">暂无结果</h3>
              </div>
            )}
          </div>
        ) : (
          filteredEnterprises.slice(0, visibleCount).map((ent, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
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
                {[
                  { label: '法定代表人', value: ent.legalRep, isFontNumber: false },
                  ent.capital ? { label: '注册资本', value: ent.capital, isFontNumber: true } : null,
                  (ent.projectContacts !== undefined) ? { label: '项目联系人', value: ent.projectContacts, isFontNumber: true } : null,
                  (ent.winningBids !== undefined) ? { label: '中标业绩', value: ent.winningBids, isFontNumber: true } : null
                ].filter(Boolean).map((item, i, arr) => (
                  <div key={item!.label} className={`flex flex-col items-center flex-1 min-w-0 ${i < arr.length - 1 ? 'border-r border-[#F0F0F0]' : ''}`}>
                    <span className="text-[11px] text-[#999999] mb-1">{item!.label}</span>
                    <span className={`text-[13px] text-[#333333] font-medium truncate w-full text-center px-1 ${item!.isFontNumber ? 'font-numbers' : ''}`}>{item!.value}</span>
                  </div>
                ))}
              </div>
            </article>
          )})
        )}



        {/* Lazy Auto Load More Footer */}
        {!showSkeleton && !showError && !showEmptyOverride && filteredEnterprises.length > 0 && (
          <div className="py-5 flex items-center justify-center text-[13px] text-gray-400">
            {loadState === 'loading' && (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-[#1677FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>加载中...</span>
              </div>
            )}
            {loadState === 'noMore' && (
              <div className="flex items-center gap-2 text-gray-400/85 font-normal">
                <div className="h-[1px] w-8 bg-gray-200"></div>
                <span>已经到底啦</span>
                <div className="h-[1px] w-8 bg-gray-200"></div>
              </div>
            )}
            {loadState === 'error' && (
              <button 
                onClick={handleRetry}
                className="px-4 py-2 text-[#FF4D4F] font-semibold bg-[#FFF2F0] hover:bg-[#FFCCC7] rounded-full active:scale-95 transition-all flex items-center gap-1 border border-[#FFCCC7]"
              >
                <span>加载失败，点击重试</span>
              </button>
            )}
          </div>
        )}
      </main>

      <ExportDialog 
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
        userRole={userRole}
        totalItems={filteredEnterprises.length}
        dataType="enterprise"
        addExportRecord={addExportRecord}
        onViewRecords={() => onNavigate(ViewName.EXPORT_RECORDS)}
        exportStatusOverride={exportStatusOverride}
        onUpgrade={() => {
          onNavigate(ViewName.MEMBER_CENTER);
        }}
      />


    </div>
  );
};