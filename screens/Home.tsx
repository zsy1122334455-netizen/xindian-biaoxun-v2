import React, { useState, useEffect } from 'react';
import { Bell, Search, RefreshCw, ChevronDown, X, CalendarDays, Star, History, Download, ChevronLeft, WifiOff, AlertTriangle, Contact } from 'lucide-react';
import { ViewName, Opportunity, UserRole } from '../types';
import { getProjectTypeStyle, getAnnouncementTypeStyle } from '../utils';
import { getOpportunityStatusInfo, PRIMARY_STATUS_STYLES, BADGE_STYLES, getCountdownText } from '../utils/statusUtils';

interface HomeProps {
  onNavigate: (view: ViewName, data?: any) => void;
  opportunities: Opportunity[];
  onToggleStar: (id: string) => void;
  showToast?: (message: string) => void;
  feedStatusOverride?: 'auto' | 'loading' | 'error' | 'empty' | 'ready';
  setFeedStatusOverride?: (status: 'auto' | 'loading' | 'error' | 'empty' | 'ready') => void;
  isOfflineError?: boolean;
  setIsOfflineError?: (offline: boolean) => void;
  userRole?: UserRole;
}

export const Home: React.FC<HomeProps> = ({ 
  onNavigate, 
  opportunities, 
  onToggleStar, 
  showToast,
  feedStatusOverride: propFeedStatusOverride,
  setFeedStatusOverride: propSetFeedStatusOverride,
  isOfflineError: propIsOfflineError,
  setIsOfflineError: propSetIsOfflineError,
  userRole = UserRole.FREE
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'商机' | '企业'>('商机');
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const [hotSearchIndex, setHotSearchIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'focus' | 'today' | 'latest'>('latest');

  // Dev overrides & fail proofing states
  const [localFeedStatusOverride, setLocalFeedStatusOverride] = useState<'auto' | 'loading' | 'error' | 'empty' | 'ready'>('auto');
  const [localIsOfflineError, setLocalIsOfflineError] = useState(false);

  const feedStatusOverride = propFeedStatusOverride !== undefined ? propFeedStatusOverride : localFeedStatusOverride;
  const setFeedStatusOverride = propSetFeedStatusOverride !== undefined ? propSetFeedStatusOverride : setLocalFeedStatusOverride;
  const isOfflineError = propIsOfflineError !== undefined ? propIsOfflineError : localIsOfflineError;
  const setIsOfflineError = propSetIsOfflineError !== undefined ? propSetIsOfflineError : setLocalIsOfflineError;

  // Loading & Pull-to-refresh state
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);

  // States and refs to handle deferred toast and fresh state reading within setTimeout
  const [pendingRefreshToast, setPendingRefreshToast] = useState(false);
  const statusRef = React.useRef<'auto' | 'loading' | 'error' | 'empty' | 'ready'>('auto');
  const activeTabRef = React.useRef<'focus' | 'today' | 'latest'>('latest');

  // Red dot indicator state (persisted via localStorage)
  const [hasUnreadBell, setHasUnreadBell] = useState(() => {
    return localStorage.getItem('unread_bell_indicator') !== 'false';
  });

  const oppHotSearchBatches = [
    ['工程施工', '信息化', '旧房改造'],
    ['智慧城市', '医疗设备', '园林绿化'],
    ['光伏发电', '电梯维保', '办公采购']
  ];
  
  const entHotSearchBatches = [
    ['腾讯科技', '阿里巴巴', '百度时代'],
    ['华为技术', '中国移动', '国家电网'],
    ['中建八局', '中国建筑', '中国中铁']
  ];

  const currentBatches = searchScope === '商机' ? oppHotSearchBatches : entHotSearchBatches;
  const currentHotSearches = currentBatches[hotSearchIndex % currentBatches.length];

  // Simulating initial loading skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingFeed(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Soft tab switching skeleton effect
  const handleTabChange = (tab: 'focus' | 'today' | 'latest') => {
    setIsLoadingFeed(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsLoadingFeed(false);
    }, 450);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (searchScope === '企业') {
        onNavigate(ViewName.ENTERPRISE_LIST, { query: searchQuery });
      } else {
        onNavigate(ViewName.OPPORTUNITY_LIST, { query: searchQuery, scope: searchScope });
      }
    }
  };

  const handleHotSearchClick = (term: string) => {
    if (searchScope === '企业') {
      onNavigate(ViewName.ENTERPRISE_LIST, { query: term });
    } else {
      onNavigate(ViewName.OPPORTUNITY_LIST, { query: term });
    }
  };

  const handleRefreshHotSearch = () => {
    setHotSearchIndex((prev) => (prev + 1) % currentBatches.length);
  };

  const handleBellClick = () => {
    setHasUnreadBell(false);
    localStorage.setItem('unread_bell_indicator', 'false');
    onNavigate(ViewName.MESSAGE_LIST);
  };

  const handleBackClick = () => {
    if (showToast) {
      showToast('正在退出，返回主应用...');
    } else {
      alert('已退出「新点标讯」子应用并返回主应用');
    }
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollContainer = document.getElementById('main-scroll-container') || document.documentElement;
    if (scrollContainer.scrollTop <= 2) {
      setStartY(e.touches[0].pageY);
      setCanPull(true);
    } else {
      setCanPull(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canPull || isRefreshing) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY;
    if (diff > 0) {
      // Logarithmic resistance
      const distance = Math.min(80, Math.pow(diff, 0.85));
      setPullDistance(distance);
      // Suppress native iOS/Android overflow scroll triggers
      if (diff > 8 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!canPull || isRefreshing) return;
    if (pullDistance > 45) {
      triggerPullToRefresh();
    } else {
      setPullDistance(0);
    }
    setCanPull(false);
  };

  const triggerPullToRefresh = (showToastAlert = true) => {
    setIsRefreshing(true);
    setPullDistance(50);
    
    // Simulate content refresh sequence
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
      
      if (showToastAlert && showToast) {
        const currentStatus = statusRef.current;
        const currentTab = activeTabRef.current;

        if (currentStatus === 'error') {
          showToast('刷新失败，请重试');
        } else if (currentStatus === 'loading') {
          // "加载中"状态下不要提前弹成功提示，应在加载成功完成后再弹
          setPendingRefreshToast(true);
        } else {
          // 只有在【正常状态下下拉刷新成功后】才弹成功提示
          let msg = '最新商机已刷新';
          if (currentTab === 'focus') {
            msg = '关注列表已更新';
          } else if (currentTab === 'today') {
            msg = '开标信息已更新';
          }
          showToast(msg);
        }
      }
    }, 1000);
  };

  const handleRetry = () => {
    setFeedStatusOverride('auto'); // resets the override back to natural behavior
    setIsLoadingFeed(true);
    if (showToast) {
      showToast('正在重新加载...');
    }
    setTimeout(() => {
      setIsLoadingFeed(false);
      if (showToast) {
        showToast('重新加载完成');
      }
    }, 700);
  };

  useEffect(() => {
    const handleTabReselect = (e: CustomEvent) => {
      if (e.detail === ViewName.HOME) {
        triggerPullToRefresh(true);
      }
    };
    window.addEventListener('tabReselected', handleTabReselect as EventListener);
    return () => window.removeEventListener('tabReselected', handleTabReselect as EventListener);
  }, []);

  const getFilteredOpportunities = () => {
    switch (activeTab) {
      case 'focus':
        return opportunities.filter(opp => opp.isStarred);
      case 'today': {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        return opportunities.filter(opp => opp.deadline && opp.deadline.substring(0, 10) === todayStr);
      }
      case 'latest':
      default:
        return opportunities;
    }
  };

  const filteredOpportunities = getFilteredOpportunities();

  const todayOpportunitiesCount = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return opportunities.filter(opp => opp.deadline && opp.deadline.substring(0, 10) === todayStr).length;
  })();

  const currentFeedStatus = (() => {
    if (feedStatusOverride !== 'auto') return feedStatusOverride;
    if (isLoadingFeed) return 'loading';
    if (filteredOpportunities.length === 0) return 'empty';
    return 'ready';
  })();

  // Keep refs updated on every render to avoid stale closure issues in async setTimeout callbacks
  statusRef.current = currentFeedStatus;
  activeTabRef.current = activeTab;

  // React to loading state transitions when a refresh toast is pending
  useEffect(() => {
    if (pendingRefreshToast && (currentFeedStatus === 'ready' || currentFeedStatus === 'empty')) {
      if (showToast) {
        let msg = '最新商机已刷新';
        if (activeTab === 'focus') {
          msg = '关注列表已更新';
        } else if (activeTab === 'today') {
          msg = '开标信息已更新';
        }
        showToast(msg);
      }
      setPendingRefreshToast(false);
    } else if (pendingRefreshToast && currentFeedStatus === 'error') {
      if (showToast) {
        showToast('刷新失败，请重试');
      }
      setPendingRefreshToast(false);
    }
  }, [currentFeedStatus, pendingRefreshToast, activeTab, showToast]);

  const renderSkeletons = () => {
    return Array.from({ length: 3 }).map((_, idx) => (
      <div 
        key={idx}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 animate-pulse"
      >
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gray-200 rounded w-5/6"></div>
          <div className="h-5 bg-gray-200 rounded-full w-5"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-100 rounded w-16"></div>
          <div className="h-5 bg-gray-100 rounded w-16"></div>
          <div className="h-5 bg-gray-100 rounded w-20"></div>
        </div>
        <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-50">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-5 bg-gray-100 rounded w-12"></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-page pb-[calc(60px+env(safe-area-inset-bottom)+16px)] selection:bg-blue-100">

      {/* Sticky Top Bar (With Left Return circle button, Centered Title, and Right Bell) */}
      <div className="sticky top-0 z-[110] bg-gradient-to-r from-[#0D5EFA] to-[#4B85FA] text-white pt-safe-top shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* Left Return Button representing a sub-app back trigger */}
          <button 
            className="w-9 h-9 rounded-full bg-white/12 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white cursor-pointer border border-white/10 shadow-sm"
            onClick={handleBackClick}
            title="返回主应用"
          >
            <ChevronLeft size={18} className="stroke-[2.5]" />
          </button>

          {/* Centered Tool Name with precise balance */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] font-bold tracking-wide text-white select-none pointer-events-none">
            新点标讯
          </div>

          {/* Right Notification Bell */}
          <button 
            className="relative w-9 h-9 rounded-full hover:bg-white/12 active:opacity-80 transition-all flex items-center justify-center cursor-pointer"
            onClick={handleBellClick}
          >
            <Bell size={21} className="stroke-[2.2]" />
            {hasUnreadBell && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0D5EFA]"></span>
            )}
          </button>
        </div>
      </div>

      {/* Non-sticky Header Content */}
      <header className="bg-gradient-to-br from-[#0D5EFA] to-[#8EABFF] text-white pb-14 pt-2 relative rounded-b-[32px] mt-[-1px]">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="px-4 mt-2 relative z-50">
            <div className="flex w-full items-center rounded-lg bg-white h-[44px] shadow-sm font-sans">
              {/* Dropdown */}
              <div className="relative h-full flex items-center">
                <button 
                  className="flex items-center pl-3 pr-2 h-full text-[16px] font-normal text-[#333333] whitespace-nowrap active:bg-gray-50 rounded-l-lg"
                  onClick={() => setIsScopeMenuOpen(!isScopeMenuOpen)}
                >
                  <span className="pr-1">{searchScope}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isScopeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isScopeMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsScopeMenuOpen(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-[120px] bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1)] py-2 z-50 border border-gray-100">
                      {/* Triangle pointer */}
                      <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-100"></div>
                      <div className="relative bg-white z-10 rounded-lg overflow-hidden flex flex-col">
                        {(['商机', '企业'] as const).map(scope => (
                          <button 
                            key={scope}
                            className={`block w-full text-left px-5 py-3 text-[16px] font-normal hover:bg-gray-50 active:bg-gray-100 transition-colors ${searchScope === scope ? 'text-[#1677FF]' : 'text-[#333333]'}`}
                            onClick={() => {
                              setSearchScope(scope as any);
                              setIsScopeMenuOpen(false);
                            }}
                          >
                            {scope}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="h-4 w-[1px] bg-gray-200 mx-1 flex-shrink-0"></div>

              {/* Search input field */}
              <div className="text-gray-400 flex items-center justify-center pl-2 pr-1 flex-shrink-0">
                <Search size={16} />
              </div>
              <input 
                className="flex-1 bg-transparent border-none text-[16px] font-normal text-[#333333] placeholder:text-gray-500 focus:ring-0 px-1 h-full outline-none min-w-0" 
                placeholder="请输入搜索内容" 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-1 flex items-center justify-center flex-shrink-0 active:opacity-77"
                >
                  <div className="w-4 h-4 rounded-full bg-[#BCC1CB] flex items-center justify-center">
                    <X size={10} className="text-white" strokeWidth={3} />
                  </div>
                </button>
              )}

              {/* Search button trigger */}
              <button 
                className="h-full px-5 bg-[#1677FF] text-white font-normal text-[16px] active:bg-[#1677FF]/90 transition-colors rounded-r-lg flex-shrink-0"
                onClick={handleSearch}
              >
                搜索
              </button>
            </div>
          </div>

          {/* Hot Tag keywords */}
          <div className="px-4 mt-4 flex items-center gap-2 relative z-10 overflow-x-auto no-scrollbar">
            <span className="text-[13px] text-white flex items-center gap-1 font-medium whitespace-nowrap">
              热搜 <span className="w-[1px] h-3 bg-white/40 mx-1"></span>
            </span>
            <div className="flex gap-4 text-[13px] text-white/90 font-medium">
              {currentHotSearches.map((term, index) => (
                <button 
                  key={index}
                  className="whitespace-nowrap hover:text-white transition-colors"
                  onClick={() => handleHotSearchClick(term)}
                >
                  {term}
                </button>
              ))}
            </div>
            <div className="ml-auto pl-4">
              <button onClick={handleRefreshHotSearch} className="active:rotate-180 transition-transform duration-300">
                  <RefreshCw size={16} className="text-white/90" />
              </button>
            </div>
          </div>
        </div>
      </header>



      {/* Main Container over header layout */}
      <main className="flex-1 relative z-20 -mt-8 px-4 max-w-7xl mx-auto w-full">
        {/* Quick Actions Grid (One neat row of 4 columns, filling the row cleanly) */}
        <section className="bg-white rounded-xl p-4 shadow-soft grid grid-cols-4 gap-x-2 gap-y-1 mb-4 select-none">
          {[
            { icon: CalendarDays, label: '我的日程', color: 'text-[#0D5EFA]', view: ViewName.MY_SCHEDULE },
            { icon: Contact, label: '项目联系', color: 'text-amber-500', view: ViewName.PROJECT_CONTACTS },
            { icon: History, label: '浏览历史', color: 'text-violet-500', view: ViewName.BROWSING_HISTORY },
            { icon: Download, label: '导出记录', color: 'text-emerald-500', view: ViewName.EXPORT_RECORDS },
          ].map((item, idx) => (
            <button 
              key={idx} 
              className="flex flex-col items-center gap-2 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-blue-100 rounded-lg py-1 cursor-pointer"
              onClick={() => {
                if (item.view) {
                  onNavigate(item.view);
                }
              }}
            >
              <div className="h-12 w-12 rounded-xl bg-[#F4F7FF] flex items-center justify-center">
                <item.icon className={item.color} size={24} strokeWidth={2} />
              </div>
              <span className="text-[12px] text-gray-700 font-medium font-sans text-center leading-none">
                {item.label}
              </span>
            </button>
          ))}
        </section>

        {/* Feed Scroll and Pull-to-Refresh Container */}
        <div 
          id="home-feed-touch-zone" 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Home Feed Tabs Anchor */}
          <section id="home-feed-tabs" className="mb-4 border-b border-gray-100 scroll-mt-18">
            <div className="flex overflow-x-auto no-scrollbar">
              <button 
                  className={`relative flex-1 py-3 text-[15px] whitespace-nowrap transition-colors ${activeTab === 'latest' ? 'font-bold text-[#1677FF]' : 'font-medium text-gray-600 hover:text-gray-850'}`}
                  onClick={() => handleTabChange('latest')}
              >
                  最新商机 <span className={`text-[11px] font-normal ml-0.5 ${activeTab === 'latest' ? 'text-[#1677FF]' : 'text-gray-400'}`}>(99+)</span>
                  {activeTab === 'latest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-[#1677FF] rounded-t-full" />}
              </button>
              <button 
                  className={`relative flex-1 py-3 text-[15px] whitespace-nowrap transition-colors ${activeTab === 'focus' ? 'font-bold text-[#1677FF]' : 'font-medium text-gray-600 hover:text-gray-850'}`}
                  onClick={() => handleTabChange('focus')}
              >
                  我的关注 <span className={`text-[11px] font-normal ml-0.5 ${activeTab === 'focus' ? 'text-[#1677FF]' : 'text-gray-400'}`}>({opportunities.filter(o => o.isStarred).length})</span>
                  {activeTab === 'focus' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-[#1677FF] rounded-t-full" />}
              </button>
              <button 
                  className={`relative flex-1 py-3 text-[15px] whitespace-nowrap transition-colors ${activeTab === 'today' ? 'font-bold text-[#1677FF]' : 'font-medium text-gray-600 hover:text-gray-850'}`}
                  onClick={() => handleTabChange('today')}
              >
                  今日开标 <span className={`text-[11px] font-normal ml-0.5 ${activeTab === 'today' ? 'text-[#1677FF]' : 'text-gray-400'}`}>({todayOpportunitiesCount})</span>
                  {activeTab === 'today' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-[#1677FF] rounded-t-full" />}
              </button>
            </div>
          </section>
          <div 
            className="overflow-hidden transition-all duration-150 flex items-center justify-center text-gray-500 bg-transparent"
            style={{ 
              height: pullDistance > 0 || isRefreshing ? `${Math.min(48, pullDistance)}px` : '0px',
              opacity: pullDistance > 0 || isRefreshing ? Math.min(1, pullDistance / 35) : 0,
            }}
          >
            <div className="flex items-center gap-2 py-2">
              <RefreshCw 
                size={14} 
                className={`text-[#1677FF] ${isRefreshing ? 'animate-spin' : ''}`} 
                style={{
                  transform: !isRefreshing ? `rotate(${pullDistance * 6}deg)` : undefined
                }}
              />
              <span className="text-[12px] font-medium text-gray-400">
                {isRefreshing ? '正在加载最新商机...' : pullDistance > 35 ? '松开立即刷新' : '下拉刷新商机'}
              </span>
            </div>
          </div>

          {/* Feed List Container */}
          <section className="flex flex-col gap-4 mb-8">
            {currentFeedStatus === 'loading' && renderSkeletons()}

            {currentFeedStatus === 'error' && (
              /* 新增网络失败/普通加载失败内联居中卡片 */
              <div 
                style={{ animation: 'simpleFadeInOnly 0.3s ease-out forwards' }}
                className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center w-full min-h-[300px]"
              >
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes simpleFadeInOnly {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                ` }} />
                <div className="w-16 h-16 mb-4 flex items-center justify-center bg-[#FFF1F0] text-[#FF4D4F] rounded-full">
                  {isOfflineError ? (
                    <WifiOff size={28} className="stroke-[1.5]" />
                  ) : (
                    <AlertTriangle size={28} className="stroke-[1.5]" />
                  )}
                </div>
                <h4 className="text-[15px] font-bold text-gray-850 mb-1.5 font-sans">
                  {isOfflineError ? '网络连接失败' : '加载失败'}
                </h4>
                <p className="text-gray-400 text-[13px] max-w-[260px] leading-relaxed mb-6 font-sans">
                  {isOfflineError ? '网络连接失败，请检查网络后重试' : '加载失败，请稍后重试'}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-6 py-2.5 bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-medium text-[13px] rounded-lg shadow-sm active:scale-95 transition-all outline-none font-sans cursor-pointer"
                >
                  点击重试
                </button>
              </div>
            )}

            {currentFeedStatus === 'empty' && (
              activeTab === 'focus' ? (
                /* 我的关注为空：保持原有图标与文案，按钮（去浏览最新商机）切回最新商机 */
                <div 
                  style={{ animation: 'simpleFadeInOnly 0.3s ease-out forwards' }}
                  className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center w-full min-h-[300px]"
                >
                  <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes simpleFadeInOnly {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                  ` }} />
                  <div className="w-16 h-16 mb-4 flex items-center justify-center bg-[#F4F7FF] text-[#1677FF] rounded-full">
                    <Star size={28} className="stroke-[1.5] text-amber-500 animate-pulse" />
                  </div>
                  <h4 className="text-[15px] font-bold text-gray-800 mb-1.5 font-sans">
                    还没有关注任何标讯哦
                  </h4>
                  <p className="text-gray-400 text-[13px] max-w-[260px] leading-relaxed mb-6 font-sans">
                    添加喜欢的项目关注后，您可以在这里快速了解全部动态更新。
                  </p>
                  <button
                    onClick={() => handleTabChange('latest')}
                    className="px-6 py-2.5 bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-medium text-[13px] rounded-lg shadow-sm active:scale-95 transition-all font-sans cursor-pointer"
                  >
                    去浏览最新商机
                  </button>
                </div>
              ) : activeTab === 'today' ? (
                /* 今日开标为空：保持原有图标与今日暂无开标预告文案，按钮（前往日程表添加）跳转日程页 */
                <div 
                  style={{ animation: 'simpleFadeInOnly 0.3s ease-out forwards' }}
                  className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center w-full min-h-[300px]"
                >
                  <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes simpleFadeInOnly {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                  ` }} />
                  <div className="w-16 h-16 mb-4 flex items-center justify-center bg-[#F4F7FF] text-[#1677FF] rounded-full">
                    <CalendarDays size={28} className="stroke-[1.5] text-blue-500" />
                  </div>
                  <h4 className="text-[15px] font-bold text-gray-800 mb-1.5 font-sans">
                    今日暂无开标预告
                  </h4>
                  <p className="text-gray-400 text-[13px] max-w-[260px] leading-relaxed mb-6 font-sans">
                    今日尚未安排任何项目开标。您可在此添加个人开标备忘，或发现新商机。
                  </p>
                  <button
                    onClick={() => onNavigate(ViewName.MY_SCHEDULE)}
                    className="px-6 py-2.5 bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-medium text-[13px] rounded-lg shadow-sm active:scale-95 transition-all font-sans cursor-pointer"
                  >
                    前往日程表添加
                  </button>
                </div>
              ) : (
                /* 最新商机为空 */
                <div 
                  style={{ animation: 'simpleFadeInOnly 0.3s ease-out forwards' }}
                  className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center w-full min-h-[300px]"
                >
                  <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes simpleFadeInOnly {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                  ` }} />
                  <div className="w-16 h-16 mb-4 flex items-center justify-center bg-[#F4F7FF] text-gray-450 rounded-full">
                    <Search size={28} className="stroke-[1.5] text-gray-400" />
                  </div>
                  <h4 className="text-[15px] font-bold text-gray-800 mb-1.5 font-sans">
                    暂无最新商机哦
                  </h4>
                  <p className="text-gray-400 text-[13px] max-w-[260px] leading-relaxed mb-6 font-sans">
                    当前暂无符合条件的商机信息，您可稍后再试或点击刷新。
                  </p>
                  <button
                    onClick={() => triggerPullToRefresh(true)}
                    className="px-6 py-2.5 bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-medium text-[13px] rounded-lg shadow-sm active:scale-95 transition-all font-sans cursor-pointer"
                  >
                    刷新商机
                  </button>
                </div>
              )
            )}

            {currentFeedStatus === 'ready' && (
              filteredOpportunities.map((opp) => {
                const statusInfo = getOpportunityStatusInfo(opp.currentStage, opp.deadline);
                const statusText = statusInfo.primary;

                return (
                  <div 
                    key={opp.id} 
                    onClick={() => onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opp)}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2.5 gap-3">
                      <h3 className="text-[16px] font-bold text-text-main leading-[1.5] line-clamp-2 flex-1 pb-0.5" style={{ wordBreak: 'break-all' }}>
                        {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                        {opp.isMultiBid && (
                          <span className="text-[#0D5EFA] ml-1 text-xs shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                        )}
                      </h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(opp.id);
                        }}
                        className="shrink-0 p-1 active:scale-90 transition-transform -mr-1 -mt-1"
                      >
                        {opp.isStarred ? (
                           <StarFilledIcon className="text-orange-400" />
                        ) : (
                           <StarIcon className="text-gray-300" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="h-5 flex items-center px-1.5 text-[11px] rounded bg-[#E6F4FF] text-[#1677FF]">
                        {(opp.region || '').replace('·', ' ')}
                      </span>
                      {opp.projectType && (
                        <span className={`h-5 flex items-center px-1.5 rounded text-[11px] ${getProjectTypeStyle(opp.projectType)}`}>
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
                            <span key={tag} className={`h-5 flex items-center px-1.5 rounded text-[11px] ${styleClass}`}>
                              {tag}
                            </span>
                          );
                        });
                      })()}
                      <span className={`h-5 flex items-center px-1.5 rounded text-[11px] font-medium border ${PRIMARY_STATUS_STYLES[statusInfo.primary].bg} ${PRIMARY_STATUS_STYLES[statusInfo.primary].text} ${PRIMARY_STATUS_STYLES[statusInfo.primary].border}`}>
                        {statusInfo.primary}
                      </span>
                      {statusInfo.badges.map(b => (
                        <span key={b} className={`h-5 flex items-center px-1.5 rounded text-[10px] font-semibold border ${BADGE_STYLES[b].bg} ${BADGE_STYLES[b].text} ${BADGE_STYLES[b].border}`}>
                          {b}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-50 flex justify-between items-end">
                      <div className="flex flex-col gap-1 items-start">
                        {statusText === '招标中' && (() => {
                          const countdown = getCountdownText(opp.deadline);
                          if (countdown) {
                            return (
                              <span className={`${countdown.isUrgent ? 'text-[#FA8C16] font-medium' : 'text-gray-400 font-normal'} text-[11px] font-sans`}>
                                {countdown.text}
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <div className="text-[16px] font-bold text-[#FF5722] font-numbers leading-none">
                          {opp.amount}
                        </div>
                      </div>
                      
                      <div className="text-[11px] text-gray-400 font-sans tracking-tight whitespace-nowrap">
                        {opp.date}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

          </section>
        </div>
      </main>


    </div>
  );
};

// Helper Star SVGs
const StarFilledIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

const StarIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.045.796.77.398 1.151l-4.181 4.024a.562.562 0 00-.165.509l1.285 5.371c.14.586-.48.985-.921.738l-4.721-2.735a.563.563 0 00-.582 0l-4.721 2.735c-.441.247-1.06-.152-.921-.738l1.285-5.371a.563.563 0 00-.165-.509l-4.181-4.024c-.398-.38-.165-1.105.398-1.151l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);
