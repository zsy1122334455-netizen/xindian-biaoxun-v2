import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Filter, ChevronDown, Plus, Download, ChevronRight, X, RefreshCw, Crown, Lock, Clock } from 'lucide-react';
import { ViewName, Opportunity, UserRole, SubscriptionPlan } from '../types';
import { MOCK_OPPORTUNITIES } from '../constants';
import { ExportDialog } from '../components/ExportDialog';
import { getExportQuota, addTodayExportUsed } from '../utils/exportQuota';
import { VipPromptModal } from '../components/VipPromptModal';
import { REGIONS } from '../src/constants/regions';
import { ANNOUNCEMENT_TYPES } from '../src/constants/announcementTypes';
import { getProjectTypeStyle, getAnnouncementTypeStyle, parseTags, getAmountDisplay, getDeadlineDisplay } from '../utils';
import { QualificationSelector } from '../components/QualificationSelector';
import { getOpportunityStatusInfo, PRIMARY_STATUS_STYLES, BADGE_STYLES, getDaysDiff, getCountdownText } from '../utils/statusUtils';
import { QUALIFICATION_TREE_DATA, QualNode } from '../src/constants/qualifications';
import { IndustrySelector } from '../components/IndustrySelector';
import { INDUSTRY_TREE_DATA, IndustryNode } from '../src/constants/industries';

interface Props {
  onNavigate: (view: ViewName, data?: any) => void;
  onBack: () => void;
  initialQuery?: string;
  opportunities: Opportunity[];
  onToggleStar: (id: string) => void;
  userRole: UserRole;
  subscriptionPlans?: SubscriptionPlan[];
  onAddSubscription?: (plan: Partial<SubscriptionPlan>) => boolean | void;
  vipCities?: string[];
  showToast?: (message: string) => void;
  feedStatusOverride?: 'auto' | 'loading' | 'error' | 'empty' | 'ready';
  listState: any;
  setListState: React.Dispatch<React.SetStateAction<any>>;
  onShowPaymentModal?: (
    sceneId: string, 
    customTitle?: string, 
    customDesc?: string, 
    customBtn?: string, 
    customSecondaryBtn?: string, 
    onSecAction?: () => void,
    onPriAction?: () => void
  ) => void;
  addExportRecord?: (dataType: 'opportunity' | 'enterprise', count: number, status?: 'completed' | 'failed') => void;
  exportStatusOverride?: 'completed' | 'failed';
}

const findQualNodeById = (id: string, nodes: QualNode[]): QualNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findQualNodeById(id, node.children);
      if (found) return found;
    }
  }
  return undefined;
};

const findIndustryNodeByName = (name: string, nodes: IndustryNode[]): IndustryNode | undefined => {
  for (const node of nodes) {
    if (node.name === name) return node;
    if (node.children) {
      const found = findIndustryNodeByName(name, node.children);
      if (found) return found;
    }
  }
  return undefined;
};

const parseRelativeOrAbsoluteDate = (rawDateStr: string): number => {
  if (!rawDateStr) return 0;
  const dateStr = rawDateStr.replace('发布', '').trim();
  if (!dateStr) return 0;
  const now = new Date();
  
  if (dateStr.includes('分钟前')) {
    const min = parseInt(dateStr, 10);
    return isNaN(min) ? now.getTime() : now.getTime() - min * 60 * 1000;
  }
  if (dateStr.includes('小时前') || dateStr.includes('小时')) {
    const hr = parseInt(dateStr.replace('小于', '').trim(), 10);
    return isNaN(hr) ? now.getTime() : now.getTime() - hr * 60 * 60 * 1000;
  }
  if (dateStr.includes('天前')) {
    const day = parseInt(dateStr, 10);
    return isNaN(day) ? now.getTime() : now.getTime() - day * 24 * 60 * 60 * 1000;
  }
  if (dateStr.includes('周前')) {
    const week = parseInt(dateStr, 10);
    return isNaN(week) ? now.getTime() : now.getTime() - week * 7 * 24 * 60 * 60 * 1000;
  }
  if (dateStr.includes('月前')) {
    const month = parseInt(dateStr, 10);
    return isNaN(month) ? now.getTime() : now.getTime() - month * 30 * 24 * 60 * 60 * 1000;
  }
  
  if (dateStr.includes('刚刚') || dateStr.includes('今天')) {
    return now.getTime();
  }
  
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
};



const getFormatDeadline = (deadlineStr?: string) => {
  if (!deadlineStr) return '';
  const val = deadlineStr.trim();
  if (!val) return '';
  const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  return '';
};

const matchRegion = (city: string, region: string): boolean => {
  if (!city || !region) return false;
  
  const removeSuffix = (str: string) => {
    return str
      .replace(/(市|区|县|新区|特别行政区|自治县|自治州|蒙古族自治县|藏族自治县|哈萨克族自治县|彝族自治县|苗族自治县|白族自治县|哈尼族自治县|傣族自治县|傈僳族自治县|佤族自治县|拉祜族自治县|纳西族自治县|景颇族自治县|布朗族自治县|普米族自治县|阿昌族自治县|怒族自治县|独龙族自治县|德昂族自治县|基诺族自治县)$/g, '')
      .replace(/·/g, '')
      .trim();
  };
  
  const cleanCity = removeSuffix(city);
  const cleanRegion = removeSuffix(region);
  
  if (cleanCity && cleanRegion && (cleanRegion.includes(cleanCity) || cleanCity.includes(cleanRegion))) {
    return true;
  }
  return region.includes(city);
};

export const OpportunityList: React.FC<Props> = ({ onNavigate: propOnNavigate, onBack: propOnBack, initialQuery = '', opportunities, onToggleStar, userRole, subscriptionPlans = [], onAddSubscription, vipCities = [], showToast, feedStatusOverride = 'auto', listState, setListState, onShowPaymentModal, addExportRecord, exportStatusOverride }) => {
  const [searchQuery, setSearchQuery] = useState(listState.searchQuery);
  const [localSearchQuery, setLocalSearchQuery] = useState(listState.searchQuery || '');
  const [filteredOpportunities, setFilteredOpportunities] = useState(opportunities);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [isLoading, setIsLoading] = useState(!listState.hasLoadedOnce);
  const [isNetworkError, setIsNetworkError] = useState(false);

  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Lazy bottom scroll loading states
  const [visibleCount, setVisibleCount] = useState(listState.visibleCount);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'noMore' | 'error'>('idle');

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer && scrollContainer.scrollTop <= 2) {
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
      const distance = Math.min(80, Math.pow(diff, 0.85));
      setPullDistance(distance);
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

  const triggerPullToRefresh = () => {
    setIsRefreshing(true);
    setPullDistance(50);
    
    setVisibleCount(8);
    const container = document.getElementById('main-scroll-container') || scrollRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setListState((prev: any) => ({
      ...prev,
      visibleCount: 8,
      scrollTop: 0
    }));
    
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
      
      const refreshMessage = isNetworkError ? '刷新失败，请检查网络' : '最新商机已刷新';
      if (showToast) {
        showToast(refreshMessage);
      } else {
        setToast({ show: true, message: refreshMessage });
        setTimeout(() => setToast({ show: false, message: '' }), 1500);
      }
    }, 1000);
  };

  const loadMoreData = () => {
    setLoadState('loading');
    setTimeout(() => {
      let nextCount = visibleCount + 5;
      setVisibleCount(nextCount);
      if (nextCount >= filteredOpportunities.length) {
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
      if (nextCount >= filteredOpportunities.length) {
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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionName, setSubscriptionName] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>(listState.selectedCities);

  const normalizeCityName = (name: string): string =>
    name.replace(/市|区|县|新区/g, '').trim();

  const isCityAuthorized = (city: string): boolean => {
    if (userRole === UserRole.SVIP) {
      return true;
    }
    if (userRole === UserRole.VIP) {
      if (!vipCities || vipCities.length === 0) {
        return false;
      }
      return vipCities.some(purchased =>
        purchased === city ||
        normalizeCityName(purchased) === normalizeCityName(city)
      );
    }
    return false;
  };

  useEffect(() => {
    if (userRole === UserRole.VIP) {
      setSelectedCities(prev => {
        const filtered = prev.filter(city => isCityAuthorized(city));
        if (filtered.length === prev.length && filtered.every((v, i) => v === prev[i])) {
          return prev;
        }
        return filtered;
      });
    } else if (userRole === UserRole.FREE) {
      setSelectedCities(prev => prev.length === 0 ? prev : []);
    }
  }, [userRole, vipCities]);

  const [expandedProvince, setExpandedProvince] = useState<string>(listState.expandedProvince);
  const [selectedAnnouncementType, setSelectedAnnouncementType] = useState<{ mainType: string, subTypes: string[] }>(listState.selectedAnnouncementType);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(listState.selectedFilters);
  const [customStartTime, setCustomStartTime] = useState<string>(listState.customStartTime);
  const [customEndTime, setCustomEndTime] = useState<string>(listState.customEndTime);
  const [showQualificationSelector, setShowQualificationSelector] = useState(false);
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'deadline' | 'relevance'>(listState.sortBy);
  const [showUnopenedCities, setShowUnopenedCities] = useState(false);
  const [returnToMoreAfterRegionSelect, setReturnToMoreAfterRegionSelect] = useState(false);
  
  const scrollRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const handleTabReselect = (e: CustomEvent) => {
      if (e.detail === ViewName.OPPORTUNITY_LIST) {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Reset all local states to initial values
        setSearchQuery('');
        setLocalSearchQuery('');
        setSelectedCities([]);
        setExpandedProvince('全国');
        setSelectedAnnouncementType({ mainType: '全部', subTypes: [] });
        setSelectedFilters({
          时间: ['不限'],
          业务类型: ['不限'],
          货物类型: ['全部']
        });
        setCustomStartTime('');
        setCustomEndTime('');
        setMoreFilters({
          searchScope: '全文',
          announcementType: '不限',
          industryClassification: ['全部'],
          biddingMethod: ['全部'],
          amountPreset: '不限',
          amountMin: '',
          amountMax: '',
          deadline: '不限',
          deadlineStart: '',
          deadlineEnd: '',
          qualificationIds: [],
          fundingSource: ['全部'],
          excludeKeywords: [],
          excludeScope: '标题'
        });
        setSortBy('latest');
        setVisibleCount(8);
        setLoadState('idle');

        triggerPullToRefresh();
      }
    };
    window.addEventListener('tabReselected', handleTabReselect as EventListener);
    return () => window.removeEventListener('tabReselected', handleTabReselect as EventListener);
  }, []);

  const [moreFilters, setMoreFilters] = useState<{
    searchScope: string;
    announcementType: string;
    biddingMethod: string[];
    deadline: string;
    deadlineStart: string;
    deadlineEnd: string;
    amountPreset?: string;
    amountMin?: string;
    amountMax?: string;
    qualificationIds?: string[];
    fundingSource?: string[];
    industryClassification: string[];
    excludeKeywords?: string[];
    excludeScope?: string;
  }>(listState.moreFilters);

  useEffect(() => {
    if (isSubscriptionModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSubscriptionModalOpen]);

  const MOCK_PROCUREMENTS = [
    {
      id: 'p1',
      title: '中国中医科学院眼科医院骨科耗材采购项目比选结果公示',
      tags: ['采购结果'],
      region: '北京 石景山',
      date: '5分钟前',
      deadline: '2025-09-25 09:30',
      amount: '120万',
      isStarred: false,
      projectType: '医疗耗材'
    },
    {
      id: 'p2',
      title: '政府采购合同货物类-手术显微镜等',
      tags: ['采购合同'],
      region: '北京',
      date: '1小时前',
      deadline: '2025-08-24 14:00',
      amount: '85万',
      isStarred: false,
      projectType: '医疗设备'
    },
    {
      id: 'p3',
      title: '【超思公司】天津超思医疗器械有限责任公司-真空吸板机项目询价采购公告',
      tags: ['采购公告'],
      region: '北京 石景山',
      date: '3小时前',
      deadline: '2025-08-23 17:00',
      amount: '45万',
      isStarred: false,
      hasAttachment: true,
      projectType: '医疗器械'
    }
  ];

  const filters = [
    { label: '地区', type: 'region' },
    { label: '时间', type: 'time' },
    { label: '业务类型', options: ['不限', '工程建设', '政府采购', '土地使用权', '矿业权', '国有产权', '碳排放权', '排污权', '药品采购权', '二类疫苗', '林权', '其他'] },
  ];

  const isFirstMountRef = React.useRef(true);
  const [isSortingTransition, setIsSortingTransition] = useState(false);
  const prevFiltersRef = React.useRef({
    searchQuery,
    selectedCities,
    selectedFilters,
    moreFilters,
    customStartTime,
    customEndTime
  });

  const onNavigate = (view: ViewName, data?: any) => {
    const container = document.getElementById('main-scroll-container') || scrollRef.current;
    const scrollTop = container ? container.scrollTop : 0;
    setListState({
      searchQuery,
      selectedCities,
      expandedProvince,
      selectedAnnouncementType,
      selectedFilters,
      customStartTime,
      customEndTime,
      moreFilters,
      sortBy,
      visibleCount,
      hasLoadedOnce: true,
      scrollTop
    });
    propOnNavigate(view, data);
  };

  const onBack = () => {
    const container = document.getElementById('main-scroll-container') || scrollRef.current;
    const scrollTop = container ? container.scrollTop : 0;
    setListState({
      searchQuery,
      selectedCities,
      expandedProvince,
      selectedAnnouncementType,
      selectedFilters,
      customStartTime,
      customEndTime,
      moreFilters,
      sortBy,
      visibleCount,
      hasLoadedOnce: true,
      scrollTop
    });
    propOnBack();
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

  // Listener for custom debug events
  useEffect(() => {
    const handleDebugSort = (e: CustomEvent) => {
      const sortId = e.detail;
      if (sortId === 'latest' || sortId === 'deadline' || sortId === 'relevance') {
        setSortBy(sortId);
      }
    };
    window.addEventListener('debugSetOppSort', handleDebugSort as EventListener);
    return () => window.removeEventListener('debugSetOppSort', handleDebugSort as EventListener);
  }, []);

  useEffect(() => {
    let result = opportunities;

    // 1. Search Query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      if (moreFilters.searchScope === '标题') {
        result = result.filter(opp => 
          opp.title.toLowerCase().includes(lowerQuery)
        );
      } else {
        result = result.filter(opp => 
          opp.title.toLowerCase().includes(lowerQuery) ||
          opp.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
          opp.region.toLowerCase().includes(lowerQuery) ||
          (opp.ownerName || '').toLowerCase().includes(lowerQuery) ||
          (opp.agencyName || '').toLowerCase().includes(lowerQuery) ||
          (opp.winnerName || '').toLowerCase().includes(lowerQuery)
        );
      }
    }

    // 2. Region Filter
    if (userRole === UserRole.VIP) {
      if (selectedCities.length > 0) {
        result = result.filter(opp => {
          return selectedCities.some(city => matchRegion(city, opp.region));
        });
      }
    } else if (selectedCities.length > 0) {
      result = result.filter(opp => {
        return selectedCities.some(city => matchRegion(city, opp.region));
      });
    }

    // 3. Announcement Type (from moreFilters)
    if (moreFilters.announcementType !== '不限') {
      result = result.filter(opp => opp.tags.includes(moreFilters.announcementType));
    }

    // 3.5 Industry Classification (from moreFilters)
    if (moreFilters.industryClassification && moreFilters.industryClassification.length > 0 && !moreFilters.industryClassification.includes('全部')) {
      result = result.filter(opp => moreFilters.industryClassification.some(industry => opp.tags.includes(industry)));
    }

    // 4. Bidding Method (from moreFilters)
    if (moreFilters.biddingMethod && moreFilters.biddingMethod.length > 0 && !moreFilters.biddingMethod.includes('全部')) {
      result = result.filter(opp => moreFilters.biddingMethod.some(method => opp.tags.includes(method)));
    }

    // 5. Funding Source (from moreFilters)
    if (moreFilters.fundingSource && moreFilters.fundingSource.length > 0 && !moreFilters.fundingSource.includes('全部')) {
      result = result.filter(opp => moreFilters.fundingSource!.some(source => opp.tags.includes(source)));
    }

    // 6. Selected Filters (Project Type, Service Type, Goods Type)
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (key !== '时间' && values.length > 0 && !values.includes('全部') && !values.includes('不限')) {
        if (key === '业务类型') {
          result = result.filter(opp => values.some(val => opp.projectType === val));
        } else {
          result = result.filter(opp => values.some(val => opp.tags.includes(val)));
        }
      }
    });

    // 7. Exclude Keywords
    if (moreFilters.excludeKeywords && moreFilters.excludeKeywords.length > 0) {
      result = result.filter(opp => {
        const textToSearch = moreFilters.excludeScope === '标题' ? opp.title : opp.title + ' ' + opp.tags.join(' ');
        return !moreFilters.excludeKeywords!.some(keyword => textToSearch.includes(keyword));
      });
    }

    // 7.5 Time Filter
    const timeFilterVal = selectedFilters['时间']?.[0];
    if (timeFilterVal && timeFilterVal !== '不限') {
      const now = new Date();
      if (timeFilterVal === '今天') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        result = result.filter(opp => {
          const dateVal = parseRelativeOrAbsoluteDate(opp.date);
          return dateVal >= startOfToday.getTime() && dateVal <= endOfToday.getTime();
        });
      } else if (timeFilterVal.startsWith('近')) {
        let days = 0;
        if (timeFilterVal === '近1年') {
          days = 365;
        } else {
          days = parseInt(timeFilterVal.replace('近', '').replace('天', ''), 10);
        }
        if (!isNaN(days) && days > 0) {
          const cutoffTime = now.getTime() - days * 24 * 60 * 60 * 1000;
          result = result.filter(opp => {
            const dateVal = parseRelativeOrAbsoluteDate(opp.date);
            return dateVal >= cutoffTime;
          });
        }
      } else if (timeFilterVal === '自定义') {
        if (customStartTime && customEndTime) {
          const startParts = customStartTime.split('-');
          const endParts = customEndTime.split('-');
          const start = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);
          const end = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 23, 59, 59, 999);
          if (start.getTime() <= end.getTime()) {
            result = result.filter(opp => {
              const dateVal = parseRelativeOrAbsoluteDate(opp.date);
              return dateVal >= start.getTime() && dateVal <= end.getTime();
            });
          }
        }
      }
    }

    // 7.6 Project Amount Filter
    const parseAmount = (amountStr: string): number => {
      if (!amountStr) return 0;
      let cleaned = amountStr.replace(/,/g, '').trim();
      if (cleaned.includes('亿')) {
        const parts = cleaned.split('亿');
        const yiPart = parseFloat(parts[0]) || 0;
        let wanPart = 0;
        if (parts[1] && parts[1].includes('万')) {
          wanPart = parseFloat(parts[1].replace('万', '')) || 0;
        }
        return yiPart * 10000 + wanPart;
      }
      cleaned = cleaned.replace(/万/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    if (moreFilters.amountPreset && moreFilters.amountPreset !== '不限') {
      if (moreFilters.amountPreset === '<100万') {
        result = result.filter(opp => parseAmount(opp.amount) < 100);
      } else if (moreFilters.amountPreset === '100-500万') {
        result = result.filter(opp => {
          const amt = parseAmount(opp.amount);
          return amt >= 100 && amt <= 500;
        });
      } else if (moreFilters.amountPreset === '>500万') {
        result = result.filter(opp => parseAmount(opp.amount) > 500);
      }
    } else {
      const minStr = moreFilters.amountMin?.trim();
      const maxStr = moreFilters.amountMax?.trim();
      if (minStr || maxStr) {
        const minVal = minStr ? parseFloat(minStr) : NaN;
        const maxVal = maxStr ? parseFloat(maxStr) : NaN;
        result = result.filter(opp => {
          const amt = parseAmount(opp.amount);
          if (!isNaN(minVal) && amt < minVal) {
            return false;
          }
          if (!isNaN(maxVal) && amt > maxVal) {
            return false;
          }
          return true;
        });
      }
    }

    // 7.7 Bidding Deadline Filter
    const nowTime = Date.now();
    const deadlineVal = moreFilters.deadline;
    if (deadlineVal && deadlineVal !== '不限') {
      if (deadlineVal === '自定义') {
        if (moreFilters.deadlineStart && moreFilters.deadlineEnd) {
          const startParts = moreFilters.deadlineStart.split('-');
          const endParts = moreFilters.deadlineEnd.split('-');
          const startFull = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0).getTime();
          const endFull = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 23, 59, 59, 999).getTime();
          
          if (startFull <= endFull) {
            result = result.filter(opp => {
              if (!opp.deadline) return false;
              const t = Date.parse(opp.deadline);
              if (isNaN(t)) return false;
              return t >= startFull && t <= endFull;
            });
          }
        }
      } else {
        let days = 0;
        if (deadlineVal === '近3天') days = 3;
        else if (deadlineVal === '近10天') days = 10;
        else if (deadlineVal === '近1月') days = 30;
        else if (deadlineVal === '近3月') days = 90;

        if (days > 0) {
          const maxFutureTime = nowTime + days * 24 * 60 * 60 * 1000;
          result = result.filter(opp => {
            if (!opp.deadline) return false;
            const t = Date.parse(opp.deadline);
            if (isNaN(t)) return false;
            return t >= nowTime && t <= maxFutureTime;
          });
        }
      }
    }

    // 8. Dynamic Sorting based on sortBy state
    if (sortBy === 'latest') {
      result = [...result].sort((a, b) => {
        return parseRelativeOrAbsoluteDate(b.date) - parseRelativeOrAbsoluteDate(a.date);
      });
    } else if (sortBy === 'deadline') {
      result = [...result].sort((a, b) => {
        const valA = a.deadline ? Date.parse(a.deadline) : Infinity;
        const valB = b.deadline ? Date.parse(b.deadline) : Infinity;
        const scoreA = isNaN(valA) ? Infinity : valA;
        const scoreB = isNaN(valB) ? Infinity : valB;
        return scoreA - scoreB;
      });
    } else if (sortBy === 'relevance') {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const getScore = (opp: Opportunity) => {
          let score = 0;
          const title = opp.title.toLowerCase();
          if (title === query) score += 200;
          else if (title.startsWith(query)) score += 100;
          else if (title.includes(query)) score += 50;
          
          if (moreFilters.searchScope !== '标题') {
            opp.tags.forEach(tag => {
              if (tag.toLowerCase().includes(query)) score += 30;
            });
            if (opp.region.toLowerCase().includes(query)) score += 10;
            if ((opp.ownerName || '').toLowerCase().includes(query)) score += 40;
            if ((opp.agencyName || '').toLowerCase().includes(query)) score += 20;
            if ((opp.winnerName || '').toLowerCase().includes(query)) score += 20;
          }
          return score;
        };
        result = [...result].sort((a, b) => getScore(b) - getScore(a));
      } else {
        // Fallback to latest when no search query is active
        result = [...result].sort((a, b) => {
          return parseRelativeOrAbsoluteDate(b.date) - parseRelativeOrAbsoluteDate(a.date);
        });
      }
    }

    setFilteredOpportunities(result);

    if (!listState.hasLoadedOnce) {
      // During cold loading phase, only update the filtered result, do nothing else
      return;
    }

    if (isFirstMountRef.current && listState.hasLoadedOnce) {
      setIsLoading(false);
      setVisibleCount(listState.visibleCount);
      setLoadState(result.length <= listState.visibleCount ? 'noMore' : 'idle');
      isFirstMountRef.current = false;
      prevFiltersRef.current = {
        searchQuery,
        selectedCities,
        selectedFilters,
        moreFilters,
        customStartTime,
        customEndTime
      };
    } else {
      // Subsequent filter/sorting changes
      const isFiltersChanged = 
        prevFiltersRef.current.searchQuery !== searchQuery ||
        JSON.stringify(prevFiltersRef.current.selectedCities) !== JSON.stringify(selectedCities) ||
        JSON.stringify(prevFiltersRef.current.selectedFilters) !== JSON.stringify(selectedFilters) ||
        JSON.stringify(prevFiltersRef.current.moreFilters) !== JSON.stringify(moreFilters) ||
        prevFiltersRef.current.customStartTime !== customStartTime ||
        prevFiltersRef.current.customEndTime !== customEndTime;

      if (!isFiltersChanged) {
        // Pure sort change: 300ms light transition feedback instead of full skeleton
        setIsLoading(false);
        setVisibleCount(8);
        setLoadState(result.length <= 8 ? 'noMore' : 'idle');
        isFirstMountRef.current = false;

        setIsSortingTransition(true);
        const timer = setTimeout(() => {
          setIsSortingTransition(false);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        // Filter changes: full skeleton screen loading transition
        setIsLoading(true);
        setVisibleCount(8);
        setLoadState(result.length <= 8 ? 'noMore' : 'idle');
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 450);
        isFirstMountRef.current = false;

        prevFiltersRef.current = {
          searchQuery,
          selectedCities,
          selectedFilters,
          moreFilters,
          customStartTime,
          customEndTime
        };
        return () => clearTimeout(timer);
      }
    }

    prevFiltersRef.current = {
      searchQuery,
      selectedCities,
      selectedFilters,
      moreFilters,
      customStartTime,
      customEndTime
    };
  }, [searchQuery, opportunities, selectedCities, selectedFilters, moreFilters, customStartTime, customEndTime, sortBy]);

  const handleSearch = (query: string) => {
    if (query.toLowerCase() === 'error' || query === '加载失败' || query === '网络失败') {
      setIsNetworkError(true);
    } else {
      setIsNetworkError(false);
    }
    setSearchQuery(query);
  };

  const handleExport = (count: number) => {
    // Mock export logic
    setToast({ show: true, message: `成功导出 ${count} 条数据` });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };



  // Unified debug status (shared with Home via the dev panel's feedStatusOverride)
  const showSkeleton = feedStatusOverride === 'loading' || isLoading || isLoadingFeed;
  const showError = feedStatusOverride === 'error' || isNetworkError;
  const showEmptyOverride = feedStatusOverride === 'empty';

  const isVipMoreFilterLocked = userRole === UserRole.VIP && selectedCities.length === 0;

  const hasActiveMoreFilters = (() => {
    if (moreFilters.announcementType !== '不限') return true;

    const indList = moreFilters.industryClassification || [];
    const isIndDefault = indList.length === 1 && indList[0] === '全部';
    if (indList.length > 0 && !isIndDefault) return true;

    const bidList = moreFilters.biddingMethod || [];
    const isBidDefault = bidList.length === 1 && bidList[0] === '全部';
    if (bidList.length > 0 && !isBidDefault) return true;

    if (moreFilters.amountPreset !== '不限' && moreFilters.amountPreset !== '') return true;
    if (moreFilters.amountMin && moreFilters.amountMin.trim() !== '') return true;
    if (moreFilters.amountMax && moreFilters.amountMax.trim() !== '') return true;

    if (moreFilters.deadline !== '不限' && moreFilters.deadline !== '') return true;
    if (moreFilters.deadlineStart && moreFilters.deadlineStart.trim() !== '') return true;
    if (moreFilters.deadlineEnd && moreFilters.deadlineEnd.trim() !== '') return true;

    if (moreFilters.qualificationIds && moreFilters.qualificationIds.length > 0) return true;

    const fundList = moreFilters.fundingSource || [];
    const isFundDefault = fundList.length === 1 && fundList[0] === '全部';
    if (fundList.length > 0 && !isFundDefault) return true;

    if (moreFilters.excludeKeywords && moreFilters.excludeKeywords.length > 0) return true;

    return false;
  })();

  const getFilterCounts = () => {
    const regionCount = selectedCities.length > 0 ? 1 : 0;
    const timeCount = (selectedFilters['时间'] && selectedFilters['时间'][0] !== '不限') ? 1 : 0;
    const bizTypeCount = (selectedFilters['业务类型'] && selectedFilters['业务类型'][0] !== '不限') ? 1 : 0;

    let moreCount = 0;
    if (moreFilters.announcementType !== '不限') moreCount += 1;
    
    const indList = moreFilters.industryClassification || [];
    if (!indList.includes('全部')) moreCount += 1;

    const bidList = moreFilters.biddingMethod || [];
    if (!bidList.includes('全部')) moreCount += 1;

    if (moreFilters.amountPreset !== '不限' || (moreFilters.amountMin && moreFilters.amountMin.trim() !== '') || (moreFilters.amountMax && moreFilters.amountMax.trim() !== '')) {
      moreCount += 1;
    }

    if (moreFilters.deadline !== '不限') moreCount += 1;

    if (moreFilters.qualificationIds && moreFilters.qualificationIds.length > 0) moreCount += 1;

    const fundList = moreFilters.fundingSource || [];
    if (!fundList.includes('全部')) moreCount += 1;

    if (moreFilters.excludeKeywords && moreFilters.excludeKeywords.length > 0) moreCount += 1;

    return {
      regionCount,
      timeCount,
      bizTypeCount,
      moreCount,
      totalCount: regionCount + timeCount + bizTypeCount + moreCount
    };
  };

  const filterCounts = getFilterCounts();
  const isSearchActive = searchQuery.trim() !== '';
  const isFilterActiveAny = filterCounts.totalCount >= 1;

  const clearAllFilters = () => {
    setSelectedCities(prev => prev.length === 0 ? prev : []);
    setExpandedProvince('全国');
    setSelectedAnnouncementType({ mainType: '全部', subTypes: [] });
    setSelectedFilters({
      时间: ['不限'],
      业务类型: ['不限'],
      货物类型: ['全部']
    });
    setCustomStartTime('');
    setCustomEndTime('');
    setMoreFilters({
      searchScope: '全文',
      announcementType: '不限',
      industryClassification: ['全部'],
      biddingMethod: ['全部'],
      amountPreset: '不限',
      amountMin: '',
      amountMax: '',
      deadline: '不限',
      deadlineStart: '',
      deadlineEnd: '',
      qualificationIds: [],
      fundingSource: ['全部'],
      excludeKeywords: [],
      excludeScope: '标题'
    });
    setActiveFilter(null);
    setVisibleCount(8);
    const container = document.getElementById('main-scroll-container') || scrollRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  };

  const handleAddToSubscription = () => {
    if (isVipMoreFilterLocked) {
      setToast({ show: true, message: '请选择已购地市后再加入订阅，或升级 SVIP 筛全国' });
      setTimeout(() => setToast({ show: false, message: '' }), 2500);
      return;
    }
    if (userRole === UserRole.FREE && subscriptionPlans && subscriptionPlans.length >= 1) {
      onNavigate(ViewName.ADD_SUBSCRIPTION);
    } else {
      setIsSubscriptionModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-page font-sans">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-5 py-3 rounded-xl text-[14px] z-[110] animate-fade-in text-center whitespace-pre-line leading-relaxed shadow-2xl backdrop-blur-sm">
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white z-20 shrink-0">
        <div className="bg-gradient-to-r from-[#3B7BFF] to-[#6B9DFF] pt-safe-top pb-3">
          <div className="flex items-center justify-center h-12 px-4 relative">
            <h1 className="text-[20px] font-semibold text-white text-center absolute left-1/2 -translate-x-1/2 whitespace-nowrap">查商机</h1>
          </div>
          
          {/* Search Input */}
          <div className="px-[16px] flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input 
                className="block w-full h-[40px] pl-10 pr-10 text-sm bg-white border-none rounded-lg focus:ring-1 focus:ring-white placeholder-gray-400 outline-none shadow-sm" 
                placeholder="请输入关键词" 
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
          <div className="flex px-2 py-3 items-center bg-white border-b border-gray-50 shadow-sm gap-1">
            <div className="flex flex-1 items-center gap-1 min-w-0 pr-2">
              {filters.map((filter) => {
                let displayText = filter.label;
                const isAllVipCities = filter.label === '地区' && 
                                       userRole === UserRole.VIP && 
                                       vipCities.length > 0 && 
                                       selectedCities.length === vipCities.length &&
                                       selectedCities.every(c => vipCities.includes(c));

                if (filter.label === '地区') {
                  if (selectedCities.length === 0) {
                    displayText = '全国';
                  } else if (selectedCities.length === 1) {
                    displayText = selectedCities[0];
                  } else {
                    if (isAllVipCities) {
                      displayText = '已购地市';
                    } else {
                      displayText = '地区';
                    }
                  }
                } else {
                  const selected = selectedFilters[filter.label];
                  if (selected && selected.length > 0 && selected[0] !== '不限' && selected[0] !== '全部') {
                    displayText = selected.join(',');
                  }
                }
                
                const isFilterActive = (() => {
                  if (filter.label === '地区') return selectedCities.length > 0;
                  if (filter.label === '时间') return selectedFilters['时间'] && selectedFilters['时间'][0] !== '不限';
                  if (filter.label === '业务类型') return selectedFilters['业务类型'] && selectedFilters['业务类型'][0] !== '不限';
                  return false;
                })();
                const isActive = activeFilter === filter.label || isFilterActive;
                const isRegionFilter = filter.label === '地区';
                const isFree = userRole === UserRole.FREE;

                // Only show badge for multi-selected region (when not all VIP cities)
                const showBadge = filter.label === '地区' && selectedCities.length > 1 && !isAllVipCities;
                const badgeCount = selectedCities.length;
                
                return (
                  <button 
                    key={filter.label} 
                    className={`flex items-center justify-center gap-1.5 flex-1 min-w-0 px-2 py-1.5 rounded-lg transition-colors border ${
                      isActive 
                        ? 'text-primary bg-primary/5 border-primary/20 font-semibold' 
                        : 'text-gray-500 bg-gray-50 border-transparent active:bg-gray-100 font-normal'
                    }`}
                    onClick={() => {
                      if (filter.label === '地区') {
                        if (userRole === UserRole.FREE) {
                          onShowPaymentModal?.(
                            'REGION_FILTER',
                            '开通会员后可使用筛选',
                            '开通 VIP 后可筛选已购地市，升级 SVIP 可全国范围精确筛选。',
                            '开通会员',
                            '暂不使用'
                          );
                          return;
                        }
                        setReturnToMoreAfterRegionSelect(false);
                      }
                      setActiveFilter(activeFilter === filter.label ? null : filter.label);
                    }}
                  >
                    {isRegionFilter && !isFree && (userRole === UserRole.SVIP ? <Crown size={12} className="text-purple-500 fill-purple-400 shrink-0" /> : <Crown size={12} className="text-amber-500 fill-amber-400 shrink-0" />)}
                    <span className="text-[13px] truncate">{displayText}</span>
                    {showBadge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E6F7FF] text-[#1677FF] rounded-md leading-none shrink-0 border border-[#B3E1FF]/30 select-none">
                        {badgeCount}
                      </span>
                    )}
                    <ChevronDown size={12} className={`shrink-0 transition-transform ${activeFilter === filter.label ? 'rotate-180 text-primary' : (isActive ? 'text-primary' : 'text-gray-400')}`} />
                  </button>
                );
              })}
            </div>
            <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>
            <button 
              className={`relative flex-shrink-0 flex items-center justify-center gap-1.5 h-8 rounded-lg transition-colors px-2.5 border ${
                (activeFilter === '更多' || filterCounts.moreCount >= 1)
                  ? 'text-primary bg-primary/5 border-primary/20 font-semibold' 
                  : 'text-gray-500 bg-gray-50 border-transparent active:bg-gray-100 font-normal'
              }`}
              onClick={() => {
                if (userRole === UserRole.FREE) {
                  onShowPaymentModal?.(
                    'MORE_FILTER',
                    '开通会员后可使用筛选',
                    '开通 VIP 后可筛选已购地市，升级 SVIP 可全国范围精确筛选。',
                    '开通会员',
                    '暂不使用'
                  );
                  return;
                }
                if (userRole === UserRole.VIP && selectedCities.length === 0) {
                  onShowPaymentModal?.(
                    'REGION_FILTER_VIP_MORE',
                    '请先选择已购地市',
                    '当前为全国浏览，VIP 高级筛选需在已购地市内使用。你可以先选择已购地市，或升级 SVIP 解锁全国筛选。',
                    '选择已购地市',
                    '升级 SVIP',
                    () => {
                      onNavigate(ViewName.MEMBER_CENTER, { initialTab: 'svip' });
                    },
                    () => {
                      setActiveFilter('地区');
                    }
                  );
                  return;
                }
                setActiveFilter(activeFilter === '更多' ? null : '更多');
              }}
            >
              <Filter size={14} className="shrink-0" />
              <span className="text-[12px] font-medium shrink-0">更多</span>
              {filterCounts.moreCount >= 1 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E6F7FF] text-[#1677FF] rounded-md leading-none shrink-0 border border-[#B3E1FF]/30">
                  {filterCounts.moreCount}
                </span>
              )}
            </button>
          </div>

          {activeFilter && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2">
              {activeFilter === '地区' ? (
                (() => {
                  return (
                    <div className="flex flex-col bg-white transition-all duration-200 h-[380px]">
                      {/* Notice Banner */}
                      {userRole === UserRole.FREE && (
                        <div className="bg-[#FFFDF5] px-4 py-2 flex items-center justify-between text-xs text-[#B8860B] border-b border-[#FFF8E6] shrink-0 select-none">
                          <div className="flex items-center gap-1.5 font-sans">
                            <Crown size={13} className="text-amber-600 fill-amber-500 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-semibold text-amber-800">未开通地区精确筛选权限</span>
                              <span className="text-[10px] text-gray-500">开通 VIP 后可筛选已购地市，升级 SVIP 可全国筛选</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveFilter(null);
                              onNavigate(ViewName.MEMBER_CENTER, { initialTab: 'vip' });
                            }}
                            className="text-[#1677FF] hover:underline font-bold text-[11px] flex items-center gap-0.5 cursor-pointer font-sans shrink-0 ml-2"
                          >
                            立即开通 {'>'}
                          </button>
                        </div>
                      )}

                      {userRole === UserRole.VIP && (
                        <>
                          <div className="bg-[#f0f7ff] h-9 px-3 flex items-center justify-between text-[11px] text-[#1677FF] border-[#f0f7ff] border-b shrink-0 select-none font-sans">
                            <div className="flex items-center gap-1 font-semibold text-blue-800 min-w-0">
                              <Crown size={11} className="text-[#1677FF] fill-[#1677FF]/20 shrink-0" />
                              <span className="truncate">VIP 可全国浏览，精确筛选仅限已购地市</span>
                            </div>
                            <button 
                              onClick={() => {
                                setActiveFilter(null);
                                onNavigate(ViewName.MEMBER_CENTER, {
                                  initialTab: 'svip',
                                  initialPlanId: 'svip_annual',
                                  upgradeType: 'vip_to_svip_annual'
                                });
                              }}
                              className="text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-[1px] cursor-pointer shrink-0 ml-1.5 text-[10.5px] whitespace-nowrap"
                            >
                              <span>升级 SVIP 全国筛选</span>
                              <span className="text-[9px] translate-y-[0.5px]">&gt;</span>
                            </button>
                          </div>

                          {returnToMoreAfterRegionSelect && (
                            <div className="bg-amber-50/70 h-8 px-4 flex items-center text-[11px] text-amber-800 border-b border-amber-200/20 shrink-0 select-none font-sans font-medium gap-1.5 scrollbar-none">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0"></span>
                              <span>选择已购地市后，将继续设置更多筛选</span>
                            </div>
                          )}

                          {/* VIP 已购快捷 Row */}
                          <div className="flex items-center gap-1.5 h-8 px-4 bg-blue-50/5 border-b border-gray-100/80 shrink-0 font-sans text-xs select-none overflow-x-auto scrollbar-none">
                            <span className="text-gray-500 font-bold shrink-0 text-[10px]">已购地市</span>
                            {vipCities && vipCities.length > 0 ? (
                              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                                {vipCities.map(city => {
                                  const isSelected = selectedCities.includes(city);
                                  return (
                                    <button
                                      key={city}
                                      onClick={() => {
                                        // Find corresponding province in REGIONS
                                        const provObj = REGIONS.find(r => 
                                          r.cities.some(c => c === city || normalizeCityName(c) === normalizeCityName(city))
                                        );
                                        if (provObj) {
                                          const provName = provObj.name;
                                          const matchedCity = provObj.cities.find(c => 
                                            c === city || normalizeCityName(c) === normalizeCityName(city)
                                          ) || city;
                                          
                                          // 1. switch province
                                          setExpandedProvince(provName);
                                          
                                          // 2. select it if not already selected (never uncheck via shortcut click)
                                          if (!selectedCities.includes(matchedCity)) {
                                            setSelectedCities(prev => [...prev, matchedCity]);
                                          }
                                          
                                          // 3. scroll to corresponding right item
                                          setTimeout(() => {
                                            const el = document.getElementById(`city-btn-${matchedCity}`);
                                            if (el) {
                                              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                            }
                                          }, 100);
                                        }
                                      }}
                                      className={`flex items-center gap-1 px-2 h-5.5 rounded-md text-[10px] font-bold transition-all shrink-0 border ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-3xs'
                                          : 'bg-blue-50/30 border-blue-200/50 text-blue-600 hover:bg-blue-100/40'
                                      }`}
                                    >
                                      {isSelected && (
                                        <svg width="6" height="6" viewBox="0 0 12 12" fill="none" className="shrink-0">
                                          <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                      <span>{city}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400 py-0.5">
                                暂无已购地市，请前往会员中心添加
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {userRole === UserRole.SVIP && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-2 flex items-center justify-between text-xs text-purple-800 border-b border-purple-200/50 shrink-0 select-none font-sans">
                          <div className="flex items-center gap-1 font-sans">
                            <Crown size={12} className="text-purple-600 fill-purple-400 shrink-0" />
                            <span className="font-semibold">👑 SVIP 可全国范围精确筛选</span>
                          </div>
                          <span className="font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded text-[10px] scale-90 origin-right shrink-0">
                            已选 {selectedCities.length === 0 ? '全国' : `${selectedCities.length}个地市`}
                          </span>
                        </div>
                      )}

                      {/* Split selector area */}
                      <div className="flex flex-1 min-h-0 overflow-hidden">
                        {/* Left Column: Provinces */}
                        <div className="w-1/3 bg-[#F7F8FA] overflow-y-auto">
                          <button 
                            className={`w-full text-center px-4 py-3 text-[14px] transition-colors ${expandedProvince === '全国' ? 'bg-white text-primary font-semibold' : 'text-gray-600 hover:bg-gray-100/50'}`}
                            onClick={() => {
                              setExpandedProvince('全国');
                            }}
                          >
                            全国
                          </button>
                          {REGIONS.map(r => (
                            <button 
                              key={r.name}
                              className={`w-full text-center px-4 py-3 text-[14px] transition-colors ${expandedProvince === r.name ? 'bg-white text-primary font-semibold' : 'text-gray-600 hover:bg-gray-100/50'}`}
                              onClick={() => setExpandedProvince(r.name)}
                            >
                              {r.name}
                            </button>
                          ))}
                        </div>

                        {/* Right Column: Cities */}
                        <div className="w-2/3 overflow-y-auto bg-white p-3 space-y-2">
                          {expandedProvince === '全国' ? (
                            <button 
                              className={`w-full text-left px-4 py-3 rounded-xl border text-[14px] flex justify-between items-center transition-all ${
                                selectedCities.length === 0 
                                  ? 'bg-blue-50/50 border-blue-200 text-blue-700 font-medium' 
                                  : 'border-gray-150 text-gray-700 hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                if (userRole === UserRole.FREE) {
                                  onShowPaymentModal?.(
                                    'REGION_FILTER',
                                    '开通会员后可使用筛选',
                                    '开通 VIP 后可筛选已购地市，升级 SVIP 可全国范围精确筛选。',
                                    '开通会员',
                                    '暂不使用'
                                  );
                                  return;
                                }
                                setSelectedCities([]);
                              }}
                            >
                              <span>全国 / 不限地区</span>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${selectedCities.length === 0 ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                                {selectedCities.length === 0 && (
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                            </button>
                          ) : (
                            <div className="space-y-2">
                              {REGIONS.find(r => r.name === expandedProvince)?.cities.map(city => {
                                const isSelected = selectedCities.includes(city);
                                
                                if (userRole === UserRole.FREE) {
                                  return (
                                    <button 
                                      key={city}
                                      id={`city-btn-${city}`}
                                      className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-150 bg-gray-50/20 text-gray-400 text-[13px] flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all font-sans"
                                      onClick={() => onShowPaymentModal?.(
                                        'REGION_FILTER',
                                        '开通会员后可使用筛选',
                                        '开通 VIP 后可筛选已购地市，升级 SVIP 可全国范围精确筛选。',
                                        '开通会员',
                                        '暂不使用'
                                      )}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Lock size={12} className="text-gray-300 shrink-0" />
                                        <span className="truncate">{city}</span>
                                      </div>
                                      <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200/40 px-1.5 py-0.5 rounded-md scale-95 shrink-0 font-medium font-sans">VIP专属</span>
                                    </button>
                                  );
                                }
                                
                                if (userRole === UserRole.VIP) {
                                  const isAuth = isCityAuthorized(city);
                                  if (isAuth) {
                                    return (
                                      <button 
                                        key={city}
                                        id={`city-btn-${city}`}
                                        className={`w-full text-left px-4 py-2 rounded-xl border text-[13px] flex justify-between items-center transition-all ${
                                          isSelected 
                                            ? 'bg-blue-50/50 border-blue-500/80 text-blue-900 font-semibold' 
                                            : 'bg-white border-gray-150 text-gray-700 hover:bg-gray-50'
                                        }`}
                                        onClick={() => {
                                          const isAlreadySelected = selectedCities.includes(city);
                                          const newCities = isAlreadySelected
                                            ? selectedCities.filter(c => c !== city)
                                            : [...selectedCities, city];
                                          setSelectedCities(newCities);
                                        }}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-white transition-colors shrink-0 ${
                                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                          }`}>
                                            {isSelected && (
                                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                          <span className="truncate">{city}</span>
                                        </div>
                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded scale-90 origin-right shrink-0">已购</span>
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <button 
                                        key={city}
                                        id={`city-btn-${city}`}
                                        className="w-full text-left px-4 py-2 rounded-xl border border-gray-100/85 bg-gray-50/40 text-gray-400 text-[13px] flex justify-between items-center cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all font-sans"
                                        onClick={() => onShowPaymentModal?.(
                                          'REGION_FILTER_VIP',
                                          '该地区暂未开通筛选权限',
                                          '升级 SVIP 后可全国范围精确筛选，当前 VIP 用户升级仅需补差价',
                                          '升级 SVIP',
                                          '暂不升级',
                                          () => {},
                                          () => {
                                            onNavigate(ViewName.MEMBER_CENTER, { initialTab: 'svip' });
                                          }
                                        )}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <Lock size={12} className="text-gray-300 shrink-0" />
                                          <span className="truncate text-gray-400">{city}</span>
                                        </div>
                                        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md scale-90 shrink-0">未开通</span>
                                      </button>
                                    );
                                  }
                                }

                                // SVIP
                                return (
                                  <button 
                                    key={city}
                                    id={`city-btn-${city}`}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-[13px] flex justify-between items-center transition-all ${
                                      isSelected 
                                        ? 'bg-purple-50/50 border-purple-500/80 text-purple-900 font-semibold shadow-xs' 
                                        : 'bg-white border-gray-150 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => {
                                      const isAlreadySelected = selectedCities.includes(city);
                                      const newCities = isAlreadySelected
                                        ? selectedCities.filter(c => c !== city)
                                        : [...selectedCities, city];
                                      setSelectedCities(newCities);
                                    }}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-white transition-colors shrink-0 ${
                                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                                      }`}>
                                        {isSelected && (
                                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                      <span className="truncate">{city}</span>
                                    </div>
                                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded scale-90 origin-right shrink-0">SVIP特权</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Bar */}
                      <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2 shrink-0">
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[12px] text-gray-500">
                          <span className="shrink-0 font-medium">已选择：</span>
                          {selectedCities.length === 0 ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">全国 / 不限地区</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-nowrap font-sans">
                              {selectedCities.map(city => (
                                <div key={city} className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-700 whitespace-nowrap">
                                  <span>{city}</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (userRole === UserRole.FREE) {
                                        onShowPaymentModal?.(
                                          'REGION_FILTER',
                                          '开通会员后可使用筛选',
                                          '开通 VIP 后可筛选已购地市，升级 SVIP 可全国范围精确筛选。',
                                          '开通会员',
                                          '暂不使用'
                                        );
                                        return;
                                      }
                                      setSelectedCities(selectedCities.filter(c => c !== city));
                                    }}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-150 border border-gray-150 text-gray-600 rounded-lg text-[13px] font-medium transition-colors"
                            onClick={() => {
                              if (userRole === UserRole.FREE) {
                                onShowPaymentModal?.(
                                  'REGION_FILTER',
                                  '开通会员后可使用筛选',
                                  '开通 VIP 后可筛选已购地市，升级 SVIP 可全国范围精确筛选。',
                                  '开通会员',
                                  '暂不使用'
                                );
                                return;
                              }
                              setSelectedCities([]);
                              setExpandedProvince('全国');
                            }}
                          >
                            清空地区
                          </button>
                          <button 
                            className="flex-1 py-1.5 bg-[#1677FF] hover:bg-[#4096ff] active:bg-[#0958d9] text-white rounded-lg text-[13px] font-medium transition-colors shadow-xs"
                            onClick={() => {
                              if (userRole === UserRole.FREE) {
                                onShowPaymentModal?.(
                                  'REGION_FILTER',
                                  '开通会员后可使用筛选',
                                  '开通 VIP 后可筛选已购地市，升级 SVIP 可全国范围精确筛选。',
                                  '开通会员',
                                  '暂不使用'
                                );
                                return;
                              }
                              if (returnToMoreAfterRegionSelect) {
                                setReturnToMoreAfterRegionSelect(false);
                                setActiveFilter('更多');
                              } else {
                                setActiveFilter(null);
                              }
                            }}
                          >
                            {returnToMoreAfterRegionSelect ? '继续筛选' : '确定'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                        })()
                      ) : activeFilter === '更多' ? (
                <div className="flex flex-col bg-white h-[calc(100vh-250px)] max-h-[580px] sm:h-[480px]">
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-20 space-y-6 scrollbar-none">
                    {/* 1. 当前范围提示 */}
                    <div className="border-b border-gray-100 pb-5">
                      {isVipMoreFilterLocked ? (
                        <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3.5 flex flex-col gap-3 select-none font-sans">
                          <div className="flex flex-col gap-1">
                            <div className="text-[13px] font-bold text-amber-900 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                              <span>当前为全国浏览，VIP 高级筛选需先选择已购地市</span>
                            </div>
                            <div className="text-[11.5px] text-amber-700 font-medium leading-relaxed font-sans">
                              VIP 可浏览全国商机，但高级筛选权限仅对已购地市生效。请选择区域后继续进行高级筛选，或直接升级 SVIP 解锁全国范围精确筛选。
                            </div>
                          </div>
                          <div className="flex gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setReturnToMoreAfterRegionSelect(true);
                                setActiveFilter('地区');
                              }}
                              className="flex-1 h-[32px] rounded-lg text-[11.5px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918M21 7.5a9 9 0 0 0-18 0" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span>选择已购地市</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onNavigate(ViewName.MEMBER_CENTER, { initialTab: 'svip' });
                              }}
                              className="flex-1 h-[32px] rounded-lg text-[11.5px] font-bold bg-[#7C3AED] hover:bg-purple-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                            >
                              <Crown size={12} className="text-white shrink-0" />
                              <span>升级 SVIP</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`border rounded-xl p-3 flex flex-col gap-1 select-none font-sans ${userRole === UserRole.SVIP ? 'bg-purple-50/50 border-purple-100/60' : 'bg-blue-50/50 border-blue-100/60'}`}>
                          {userRole === UserRole.SVIP ? (
                            selectedCities.length === 0 ? (
                              <>
                                <div className="text-[13px] font-bold text-purple-950 flex items-center gap-1.5 font-sans">
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                  当前筛选范围：全国
                                </div>
                                <div className="text-[11px] text-purple-700/80 font-medium font-sans">
                                  以下高级筛选条件将在全国所有商机中生效 (SVIP 可全国范围精确筛选)
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-[13px] font-bold text-purple-950 flex items-center gap-1.5 font-sans">
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                  当前筛选范围：已选地区
                                </div>
                                <div className="text-[11px] text-purple-700/80 font-medium font-sans">
                                  以下高级筛选条件将在已选地市（{selectedCities.join('、')}）内生效
                                </div>
                              </>
                            )
                          ) : (
                            <>
                              <div className="text-[13px] font-bold text-blue-900 flex items-center gap-1.5 font-sans">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                当前筛选范围：已购地市内生效
                              </div>
                              <div className="text-[11px] text-blue-600/80 font-medium font-sans">
                                以下高级筛选条件将在您已选的已购地市（{selectedCities.join('、')}）内生效
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="relative space-y-6">
                      {/* 2. 搜索范围 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>搜索范围</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {moreFilters.searchScope === '全文' ? '全部' : '已选 1 项'}
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          {['全文', '标题'].map(opt => (
                            <button
                              type="button"
                              key={opt}
                              className={`px-3.5 h-[32px] rounded-lg text-[13px] font-semibold cursor-pointer transition-colors border ${
                                isVipMoreFilterLocked
                                  ? (moreFilters.searchScope === opt 
                                      ? 'bg-gray-100 text-gray-500 border-gray-300' 
                                      : 'bg-gray-50/50 text-gray-400 border-transparent')
                                  : (moreFilters.searchScope === opt 
                                      ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold shadow-3xs' 
                                      : 'bg-gray-100/70 text-gray-700 border-transparent hover:bg-gray-150')
                              }`}
                              onClick={() => {
                                if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, searchScope: opt});
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. 公告类型 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>公告类型</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {moreFilters.announcementType === '不限' ? '全部' : '已选 1 项'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {(() => {
                             const projectType = (selectedFilters['业务类型'] && selectedFilters['业务类型'][0]) || '不限';
                             const announcementOptionsMap: Record<string, string[]> = {
                               '不限': ['不限', '交易公示', '成交公告'],
                               '工程建设': ['不限', '招标计划', '招标公告', '开标记录', '中标候选人公示', '中标公示', '更正公告'],
                               '政府采购': ['不限', '采购公告', '中标候选人公示', '成交公告', '采购合同', '更正公告'],
                               '土地使用权': ['不限', '出让公告', '成交宗地'],
                               '矿业权': ['不限', '出让公告', '出让结果', '公开信息', '登记公告信息'],
                               '国有产权': ['不限', '转让公告', '交易结果'],
                               '碳排放权': ['不限', '交易公示', '出售公告', '结果公示'],
                               '排污权': ['不限', '交易公告', '结果公示'],
                               '药品采购权': ['不限', '交易公告', '交易目录', '更正公告'],
                               '二类疫苗': ['不限', '交易公告', '交易目录', '更正公告'],
                               '林权': ['不限', '信息披露', '结果公示'],
                               '其他': ['不限', '交易公示', '结果公示']
                             };
                             const options = announcementOptionsMap[projectType] || announcementOptionsMap['不限'];
                             
                             return options.map(opt => (
                               <button
                                 type="button"
                                 key={opt}
                                 className={`px-3.5 h-[32px] rounded-lg text-[13px] font-semibold cursor-pointer transition-colors border ${
                                   isVipMoreFilterLocked
                                     ? (moreFilters.announcementType === opt 
                                         ? 'bg-gray-100 text-gray-500 border-gray-300' 
                                         : 'bg-gray-50/50 text-gray-400 border-transparent')
                                     : (moreFilters.announcementType === opt 
                                         ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold shadow-3xs' 
                                         : 'bg-gray-100/70 text-gray-700 border-transparent hover:bg-gray-150')
                                 }`}
                                 onClick={() => {
                                   if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, announcementType: opt});
                                 }}
                               >
                                 {opt}
                               </button>
                             ));
                          })()}
                        </div>
                      </div>

                      {/* 4. 项目金额 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>项目金额</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {(!moreFilters.amountPreset || moreFilters.amountPreset === '不限') && !moreFilters.amountMin && !moreFilters.amountMax
                              ? '全部'
                              : '已选 1 项'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2.5 mb-3">
                          {['不限', '<100万', '100-500万', '>500万'].map(opt => (
                            <button
                              type="button"
                              key={opt}
                              className={`px-3.5 h-[32px] rounded-lg text-[13px] font-semibold cursor-pointer transition-colors border ${
                                isVipMoreFilterLocked
                                  ? (moreFilters.amountPreset === opt 
                                      ? 'bg-gray-100 text-gray-500 border-gray-300' 
                                      : 'bg-gray-50/50 text-gray-400 border-transparent')
                                  : (moreFilters.amountPreset === opt 
                                      ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold shadow-3xs' 
                                      : 'bg-gray-100/70 text-gray-700 border-transparent hover:bg-gray-150')
                              }`}
                              onClick={() => {
                                if (!isVipMoreFilterLocked) {
                                  setMoreFilters({...moreFilters, amountPreset: opt, amountMin: '', amountMax: ''});
                                }
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative">
                            <input 
                              type="number"
                              disabled={isVipMoreFilterLocked}
                              placeholder="最小金额"
                              value={moreFilters.amountMin || ''}
                              onChange={(e) => {
                                 if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, amountPreset: '', amountMin: e.target.value});
                              }}
                              className={`w-full h-9 pl-3 pr-8 rounded-lg text-[13px] border text-center outline-none bg-white ${
                                isVipMoreFilterLocked 
                                  ? 'border-gray-100 text-gray-400 bg-gray-50/50' 
                                  : 'border-gray-200 focus:border-blue-500'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 font-medium">万</span>
                          </div>
                          <span className="text-gray-300">-</span>
                          <div className="flex-1 relative">
                            <input 
                              type="number"
                              disabled={isVipMoreFilterLocked}
                              placeholder="最大金额"
                              value={moreFilters.amountMax || ''}
                              onChange={(e) => {
                                 if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, amountPreset: '', amountMax: e.target.value});
                              }}
                              className={`w-full h-9 pl-3 pr-8 rounded-lg text-[13px] border text-center outline-none bg-white ${
                                isVipMoreFilterLocked 
                                  ? 'border-gray-100 text-gray-400 bg-gray-50/50' 
                                  : 'border-gray-200 focus:border-blue-500'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 font-medium">万</span>
                          </div>
                        </div>
                      </div>

                      {/* 5. 行业分类 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>行业分类</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {moreFilters.industryClassification && moreFilters.industryClassification.length > 0 && !moreFilters.industryClassification.includes('全部')
                              ? `已选 ${moreFilters.industryClassification.length} 项`
                              : '全部'}
                          </div>
                        </div>
                        <div 
                          className={`border rounded-lg p-3 text-xs min-h-[44px] cursor-pointer flex flex-wrap gap-2 items-center transition-colors ${
                            isVipMoreFilterLocked 
                              ? 'bg-gray-50/50 border-gray-100 text-gray-400' 
                              : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-blue-400/50'
                          }`}
                          onClick={(e) => {
                            if (!isVipMoreFilterLocked) {
                              e.stopPropagation();
                              setShowIndustrySelector(true);
                            }
                          }}
                        >
                          {moreFilters.industryClassification && moreFilters.industryClassification.length > 0 && !moreFilters.industryClassification.includes('全部') ? (
                            <>
                              {moreFilters.industryClassification.slice(0, 3).map(name => {
                                const node = findIndustryNodeByName(name, INDUSTRY_TREE_DATA);
                                return node ? (
                                  <span key={name} className={`px-2 py-1 rounded-md text-[11px] font-semibold shadow-3xs font-sans ${isVipMoreFilterLocked ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                                    {node.name}
                                  </span>
                                ) : (
                                  <span key={name} className={`px-2 py-1 rounded-md text-[11px] font-semibold shadow-3xs font-sans ${isVipMoreFilterLocked ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                                    {name}
                                  </span>
                                );
                              })}
                              {moreFilters.industryClassification.length > 3 && (
                                <span className={`px-2 py-1 rounded-md text-[11px] font-extrabold shadow-3xs font-sans ${isVipMoreFilterLocked ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-800'}`}>
                                  +{moreFilters.industryClassification.length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 font-medium text-xs">点击选择行业分类...</span>
                          )}
                        </div>
                      </div>

                      {/* 6. 招标组织方式 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>招标组织方式</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {moreFilters.biddingMethod && moreFilters.biddingMethod.length > 0 && !moreFilters.biddingMethod.includes('全部')
                              ? `已选 ${moreFilters.biddingMethod.length} 项`
                              : '全部'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {['全部', '公开招标', '邀请招标', '竞争性磋商', '直接发包', '竞争性谈判', '单一来源', '竞价', '询价'].map(opt => {
                            const isSelected = moreFilters.biddingMethod.includes(opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                className={`px-3.5 h-[32px] rounded-lg text-[13px] font-semibold cursor-pointer transition-colors border ${
                                  isVipMoreFilterLocked
                                    ? (isSelected 
                                        ? 'bg-gray-100 text-gray-500 border-gray-300 font-bold' 
                                        : 'bg-gray-50/50 text-gray-400 border-transparent')
                                    : (isSelected 
                                        ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold shadow-3xs' 
                                        : 'bg-gray-100/70 text-gray-700 border-transparent hover:bg-gray-150')
                                }`}
                                onClick={() => {
                                  if (isVipMoreFilterLocked) return;
                                  let newMethods = [...moreFilters.biddingMethod];
                                  if (opt === '全部') {
                                    newMethods = ['全部'];
                                  } else {
                                    if (newMethods.includes('全部')) {
                                      newMethods = newMethods.filter(m => m !== '全部');
                                    }
                                    if (newMethods.includes(opt)) {
                                      newMethods = newMethods.filter(m => m !== opt);
                                    } else {
                                      newMethods.push(opt);
                                    }
                                    if (newMethods.length === 0) {
                                      newMethods = ['全部'];
                                    }
                                  }
                                  setMoreFilters({...moreFilters, biddingMethod: newMethods});
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 7. 投标截止时间 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>投标截止时间</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {moreFilters.deadline === '不限' ? '全部' : '已选 1 项'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2.5 mb-3">
                          {['不限', '近3天', '近10天', '近1月', '近3月', '自定义'].map(opt => (
                            <button
                              type="button"
                              key={opt}
                              className={`px-3.5 h-[32px] rounded-lg text-[13px] font-semibold cursor-pointer transition-colors border ${
                                isVipMoreFilterLocked
                                  ? (moreFilters.deadline === opt 
                                      ? 'bg-gray-100 text-gray-500 border-gray-300' 
                                      : 'bg-gray-50/50 text-gray-400 border-transparent')
                                  : (moreFilters.deadline === opt 
                                      ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold shadow-3xs' 
                                      : 'bg-gray-100/70 text-gray-700 border-transparent hover:bg-gray-150')
                              }`}
                              onClick={() => {
                                if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, deadline: opt});
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {moreFilters.deadline === '自定义' && (
                          <div className="flex items-center gap-2.5 text-xs">
                            <input 
                              type="date" 
                              disabled={isVipMoreFilterLocked}
                              className={`border rounded-lg px-2.5 py-1.5 outline-none flex-1 bg-white ${
                                isVipMoreFilterLocked ? 'border-gray-100 text-gray-400 bg-gray-50/50' : 'border-gray-200 focus:border-blue-500'
                              }`} 
                              value={moreFilters.deadlineStart} 
                              max={moreFilters.deadlineEnd || undefined}
                              onChange={(e) => {
                                if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, deadlineStart: e.target.value});
                              }} 
                            />
                            <span className="text-gray-400 shrink-0">至</span>
                            <input 
                              type="date" 
                              disabled={isVipMoreFilterLocked}
                              className={`border rounded-lg px-2.5 py-1.5 outline-none flex-1 bg-white ${
                                isVipMoreFilterLocked ? 'border-gray-100 text-gray-400 bg-gray-50/50' : 'border-gray-200 focus:border-blue-500'
                              }`} 
                              value={moreFilters.deadlineEnd} 
                              min={moreFilters.deadlineStart || undefined}
                              onChange={(e) => {
                                if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, deadlineEnd: e.target.value});
                              }} 
                            />
                          </div>
                        )}
                      </div>

                      {/* 8. 企业资质要求 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>企业资质要求</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {moreFilters.qualificationIds && moreFilters.qualificationIds.length > 0
                              ? `已选 ${moreFilters.qualificationIds.length} 项`
                              : '无'}
                          </div>
                        </div>
                        <div 
                          className={`border rounded-lg p-3 text-xs min-h-[44px] cursor-pointer flex flex-wrap gap-2 items-center transition-colors ${
                            isVipMoreFilterLocked 
                              ? 'bg-gray-50/50 border-gray-100 text-gray-400' 
                              : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-blue-400/50'
                          }`}
                          onClick={(e) => {
                            if (!isVipMoreFilterLocked) {
                              e.stopPropagation();
                              setShowQualificationSelector(true);
                            }
                          }}
                        >
                          {moreFilters.qualificationIds && moreFilters.qualificationIds.length > 0 ? (
                            <>
                              {moreFilters.qualificationIds.slice(0, 3).map(id => {
                                const node = findQualNodeById(id, QUALIFICATION_TREE_DATA);
                                return node ? (
                                  <span key={id} className={`px-2 py-1 rounded-md text-[11px] font-semibold shadow-3xs font-sans ${isVipMoreFilterLocked ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                                    {node.name}
                                  </span>
                                ) : null;
                              })}
                              {moreFilters.qualificationIds.length > 3 && (
                                <span className={`px-2 py-1 rounded-md text-[11px] font-extrabold shadow-3xs font-sans ${isVipMoreFilterLocked ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-800'}`}>
                                  +{moreFilters.qualificationIds.length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 font-medium text-xs">点击选择企业资质...</span>
                          )}
                        </div>
                      </div>

                      {/* 9. 资金来源 */}
                      <div className="border-b border-gray-100 pb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>资金来源</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {moreFilters.fundingSource && moreFilters.fundingSource.length > 0 && !moreFilters.fundingSource.includes('全部')
                              ? `已选 ${moreFilters.fundingSource.length} 项`
                              : '全部'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {['全部', '企业', '政府', '自筹', '财政', '其他'].map(opt => {
                            const isSelected = moreFilters.fundingSource?.includes(opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                className={`px-3.5 h-[32px] rounded-lg text-[13px] font-semibold cursor-pointer transition-colors border ${
                                  isVipMoreFilterLocked
                                    ? (isSelected 
                                        ? 'bg-gray-100 text-gray-500 border-gray-300 font-bold' 
                                        : 'bg-gray-50/50 text-gray-400 border-transparent')
                                    : (isSelected 
                                        ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold shadow-3xs' 
                                        : 'bg-gray-100/70 text-gray-700 border-transparent hover:bg-gray-150')
                                }`}
                                onClick={() => {
                                  if (isVipMoreFilterLocked) return;
                                  let newSources = [...(moreFilters.fundingSource || [])];
                                  if (opt === '全部') {
                                    newSources = ['全部'];
                                  } else {
                                    if (newSources.includes('全部')) {
                                      newSources = newSources.filter(s => s !== '全部');
                                    }
                                    if (newSources.includes(opt)) {
                                      newSources = newSources.filter(s => s !== opt);
                                    } else {
                                      newSources.push(opt);
                                    }
                                    if (newSources.length === 0) {
                                      newSources = ['全部'];
                                    }
                                  }
                                  setMoreFilters({...moreFilters, fundingSource: newSources});
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 10. 排除词 */}
                      <div className="pb-1">
                        <div className="flex justify-between items-center mb-3">
                          <div className={`text-[13px] font-semibold ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-800'}`}>排除词</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {(moreFilters.excludeKeywords || []).length > 0 
                              ? `已选 ${(moreFilters.excludeKeywords || []).length} 项` 
                              : '无'}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-700'}`}>
                            <input type="radio" disabled={isVipMoreFilterLocked} name="exclude" checked={moreFilters.excludeScope === '标题'} onChange={() => { if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, excludeScope: '标题'}); }} className="text-primary w-3.5 h-3.5 cursor-pointer" /> 标题
                          </label>
                          <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none ${isVipMoreFilterLocked ? 'text-gray-400' : 'text-gray-700'}`}>
                            <input type="radio" disabled={isVipMoreFilterLocked} name="exclude" checked={moreFilters.excludeScope === '全文'} onChange={() => { if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, excludeScope: '全文'}); }} className="text-primary w-3.5 h-3.5 cursor-pointer" /> 全文
                          </label>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <input 
                            type="text" 
                            id="excludeInput"
                            disabled={isVipMoreFilterLocked}
                            placeholder="不包含的关键词" 
                            className={`flex-1 rounded-lg px-3 py-2 text-xs outline-none font-sans ${
                              isVipMoreFilterLocked ? 'bg-gray-50/50 border-gray-100 text-gray-400' : 'bg-gray-50 border-gray-100 focus:border-blue-300'
                            }`} 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isVipMoreFilterLocked) {
                                const val = e.currentTarget.value.trim();
                                if (val && (moreFilters.excludeKeywords || []).length < 10 && !moreFilters.excludeKeywords?.includes(val)) {
                                  setMoreFilters({...moreFilters, excludeKeywords: [...(moreFilters.excludeKeywords || []), val]});
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                          <button 
                            type="button"
                            disabled={isVipMoreFilterLocked}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                              isVipMoreFilterLocked ? 'bg-gray-200 text-gray-400' : 'bg-primary hover:bg-blue-600 text-white'
                            }`}
                            onClick={() => {
                              if (isVipMoreFilterLocked) return;
                              const input = document.getElementById('excludeInput') as HTMLInputElement;
                              const val = input.value.trim();
                              if (val && (moreFilters.excludeKeywords || []).length < 10 && !moreFilters.excludeKeywords?.includes(val)) {
                                  setMoreFilters({...moreFilters, excludeKeywords: [...(moreFilters.excludeKeywords || []), val]});
                                  input.value = '';
                              }
                            }}
                          >添加</button>
                        </div>
                        {(moreFilters.excludeKeywords || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {moreFilters.excludeKeywords!.slice(0, 3).map(keyword => (
                              <div key={keyword} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isVipMoreFilterLocked ? 'bg-gray-50 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                {keyword}
                                <button 
                                  type="button"
                                  disabled={isVipMoreFilterLocked}
                                  onClick={() => {
                                    if (!isVipMoreFilterLocked) setMoreFilters({...moreFilters, excludeKeywords: moreFilters.excludeKeywords!.filter(k => k !== keyword)});
                                  }}
                                  className="text-gray-400 hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                            ))}
                            {moreFilters.excludeKeywords!.length > 3 && (
                              <div className={`px-2 py-1 rounded-lg text-xs font-extrabold ${isVipMoreFilterLocked ? 'bg-gray-50 text-gray-400' : 'bg-blue-100 text-blue-800'}`}>
                                +{moreFilters.excludeKeywords!.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Transparent Absolute Overlay to gracefully catch clicks and display lock message */}
                      {isVipMoreFilterLocked && (
                        <div 
                          className="absolute inset-0 bg-transparent z-40 cursor-not-allowed"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setToast({ show: true, message: '请先选择已购地市后使用更多筛选' });
                            setTimeout(() => setToast({ show: false, message: '' }), 1500);
                          }}
                        />
                      )}
                    </div>

                  </div>

                  {/* 底部固定操作区 */}
                  <div className="flex p-4 border-t border-gray-100 gap-3 shrink-0 bg-white">
                    <button 
                      type="button"
                      className="flex-1 h-[42px] bg-blue-50 hover:bg-blue-100 text-primary rounded-xl text-[14px] font-bold transition-all flex items-center justify-center cursor-pointer shadow-3xs"
                      onClick={() => {
                        if (isVipMoreFilterLocked) {
                          setToast({ show: true, message: '请选择已购地市后再加入订阅，或升级 SVIP 筛全国' });
                          setTimeout(() => setToast({ show: false, message: '' }), 2500);
                          return;
                        }
                        if (userRole === UserRole.FREE && subscriptionPlans && subscriptionPlans.length >= 1) {
                          onNavigate(ViewName.ADD_SUBSCRIPTION);
                        } else {
                          setIsSubscriptionModalOpen(true);
                        }
                      }}
                    >
                      加入订阅
                    </button>
                    <button 
                      type="button"
                      className="flex-1 h-[42px] bg-gray-100 hover:bg-gray-150 text-gray-600 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        setMoreFilters({ searchScope: '全文', announcementType: '不限', industryClassification: ['全部'], biddingMethod: ['全部'], amountPreset: '不限', amountMin: '', amountMax: '', deadline: '不限', deadlineStart: '', deadlineEnd: '', qualificationIds: [], fundingSource: ['全部'], excludeKeywords: [], excludeScope: '标题' });
                      }}
                    >
                      清空
                    </button>
                    <button 
                      type="button"
                      className="flex-1 h-[42px] bg-primary hover:bg-blue-600 text-white rounded-xl text-[14px] font-bold transition-all flex items-center justify-center cursor-pointer shadow-3xs"
                      onClick={() => {
                        if (isVipMoreFilterLocked) {
                          const isAnyMoreFilterApplied = hasActiveMoreFilters || moreFilters.searchScope !== '全文';
                          if (isAnyMoreFilterApplied) {
                            setToast({ show: true, message: '请选择已购地市后再使用更多筛选，或升级 SVIP 筛选全国' });
                            setTimeout(() => setToast({ show: false, message: '' }), 2500);
                            return;
                          }
                        }
                        setActiveFilter(null);
                      }}
                    >
                      筛选
                    </button>
                  </div>
                </div>
              ) : activeFilter === '时间' ? (
                <div className="flex flex-col bg-white">
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 max-h-[250px]">
                    {['不限', '今天', '近3天', '近7天', '近30天', '近60天', '近90天', '近180天', '近1年'].map(option => {
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
                            max={customEndTime || undefined}
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
                            min={customStartTime || undefined}
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
                  
                  <div className="flex p-4 border-t border-[#F0F0F0] gap-3 shrink-0">
                    <button 
                      className="flex-1 py-1 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
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
              ) : (
                <div className="flex flex-col bg-white">
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 max-h-[250px]">
                    <div className="flex flex-col">
                      {filters.find(f => f.label === activeFilter)?.options?.map(opt => {
                        const isSelected = selectedFilters[activeFilter || '']?.includes(opt) || (opt === '不限' && !selectedFilters[activeFilter || '']?.length);
                        return (
                          <button
                            key={opt}
                            className="w-full flex justify-between items-center py-3 border-b border-[#F0F0F0]"
                            onClick={() => {
                              setSelectedFilters({...selectedFilters, [activeFilter || '']: [opt]});
                              if (activeFilter === '业务类型') {
                                setMoreFilters(prev => ({...prev, announcementType: '不限'}));
                              }
                            }}
                          >
                            <span className={`text-[14px] ${isSelected ? 'text-[#1677FF]' : 'text-[#333333]'}`}>{opt}</span>
                            {isSelected && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="#1677FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex p-4 border-t border-[#F0F0F0] gap-3 shrink-0">
                    <button 
                      className="flex-1 py-1 bg-[#F0F5FF] text-[#1677FF] rounded-md text-[14px] font-medium"
                      onClick={() => {
                        const defaultValue = activeFilter === '业务类型' ? ['不限'] : ['全部'];
                        setSelectedFilters({ ...selectedFilters, [activeFilter || '']: defaultValue });
                        if (activeFilter === '业务类型') {
                          setMoreFilters(prev => ({...prev, announcementType: '不限'}));
                        }
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
              )}
            </div>
          )}
        </div>
      </header>

      {/* List Content */}
      <main 
        ref={scrollRef} 
        onScroll={handleScroll} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto bg-[#F5F7FA] pb-24 relative"
      >
        {isSortingTransition && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-white/60 backdrop-blur-[1px] flex justify-center pt-24 z-[40] transition-opacity duration-300">
            <div className="flex flex-col items-center gap-2 bg-white/95 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 max-h-fit">
              <div className="w-6 h-6 border-[2.5px] border-[#1677FF] border-t-transparent rounded-full animate-spin" />
              <span className="text-[12px] text-gray-500 font-medium">重排商机中...</span>
            </div>
          </div>
        )}
        {/* Results Header with Sorting Entry */}
        <div className="bg-white border-b border-[#F0F0F0] sticky top-0 z-10 shadow-sm">
          {/* Row 1: Counts & Export */}
          <div className="flex justify-between items-center px-4 py-3 bg-white">
            <div className="flex items-center gap-3">
              {(() => {
                if (isNetworkError) {
                  return (
                    <div className="text-[13px] text-gray-500">
                      共<span className="text-[#FF4D4F] mx-1 font-bold font-numbers">0</span>条数据
                    </div>
                  );
                }
                const X = filteredOpportunities.length;
                if (!isSearchActive && !isFilterActiveAny) {
                  return (
                    <div className="text-[13px] text-gray-500">
                      共<span className="text-[#FF4D4F] mx-1 font-bold font-numbers">{X > 0 ? '5000+' : '0'}</span>条数据
                    </div>
                  );
                }
                if (X === 0) {
                  return (
                    <div className="text-[13px] text-gray-500">
                      当前命中<span className="text-[#FF4D4F] mx-1 font-bold font-numbers">0</span>条
                    </div>
                  );
                }
                if (isFilterActiveAny && !isSearchActive) {
                  return (
                    <div className="text-[13px] text-gray-500">
                      当前命中<span className="text-[#FF4D4F] mx-1 font-bold font-numbers">{X}</span>条
                    </div>
                  );
                }
                if (isSearchActive && !isFilterActiveAny) {
                  return (
                    <div className="text-[13px] text-gray-500 truncate max-w-[220px]" title={`「${searchQuery}」相关结果 ${X} 条`}>
                      「{searchQuery}」相关结果<span className="text-[#FF4D4F] mx-1 font-bold font-numbers">{X}</span>条
                    </div>
                  );
                }
                return (
                  <div className="text-[13px] text-gray-500">
                    当前命中<span className="text-[#FF4D4F] mx-1 font-bold font-numbers">{X}</span>条
                  </div>
                );
              })()}
            </div>
            <button 
              className="text-[#1677FF] text-[13px] font-medium flex items-center gap-1 hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
              onClick={() => {
                if (userRole === UserRole.FREE) {
                  onShowPaymentModal?.('EXPORT_LOCKED');
                } else {
                  setIsExportDialogOpen(true);
                }
              }}
            >
              <Download size={14} className="stroke-[2.2]" />
              导出数据
            </button>
          </div>
        </div>

        {/* Pull to refresh visual loader - inline inside feed, above the list cards */}
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

        {/* Results List */}
        <div className="space-y-3 p-3">
          {showSkeleton ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100/50 flex flex-col gap-3.5 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <div className="h-5 bg-gray-200 rounded-md w-5/6"></div>
                  <div className="h-5 bg-gray-200 rounded-full w-5"></div>
                </div>
                <div className="flex gap-2.5">
                  <div className="h-5 bg-gray-100 rounded-md w-16"></div>
                  <div className="h-5 bg-gray-100 rounded-md w-20"></div>
                  <div className="h-5 bg-gray-100 rounded-md w-14"></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="h-5 bg-gray-200 rounded-md w-24"></div>
                  <div className="h-5 bg-gray-100 rounded-md w-12"></div>
                </div>
              </div>
            ))
          ) : (showError || showEmptyOverride || filteredOpportunities.length === 0) ? (
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
              ) : (showEmptyOverride || (opportunities.length === 0 && !isSearchActive && !isFilterActiveAny)) ? (
                // 2. 首次无数据 Empty State
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 mb-4 text-gray-300 flex items-center justify-center bg-gray-50 rounded-full">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18m-18 0v-7.5A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v7.5m-18 0v-4.5A2.25 2.25 0 014.5 9h15a2.25 2.25 0 012.25 2.25v4.5m-18 3h18a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25h-3.86a2.25 2.25 0 01-2.008-1.24l-.885-1.77a2.25 2.25 0 00-2.007-1.24h-1.98a2.25 2.25 0 00-2.007 1.24l-.885 1.77a2.25 2.25 0 01-2.007 1.24H4.5a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-bold text-[16px] mb-1">暂无商机数据</h3>
                  <p className="text-gray-500 text-[13.5px] max-w-[280px] mb-5">新标讯系统尚未入库任何招标商机，我们正在马不停蹄地抓取中！</p>
                </div>
              ) : (isSearchActive || isFilterActiveAny) ? (
                // 3. 搜索或筛选无结果 (有条件的空态)
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 mb-4 text-amber-500 flex items-center justify-center bg-amber-50 rounded-full">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-bold text-[16px] mb-1">未找到符合条件的结果</h3>
                  <p className="text-gray-500 text-[13.5px] max-w-[280px] mb-5">试试减少筛选条件，或调整关键词</p>
                  <div className="flex flex-col gap-2 w-full max-w-[240px]">
                    <button 
                      onClick={() => {
                        if (isFilterActiveAny) {
                          clearAllFilters();
                        } else {
                          handleSearch('');
                        }
                      }}
                      className="w-full py-2.5 bg-[#1677FF] hover:bg-[#4096ff] text-white text-[14px] font-semibold rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      {isFilterActiveAny ? '清除筛选' : '清除搜索'}
                    </button>
                  </div>
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
            filteredOpportunities.slice(0, visibleCount).map((opp, index) => {
              const statusInfo = getOpportunityStatusInfo(opp.currentStage, opp.deadline);
              const statusText = statusInfo.primary;
                                
              const isBidding = ['招标中', '前期公告'].includes(statusText);
              const isWon = ['结果公示', '已结束', '已终止', '已截止'].includes(statusText);
              const isProposed = statusText === '前期公告';

              const deadline = opp.deadline || (opp.date.includes(':') ? opp.date : opp.date + ' 23:59');

              return (
                <article 
                  key={opp.id} 
                  onClick={() => {
                    onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opp);
                  }}
                  className="bg-white rounded-xl shadow-sm transition-all border border-transparent active:scale-[0.99] active:bg-gray-50 flex items-stretch overflow-hidden"
                >

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2.5 gap-3">
                      <h3 className="text-[15px] font-medium text-[#333333] leading-snug flex-1 line-clamp-2 pb-0.5" style={{ wordBreak: 'break-all' }}>
                        {opp.isMultiBid ? (opp.title.length > 28 ? opp.title.substring(0, 27) + '...' : opp.title) : opp.title}
                        {opp.isMultiBid && (
                          <span className="text-primary ml-1 text-xs shrink-0 align-super font-normal whitespace-nowrap">[多标段]</span>
                        )}
                      </h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(opp.id);
                        }}
                        className="shrink-0 p-1 active:scale-90 transition-transform -mr-1 -mt-1"
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
                    </div>
                  
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
                      const { orgMethod, announcementType } = parseTags(opp.tags);
                      const tagsToShow = [announcementType, orgMethod].filter(Boolean) as string[];
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
                    <span className={`h-5 flex items-center px-1.5 rounded text-[11px] font-medium border ${PRIMARY_STATUS_STYLES[statusInfo.primary].bg} ${PRIMARY_STATUS_STYLES[statusInfo.primary].text} ${PRIMARY_STATUS_STYLES[statusInfo.primary].border}`}>
                      {statusInfo.primary}
                    </span>
                    {statusInfo.badges.map(b => (
                      <span key={b} className={`h-5 flex items-center px-1.5 rounded text-[10px] font-semibold border ${BADGE_STYLES[b].bg} ${BADGE_STYLES[b].text} ${BADGE_STYLES[b].border}`}>
                        {b}
                      </span>
                    ))}
                  </div>
                  
                    <div className="space-y-1.5 text-[13px] mb-3">
                      <div className="flex items-center gap-2">
                         <div className="flex flex-1 min-w-0">
                           <span className="text-[#999999] shrink-0">招采单位：</span>
                           <span className="text-[#1677FF] truncate">{opp.ownerName || '—'}</span>
                         </div>
                      </div>
                      
                      <div className="flex">
                        <span className="text-[#999999] shrink-0">代理单位：</span>
                        <span className="text-[#1677FF] truncate">{opp.agencyName || '自行招标'}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex min-w-0">
                          <span className="text-[#999999] shrink-0">截止时间：</span>
                          <span className="text-[#666666] truncate">{getDeadlineDisplay(opp.deadline, opp.currentStage, opp.tags, true)}</span>
                        </div>
                        {(() => {
                          if (statusText !== '招标中') return null;
                          const countdown = getCountdownText(opp.deadline);
                          if (countdown) {
                            return (
                              <span className={`${countdown.isUrgent ? 'text-[#FA8C16] font-medium' : 'text-gray-400 font-normal'} text-xs shrink-0 ml-2`}>
                                {countdown.text}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                  <div className="pt-2.5 border-t border-gray-50 flex justify-between items-end mt-3">
                    <div className="flex flex-col gap-1 items-start">
                      {(() => {
                        const amountStr = getAmountDisplay(opp.amount, opp.currentStage, opp.tags);
                        if (amountStr === '暂未明确' || amountStr === '详见招标文件') {
                          return (
                            <div className="flex items-baseline">
                              <span className="text-[13px] text-gray-400 font-sans">{amountStr}</span>
                            </div>
                          );
                        }
                        const match = amountStr.match(/^([\d,.]+)(.*)$/);
                        if (match) {
                          const num = match[1];
                          const unit = match[2];
                          return (
                            <div className="flex items-baseline">
                              <span className="text-[17px] font-bold text-[#FF4D4F] font-numbers leading-none">{num}</span>
                              {unit && <span className="text-[12px] text-[#FF7875] font-normal ml-0.5 font-sans">{unit}</span>}
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-baseline">
                            <span className="text-[17px] font-bold text-[#FF4D4F] font-numbers leading-none">{amountStr}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col gap-1 items-end text-right justify-end">
                      <div className="text-[11px] text-gray-400 font-sans tracking-tight whitespace-nowrap flex items-center gap-1 justify-end">
                        <Clock size={11} className="text-gray-400 shrink-0" />
                        <span>发布 {opp.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </article>
              );
            })
        )}

        {/* Lazy Auto Load More Footer */}
        {!isLoading && filteredOpportunities.length > 0 && (
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
        </div>
      </main>

      <ExportDialog 
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
        userRole={userRole}
        totalItems={filteredOpportunities.length}
        dataType="opportunity"
        addExportRecord={addExportRecord}
        onViewRecords={() => onNavigate(ViewName.EXPORT_RECORDS)}
        exportStatusOverride={exportStatusOverride}
        onUpgrade={() => {
          onNavigate(ViewName.MEMBER_CENTER);
        }}
      />


      
      {showQualificationSelector && (
        <QualificationSelector
          initialSelectedIds={moreFilters.qualificationIds || []}
          onConfirm={(ids) => {
            setMoreFilters({...moreFilters, qualificationIds: ids});
            setShowQualificationSelector(false);
          }}
          onClose={() => setShowQualificationSelector(false)}
        />
      )}
      
      {showIndustrySelector && (
        <IndustrySelector
          initialSelected={moreFilters.industryClassification}
          onConfirm={(selected) => {
            setMoreFilters({...moreFilters, industryClassification: selected});
            setShowIndustrySelector(false);
          }}
          onClose={() => setShowIndustrySelector(false)}
        />
      )}

      {/* Subscription Name Modal */}
      {isSubscriptionModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6"
          onClick={() => setIsSubscriptionModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl max-h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900">设置订阅方案名称</h3>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-lg p-3 mb-6 text-sm outline-none focus:border-blue-500"
              placeholder="请输入订阅方案名称"
              value={subscriptionName}
              onChange={(e) => setSubscriptionName(e.target.value)}
            />
            <div className="flex gap-3">
              <button 
                type="button"
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                onClick={() => setIsSubscriptionModalOpen(false)}
              >
                取消
              </button>
              <button 
                type="button"
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all cursor-pointer"
                onClick={() => {
                  let finalName = subscriptionName.trim();
                  
                  if (!finalName) {
                    const date = new Date();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const prefix = `${month}月${day}日方案`;
                    
                    const numberToChinese = (num: number): string => {
                      const chineseNumbers = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
                      if (num <= 10) return chineseNumbers[num];
                      if (num < 20) return "十" + (num % 10 === 0 ? "" : chineseNumbers[num % 10]);
                      if (num < 100) return chineseNumbers[Math.floor(num / 10)] + "十" + (num % 10 === 0 ? "" : chineseNumbers[num % 10]);
                      return num.toString();
                    };

                    let counter = 1;
                    while (subscriptionPlans?.some(p => p.name === `${prefix}${numberToChinese(counter)}`)) {
                      counter++;
                    }
                    finalName = `${prefix}${numberToChinese(counter)}`;
                  } else {
                    if (subscriptionPlans?.some(p => p.name === finalName)) {
                      setToast({ show: true, message: '方案名称重复，请修改' });
                      setTimeout(() => setToast({ show: false, message: '' }), 1500);
                      return;
                    }
                  }

                  if (onAddSubscription) {
                    const keywords = searchQuery.trim() ? searchQuery.trim().split(/\s+/) : [];
                    const amountPreset = moreFilters.amountPreset !== '不限' ? moreFilters.amountPreset : '';
                    
                    const success = onAddSubscription({
                      name: finalName,
                      region: selectedCities.length > 0 ? selectedCities.join(',') : '全国',
                      keywords: keywords,
                      amountRange: {
                        preset: amountPreset,
                        min: moreFilters.amountMin || '',
                        max: moreFilters.amountMax || ''
                      },
                      organizationForm: (moreFilters.biddingMethod || []).filter(m => m !== '全部').join(','),
                      fundingSource: (moreFilters.fundingSource || []).filter(s => s !== '全部').join(','),
                      qualificationRequirement: (moreFilters.qualificationIds || []).join(','),
                      openingDeadline: moreFilters.deadline && moreFilters.deadline !== '不限' ? (moreFilters.deadline === '自定义' ? `${moreFilters.deadlineStart || ''}~${moreFilters.deadlineEnd || ''}` : moreFilters.deadline) : '',
                      industryClassification: (moreFilters.industryClassification || []).filter(i => i !== '全部'),
                      announcementType: moreFilters.announcementType !== '不限' ? moreFilters.announcementType : '',
                      excludeKeywords: moreFilters.excludeKeywords || []
                    });
                    
                    if (success === false) {
                      setIsSubscriptionModalOpen(false);
                      setSubscriptionName('');
                      return;
                    }
                  }

                  setToast({ show: true, message: `已成功创建订阅方案:\n${finalName}` });
                  setTimeout(() => setToast({ show: false, message: '' }), 1500);
                  setIsSubscriptionModalOpen(false);
                  setSubscriptionName('');
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};