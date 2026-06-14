import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Tag, Check, Infinity, X, ChevronDown, ChevronUp, ChevronRight, Star, ArrowUpCircle, Lock } from 'lucide-react';
import { ViewName, UserRole, Membership } from '../types';
import { REGIONS } from '../src/constants/regions';

interface MemberCenterProps {
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
  userRole: UserRole;
  initialTab?: 'vip' | 'svip';
  initialPlanId?: string;
  upgradeType?: 'vip_to_svip_annual';
  showToast: (message: string) => void;
  setUserRole: (role: UserRole) => void;
  vipStartDate?: string;
  membershipStartDate?: string;
  purchaseDate?: string;
  membership?: Membership;
  setMembership?: (membership: Membership) => void;
}

export const MemberCenter: React.FC<MemberCenterProps> = ({ 
  onBack, 
  onNavigate, 
  userRole, 
  initialTab, 
  initialPlanId, 
  upgradeType, 
  showToast, 
  setUserRole, 
  vipStartDate,
  membershipStartDate,
  purchaseDate,
  membership,
  setMembership
}) => {
  const [activeTab, setActiveTab ] = useState<'vip' | 'svip'>(userRole === UserRole.SVIP ? 'svip' : (initialTab === 'vip' ? 'vip' : 'svip'));
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (membership?.role === UserRole.SVIP) return 'svip_annual';
    if (initialPlanId) return initialPlanId;
    if (initialTab === 'vip') return 'vip_annual';
    if (membership?.role === UserRole.VIP) return 'svip_upgrade_diff';
    return 'svip_annual';
  });

  const getFormattedDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayDate = getFormattedDate(new Date());

  const effectiveRole = (() => {
    if (membership?.svipTrialUntil && membership.svipTrialUntil >= todayDate) {
      return UserRole.SVIP;
    }
    if (membership && membership.role !== UserRole.FREE && membership.expiryDate && membership.expiryDate >= todayDate) {
      return membership.role;
    }
    return UserRole.FREE;
  })();

  const baseRangeRole = membership?.role || UserRole.FREE;

  const isCurrentlyInTrial = !!(membership?.svipTrialUntil && membership.svipTrialUntil >= todayDate);

  useEffect(() => {
    if (baseRangeRole === UserRole.SVIP) {
      setActiveTab('svip');
      setSelectedPlanId('svip_annual');
    } else {
      if (initialTab === 'svip' || initialTab === 'vip') {
        setActiveTab(initialTab);
      } else {
        setActiveTab('svip');
      }
      if (initialPlanId) {
        setSelectedPlanId(initialPlanId);
      } else {
        if (initialTab === 'vip') {
          setSelectedPlanId('vip_annual');
        } else {
          setSelectedPlanId(baseRangeRole === UserRole.VIP ? 'svip_upgrade_diff' : 'svip_annual');
        }
      }
    }
  }, [initialTab, initialPlanId, baseRangeRole]);

  const [couponCode, setCouponCode] = useState('');
  const [isDefaultPromo, setIsDefaultPromo] = useState(false);
  const [showPromoTooltip, setShowPromoTooltip] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>(membership?.vipCities || []);

  useEffect(() => {
    setSelectedCities(membership?.vipCities || []);
  }, [membership?.vipCities]);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(REGIONS[0]?.name || null);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isAgreementChecked, setIsAgreementChecked] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [isPaying, setIsPaying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<{
    type: 'first_open' | 'renewal' | 'svip_overlay' | 'svip_upgrade_diff';
    role: 'VIP' | 'SVIP';
    planType: 'monthly' | 'annual';
  } | null>(null);

  const roleLevels = {
    [UserRole.FREE]: 0,
    [UserRole.VIP]: 1,
    [UserRole.SVIP]: 2,
  };

  const annualPrices = {
    vip: 199,
    svip: 399,
  };

  const expiryDate = membership?.expiryDate || '';

  const addDaysStr = (baseStr: string, daysToAdd: number) => {
    try {
      const parts = baseStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      d.setDate(d.getDate() + daysToAdd);
      return getFormattedDate(d);
    } catch {
      const d = new Date();
      d.setDate(d.getDate() + daysToAdd);
      return getFormattedDate(d);
    }
  };

  const getRemainingDays = (expStr: string, todayStr: string) => {
    if (!expStr) return 0;
    try {
      const today = new Date(todayStr);
      today.setHours(0, 0, 0, 0);
      const expire = new Date(expStr);
      expire.setHours(0, 0, 0, 0);
      const diff = expire.getTime() - today.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch (e) {
      return 180; // fallback
    }
  };

  const remainingDays = getRemainingDays(expiryDate, todayDate);
  const startDate = vipStartDate || membershipStartDate || purchaseDate;

  const currentRoleLevel = roleLevels[baseRangeRole];
  const targetRoleLevel = roleLevels[activeTab.toUpperCase() as UserRole];
  
  const changeType: 'upgrade' | 'renewal' | 'downgrade' = 
    targetRoleLevel > currentRoleLevel 
      ? 'upgrade' 
      : targetRoleLevel === currentRoleLevel 
        ? 'renewal' 
        : 'downgrade';

  const isSvipReviewingVip = baseRangeRole === UserRole.SVIP && activeTab === 'vip';

  const isUpgrade = targetRoleLevel > currentRoleLevel && baseRangeRole !== UserRole.FREE;
  const isRenewal = targetRoleLevel === currentRoleLevel && baseRangeRole !== UserRole.FREE;

  const scrollRef = useRef<HTMLDivElement>(null);
  const mainScrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const allPlans = {
    vip: [
      { id: 'vip_monthly', name: 'VIP 月度会员', price: 19, originalPrice: null, tag: '', unit: '¥19/月' },
      { id: 'vip_annual', name: 'VIP 年度会员', price: 199, originalPrice: 228, tag: '超值推荐', unit: '约¥16.6/月' },
    ],
    svip: [
      { id: 'svip_monthly_auto', name: '连续包月', price: 19, originalPrice: 39, tag: '首月特惠', unit: '¥19/月' },
      { id: 'svip_monthly', name: '单月购买', price: 39, originalPrice: null, tag: '', unit: '¥39/月' },
      { id: 'svip_annual', name: '年度会员', price: 399, originalPrice: 468, tag: '超值推荐', unit: '约¥33.3/月' },
    ]
  };

  const allBenefits = [
    { name: '标讯详情查看', free: '每日 10 条', vip: '不限', svip: '不限' },
    { name: '地区筛选范围', free: '不支持', vip: '最多 3 个地级市（直辖市按整市计）', svip: '全国任意地市' },
    { name: '更多筛选能力', free: '基础筛选', vip: '已购地市内高级筛选', svip: '全国高级筛选' },
    { name: '商机订阅方案', free: '1 个方案', vip: '多个方案', svip: '多个方案' },
    { name: '项目联系方式', free: '不支持', vip: '不支持', svip: '支持' },
    { name: '企业信息查询', free: '每日 10 条', vip: '不限', svip: '不限' },
    { name: '数据导出额度', free: '不支持', vip: '10 条/天', svip: '50 条/天' },
    { name: '商机收藏', free: '支持', vip: '支持', svip: '支持' },
  ];

  const bannerData = {
    vip: { title: '解锁高级商机情报', desc: '地区筛选范围：最多 3 个地级市（直辖市按整市计） + 高级条件筛选' },
    svip: { title: '解锁全国商机情报', desc: '全国任意地市筛选 + 智能商机订阅' },
  };

  // VIP Upgrade details & calculations
  // TODO：上线必须接真实订单金额
  const vipPaidAmount = membership?.paidAmount ?? (membership?.planType === 'annual' ? 199 : 19);
  const vipTotalDays = membership?.planType === 'annual' ? 365 : 30;
  const vipRemainingDays = remainingDays;
  
  // SVIP Same period price
  const svipSamePeriodPrice = Math.round(
    ((membership?.planType === 'annual' ? 399 : 39) * vipRemainingDays) / vipTotalDays
  );
  
  // VIP remaining value deduction
  const vipDeduction = Math.round(
    (vipPaidAmount * vipRemainingDays) / vipTotalDays
  );
  
  // upgradePrice is svipSamePeriodPrice - vipDeduction, ensuring it's not negative and bounded nicely
  const calculatedDiffPrice = Math.max(0, svipSamePeriodPrice - vipDeduction);
  const upgradePrice = calculatedDiffPrice;
  const priceNewMonthly = Math.max(0, 39 - vipDeduction);   // 新购月度，按 VIP 剩余价值抵扣

  const currentPlans = (() => {
    if (activeTab === 'vip') {
      if (baseRangeRole === UserRole.VIP) {
        return [
          { id: 'vip_monthly', name: 'VIP 月度续费', price: 19, originalPrice: null, tag: '优惠续期', unit: '¥19/月' },
          { id: 'vip_annual', name: 'VIP 年度续费', price: 199, originalPrice: 228, tag: '推荐续费', unit: '约¥16.6/月' },
        ];
      }
      return [
        { id: 'vip_monthly', name: 'VIP 月度会员', price: 19, originalPrice: null, tag: '', unit: '¥19/月' },
        { id: 'vip_annual', name: 'VIP 年度会员', price: 199, originalPrice: 228, tag: '超值推荐', unit: '约¥16.6/月' },
      ];
    } else {
      // activeTab === 'svip'
      if (baseRangeRole === UserRole.VIP) {
        // VIP Upgrading to SVIP: show 3 options
        return [
          {
            id: 'svip_upgrade_diff',
            name: '补差升级',
            price: calculatedDiffPrice,
            originalPrice: null,
            tag: '最省',
            unit: '到期日不变',
          },
          {
            id: 'svip_monthly_new',
            name: 'SVIP 新购月度',
            price: priceNewMonthly,
            originalPrice: 39,
            tag: '',
            unit: '今起30天',
          },
          {
            id: 'svip_upgrade_diff_plus_year',
            name: '补差升级 + 续一年',
            price: calculatedDiffPrice + 399,
            originalPrice: null,
            tag: '升级并续费',
            unit: '延长一年',
          },
        ];
      } else if (baseRangeRole === UserRole.SVIP) {
        // SVIP user: renewal
        return [
          { id: 'svip_monthly', name: 'SVIP 月度续费', price: 39, originalPrice: null, tag: '月度续期', unit: '单月 ¥39' },
          { id: 'svip_annual', name: 'SVIP 年度续费', price: 399, originalPrice: 468, tag: '推荐续费', unit: '约¥33.3/月' },
        ];
      } else {
        // FREE user
        return [
          { id: 'svip_monthly_auto', name: '连续包月', price: 19, originalPrice: 39, tag: '首月特惠', unit: '¥19/月' },
          { id: 'svip_monthly', name: '单月购买', price: 39, originalPrice: null, tag: '', unit: '¥39/月' },
          { id: 'svip_annual', name: '年度会员', price: 399, originalPrice: 468, tag: '超值推荐', unit: '约¥33.3/月' }
        ];
      }
    }
  })();

  const currentBanner = bannerData[activeTab];
  
  // Ensure selected plan is valid for current tab
  const currentPlan = currentPlans.find(p => p.id === selectedPlanId) || currentPlans[0];

  const isVipToSvipUpgradeActive =
    baseRangeRole === UserRole.VIP &&
    activeTab === 'svip' &&
    remainingDays > 0;

  const calculateFinalPrice = () => {
    return currentPlan?.price ?? 0;
  };

  const finalPrice = calculateFinalPrice();

  const user = {
    name: '用户1',
    phone: '13800138000'
  };

  const displayName = user.name || user.phone;

  const handleTabChange = (tab: 'vip' | 'svip') => {
    setActiveTab(tab);
    // Select default plan for the new tab
    if (tab === 'vip') setSelectedPlanId('vip_annual');
    if (tab === 'svip') {
      if (membership?.role === UserRole.VIP) {
        setSelectedPlanId('svip_upgrade_diff');
      } else {
        setSelectedPlanId('svip_annual');
      }
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.FREE: return '普通会员';
      case UserRole.VIP: return 'VIP';
      case UserRole.SVIP: return 'SVIP';
      default: return '普通会员';
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.FREE: return 'FREE';
      case UserRole.VIP: return 'VIP';
      case UserRole.SVIP: return 'SVIP';
      default: return 'FREE';
    }
  };

  const handleCityToggle = (city: string) => {
    if (selectedCities.includes(city)) {
      setSelectedCities(prev => prev.filter(c => c !== city));
    } else {
      if (selectedCities.length >= 3) {
        showToast('最多只能选择 3 个地级市（直辖市按整市计）');
        return;
      }
      setSelectedCities(prev => [...prev, city]);
    }
  };

  const roleLabels: Record<string, string> = {
    free: '普通会员',
    vip: 'VIP',
    svip: 'SVIP'
  };

  const columnOrder: ('free' | 'vip' | 'svip')[] = ['free', 'vip', 'svip'];
  const sortedColumns = [
    activeTab,
    ...columnOrder.filter(c => c !== activeTab)
  ];

  const handleConfirmPayment = () => {
    if (changeType === 'downgrade') {
      return;
    }

    const purchaseRole = (activeTab === 'vip' ? 'VIP' : 'SVIP') as 'VIP' | 'SVIP';
    const planType: 'monthly' | 'annual' = 
      (currentPlan?.id?.includes('annual') || currentPlan?.id === 'svip_upgrade_diff' || currentPlan?.id === 'svip_upgrade_diff_plus_year')
        ? 'annual'
        : 'monthly';
    
    let purchaseType: 'first_open' | 'renewal' | 'svip_upgrade_diff' = 'first_open';
    if (currentPlan?.id === 'svip_upgrade_diff' || currentPlan?.id === 'svip_upgrade_diff_plus_year') {
      purchaseType = 'svip_upgrade_diff';
    } else if (changeType === 'renewal') {
      purchaseType = 'renewal';
    } else {
      purchaseType = 'first_open';
    }

    setLastPurchase({
      type: purchaseType as any,
      role: purchaseRole,
      planType
    });

    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setShowPaymentModal(false);
      
      const days = planType === 'annual' ? 365 : 30;

      if (setMembership) {
        if (purchaseType === 'svip_upgrade_diff') {
          // VIP -> SVIP 补差升级 (转换, 单一时间线)
          const isPlusYear = currentPlan?.id === 'svip_upgrade_diff_plus_year';
          setMembership({
            ...membership!,
            role: UserRole.SVIP,
            vipCities: [], // 地市并入全国
            svipTrialUntil: null, // 实装升级，停止免费体验
            ...(isPlusYear ? {
              planType: 'annual',
              expiryDate: addDaysStr(membership!.expiryDate || todayDate, 365)
            } : {})
          });
        } else if (purchaseType === 'renewal') {
          // 同级续费
          const baseDateStr = (membership?.expiryDate && membership.expiryDate >= todayDate) 
            ? membership.expiryDate 
            : todayDate;
          const finalExpiryDate = addDaysStr(baseDateStr, days);
          setMembership({
            ...membership!,
            planType,
            expiryDate: finalExpiryDate,
            paidAmount: finalPrice
          });
        } else {
          // first_open
          // 仅 userRole === FREE 时才允许全新开通。
          const finalExpiryDate = addDaysStr(todayDate, days);
          const cities = purchaseRole === 'VIP' ? selectedCities : [];
          setMembership({
            role: purchaseRole === 'VIP' ? UserRole.VIP : UserRole.SVIP,
            planType,
            expiryDate: finalExpiryDate,
            vipCities: cities,
            svipTrialUntil: null,
            svipTrialUsed: membership?.svipTrialUsed ?? false,
            paidAmount: finalPrice
          });
        }
      }

      setShowSuccessModal(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 font-sans flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#F5F7FA] sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">会员中心</h1>
        <div className="w-10"></div>
      </div>

      <div ref={mainScrollContainerRef} className="px-4 space-y-4 flex-1 overflow-y-auto pb-32">
        {/* User Card */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                effectiveRole === UserRole.FREE ? 'bg-blue-50 text-blue-600' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {getRoleBadge(effectiveRole)}
              </span>
            </div>
            <p className="text-xs text-gray-500">当前版本：{getRoleLabel(effectiveRole)}</p>
            {effectiveRole !== UserRole.FREE && (
              <div className="text-xs text-[#6B7280] mt-1 space-y-0.5">
                {isCurrentlyInTrial ? (
                  <>
                    <span className="block text-amber-700 font-bold">SVIP 体验中（至 {membership?.svipTrialUntil}）</span>
                    <span className="block text-gray-500">会员有效期至：{expiryDate}</span>
                  </>
                ) : effectiveRole === UserRole.VIP ? (
                  <span>{membershipStartDate ? `VIP 有效期：${membershipStartDate} 至 ${expiryDate}` : `VIP 有效期至：${expiryDate}`}</span>
                ) : (
                  <span>SVIP 有效期至：{expiryDate}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {isCurrentlyInTrial && (
          <div id="trial_active_banner" className="bg-[#FFF8E6] border border-[#FDEBBA] rounded-2xl p-4 shadow-sm text-left">
            <p className="text-[#B8860B] font-bold text-xs leading-relaxed">
              SVIP 体验中(至 {membership?.svipTrialUntil}) · 会员有效期 {expiryDate} 不变
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button 
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'vip' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
            onClick={() => handleTabChange('vip')}
          >
            VIP
          </button>
          <button 
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'svip' ? 'bg-[#FFF8E6] text-[#B8860B]' : 'text-gray-500'}`}
            onClick={() => handleTabChange('svip')}
          >
            SVIP
          </button>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-br from-[#FFFDF8] to-[#FFF8E6] border border-[#FDEBBA] rounded-2xl p-4 shadow-md relative overflow-hidden group">
          {/* Decorative light effect */}
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              ★
            </div>
            <span className="text-[#B8860B] text-[10px] font-bold tracking-[0.1em] uppercase">
              {activeTab === 'vip' ? 'VIP 权益升级' : 'SVIP 权益升级'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 relative z-10 tracking-tight">{currentBanner.title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed relative z-10">{currentBanner.desc}</p>
        </div>

        {/* Plans and Region Selection or SVIP/VIP Fact Statement */}
        {isSvipReviewingVip ? (
          <div id="svip_vip_info_block" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 text-center flex flex-col items-center justify-center gap-4 py-12 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-[#B8860B] shadow-inner mb-1">
              <Star className="w-8 h-8 fill-[#B8860B]/10 text-[#B8860B]" />
            </div>
            <div className="space-y-2 max-w-sm px-4">
              <h4 className="text-base font-bold text-gray-900 leading-normal">您当前是 SVIP 会员</h4>
              <p className="text-sm text-gray-650 leading-relaxed font-normal">
                您当前是 SVIP，已包含 VIP 全部权益。SVIP 到期后，可自由选择开通 VIP 或续费 SVIP。
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Plans */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3">选择订阅方案</h3>
              <div className={`grid gap-3 ${currentPlans.length === 1 ? 'grid-cols-1' : currentPlans.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {currentPlans.map((plan) => {
                  const displayTag = plan.tag;
                  const isSelected = selectedPlanId === plan.id;
                  const isUpgradeDiffType = plan.id === 'svip_upgrade_diff' || plan.id === 'svip_upgrade_diff_plus_year';
                  const isNewMonthly = plan.id === 'svip_monthly_new';
                  const isNewMonthlyLocked = isNewMonthly && baseRangeRole === UserRole.VIP && remainingDays >= 30;
                  const newMonthlyLockReason = '有效期不少于 30 天时，新购月度会重置为今起 30 天、反而缩短有效期，建议改用补差升级。';
                  
                  if (isUpgradeDiffType) {
                    return (
                      <div 
                        key={plan.id}
                        id={`plan_card_${plan.id}`}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`relative bg-white rounded-2xl p-4 flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-red-500 shadow-md bg-rose-50/10' 
                            : 'border-transparent shadow-sm'
                        }`}
                      >
                        {displayTag && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm text-white bg-gradient-to-r from-red-500 to-rose-600">
                            {displayTag}
                          </div>
                        )}
                        <div className="text-sm font-semibold text-red-950 mb-2">{plan.name}</div>
                        
                        <div className="flex items-baseline mb-1 text-red-600">
                          <span className="text-sm font-bold">¥</span>
                          <span className="text-3xl font-extrabold tracking-tighter">{plan.price}</span>
                        </div>
                        {plan.unit && (
                          <div className="text-[10px] px-2 py-0.5 rounded-full mt-auto text-red-700 bg-red-50">
                            {plan.unit}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isNewMonthlyLocked) {
                    return (
                      <div 
                        key={plan.id}
                        id={`plan_card_${plan.id}`}
                        onClick={() => {
                          showToast(newMonthlyLockReason);
                        }}
                        className="relative bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 opacity-60 cursor-not-allowed transition-all shadow-sm"
                      >
                        {displayTag && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm text-white bg-gray-400">
                            {displayTag}
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-400 mb-2">{plan.name}</div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-bold mt-1.5 mb-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>暂不可选</span>
                        </div>
                        <div className="text-[9px] text-gray-500 font-medium px-1 py-0.5 mt-auto text-center leading-tight">
                          有效期较长，建议补差升级
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={plan.id}
                      id={`plan_card_${plan.id}`}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                      }}
                      className={`relative bg-white rounded-2xl p-4 flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#B8860B] shadow-md bg-[#FFF8E6]/10' 
                          : 'border-transparent shadow-sm'
                      }`}
                    >
                      {displayTag && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm text-white bg-gradient-to-r from-yellow-400 to-yellow-500">
                          {displayTag}
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900 mb-2">{plan.name}</div>
                      
                      <div className="flex items-baseline mb-1 text-[#B8860B]">
                        <span className="text-sm font-bold">¥</span>
                        <span className="text-3xl font-extrabold tracking-tighter">{plan.price}</span>
                      </div>
                      {plan.originalPrice && (
                        <div className="text-xs text-gray-400 line-through mb-1">¥{plan.originalPrice}</div>
                      )}
                      {plan.unit && (
                        <div className="text-[10px] px-2 py-0.5 rounded-full mt-auto text-[#B8860B] bg-[#FFF8E6]">
                          {plan.unit}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Conditional detailed instructions inside SVIP membership area */}
              {activeTab === 'svip' && baseRangeRole === UserRole.VIP && (
                <div className="mt-4 space-y-4 font-sans text-left">
                  {(currentPlan?.id === 'svip_upgrade_diff' || currentPlan?.id === 'svip_upgrade_diff_plus_year') && (
                    <div id="svip_upgrade_diff_hint" className="bg-[#ECF2FF] rounded-3xl p-5 border border-[#CCDCFF] space-y-4 animate-in fade-in duration-200">
                      
                      {/* Header with blue icon and title */}
                      <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm border-b border-blue-200/40 pb-2">
                        <ArrowUpCircle className="w-5 h-5 text-blue-600 fill-blue-50" />
                        <span>VIP升级SVIP会员</span>
                      </div>

                      {/* White inner explanation box */}
                      <div className="bg-white rounded-2xl p-4 border border-blue-100 text-xs text-blue-700 leading-relaxed font-semibold shadow-sm">
                        {currentPlan?.id === 'svip_upgrade_diff_plus_year' 
                          ? '您当前已是VIP会员，本次仅补齐剩余到期日前 VIP 与 SVIP 的差价，并同时延续一整年 SVIP。升级后有效期将增加 365 天。'
                          : '您当前已是VIP会员，本次仅补齐剩余有效期内 VIP 与 SVIP 的权益差价。升级后有效期不变，权益范围升级为全国。'}
                      </div>

                      {/* Detail rows */}
                      <div className="bg-white/70 rounded-2xl p-4 border border-blue-200/50 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-gray-600 font-medium">
                          <span>补差周期：</span>
                          <span className="font-extrabold text-blue-950">{addDaysStr(todayDate, 1)} 至 {expiryDate || '2027-06-11'}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 font-medium">
                          <span>剩余天数：</span>
                          <span className="font-extrabold text-blue-950">{vipRemainingDays}天</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 font-medium">
                          <span>年度差价：</span>
                          <span className="font-extrabold text-blue-950">SVIP 399元 - VIP 199元 = 200元</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 font-medium">
                          <span>计算方式：</span>
                          <span className="font-extrabold text-[#3B82F6]">200元 / 365天 × {vipRemainingDays}天</span>
                        </div>
                        
                        <div className="border-t border-dashed border-blue-200 pt-2.5 flex justify-between items-center text-sm font-bold">
                          <span className="text-gray-800">{currentPlan?.id === 'svip_upgrade_diff_plus_year' ? '补差升级' : '本次应补'}：</span>
                          <span className="text-gray-900 font-extrabold">￥{upgradePrice}</span>
                        </div>
                        {currentPlan?.id === 'svip_upgrade_diff_plus_year' && (
                          <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                            <span>+ 续费一年：</span>
                            <span className="font-extrabold text-gray-950">￥399</span>
                          </div>
                        )}
                        <div className="border-t border-solid border-blue-200 pt-2 flex justify-between items-center text-sm font-bold">
                          <span className="text-gray-800">合计总额：</span>
                          <span className="text-red-600 font-black text-lg">￥{finalPrice}</span>
                        </div>
                      </div>

                      {/* Benefit list */}
                      <div className="space-y-3.5 text-xs text-gray-600 leading-relaxed pl-1 pt-1 border-t border-dashed border-blue-200/40">
                        <div className="flex items-start gap-1.5 text-blue-900 font-bold">
                          <span className="text-blue-500 font-extrabold">✦</span>
                          <span>升级后可筛选全国任意地市，不再受已购地区筛选限制。</span>
                        </div>
                        
                        {/* Notice Box */}
                        <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-2xl text-[11px] text-amber-900 space-y-1.5">
                          <div className="font-extrabold flex items-center gap-1 text-amber-950">
                            <span>⚠️ 请注意：</span>
                          </div>
                          <p className="text-amber-800 leading-normal font-medium">
                            {currentPlan?.id === 'svip_upgrade_diff_plus_year' 
                              ? `本次将在补齐差价的基础上让您的 SVIP 状态延长一年，新到期日为 ${addDaysStr(membership!.expiryDate || todayDate, 365)}。`
                              : `本次仅补齐剩余有效期内的会员权益差价，升级后 SVIP 有效期仍至 ${expiryDate}。`}
                          </p>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}
              {activeTab === 'vip' && membership?.role === UserRole.VIP && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  续费将延长有效期，已购地市保持不变
                </p>
              )}
            </div>

            {/* Region Selection for VIP */}
            {activeTab === 'vip' && (
              userRole === UserRole.VIP ? (
                // 已购态 Block A — 当前会员状态
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="w-1 h-4 bg-blue-600 rounded"></span>
                      <span>当前会员状态</span>
                    </h3>
                  </div>

                  {/* Membership details */}
                  <div className="grid grid-cols-3 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/60 text-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 mb-0.5">套餐类型</span>
                      <span className="text-xs font-bold text-gray-800">
                        {membership?.planType === 'annual' ? '年度' : '月度'}
                      </span>
                    </div>
                    <div className="flex flex-col border-x border-gray-200/50">
                      <span className="text-[10px] text-gray-400 mb-0.5">到期日期</span>
                      <span className="text-xs font-bold text-gray-800">{membership?.expiryDate || '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 mb-0.5">剩余天数</span>
                      <span className="text-xs font-bold text-[#EF4444]">{remainingDays} 天</span>
                    </div>
                  </div>

                  {/* Readonly cities */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-500">已购地市</div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {selectedCities.length > 0 ? (
                        selectedCities.map(city => (
                          <div key={city} className="flex flex-col justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 hover:shadow-sm transition-shadow">
                            <span className="font-bold text-blue-900 text-[14px] truncate">{city}</span>
                            <div className="flex items-center gap-1 mt-1.5 text-blue-600">
                              <Check size={12} className="shrink-0" />
                              <span className="text-[10px] font-medium tracking-tight">已激活筛选</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 py-6 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-gray-50/50 animate-pulse">
                          暂无已购筛选地市
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#9A6D2E] bg-[#FFFBF0] p-3 rounded-xl border border-[#FFE3A1] leading-relaxed font-sans space-y-1">
                    <div>ℹ️ <strong className="text-[#77470E]">说明:</strong> VIP 地区筛选范围：最多 3 个地级市（直辖市按整市计），地市筛选仅限以上已购地市。</div>
                    <div className="font-semibold text-[#EA7C13]">续费仅延长有效期，已购地市保持不变；如需调整筛选范围，可升级 SVIP（全国）。</div>
                  </div>
                </div>
              ) : (
                // 首购态 (FREE 用户，保持现状不变)
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="w-1 h-4 bg-blue-600 rounded"></span>
                      <span>已购筛选地市：最多 3 个地级市（直辖市按整市计）</span>
                    </h3>
                    <button 
                      onClick={() => setIsRegionModalOpen(true)}
                      className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center gap-1"
                    >
                      + 添加/修改地区
                    </button>
                  </div>
                  
                  {/* Selected Cities */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {selectedCities.length > 0 ? (
                       selectedCities.map(city => (
                        <div key={city} className="relative flex flex-col justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100/80 transition-all shadow-[0_2px_8px_-3px_rgba(37,99,235,0.08)]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-900 text-[14px] truncate">{city}</span>
                            <button 
                              onClick={() => handleCityToggle(city)} 
                              className="text-blue-400 hover:text-blue-600 hover:bg-blue-100/50 p-1 rounded-full transition-colors shrink-0"
                              title="删除"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-blue-600">
                            <Check size={12} className="shrink-0" />
                            <span className="text-[10px] font-medium tracking-tight">已激活筛选</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-6 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        ⚠️ 暂未购买筛选地市，点击上方“添加/修改地区”进行授权
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-500 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100/60 leading-relaxed font-sans">
                    ℹ️ <strong className="text-gray-700">说明:</strong> VIP 地区筛选范围：最多 3 个地级市（直辖市按整市计），所选地市自动包含其下辖所有区县。
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* Benefits Comparison */}
        <div>
          <div className="mb-3">
            <h3 className="text-base font-bold text-gray-900">会员权益对比</h3>
            <p className="text-xs text-gray-400 mt-0.5">按当前版本权益展示，具体以页面实际可用功能为准</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`overflow-x-auto no-scrollbar ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            >
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-gray-100">
                    <th className="sticky left-0 z-20 bg-[#FAFAFA] text-xs font-semibold text-gray-500 py-3 px-4 text-left w-[130px] max-w-[160px] border-r border-gray-100">权益项目</th>
                    {sortedColumns.map(col => {
                      const isVipCol = col === 'vip' || col === 'svip';
                      const isActive = activeTab === col;
                      return (
                        <th 
                          key={col}
                          className={`text-xs font-bold py-3 px-4 text-center transition-colors ${
                            isActive 
                              ? 'text-[#B8860B] bg-[#FFF8E6]' 
                              : isVipCol 
                                ? 'text-amber-800 bg-[#FFFDF5]' 
                                : 'text-gray-900'
                          }`}
                        >
                          {roleLabels[col]}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {allBenefits.map((benefit, index) => (
                    <tr key={index} className="border-b border-gray-50 last:border-0 items-center">
                      <td className="sticky left-0 z-10 bg-white text-xs text-gray-900 font-medium py-4 px-4 text-left border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] break-words whitespace-normal w-[130px] max-w-[160px]">
                        {benefit.name}
                      </td>
                      {sortedColumns.map(col => {
                        const isVipCol = col === 'vip' || col === 'svip';
                        const isActive = activeTab === col;
                        return (
                          <td 
                            key={col}
                            className={`text-xs text-center py-4 px-4 break-words whitespace-normal leading-normal max-w-[150px] ${
                              isActive 
                                ? 'text-[#B8860B] font-bold bg-[#FFF8E6]' 
                                : isVipCol 
                                  ? 'text-amber-700 bg-[#FFFDF5]/50' 
                                  : 'text-gray-400'
                            }`}
                          >
                            {(benefit as any)[col]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      {isSvipReviewingVip ? (
        <div id="svip_vip_info_bar" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+14px)] flex flex-col gap-2.5 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] text-center animate-in slide-in-from-bottom duration-250">
          <div className="bg-[#FFF8E6] border border-[#FDEBBA] rounded-xl p-4 text-left flex items-start gap-3">
            <Star className="w-5 h-5 text-[#B8860B] fill-[#B8860B]/20 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 leading-normal">您当前是 SVIP 会员</h4>
              <p className="text-xs text-gray-650 leading-relaxed font-normal">
                您当前是 SVIP，已包含 VIP 全部权益。SVIP 到期后，可自由选择开通 VIP 或续费 SVIP。
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex flex-col gap-3 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          {/* Promo Code Row */}
          <div className="flex items-center justify-between gap-3 relative">
            <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 flex items-center border border-gray-100">
              <input 
                type="text" 
                placeholder="请输入推广码（选填）" 
                className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 outline-none text-gray-700 placeholder-gray-400"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 relative">
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setIsDefaultPromo(!isDefaultPromo)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isDefaultPromo ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {isDefaultPromo && <Check size={10} className="text-white" />}
                </div>
                <span className="text-sm">设为默认</span>
              </div>
              <div 
                className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-[10px] font-bold ml-0.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromoTooltip(!showPromoTooltip);
                }}
              >
                !
              </div>
              
              {/* Tooltip */}
              {showPromoTooltip && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPromoTooltip(false)}></div>
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#2A2A2A] text-white text-xs p-3 rounded-lg shadow-lg z-50 leading-relaxed">
                    勾选设为默认，则下次下单时，默认展示该推广码
                    <div className="absolute -bottom-1.5 right-2 w-3 h-3 bg-[#2A2A2A] transform rotate-45"></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upgrade Guide (Block C) */}
          {activeTab === 'vip' && membership?.role === UserRole.VIP && (
            <div className="text-center py-1 select-none">
              <button
                onClick={() => {
                  handleTabChange('svip');
                  mainScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-amber-700 hover:text-amber-800 text-[13px] font-medium transition-colors cursor-pointer inline-flex items-center"
              >
                需要筛选更多地市？升级 SVIP 可筛选全国 &gt;
              </button>
            </div>
          )}

          
          {/* Price and Pay Row */}
          <div className="flex items-center justify-between">
            <div className="flex-1 flex flex-col items-start justify-center">
              {currentPlan?.id === 'svip_upgrade_diff' || currentPlan?.id === 'svip_upgrade_diff_plus_year' ? (
                <div className="text-[10px] text-red-650 bg-red-100/60 border border-red-200/40 px-2 md:px-2.5 py-0.5 rounded font-bold mb-1 tracking-tight">
                  {currentPlan?.id === 'svip_upgrade_diff_plus_year' ? '升级及续费总额' : '本次应补'}
                </div>
              ) : activeTab === 'svip' && baseRangeRole === UserRole.VIP ? (
                <div className="text-[10px] text-amber-700 bg-amber-50/70 px-2.5 py-0.5 rounded font-semibold mb-1">
                  应付金额
                </div>
              ) : (
                <div className="text-[10px] text-amber-700 bg-amber-50/70 px-2 py-0.5 rounded font-semibold mb-1">
                  {activeTab === 'vip' ? (
                    '已选择：VIP 会员'
                  ) : (
                    `已选择：SVIP 会员 · ${currentPlan?.name || '连续包月'}`
                  )}
                </div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-[#EF4444] font-bold text-sm">¥</span>
                <span className="text-[#EF4444] font-bold text-2xl tracking-tighter">{finalPrice}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div 
                  className={`w-3 h-3 rounded-sm border flex items-center justify-center cursor-pointer transition-colors ${isAgreementChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                  onClick={() => setIsAgreementChecked(!isAgreementChecked)}
                >
                  {isAgreementChecked && <Check size={10} className="text-white" />}
                </div>
                <div className="text-[10px] text-gray-500">
                   已阅读并同意 <span className="text-blue-500 cursor-pointer">《会员服务协议》</span>
                </div>
              </div>
            </div>

            <button 
              disabled={changeType === 'downgrade'}
              className={`${
                changeType === 'downgrade'
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#EF4444] text-white active:scale-95 shadow-md shadow-red-500/20"
              } font-bold px-8 py-3 rounded-xl transition-all tracking-wide`}
              onClick={() => {
                if (changeType === 'downgrade') {
                   return;
                }
                if (activeTab === 'vip' && selectedCities.length === 0) {
                  showToast('请先选择购买地区');
                  setIsRegionModalOpen(true);
                  return;
                }
                if (!isAgreementChecked) {
                  showToast('请在此页面底部先勾选同意《会员服务协议》');
                  return;
                }
                setShowPaymentModal(true);
              }}
            >
              {currentPlan?.id === 'svip_upgrade_diff' || currentPlan?.id === 'svip_upgrade_diff_plus_year' ? (
                '确认补差升级'
              ) : changeType === 'downgrade' ? (
                '当前已是更高等级会员'
              ) : userRole === UserRole.FREE ? (
                '立即开通'
              ) : changeType === 'upgrade' ? (
                '立即升级'
              ) : changeType === 'renewal' ? (
                '立即续费'
              ) : (
                '立即支付'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Region Selection Modal */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsRegionModalOpen(false)}></div>
          <div className="bg-white rounded-t-2xl w-full max-h-[70vh] flex flex-col relative z-10 animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">选择地区</h3>
              <button onClick={() => setIsRegionModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100 bg-blue-50/50">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1">
                    <Check size={14} className="text-blue-600" />
                    <span>已选购 VIP 筛选地市 ({selectedCities.length} / 3)</span>
                  </div>
                  <span className="text-[10px] text-blue-500 font-sans">最多选择3个地级市（直辖市按整市计）</span>
                </div>
                {selectedCities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCities.map(city => (
                      <div key={city} className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg text-xs font-bold text-blue-800 border border-blue-200 shadow-sm animate-in zoom-in-95 duration-100">
                        <span>{city}</span>
                        <button onClick={() => handleCityToggle(city)} className="text-blue-400 hover:text-blue-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-blue-500 font-medium font-sans">💡 请从下方省市列表中，勾选您想要拥有的 3 个 VIP 筛选地市（直辖市按整市计，包含全部辖区）</div>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden h-[40vh]">
              {/* Left Column: Provinces */}
              <div className="w-1/3 bg-gray-50 overflow-y-auto">
                {REGIONS.map(region => (
                  <button
                    key={region.name}
                    onClick={() => setExpandedRegion(region.name)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      expandedRegion === region.name 
                        ? 'bg-white text-blue-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
              
              {/* Right Column: Cities */}
              <div className="w-2/3 bg-white overflow-y-auto p-2">
                {REGIONS.find(r => r.name === expandedRegion)?.cities.map(city => (
                  <label 
                    key={city} 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 rounded-lg"
                    onClick={(e) => { e.preventDefault(); handleCityToggle(city); }}
                  >
                    <span className={`text-sm ${selectedCities.includes(city) ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                      {city}
                    </span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      selectedCities.includes(city) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {selectedCities.includes(city) && <Check size={12} className="text-white" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <button 
                onClick={() => setIsRegionModalOpen(false)}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => !isPaying && setShowPaymentModal(false)}></div>
          <div className="bg-white rounded-t-2xl w-full flex flex-col relative z-10 animate-slide-up pb-safe-bottom">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-[17px] font-bold text-gray-900">确认付款</h3>
              {!isPaying && (
                <button onClick={() => setShowPaymentModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              )}
            </div>

            {(currentPlan?.id === 'svip_upgrade_diff' || currentPlan?.id === 'svip_upgrade_diff_plus_year') && (
              <div className="px-5 py-3.5 bg-blue-50 border-b border-blue-101 text-left font-sans">
                <div className="text-[14px] font-bold text-blue-900 mb-1">VIP升级SVIP会员</div>
                <div className="text-xs text-blue-800 space-y-1.5 leading-relaxed">
                  {currentPlan?.id === 'svip_upgrade_diff_plus_year' ? (
                    <div>本次补齐权益差价并同时续费一年，升级后 SVIP 有效期至 {addDaysStr(membership!.expiryDate || todayDate, 365)}。</div>
                  ) : (
                    <div>本次仅补齐剩余有效期内 VIP 与 SVIP 的权益差价。升级后有效期不变，至 {expiryDate}。</div>
                  )}
                  <div className="text-[12px] font-bold text-blue-700">本次应付：¥{finalPrice}</div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col items-center py-8">
              <span className="text-sm text-gray-500 mb-1">支付金额</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">¥</span>
                <span className="text-[40px] font-bold text-gray-900 tracking-tighter">{finalPrice}</span>
              </div>
            </div>

            <div className="px-4 space-y-3 pb-6">
              <div 
                className={`flex items-center justify-between p-4 rounded-xl border ${paymentMethod === 'wechat' ? 'border-[#07C160] bg-[#07C160]/5' : 'border-gray-100'} cursor-pointer`}
                onClick={() => !isPaying && setPaymentMethod('wechat')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#07C160] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  </div>
                  <span className="text-[15px] font-medium text-gray-900">微信支付</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wechat' ? 'border-[#07C160] bg-[#07C160]' : 'border-gray-300'}`}>
                  {paymentMethod === 'wechat' && <Check size={12} className="text-white" />}
                </div>
              </div>

              <div 
                className={`flex items-center justify-between p-4 rounded-xl border ${paymentMethod === 'alipay' ? 'border-[#1677FF] bg-[#1677FF]/5' : 'border-gray-100'} cursor-pointer`}
                onClick={() => !isPaying && setPaymentMethod('alipay')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1677FF] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <span className="text-[15px] font-medium text-gray-900">支付宝</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'alipay' ? 'border-[#1677FF] bg-[#1677FF]' : 'border-gray-300'}`}>
                  {paymentMethod === 'alipay' && <Check size={12} className="text-white" />}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 pb-8">
              <button 
                onClick={handleConfirmPayment}
                disabled={isPaying}
                className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'alipay' ? 'bg-[#1677FF] active:bg-blue-600' : 'bg-[#07C160] active:bg-green-600'
                } ${isPaying ? 'opacity-80 cursor-not-allowed' : 'active:scale-[0.98]'}`}
              >
                {isPaying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>支付中...</span>
                  </>
                ) : (
                  <span>确认支付 ¥{finalPrice}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowSuccessModal(false);
            setLastPurchase(null);
          }}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden shadow-2xl">
            <div className="p-8 flex flex-col items-center text-center font-sans">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-gray-950 mb-2 font-sans">
                {lastPurchase?.type === 'svip_upgrade_diff'
                  ? "升级成功"
                  : lastPurchase?.type === 'renewal'
                    ? "续费成功"
                    : "开通成功"}
              </h3>
              <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
                {lastPurchase?.type === 'svip_upgrade_diff'
                  ? `已升级为 SVIP，有效期至 ${membership?.expiryDate}`
                  : lastPurchase?.type === 'renewal'
                    ? `有效期已延长至 ${membership?.expiryDate || ''}`
                    : `欢迎成为 ${lastPurchase?.role === 'SVIP' ? 'SVIP' : 'VIP'} 会员，有效期至 ${membership?.expiryDate || ''}`}
              </p>
              <button
                className="w-full bg-[#1677FF] text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all outline-none"
                onClick={() => {
                  setShowSuccessModal(false);
                  setLastPurchase(null);
                }}
              >
                {lastPurchase?.type === 'renewal' ? "知道了" : "开始体验"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
