import React, { useState, useEffect } from 'react';
import { ViewName, Opportunity, Enterprise, UserRole, EnterpriseData, SubscriptionPlan, Membership, ExportRecord } from './types';
import { PAYWALL_SCENES } from './src/constants/paywallScenes';
import { Home } from './screens/Home';
import { OpportunityList } from './screens/OpportunityList';
import { AnnouncementDetail } from './screens/AnnouncementDetail';
import { EnterpriseList } from './screens/EnterpriseList';
import { EnterpriseDetail } from './screens/EnterpriseDetail';
import { Subscription } from './screens/Subscription';
import { AddSubscription } from './screens/AddSubscription';
import { SubscriptionManagement } from './screens/SubscriptionManagement';
import { UserCenter } from './screens/UserCenter';
import { Feedback } from './screens/Feedback';
import { MemberCenter } from './screens/MemberCenter';
import { ProjectContacts, Contact } from './screens/ProjectContacts';
import { ProjectTimeline } from './screens/ProjectTimeline';
import { MySchedule } from './screens/MySchedule';
import { AddSchedule } from './screens/AddSchedule';
import { BrowsingHistory } from './screens/BrowsingHistory';
import { ExportRecords } from './screens/ExportRecords';
import { EnterpriseInfo } from './screens/EnterpriseInfo';
import { ContactProjects } from './screens/ContactProjects';
import { SelectOpportunity } from './screens/SelectOpportunity';
import { MessageList } from './screens/MessageList';
import { BottomNav } from './components/BottomNav';
import { VipPromptModal } from './components/VipPromptModal';
import { DraggableButton } from './components/DraggableButton';
import { ChevronLeft, Settings, X, ShieldCheck, Building2, ChevronUp, ChevronDown } from 'lucide-react';
import { MOCK_OPPORTUNITIES, MOCK_ENTERPRISES } from './constants';
import { resetTodayExportUsed } from './utils/exportQuota';

const getFormattedDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const initialOppListState = {
  searchQuery: '',
  selectedCities: [] as string[],
  expandedProvince: '全国',
  selectedAnnouncementType: { mainType: '全部', subTypes: [] as string[] },
  selectedFilters: {
    时间: ['不限'],
    业务类型: ['不限'],
    货物类型: ['全部']
  } as Record<string, string[]>,
  customStartTime: '',
  customEndTime: '',
  moreFilters: {
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
    qualificationIds: [] as string[],
    fundingSource: ['全部'],
    excludeKeywords: [] as string[],
    excludeScope: '标题'
  },
  sortBy: 'latest' as 'latest' | 'deadline' | 'relevance',
  visibleCount: 8,
  hasLoadedOnce: false,
  scrollTop: 0
};

const initialEntListState = {
  searchQuery: '',
  selectedRegion: { province: '全国', cities: [] as string[] },
  selectedRole: '企业角色',
  selectedCapital: '注册资本',
  moreFilters: {
    establishedYears: '不限'
  },
  sortBy: 'default' as 'default',
  visibleCount: 8,
  hasLoadedOnce: false,
  scrollTop: 0
};

function App() {
  const [currentView, setCurrentView] = useState<ViewName>(ViewName.HOME);
  const [history, setHistory] = useState<ViewName[]>([]);
  const [oppListState, setOppListState] = useState(initialOppListState);
  const [entListState, setEntListState] = useState(initialEntListState);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | undefined>(undefined);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contactProjectsData, setContactProjectsData] = useState<{contactName: string, enterpriseName: string} | undefined>(undefined);
  const [selectedOpportunityForSchedule, setSelectedOpportunityForSchedule] = useState<Opportunity | undefined>(undefined);
  const [draftSchedule, setDraftSchedule] = useState<{
    id?: string;
    title: string;
    content: string;
    activePhases: string[];
    selectedDate: string | null;
  }>({
    title: '',
    content: '',
    activePhases: [],
    selectedDate: null
  });
  const [schedules, setSchedules] = useState<any[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>(MOCK_ENTERPRISES);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const getOffsetDateString = (offsetDays: number, hhMm: string) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hhMm}`;
    };

    return MOCK_OPPORTUNITIES.map(opp => {
      if (opp.id === 'demo_today') {
        return { ...opp, deadline: getOffsetDateString(0, '18:00') };
      }
      if (opp.id === 'demo_tomorrow') {
        return { ...opp, deadline: getOffsetDateString(1, '14:00') };
      }
      if (opp.id === 'demo_3days') {
        return { ...opp, deadline: getOffsetDateString(3, '10:00') };
      }
      if (opp.id === 'demo_7days') {
        return { ...opp, deadline: getOffsetDateString(7, '15:30') };
      }
      if (opp.id === 'demo_expired') {
        return { ...opp, deadline: getOffsetDateString(-2, '12:00') };
      }
      if (opp.id === 'demo_nodeadline') {
        return { ...opp, deadline: '' };
      }

      if (opp.status === '招标中') {
        if (opp.id === '1' || opp.id === '7') {
          return { ...opp, deadline: getOffsetDateString(0, '18:00') };
        }
        if (opp.id === '2' || opp.id === '9') {
          return { ...opp, deadline: getOffsetDateString(3, '14:00') };
        }
        if (opp.id === '5') {
          return { ...opp, deadline: getOffsetDateString(10, '09:30') };
        }
      }
      return opp;
    });
  });
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [membership, setMembership] = useState<Membership>(() => {
    try {
      const stored = localStorage.getItem('user_membership');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing membership from localStorage', e);
    }
    return { role: UserRole.FREE };
  });

  const [lastCheckResult, setLastCheckResult] = useState<{ type: 'downgraded' | 'valid'; text: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('user_membership', JSON.stringify(membership));
  }, [membership]);

  // No automatic prefill of vipCities, let users choose by themselves on first purchase/activation
  useEffect(() => {
    // Left empty to remove auto prefill
  }, []);

  const checkMembershipExpiry = (latestMembership?: Membership) => {
    const target = latestMembership || membership;
    const todayStr = getFormattedDate(new Date());
    let updated = false;
    let newMembership = { ...target };

    if (newMembership.svipTrialUntil && newMembership.svipTrialUntil < todayStr) {
      newMembership.svipTrialUntil = null;
      updated = true;
    }

    if (newMembership.role !== UserRole.FREE && newMembership.expiryDate && newMembership.expiryDate < todayStr) {
      newMembership.role = UserRole.FREE;
      updated = true;
    }

    if (updated) {
      setMembership(newMembership);
      showToast('会员状态已自动更新');
      return true;
    }
    return false;
  };

  const getRemainingDays = () => {
    if (membership.role === UserRole.FREE || !membership.expiryDate) {
      return '—';
    }
    try {
      const parts = membership.expiryDate.split('-');
      const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} 天`;
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    checkMembershipExpiry();
  }, [membership]);

  const todayStr = getFormattedDate(new Date());
  const userRole = (() => {
    if (membership.svipTrialUntil && membership.svipTrialUntil >= todayStr) {
      return UserRole.SVIP;
    }
    if (membership.role !== UserRole.FREE && membership.expiryDate && membership.expiryDate >= todayStr) {
      return membership.role;
    }
    return UserRole.FREE;
  })();
  const setUserRole = (role: UserRole) => {
    setMembership(prev => {
      if (role === UserRole.FREE) {
        return { role };
      }
      
      let expiryDate = prev.expiryDate;
      let planType = prev.planType;
      
      if (!expiryDate) {
        const d = new Date();
        d.setDate(d.getDate() + 365);
        expiryDate = getFormattedDate(d);
        planType = 'annual';
      }
      
      return {
        ...prev,
        role,
        planType,
        expiryDate
      };
    });
  };
  const [freeViewedIds, setFreeViewedIds] = useState<string[]>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem('free_viewed_opportunity_detail_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.date === today && Array.isArray(parsed.viewedIds)) {
          return parsed.viewedIds;
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [freeViewedEnterpriseIds, setFreeViewedEnterpriseIds] = useState<string[]>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem('enterpriseDetailViews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.date === today && Array.isArray(parsed.viewedIds)) {
          return parsed.viewedIds;
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [customModalTitle, setCustomModalTitle] = useState<string | undefined>(undefined);
  const [customModalButtonText, setCustomModalButtonText] = useState<string | undefined>(undefined);
  const [customSecondaryModalButtonText, setCustomSecondaryModalButtonText] = useState<string | undefined>(undefined);
  const [customOnSecondaryAction, setCustomOnSecondaryAction] = useState<(() => void) | undefined>(undefined);
  const [customOnPrimaryAction, setCustomOnPrimaryAction] = useState<(() => void) | undefined>(undefined);
  const vipCities = membership.vipCities || [];
  const [showVipModal, setShowVipModal] = useState<boolean>(false);
  const [requiredRole, setRequiredRole] = useState<UserRole>(UserRole.VIP);
  const [targetVipTab, setTargetVipTab] = useState<'vip' | 'svip' | undefined>(undefined);
  const [featureDescription, setFeatureDescription] = useState<string>('');
  const [followedContacts, setFollowedContacts] = useState<Contact[]>([]);
  const [exportRecords, setExportRecords] = useState<ExportRecord[]>(() => {
    const getDaysAgo = (days: number) => {
       const todayTemp = new Date();
       const d = new Date(todayTemp);
       d.setDate(d.getDate() - days);
       const y = d.getFullYear();
       const m = String(d.getMonth() + 1).padStart(2, '0');
       const dd = String(d.getDate()).padStart(2, '0');
       return { dateStr: `${y}-${m}-${dd} 10:00`, dStr: `${y}-${m}-${dd}`, yyyymmdd: `${y}${m}${dd}` };
    };
    const d3 = getDaysAgo(3);
    const d10 = getDaysAgo(10);
    const d30 = getDaysAgo(30);
    return [
      { id: '1', name: `${d3.yyyymmdd} 商机列表.xlsx`, date: d3.dateStr, size: '2.5MB', createdAt: d3.dStr, status: 'completed' },
      { id: '2', name: `${d10.yyyymmdd} 企业列表.csv`, date: d10.dateStr, size: '1.2MB', createdAt: d10.dStr, status: 'completed' }, 
      { id: '3', name: `${d30.yyyymmdd} 机构招投标深度分析.xlsx`, date: d30.dateStr, size: '5.6MB', createdAt: d30.dStr, status: 'failed' },
    ];
  });

  const addExportRecord = (dataType: 'opportunity' | 'enterprise', count: number, status?: 'completed' | 'failed') => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    const prefix = dataType === 'opportunity' ? '商机数据' : '企业数据';
    const name = `${prefix}_${yyyy}${mm}${dd}_${hh}${min}.xlsx`;
    const dateStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    const dStr = `${yyyy}-${mm}-${dd}`;
    const size = `${(count * 0.15 + 0.1).toFixed(1)}MB`;

    const newRecord: ExportRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      date: dateStr,
      size,
      createdAt: dStr,
      status: 'processing'
    };

    setExportRecords(prev => [newRecord, ...prev]);

    setTimeout(() => {
      setExportRecords(prev => {
        return prev.map(rec => {
          if (rec.id === newRecord.id) {
            return {
              ...rec,
              status: status || exportStatusOverride
            };
          }
          return rec;
        });
      });
    }, 3000);
  };

  const openPaywall = (
    sceneId: string, 
    customTitle?: string, 
    customDesc?: string, 
    customBtn?: string, 
    customSecondaryBtn?: string, 
    onSecAction?: () => void,
    onPriAction?: () => void
  ) => {
    const scene = PAYWALL_SCENES[sceneId];
    if (scene) {
      setRequiredRole(scene.requiredRole);
      setTargetVipTab(scene.targetTab as any);
      setCustomModalTitle(customTitle || scene.title);
      setFeatureDescription(customDesc || scene.description);
      const btnTextStr = typeof scene.buttonText === 'function' ? scene.buttonText(userRole) : scene.buttonText;
      setCustomModalButtonText(customBtn || btnTextStr);
      setCustomSecondaryModalButtonText(customSecondaryBtn);
      setCustomOnSecondaryAction(() => onSecAction);
      setCustomOnPrimaryAction(() => onPriAction);
    } else {
      setRequiredRole(UserRole.VIP);
      setTargetVipTab('svip');
      
      const isEnglishKey = (str?: string) => /^[A-Z_]+$/.test(str || '');
      
      let finalTitle = customTitle;
      if (!finalTitle || isEnglishKey(finalTitle)) {
        finalTitle = '暂无法使用该功能';
      }
      
      let finalDesc = customDesc;
      if (!finalDesc || isEnglishKey(finalDesc)) {
        finalDesc = '当前会员权益暂不支持此操作，可升级会员后使用。';
      }
      
      let finalBtn = customBtn;
      if (!finalBtn || isEnglishKey(finalBtn)) {
        finalBtn = '查看会员权益';
      }
      
      let finalSecBtn = customSecondaryBtn;
      if (!finalSecBtn || isEnglishKey(finalSecBtn)) {
        finalSecBtn = '知道了';
      }

      setCustomModalTitle(finalTitle);
      setFeatureDescription(finalDesc);
      setCustomModalButtonText(finalBtn);
      setCustomSecondaryModalButtonText(finalSecBtn);
      
      setCustomOnSecondaryAction(() => onSecAction);
      setCustomOnPrimaryAction(() => onPriAction);
    }
    setShowVipModal(true);
  };

  const handleShowExportVipPrompt = () => {
    openPaywall('EXPORT_LOCKED');
  };
  const [enterpriseInfo, setEnterpriseInfo] = useState<EnterpriseData | null>(() => {
    try {
      const stored = localStorage.getItem('enterpriseInfo');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error parsing enterpriseInfo from localStorage', e);
      return null;
    }
  });

  const saveEnterpriseInfo = (data: EnterpriseData) => {
    setEnterpriseInfo(data);
    localStorage.setItem('enterpriseInfo', JSON.stringify(data));
    showToast('企业信息已保存');
  };

  const deleteEnterpriseInfo = () => {
    setEnterpriseInfo(null);
    localStorage.removeItem('enterpriseInfo');
    showToast('企业信息已删除');
  };
  const [memberCenterData, setMemberCenterData] = useState<{
    initialTab?: 'vip' | 'svip',
    tab?: 'vip' | 'svip',
    initialPlanId?: string,
    upgradeType?: 'vip_to_svip_annual'
  } | undefined>(undefined);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isMembershipCollapsed, setIsMembershipCollapsed] = useState(true);
  const [isResetCollapsed, setIsResetCollapsed] = useState(true);
  const [feedStatusOverride, setFeedStatusOverride] = useState<'auto' | 'loading' | 'error' | 'empty' | 'ready'>('auto');
  const [aiDetailStatusOverride, setAiDetailStatusOverride] = useState<'normal' | 'error'>('normal');
  const [originalDetailStatusOverride, setOriginalDetailStatusOverride] = useState<'success' | 'error'>('success');
  const [exportStatusOverride, setExportStatusOverride] = useState<'completed' | 'failed'>('completed');
  const [isOfflineError, setIsOfflineError] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([
    { id: '1', name: '方案1', keywords: ['工程', '招标'], region: '全国', isDefault: true },
  ]);

  const handleAddSubscription = (plan: Omit<SubscriptionPlan, 'id' | 'isDefault'>) => {
    if (userRole === UserRole.FREE && subscriptionPlans.length >= 1) {
      openPaywall('SUBSCRIPTION_LIMIT');
      return;
    }
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: Math.random().toString(36).substr(2, 9),
      isDefault: subscriptionPlans.length === 0
    };
    setSubscriptionPlans([...subscriptionPlans, newPlan]);
    setCurrentView(ViewName.SUBSCRIPTION_MANAGEMENT);
    showToast('添加订阅方案成功');
  };

  const handleUpdateSubscription = (id: string, updatedPlan: Partial<SubscriptionPlan>) => {
    setSubscriptionPlans(subscriptionPlans.map(p => p.id === id ? { ...p, ...updatedPlan } : p));
    setCurrentView(ViewName.SUBSCRIPTION_MANAGEMENT);
    showToast('更新订阅方案成功');
  };

  const handleDeleteSubscription = (id: string) => {
    const planToDelete = subscriptionPlans.find(p => p.id === id);
    let newPlans = subscriptionPlans.filter(p => p.id !== id);
    
    if (planToDelete?.isDefault && newPlans.length > 0) {
       newPlans[0].isDefault = true;
    }
    
    setSubscriptionPlans(newPlans);
    showToast('删除订阅方案成功');
  };

  const handleSetDefaultSubscription = (id: string) => {
    setSubscriptionPlans(subscriptionPlans.map(p => ({
      ...p,
      isDefault: p.id === id
    })));
    showToast('已设为默认方案');
  };

  const FEATURE_DESCRIPTIONS: Partial<Record<ViewName, string>> = {
    // SVIP Features
    [ViewName.SUBSCRIPTION]: "订阅关键词，实时获取最新商机推送，不错过任何机会",
    [ViewName.SUBSCRIPTION_MANAGEMENT]: "管理您的订阅规则，精准匹配您的业务需求",
    [ViewName.ADD_SUBSCRIPTION]: "添加新的订阅规则，拓展您的商机来源",
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.FREE: return '普通会员';
      case UserRole.VIP: return 'VIP';
      case UserRole.SVIP: return 'SVIP';
      default: return '普通会员';
    }
  };

  const toggleContactFollow = (contact: Contact, silent = false) => {
    setFollowedContacts(prev => {
      const isFollowed = prev.some(c => c.id === contact.id);
      if (isFollowed) {
        if (!silent) showToast('已取消关注联系人');
        return prev.filter(c => c.id !== contact.id);
      } else {
        if (!silent) showToast('已关注联系人');
        return [...prev, contact];
      }
    });
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  const addEnterprise = (enterprise: Enterprise) => {
    setEnterprises(prev => {
      if (prev.some(e => e.name === enterprise.name)) return prev;
      return [enterprise, ...prev];
    });
  };

  const toggleOpportunityStar = (id: string) => {
    setOpportunities(prev => prev.map(opp => {
      if (opp.id === id) {
        const newIsStarred = !opp.isStarred;
        if (!newIsStarred) {
          showToast('已取消收藏');
        } else {
          showToast('已收藏');
        }
        return { ...opp, isStarred: newIsStarred };
      }
      return opp;
    }));
    
    if (selectedOpportunity && selectedOpportunity.id === id) {
      setSelectedOpportunity(prev => prev ? { ...prev, isStarred: !prev.isStarred } : undefined);
    }
  };

  const toggleEnterpriseFollow = (id: string) => {
    setEnterprises(prev => prev.map(ent => {
      if (ent.id === id) {
        const newIsFollowed = !ent.isFollowed;
        if (newIsFollowed) {
          showToast('关注成功，可前往订阅——关注企业查看详情。');
        } else {
          showToast('已取消关注');
        }
        return { ...ent, isFollowed: newIsFollowed };
      }
      return ent;
    }));
    
    if (selectedEnterprise && selectedEnterprise.id === id) {
      setSelectedEnterprise(prev => prev ? { ...prev, isFollowed: !prev.isFollowed } : undefined);
    }
  };

  const handleNavigate = (view: ViewName, data?: any, replace: boolean = false) => {
    if (checkAccess(view, data)) return;

    if (view === ViewName.ANNOUNCEMENT_DETAIL && data) {
      if (userRole === UserRole.FREE) {
        const id = data.id || '';
        const today = new Date().toISOString().split('T')[0];
        
        // Mid-session day check and auto-reset
        let currentIds = freeViewedIds;
        const stored = localStorage.getItem('free_viewed_opportunity_detail_ids');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
              if (parsed.date !== today) {
                currentIds = [];
                setFreeViewedIds([]);
                localStorage.setItem('free_viewed_opportunity_detail_ids', JSON.stringify({ date: today, viewedIds: [] }));
              } else {
                currentIds = parsed.viewedIds || [];
                if (JSON.stringify(currentIds) !== JSON.stringify(freeViewedIds)) {
                  setFreeViewedIds(currentIds);
                }
              }
            }
          } catch {
            currentIds = [];
          }
        }

        if (!currentIds.includes(id) && currentIds.length >= 10) {
          openPaywall('DETAIL_QUOTA');
          return;
        }
        if (id && !currentIds.includes(id)) {
          const next = [...currentIds, id];
          setFreeViewedIds(next);
          localStorage.setItem('free_viewed_opportunity_detail_ids', JSON.stringify({ date: today, viewedIds: next }));
        }
      }
      setSelectedOpportunity(data);
    }
    if (view === ViewName.ENTERPRISE_DETAIL && data) {
      if (userRole === UserRole.FREE) {
        const id = data.id || '';
        const today = new Date().toISOString().split('T')[0];
        
        let currentIds = freeViewedEnterpriseIds;
        const stored = localStorage.getItem('enterpriseDetailViews');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
              if (parsed.date !== today) {
                currentIds = [];
                setFreeViewedEnterpriseIds([]);
                localStorage.setItem('enterpriseDetailViews', JSON.stringify({ date: today, viewedIds: [] }));
              } else {
                currentIds = parsed.viewedIds || [];
                if (JSON.stringify(currentIds) !== JSON.stringify(freeViewedEnterpriseIds)) {
                  setFreeViewedEnterpriseIds(currentIds);
                }
              }
            }
          } catch {
            currentIds = [];
          }
        }

        if (!currentIds.includes(id) && currentIds.length >= 10) {
          openPaywall('ENTERPRISE_QUOTA');
          return;
        }
        if (id && !currentIds.includes(id)) {
          const next = [...currentIds, id];
          setFreeViewedEnterpriseIds(next);
          localStorage.setItem('enterpriseDetailViews', JSON.stringify({ date: today, viewedIds: next }));
        }
      }
      setSelectedEnterprise(data);
    }
    if (view === ViewName.OPPORTUNITY_LIST && data?.query !== undefined) {
      setSearchQuery(data.query);
      setOppListState({
        ...initialOppListState,
        searchQuery: data.query,
        hasLoadedOnce: false
      });
    } else if (view === ViewName.OPPORTUNITY_LIST) {
      setSearchQuery('');
    }
    if (view === ViewName.ENTERPRISE_LIST && data?.query !== undefined) {
      setSearchQuery(data.query);
      setEntListState({
        ...initialEntListState,
        searchQuery: data.query,
        hasLoadedOnce: false
      });
    } else if (view === ViewName.ENTERPRISE_LIST) {
      setSearchQuery('');
    }
    
    if (view === ViewName.CONTACT_PROJECTS && data) {
      setContactProjectsData(data);
    }

    if (view === ViewName.MEMBER_CENTER) {
      setMemberCenterData(data || undefined);
    }

    if (view === ViewName.ADD_SUBSCRIPTION) {
      setEditingPlan(data || null);
    }
    
    if (!replace) {
      setHistory(prev => [...prev, currentView]);
    }
    setCurrentView(view);
    
    // Reset scroll position of the main container
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  };

  const checkAccess = (view: ViewName, data?: any) => {
    if (view === ViewName.ADD_SUBSCRIPTION && userRole === UserRole.FREE) {
      const isEditing = !!data;
      if (!isEditing && subscriptionPlans.length >= 1) {
        openPaywall('SUBSCRIPTION_LIMIT');
        return true;
      }
    }

    const vipFeatures: ViewName[] = [];
    const svipFeatures: ViewName[] = [];
    const svipProFeatures: ViewName[] = [];

    if (vipFeatures.includes(view) && userRole === UserRole.FREE) {
      setRequiredRole(UserRole.VIP);
      setFeatureDescription(FEATURE_DESCRIPTIONS[view] || '');
      setShowVipModal(true);
      return true;
    }
    
    if (svipFeatures.includes(view) && (userRole === UserRole.FREE || userRole === UserRole.VIP)) {
      setRequiredRole(UserRole.SVIP);
      setFeatureDescription(FEATURE_DESCRIPTIONS[view] || '');
      setShowVipModal(true);
      return true;
    }
    
    if (svipProFeatures.includes(view) && userRole !== UserRole.SVIP) {
      setRequiredRole(UserRole.SVIP);
      setFeatureDescription(FEATURE_DESCRIPTIONS[view] || '');
      setShowVipModal(true);
      return true;
    }

    return false;
  };

  const handleBack = () => {
    setHistory(prev => {
      const newHistory = [...prev];
      const previousView = newHistory.pop();
      if (previousView) {
        setCurrentView(previousView);
        return newHistory;
      }
      return prev;
    });
  };

  const handleTabChange = (view: ViewName) => {
    if (checkAccess(view)) return;
    if (view === currentView) {
      const container = document.getElementById('main-scroll-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (view !== ViewName.HOME && view !== ViewName.OPPORTUNITY_LIST) {
        setToast({ message: '已返回顶部并刷新', visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 2000);
      }
      if (view === ViewName.OPPORTUNITY_LIST) {
        setOppListState(initialOppListState);
      }
      if (view === ViewName.ENTERPRISE_LIST) {
        setEntListState(initialEntListState);
      }
      window.dispatchEvent(new CustomEvent('tabReselected', { detail: view }));
      return;
    }
    setHistory([]);
    setSearchQuery('');
    setCurrentView(view);
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  };

  const renderScreen = () => {
    switch (currentView) {
      case ViewName.HOME:
        return (
          <Home 
            onNavigate={handleNavigate} 
            opportunities={opportunities} 
            onToggleStar={toggleOpportunityStar} 
            showToast={showToast}
            userRole={userRole}
            feedStatusOverride={feedStatusOverride}
            setFeedStatusOverride={setFeedStatusOverride}
            isOfflineError={isOfflineError}
            setIsOfflineError={setIsOfflineError}
          />
        );
      case ViewName.OPPORTUNITY_LIST:
        return <OpportunityList onNavigate={handleNavigate} onBack={handleBack} initialQuery={searchQuery} opportunities={opportunities} onToggleStar={toggleOpportunityStar} userRole={userRole} subscriptionPlans={subscriptionPlans} vipCities={vipCities} showToast={showToast} feedStatusOverride={feedStatusOverride} listState={oppListState} setListState={setOppListState} onShowPaymentModal={openPaywall} addExportRecord={addExportRecord} exportStatusOverride={exportStatusOverride} onAddSubscription={(plan) => {
          if (userRole === UserRole.FREE && subscriptionPlans.length >= 1) {
            openPaywall('SUBSCRIPTION_LIMIT');
            return false;
          }
          const newPlan: SubscriptionPlan = {
            ...plan as SubscriptionPlan,
            id: Math.random().toString(36).substr(2, 9),
            isDefault: subscriptionPlans.length === 0
          };
          setSubscriptionPlans([...subscriptionPlans, newPlan]);
          return true;
        }} />;
      case ViewName.ANNOUNCEMENT_DETAIL:
        return (
          <AnnouncementDetail 
            opportunity={selectedOpportunity} 
            onBack={handleBack} 
            onNavigate={handleNavigate}
            onToggleStar={toggleOpportunityStar}
            followedContacts={followedContacts}
            onToggleContactFollow={toggleContactFollow}
            userRole={userRole}
            aiDetailStatusOverride={aiDetailStatusOverride}
            originalDetailStatusOverride={originalDetailStatusOverride}
            freeViewedCount={freeViewedIds.length}
            onShowPaymentModal={openPaywall}
            onUpgrade={(sceneId) => {
              if (sceneId === 'CONTACT_FOLLOW' || sceneId === 'CONTACT_PHONE') {
                openPaywall(sceneId);
              } else {
                setRequiredRole(UserRole.SVIP);
                setTargetVipTab('svip');
                setFeatureDescription(sceneId || '一键联系项目负责人');
                setShowVipModal(true);
              }
            }}
          />
        );
      case ViewName.ENTERPRISE_LIST:
        return <EnterpriseList onNavigate={handleNavigate} enterprises={enterprises} initialQuery={searchQuery} onToggleFollow={toggleEnterpriseFollow} userRole={userRole} feedStatusOverride={feedStatusOverride} listState={entListState} setListState={setEntListState} onShowPaymentModal={openPaywall} addExportRecord={addExportRecord} exportStatusOverride={exportStatusOverride} />;
      case ViewName.ENTERPRISE_DETAIL:
        return <EnterpriseDetail enterprise={selectedEnterprise} onBack={handleBack} onNavigate={handleNavigate} userRole={userRole} enterpriseInfo={enterpriseInfo} onToggleFollow={toggleEnterpriseFollow} onShowPaymentModal={openPaywall} addExportRecord={addExportRecord} exportStatusOverride={exportStatusOverride} />;
      case ViewName.SUBSCRIPTION:
        return (
          <Subscription 
            onNavigate={handleNavigate} 
            opportunities={opportunities} 
            enterprises={enterprises} 
            onToggleStar={toggleOpportunityStar} 
            onToggleFollow={toggleEnterpriseFollow} 
            userRole={userRole}
            plans={subscriptionPlans}
            onSetDefault={handleSetDefaultSubscription}
            onShowPaymentModal={openPaywall}
            addExportRecord={addExportRecord}
            exportStatusOverride={exportStatusOverride}
          />
        );
      case ViewName.ADD_SUBSCRIPTION:
        return (
          <AddSubscription 
            onBack={handleBack} 
            onAdd={handleAddSubscription} 
            onUpdate={handleUpdateSubscription}
            editingPlan={editingPlan}
          />
        );
      case ViewName.SUBSCRIPTION_MANAGEMENT:
        return (
          <SubscriptionManagement 
            onBack={handleBack} 
            onNavigate={handleNavigate} 
            plans={subscriptionPlans}
            onDelete={handleDeleteSubscription}
            onSetDefault={handleSetDefaultSubscription}
            userRole={userRole}
          />
        );
      case ViewName.MEMBER_CENTER:
        return (
          <MemberCenter 
            onBack={handleBack} 
            onNavigate={handleNavigate} 
            userRole={userRole} 
            initialTab={memberCenterData?.initialTab || memberCenterData?.tab} 
            initialPlanId={memberCenterData?.initialPlanId}
            upgradeType={memberCenterData?.upgradeType}
            showToast={showToast} 
            setUserRole={setUserRole} 
            membership={membership}
            setMembership={setMembership}
          />
        );
      case ViewName.PROJECT_CONTACTS:
        return <ProjectContacts 
                 onBack={handleBack} 
                 contacts={followedContacts} 
                 onUnfollow={(id) => setFollowedContacts(prev => prev.filter(c => c.id !== id))} 
                 onNavigate={handleNavigate}
                 userRole={userRole} 
               />;
      case ViewName.PROJECT_TIMELINE:
        return <ProjectTimeline onBack={handleBack} opportunity={selectedOpportunity} onNavigate={handleNavigate} />;
      case ViewName.MY_SCHEDULE:
        return <MySchedule onBack={handleBack} onNavigate={handleNavigate} schedules={schedules} setSchedules={setSchedules} setDraftSchedule={setDraftSchedule} setSelectedOpportunityForSchedule={setSelectedOpportunityForSchedule} />;
      case ViewName.ADD_SCHEDULE:
        return <AddSchedule draftSchedule={draftSchedule} setDraftSchedule={setDraftSchedule} onBack={handleBack} onNavigate={handleNavigate} setSchedules={setSchedules} selectedOpp={selectedOpportunityForSchedule} onClearSelectedOpp={() => setSelectedOpportunityForSchedule(undefined)} />;
      case ViewName.SELECT_OPPORTUNITY:
        return (
          <SelectOpportunity 
            onBack={handleBack} 
            opportunities={opportunities} 
            onSelect={(opp) => {
              setSelectedOpportunityForSchedule(opp);
              handleBack();
            }} 
          />
        );
      case ViewName.BROWSING_HISTORY:
        return <BrowsingHistory onBack={handleBack} onNavigate={handleNavigate} />;
      case ViewName.EXPORT_RECORDS:
        return <ExportRecords 
                  onBack={handleBack} 
                  userRole={userRole} 
                  onNavigate={handleNavigate}
                  onShowPaymentModal={openPaywall}
                  onShowExportVipPrompt={handleShowExportVipPrompt}
                  exportRecords={exportRecords}
                  setExportRecords={setExportRecords}
                />;
      case ViewName.ENTERPRISE_INFO:
        return (
          <EnterpriseInfo 
            onBack={handleBack} 
            initialData={enterpriseInfo} 
            onSave={saveEnterpriseInfo}
            onDelete={deleteEnterpriseInfo}
          />
        );
      case ViewName.CONTACT_PROJECTS:
        return (
          <ContactProjects 
            onBack={handleBack} 
            onNavigate={handleNavigate} 
            contactName={contactProjectsData?.contactName || ''} 
            enterpriseName={contactProjectsData?.enterpriseName || ''} 
          />
        );
      case ViewName.USER_CENTER:
        return <UserCenter onNavigate={handleNavigate} userRole={userRole} setUserRole={setUserRole} membership={membership} />;
      case ViewName.FEEDBACK:
        return <Feedback onBack={handleBack} showToast={showToast} />;
      case ViewName.MESSAGE_LIST:
        return <MessageList onBack={handleBack} />;
      default:
        return (
          <Home 
            onNavigate={handleNavigate} 
            opportunities={opportunities} 
            onToggleStar={toggleOpportunityStar} 
            showToast={showToast}
            userRole={userRole}
            feedStatusOverride={feedStatusOverride}
            setFeedStatusOverride={setFeedStatusOverride}
            isOfflineError={isOfflineError}
            setIsOfflineError={setIsOfflineError}
          />
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center sm:p-4">
      <div id="mobile-shell" className="mobile-container bg-bg-page w-full h-screen sm:w-[375px] sm:h-[812px] sm:rounded-[32px] sm:shadow-2xl sm:border-[8px] sm:border-gray-900 relative overflow-hidden transform-gpu">
        <div id="main-scroll-container" className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar">
          {renderScreen()}
        </div>
        
        {/* Toast Notification */}
        {toast.visible && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-800 text-white px-6 py-3 rounded-[8px] text-[14px] z-[100] animate-fade-in max-w-[80vw] min-w-fit w-auto text-center leading-relaxed shadow-lg break-words flex items-center justify-center">
            {toast.message}
          </div>
        )}

        <VipPromptModal 
          isOpen={showVipModal} 
          requiredRole={requiredRole}
          currentUserRole={userRole}
          featureDescription={featureDescription}
          title={customModalTitle}
          buttonText={customModalButtonText}
          secondaryButtonText={customSecondaryModalButtonText}
          onSecondaryAction={customOnSecondaryAction ? () => {
            setShowVipModal(false);
            setTargetVipTab(undefined);
            setCustomModalTitle(undefined);
            setCustomModalButtonText(undefined);
            setCustomSecondaryModalButtonText(undefined);
            setCustomOnSecondaryAction(undefined);
            customOnSecondaryAction();
          } : undefined}
          onClose={() => {
            setShowVipModal(false);
            setTargetVipTab(undefined);
            setCustomModalTitle(undefined);
            setCustomModalButtonText(undefined);
            setCustomSecondaryModalButtonText(undefined);
            setCustomOnSecondaryAction(undefined);
            setCustomOnPrimaryAction(undefined);
          }} 
          onGoToBuy={customOnPrimaryAction ? () => {
            setShowVipModal(false);
            setTargetVipTab(undefined);
            setCustomModalTitle(undefined);
            setCustomModalButtonText(undefined);
            setCustomSecondaryModalButtonText(undefined);
            setCustomOnSecondaryAction(undefined);
            const priAction = customOnPrimaryAction;
            setCustomOnPrimaryAction(undefined);
            priAction();
          } : () => {
            setShowVipModal(false);
            const targetTab: 'vip' | 'svip' = requiredRole === UserRole.SVIP ? 'svip' : 'vip';
            
            setTargetVipTab(undefined);
            setCustomModalTitle(undefined);
            setCustomModalButtonText(undefined);
            setCustomSecondaryModalButtonText(undefined);
            setCustomOnSecondaryAction(undefined);
            setCustomOnPrimaryAction(undefined);
            handleNavigate(ViewName.MEMBER_CENTER, { initialTab: targetTab });
          }} 
        />

        {![ViewName.PROJECT_TIMELINE, ViewName.MY_SCHEDULE, ViewName.ADD_SCHEDULE, ViewName.SELECT_OPPORTUNITY, ViewName.EXPORT_RECORDS, ViewName.ENTERPRISE_INFO, ViewName.CONTACT_PROJECTS, ViewName.MESSAGE_LIST, ViewName.FEEDBACK].includes(currentView) && (
          <BottomNav currentView={currentView} onChangeView={handleTabChange} />
        )}

        {/* Floating Role Switcher Button */}
        <DraggableButton onClick={() => setShowRoleSwitcher(true)} />

        {/* Role Switcher Modal */}
        {showRoleSwitcher && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowRoleSwitcher(false)}>
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Settings size={18} className="text-blue-500" />
                  开发期调试面板
                </h3>
                <button onClick={() => setShowRoleSwitcher(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto no-scrollbar">
                {/* Section 1: User Role Switcher */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1 select-none">
                    <span>👤 演示身份 / 会员级别</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(UserRole).map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setUserRole(role);
                        }}
                        className={`flex items-center justify-center px-1 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer text-center select-none ${
                          userRole === role 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <span className="truncate">{getRoleLabel(role)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2: Home Feed Status Switcher */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1 select-none">
                    <span>📰 信息流状态（首页 / 商机 / 企业）</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'auto', label: '正常（默认）' },
                      { id: 'loading', label: '加载中' },
                      { id: 'error_normal', label: '加载失败' },
                      { id: 'error_offline', label: '无网络失败' },
                      { id: 'empty', label: '空状态' },
                    ].map((statusItem) => {
                      // Check if active
                      let isActive = false;
                      if (statusItem.id === 'auto' && (feedStatusOverride === 'auto' || feedStatusOverride === 'ready')) isActive = true;
                      else if (statusItem.id === 'loading' && feedStatusOverride === 'loading') isActive = true;
                      else if (statusItem.id === 'error_normal' && feedStatusOverride === 'error' && !isOfflineError) isActive = true;
                      else if (statusItem.id === 'error_offline' && feedStatusOverride === 'error' && isOfflineError) isActive = true;
                      else if (statusItem.id === 'empty' && feedStatusOverride === 'empty') isActive = true;

                      return (
                        <button
                          key={statusItem.id}
                          onClick={() => {
                            if (statusItem.id === 'auto') {
                              setFeedStatusOverride('auto');
                            } else if (statusItem.id === 'loading') {
                              setFeedStatusOverride('loading');
                            } else if (statusItem.id === 'error_normal') {
                              setFeedStatusOverride('error');
                              setIsOfflineError(false);
                            } else if (statusItem.id === 'error_offline') {
                              setFeedStatusOverride('error');
                              setIsOfflineError(true);
                            } else if (statusItem.id === 'empty') {
                              setFeedStatusOverride('empty');
                            }
                          }}
                          className={`flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate whitespace-nowrap select-none ${
                            isActive
                              ? statusItem.id === 'error_normal'
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : statusItem.id === 'error_offline'
                                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                : statusItem.id === 'empty'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-[#1677FF] text-white border-[#1677FF] shadow-sm'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          {statusItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2.1: AI Interpretation Status Switcher */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1 select-none">
                    <span>🤖 AI 解读状态（公告详情）</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'normal', label: '正常（默认）' },
                      { id: 'error', label: '生成失败' },
                    ].map((statusItem) => {
                      const isActive = aiDetailStatusOverride === statusItem.id;
                      return (
                        <button
                          key={statusItem.id}
                          onClick={() => {
                            setAiDetailStatusOverride(statusItem.id as 'normal' | 'error');
                          }}
                          className={`flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate whitespace-nowrap select-none ${
                            isActive
                              ? statusItem.id === 'error'
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : 'bg-[#1677FF] text-white border-[#1677FF] shadow-sm'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          {statusItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2.1.2: Original Announcement Status Switcher */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1 select-none">
                    <span>📄 公告原文状态（公告详情）</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'success', label: '正常（默认）' },
                      { id: 'error', label: '加载失败' },
                    ].map((statusItem) => {
                      const isActive = originalDetailStatusOverride === statusItem.id;
                      return (
                        <button
                          key={statusItem.id}
                          onClick={() => {
                            setOriginalDetailStatusOverride(statusItem.id as 'success' | 'error');
                          }}
                          className={`flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate whitespace-nowrap select-none ${
                            isActive
                              ? statusItem.id === 'error'
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : 'bg-[#1677FF] text-white border-[#1677FF] shadow-sm'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          {statusItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2.1.5: Export Simulation Status Switcher */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1 select-none">
                    <span>📤 导出结果模拟（商机/企业）</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'completed', label: '成功（默认）' },
                      { id: 'failed', label: '失败' },
                    ].map((statusItem) => {
                      const isActive = exportStatusOverride === statusItem.id;
                      return (
                        <button
                          key={statusItem.id}
                          onClick={() => {
                            setExportStatusOverride(statusItem.id as 'completed' | 'failed');
                          }}
                          className={`flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate whitespace-nowrap select-none ${
                            isActive
                              ? statusItem.id === 'failed'
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : 'bg-[#1677FF] text-white border-[#1677FF] shadow-sm'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          {statusItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2.2: Opportunity List Sorting Switcher */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1 select-none">
                    <span>⏳ 商机列表排序（模拟测试）</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'latest', label: '最新发布' },
                      { id: 'deadline', label: '截止时间' },
                      { id: 'relevance', label: '智能推荐' },
                    ].map((sortItem) => {
                      const isActive = oppListState.sortBy === sortItem.id;
                      return (
                        <button
                          key={sortItem.id}
                          onClick={() => {
                            setOppListState(prev => ({
                              ...prev,
                              sortBy: sortItem.id as 'latest' | 'deadline' | 'relevance',
                              visibleCount: 8,
                              scrollTop: 0
                            }));
                            window.dispatchEvent(new CustomEvent('debugSetOppSort', { detail: sortItem.id }));
                          }}
                          className={`flex items-center justify-center px-2 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate select-none ${
                            isActive
                              ? 'bg-[#1677FF] text-white border-[#1677FF] shadow-sm'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          {sortItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2.5: Membership / Expiry testing */}
                <div className="border-t border-gray-100 pt-4">
                  <button 
                    onClick={() => setIsMembershipCollapsed(!isMembershipCollapsed)} 
                    className="w-full flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 focus:outline-none cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1">💳 会员套餐 / 有期验证</span>
                    {isMembershipCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                  
                  {!isMembershipCollapsed && (
                    <div className="mt-2 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Display read-only status */}
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 py-1.5 rounded-xl border border-gray-100 flex flex-col gap-1 mb-3">
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-400">当前角色:</span>
                          <span className="font-mono font-medium text-gray-700">{membership.role}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-400">套餐类型:</span>
                          <span className="font-mono font-medium text-gray-700">{membership.planType || '无'}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-400">有效期至:</span>
                          <span className="font-mono font-medium text-gray-700">{membership.expiryDate || '无'}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-400">剩余天数:</span>
                          <span className="font-mono font-medium text-gray-700">{getRemainingDays()}</span>
                        </div>
                      </div>

                      {/* Part 1: PlanType toggle */}
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 select-none">
                        套餐类型切换
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          disabled={membership.role === UserRole.FREE}
                          onClick={() => setMembership(prev => ({ ...prev, planType: 'monthly' }))}
                          className={`flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate select-none ${
                            membership.role === UserRole.FREE
                              ? 'bg-gray-50 border-gray-150 text-gray-300 cursor-not-allowed'
                              : membership.planType === 'monthly'
                              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          月度会员
                        </button>
                        <button
                          disabled={membership.role === UserRole.FREE}
                          onClick={() => setMembership(prev => ({ ...prev, planType: 'annual' }))}
                          className={`flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer truncate select-none ${
                            membership.role === UserRole.FREE
                              ? 'bg-gray-50 border-gray-150 text-gray-300 cursor-not-allowed'
                              : membership.planType === 'annual'
                              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          年度会员
                        </button>
                      </div>
                      {membership.role === UserRole.FREE && (
                        <div className="text-[10px] text-amber-600 mb-3 ml-0.5">⚠️ 请先切换为 VIP/SVIP 演示身份</div>
                      )}

                      {/* Part 2: Preset expiry date buttons */}
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 select-none">
                        有效期快捷设置
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { offset: 730, label: '超一年(+730)' },
                          { offset: 365, label: '正常(+365)' },
                          { offset: 3, label: '即将到期(+3)' },
                          { offset: -1, label: '已过期(-1)' }
                        ].map(preset => {
                          return (
                            <button
                              key={preset.offset}
                              disabled={membership.role === UserRole.FREE}
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + preset.offset);
                                const datStr = getFormattedDate(d);
                                setMembership(prev => ({ ...prev, expiryDate: datStr }));
                              }}
                              className={`flex items-center justify-center px-2 py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer truncate select-none ${
                                membership.role === UserRole.FREE
                                  ? 'bg-gray-50 border-gray-150 text-gray-300 cursor-not-allowed'
                                  : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Part 3: Immediate check button */}
                      <button
                        onClick={() => {
                          const isExpired = checkMembershipExpiry();
                          if (isExpired) {
                            setLastCheckResult({
                              type: 'downgraded',
                              text: '⚠️ 已过期，已降级为普通会员'
                            });
                          } else {
                            setLastCheckResult({
                              type: 'valid',
                              text: '✓ 当前未过期，校验通过'
                            });
                            showToast('当前会员未过期，校验通过');
                          }
                        }}
                        className="w-full py-2 px-3 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-xs rounded-xl transition-all cursor-pointer text-center font-bold"
                      >
                        检查过期并降级
                      </button>
                      {lastCheckResult && (
                        <div className={`mt-2 p-2 rounded-xl text-center text-xs font-semibold border ${
                          lastCheckResult.type === 'downgraded'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                        }`}>
                          {lastCheckResult.text}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1.5 text-center leading-normal">
                        模拟 App 重启时的过期检查：若当前为付费会员且已过期，则立即降级为普通会员
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 3: Data Resets (Testing) */}
                <div className="border-t border-gray-100 pt-4 font-sans text-left">
                  <button 
                    onClick={() => setIsResetCollapsed(!isResetCollapsed)} 
                    className="w-full flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider focus:outline-none cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1">🧪 数据重置（测试用）</span>
                    {isResetCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                  
                  {!isResetCollapsed && (
                    <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <button
                        onClick={() => {
                          resetTodayExportUsed();
                          localStorage.removeItem('enterpriseDetailViews');
                          localStorage.removeItem('free_viewed_opportunity_detail_ids');
                          setFreeViewedIds([]);
                          setFreeViewedEnterpriseIds([]);
                          showToast('已重置今日额度，可重新测试');
                        }}
                        className="w-full py-2.5 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-[#0D5EFA] font-medium text-xs rounded-xl transition-all cursor-pointer text-center font-semibold"
                      >
                        重置今日额度（导出 / 企业查看 / 商机已看）
                      </button>
                    </div>
                  )}
                </div>

                {/* Confirm closing button */}
                <button
                  onClick={() => setShowRoleSwitcher(false)}
                  className="mt-2 w-full py-2.5 bg-gray-100 hover:bg-gray-250 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  确 定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
