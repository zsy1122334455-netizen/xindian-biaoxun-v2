import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Share2, Star, Download, Phone, User, Crown, Sparkles, ChevronRight, X, Copy, Check, RefreshCcw, AlertCircle, ExternalLink } from 'lucide-react';
import { ViewName, Opportunity, UserRole } from '../types';
import { Contact } from './ProjectContacts';
import { getProjectTypeStyle, getAnnouncementTypeStyle, parseTags, getAmountDisplay, getDeadlineDisplay } from '../utils';
import { getOpportunityStatusInfo, PRIMARY_STATUS_STYLES, BADGE_STYLES } from '../utils/statusUtils';

interface Props {
  opportunity?: Opportunity;
  onBack: () => void;
  onNavigate: (view: ViewName, data?: any) => void;
  onToggleStar: (id: string) => void;
  followedContacts?: Contact[];
  onToggleContactFollow?: (contact: Contact, silent?: boolean) => void;
  userRole?: UserRole;
  onUpgrade?: (desc?: string) => void;
  aiDetailStatusOverride?: 'normal' | 'error';
  originalDetailStatusOverride?: 'success' | 'error';
  freeViewedCount?: number;
  onShowPaymentModal?: (sceneId: string) => void;
}

export const AnnouncementDetail: React.FC<Props> = ({ 
  opportunity, 
  onBack, 
  onNavigate, 
  onToggleStar,
  followedContacts = [],
  onToggleContactFollow,
  userRole = UserRole.FREE,
  onUpgrade,
  aiDetailStatusOverride = 'normal',
  originalDetailStatusOverride = 'success',
  freeViewedCount = 0,
  onShowPaymentModal
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'ai'>('ai');
  const [showContactModal, setShowContactModal] = useState(false);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    actionText?: string; 
    onAction?: () => void; 
  }>({ show: false, message: '' });
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
  const [isOriginalLoading, setIsOriginalLoading] = useState(false);
  const [isOriginalError, setIsOriginalError] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiError, setIsAiError] = useState(false);
  const [aiLoadedOnce, setAiLoadedOnce] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);

  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return localStorage.getItem('free_detail_banner_dismissed_date') === todayStr;
  });

  useEffect(() => {
    if (opportunity && userRole === UserRole.FREE) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastToastDate = localStorage.getItem('free_detail_toast_date');
      if (lastToastDate !== todayStr) {
        showToast('今日可免费查看 10 条公告详情');
        localStorage.setItem('free_detail_toast_date', todayStr);
      }
    }
  }, [opportunity, userRole]);

  const todayStr = new Date().toISOString().split('T')[0];
  const viewedCount = freeViewedCount || 0;
  const remainingCount = 10 - viewedCount;
  const showBanner = userRole === UserRole.FREE && viewedCount >= 8 && remainingCount > 0 && !isBannerDismissed;

  const simulateLoadOriginal = () => {
    setIsOriginalLoading(true);
    setIsOriginalError(false);
    setTimeout(() => {
      if (originalDetailStatusOverride === 'error') {
        setIsOriginalError(true);
      } else {
        setIsOriginalError(false);
      }
      setIsOriginalLoading(false);
    }, 1500);
  };

  const triggerAiLoading = (isRetry: boolean = false) => {
    setIsAiLoading(true);
    setIsAiError(false);
    const duration = isRetry ? 800 : 1200;
    setTimeout(() => {
      if (aiDetailStatusOverride === 'error') {
        setIsAiError(true);
        setAiLoadedOnce(false);
      } else {
        setIsAiError(false);
        setAiLoadedOnce(true);
      }
      setIsAiLoading(false);
    }, duration);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    if (opportunity) {
      setAiLoadedOnce(false);
      setIsAiError(false);

      const sections = getAiSections();
      if (!sections) {
        setIsAiLoading(false);
        setActiveTab('original');
        showToast('该公告类型暂不支持智能解析，已切换到公告原文');
        simulateLoadOriginal();
        return;
      }

      setIsAiLoading(true);
      const timer = setTimeout(() => {
        if (aiDetailStatusOverride === 'error') {
          setIsAiError(true);
          setAiLoadedOnce(false);
          setActiveTab('original');
          showToast('AI 解读暂不可用，已切换到公告原文');
          simulateLoadOriginal();
        } else {
          setIsAiError(false);
          setAiLoadedOnce(true);
        }
        setIsAiLoading(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [opportunity]);

  const handleTabChange = (tab: 'original' | 'ai') => {
    setActiveTab(tab);
    if (tab === 'original' && !isOriginalError && !isOriginalLoading) {
      simulateLoadOriginal();
    }
  };

  const showToast = (message: string, options?: { actionText?: string; onAction?: () => void }) => {
    setToast({ 
      show: true, 
      message, 
      actionText: options?.actionText, 
      onAction: options?.onAction 
    });
    setTimeout(() => {
      setToast(prev => {
        if (prev.message === message) {
          return { show: false, message: '', actionText: undefined, onAction: undefined };
        }
        return prev;
      });
    }, 3000);
  };

  if (!opportunity) return null;

  const ownerContacts: Contact[] = (opportunity.ownerContacts || []).map((c, i) => ({
    id: `owner-${i}-${opportunity.id}`,
    name: c.name,
    phone: c.phone,
    role: c.role || '甲方联系人',
    company: opportunity.ownerName || '相关招标单位',
    projectName: opportunity.title
  }));

  const agentContacts: Contact[] = (opportunity.agencyContacts || []).map((c, i) => ({
    id: `agent-${i}-${opportunity.id}`,
    name: c.name,
    phone: c.phone,
    role: c.role || '代理联系人',
    company: opportunity.agencyName || '相关代理机构',
    projectName: opportunity.title
  }));

  const isSVIP = userRole === UserRole.SVIP;

  const maskName = (name: string) => name[0] + '**';
  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const p = phone.trim();
    if (p.length <= 5) {
      return '*'.repeat(p.length);
    }
    const start = p.slice(0, 3);
    const end = p.slice(-2);
    const asteriskCount = p.length - 5;
    return start + '*'.repeat(asteriskCount) + end;
  };

  const formatNames = (contacts: Contact[]) => {
    return contacts.map(c => isSVIP ? c.name : maskName(c.name)).join(' 、 ');
  };

  const formatPhones = (contacts: Contact[]) => {
    return contacts.map(c => isSVIP ? c.phone : maskPhone(c.phone)).join(' 、 ');
  };

  const areAllFollowed = (contacts: Contact[]) => {
    return contacts.length > 0 && contacts.every(c => followedContacts.some(fc => fc.id === c.id));
  };

  const handleToggleBulkFollow = (contacts: Contact[]) => {
    if (!onToggleContactFollow) return;
    const allFollowed = areAllFollowed(contacts);
    contacts.forEach(c => {
      const isCurrentlyFollowed = followedContacts.some(fc => fc.id === c.id);
      if (allFollowed || !isCurrentlyFollowed) {
        onToggleContactFollow(c, isSVIP);
      }
    });

    if (isSVIP) {
      if (allFollowed) {
        showToast('已取消关注');
      } else {
        showToast('已关注联系人', {
          actionText: '去查看 >',
          onAction: () => onNavigate(ViewName.PROJECT_CONTACTS)
        });
      }
    }
  };

  const getAiSections = () => {
    const pt = opportunity.projectType || '';
    const type = opportunity.type;
    
    if (['药品采购权', '二类疫苗', '林权', '其他'].includes(pt)) {
      return null;
    }

    if (pt === '土地权') {
      return [
        { id: 'location', title: '土地位置', content: '市区高新技术产业园东侧A-01地块。' },
        { id: 'area', title: '面积', content: '35000平方米' },
        { id: 'purpose', title: '用途', content: '工业用地' },
        { id: 'term', title: '年限', content: '50年' },
        { id: 'startingPrice', title: '起拍价', content: '1200万元' },
        { id: 'deposit', title: '保证金', content: '500万元' },
      ];
    } else if (pt === '矿业权') {
      return [
        { id: 'mineName', title: '矿山名称', content: '紫金山铜金矿扩建区' },
        { id: 'transferMethod', title: '出让方式', content: '公开挂牌交易' },
        { id: 'mineralType', title: '矿种', content: '铜矿、金矿' },
        { id: 'term', title: '出让年限', content: '20年' },
        { id: 'area', title: '面积', content: '5.2平方公里' },
        { id: 'location', title: '地理位置', content: '龙岩市上杭县' },
      ];
    } else if (pt === '国有产权') {
      return [
        { id: 'category', title: '资产类别', content: '股权资产' },
        { id: 'location', title: '转让标的所在地区', content: '北京市海淀区' },
        { id: 'price', title: '挂牌价格', content: '5600万元' },
        { id: 'period', title: '挂牌期间', content: '自公告之日起20个工作日' },
        { id: 'date', title: '挂牌日期', content: '2025-08-20' },
        { id: 'method', title: '交易方式', content: '网络竞价' },
      ];
    } else if (pt === '排污权') {
      return [
        { id: 'pollutantName', title: '出让污染物名称', content: '二氧化硫、氮氧化物' },
        { id: 'quantity', title: '出让污染物数量', content: '二氧化硫50吨/年，氮氧化物30吨/年' },
        { id: 'startingPrice', title: '起拍价', content: '50万元' },
        { id: 'term', title: '年限', content: '5年' },
      ];
    } else if (pt === '政府采购' || type === 'procurement') {
      return [
        { id: 'method', title: '采购方式', content: '公开招标' },
        { id: 'items', title: '采购品目/数量', content: '服务器、存储设备及配套软件1批。' },
        { id: 'budget', title: '预算金额', content: '人民币300.00万元' },
        { id: 'consortium', title: '联合体要求', content: '本次采购不接受联合体投标。' },
        { id: 'duration', title: '合同履行期限', content: '合同签订之日起至项目质保期结束，质保期为验收合格后3年。' },
        { id: 'qualification', title: '资格要求', content: '1. 满足《中华人民共和国政府采购法》第二十二条规定。\n2. 落实政府采购政策需满足的资格要求：无。\n3. 本项目的特定资格要求：具备相关设备销售及售后服务能力。' },
        { id: 'deadline', title: '投标截止时间', content: '2025-09-15 09:00:00（北京时间）' },
        { id: 'submission', title: '投标文件递交方式', content: '电子化递交至省级政府采购中心平台。' },
      ];
    }

    // Default fallback to Engineering Construction (工程建设)
    return [
      { id: 'scale', title: '建设规模', content: '消防设施维修更换、地下管网梳理雨污分流、道路铺装等环境整治及配套基础设施改造。涉及小区15个，总建筑面积约30万平方米。' },
      { id: 'funds', title: '资金来源', content: '财政资金及自筹资金，已落实。' },
      { id: 'duration', title: '工期', content: '合同签订后180日历天。' },
      { id: 'qualification', title: '资格要求', content: '1. 投标人须具备市政公用工程施工总承包三级及以上资质。\n2. 拟派项目经理须具备市政公用工程专业二级及以上注册建造师执业资格。' },
      { id: 'consortium', title: '联合体要求', content: '本次招标不接受联合体投标。' },
      { id: 'deadline', title: '投标截止时间', content: '2025-09-10 09:30:00（北京时间）' },
      { id: 'submission', title: '投标文件递交方式', content: '电子化投标文件递交至公共资源交易中心电子交易平台。' },
    ];
  };

  const aiSections = getAiSections();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-bg-page min-h-screen flex flex-col font-sans text-gray-900 pb-20">
      <header className="sticky top-0 z-50 bg-white px-4 pt-safe-top pb-2 border-b border-gray-100">
        <div className="flex items-center justify-center h-12 relative">
          <button onClick={onBack} className="absolute left-0 flex h-10 w-10 items-center justify-start text-gray-800 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[18px] font-bold text-gray-900 whitespace-nowrap">公告详情</h1>
          <div className="absolute right-0 flex h-10 w-10"></div>
        </div>
      </header>

      {showBanner && (
        <div 
          onClick={() => {
            onNavigate(ViewName.MEMBER_CENTER, { initialTab: 'vip' });
          }}
          className="bg-amber-50 text-amber-800 h-[36px] flex items-center justify-between px-4 text-xs font-semibold cursor-pointer hover:bg-amber-100/80 transition-colors border-b border-amber-100 select-none"
        >
          <div className="flex items-center">
            <span>今日还可免费查看 {remainingCount} 条详情，开通会员不限量查看 &gt;</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const todayStr = new Date().toISOString().split('T')[0];
              localStorage.setItem('free_detail_banner_dismissed_date', todayStr);
              setIsBannerDismissed(true);
            }}
            className="p-1 text-amber-600 hover:text-amber-900 transition-colors bg-transparent border-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <main ref={scrollRef as any} className="flex-1 w-full max-w-md mx-auto p-4 overflow-y-auto">
        <div className="bg-white px-4 pt-5 pb-4 shadow-soft mb-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              {opportunity.projectCode ? opportunity.projectCode : '暂无项目编号'}
            </span>
            {opportunity && (
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {(() => {
                  const info = getOpportunityStatusInfo(opportunity.currentStage, opportunity.deadline);
                  const style = PRIMARY_STATUS_STYLES[info.primary];
                  return (
                    <>
                      <span className={`text-[12px] font-bold px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                        {info.primary}
                      </span>
                      {info.badges.map(b => {
                        const bStyle = BADGE_STYLES[b];
                        return (
                          <span key={b} className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}>
                            {b}
                          </span>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="flex justify-between items-start gap-4 mb-3">
            <h2 className="text-[17px] font-bold leading-snug text-gray-900">
              {opportunity.title}
              {opportunity.isMultiBid && (
                <span className="text-primary ml-1 text-xs shrink-0 align-super font-normal">[多标段]</span>
              )}
            </h2>
            <button 
              className="mt-1 p-1"
              onClick={() => onToggleStar(opportunity.id)}
            >
              <Star 
                size={20} 
                className={opportunity.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} 
              />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="h-5 flex items-center px-1.5 text-[11px] rounded bg-[#E6F4FF] text-[#1677FF]">{(opportunity.region || '').replace('·', ' ')}</span>
            {opportunity.projectType && (
              <span className={`h-5 flex items-center px-1.5 rounded text-[11px] ${getProjectTypeStyle(opportunity.projectType)}`}>
                {opportunity.projectType}
              </span>
            )}
            {(() => {
              const tags = opportunity?.tags || [];
              const { orgMethod, announcementType } = parseTags(tags);
              const tagsToShow = [announcementType, orgMethod].filter(Boolean) as string[];
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
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-50 pt-4">
            <div className="flex flex-col">
              <span className="text-[12px] text-gray-400 mb-1">预算金额</span>
              <div className="flex items-baseline gap-0.5">
                {(() => {
                  const amtDisplay = getAmountDisplay(opportunity?.amount, opportunity?.currentStage, opportunity?.tags);
                  const isPlaceholder = amtDisplay === '暂未明确' || amtDisplay === '详见招标文件';
                  return (
                    <span className={`text-[18px] font-bold font-numbers ${isPlaceholder ? 'text-gray-400 font-normal text-[14px]' : 'text-red-500'}`}>
                      {amtDisplay}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[12px] text-gray-400 mb-1">投标截止时间</span>
              <span className="text-[14px] font-medium text-gray-800">
                {getDeadlineDisplay(opportunity?.deadline, opportunity?.currentStage, opportunity?.tags, false)}
              </span>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white px-4 py-5 mb-3 rounded-xl shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary rounded-full"></div>
            <h3 className="text-[15px] font-bold text-gray-900">公告简介</h3>
          </div>
          <div className="space-y-3">
             {(() => {
                const baseItems: any[] = [
                  { label: '发布时间', value: opportunity.date },
                  opportunity.isMultiBid && { 
                    label: '标段信息', 
                    customNode: (
                      <div className="flex-1 min-w-0 flex items-center text-gray-900">
                        <span className="truncate">标段一：一期工程机电安装及调试工程标段总承包项目详细描述段落</span>
                      </div>
                    )
                  },
                  { 
                    label: '交易甲方', 
                    value: opportunity.ownerName || '—',
                    enterprise: opportunity.ownerName ? {
                      id: `owner-ent-${opportunity.id}`,
                      name: opportunity.ownerName,
                      industry: '政府机构',
                      role: '招采单位' as const,
                      location: opportunity.region,
                      legalRep: '-',
                      capital: '-',
                      date: '2020-01-01',
                      isFollowed: false
                    } : undefined
                  },
                  { 
                    label: '招标代理', 
                    value: opportunity.agencyName || '自行招标',
                    enterprise: opportunity.agencyName ? {
                      id: `agent-ent-${opportunity.id}`,
                      name: opportunity.agencyName,
                      industry: '专业技术服务业',
                      role: '招标代理' as const,
                      location: opportunity.region,
                      legalRep: '法定代表人',
                      capital: '1000万',
                      date: '2020-01-01',
                      isFollowed: false
                    } : undefined
                  }
                ].filter(Boolean);

                const isPublic = opportunity.hasPublicContacts !== false;

                // B. 甲方 (ownerContacts)
                if (isPublic && ownerContacts.length > 0) {
                  baseItems.push(
                    { label: '甲方联系人', value: formatNames(ownerContacts), contacts: ownerContacts, isFollowed: areAllFollowed(ownerContacts) },
                    { label: '甲方联系方式', value: formatPhones(ownerContacts) }
                  );
                } else {
                  baseItems.push(
                    { label: '甲方联系人', value: '未公开' },
                    { label: '甲方联系方式', value: '未公开' }
                  );
                }

                // C. 代理 (agencyContacts & agencyName)
                const hasAgency = !!opportunity.agencyName;
                if (hasAgency) {
                  if (isPublic && agentContacts.length > 0) {
                    baseItems.push(
                      { label: '代理联系人', value: formatNames(agentContacts), contacts: agentContacts, isFollowed: areAllFollowed(agentContacts) },
                      { label: '代理联系方式', value: formatPhones(agentContacts) }
                    );
                  } else {
                    baseItems.push(
                      { label: '代理联系人', value: '未公开' },
                      { label: '代理联系方式', value: '未公开' }
                    );
                  }
                }

                return baseItems;
              })().map((item: any, i) => (
                <div key={i} className="flex items-center text-[13px] w-full">
                  <span className="text-gray-400 w-24 shrink-0">{item.label}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                     {item.customNode ? item.customNode : item.enterprise ? (
                       <button 
                         onClick={() => onNavigate(ViewName.ENTERPRISE_DETAIL, item.enterprise)}
                         className="text-primary hover:underline text-left truncate"
                       >
                         {item.value}
                       </button>
                     ) : (
                       <span className="text-gray-700 truncate">{item.value}</span>
                     )}
                     {item.contacts && item.contacts.length > 0 && (
                       <button 
                         onClick={() => {
                           if (!isSVIP) {
                             onUpgrade?.('CONTACT_FOLLOW');
                             return;
                           }
                           handleToggleBulkFollow(item.contacts!);
                         }}
                         className={`text-[11px] px-1.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                           item.isFollowed 
                             ? 'text-gray-400 border-gray-200 bg-gray-50' 
                             : 'text-primary border-blue-100 bg-blue-50'
                         }`}
                       >
                         {item.isFollowed ? '已关注' : '+ 关注'}
                       </button>
                     )}
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white px-4 py-5 mb-3 rounded-xl shadow-soft">
           <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              <h3 className="text-[15px] font-bold text-gray-900">项目进度</h3>
            </div>
            <button 
              onClick={() => onNavigate(ViewName.PROJECT_TIMELINE, opportunity)}
              className="text-[12px] text-primary flex items-center gap-1 active:opacity-70"
            >
              查看全流程 <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-lg border border-blue-100/50">
            <div>
              <p className="text-[12px] text-gray-500 mb-1">当前阶段</p>
              <p className="text-[16px] font-bold text-primary">{opportunity.currentStage || '招标中'}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-gray-500 mb-1">更新时间</p>
              <p className="text-[14px] font-medium text-gray-800">{opportunity.date}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-4 py-5 mb-6 rounded-xl shadow-soft relative min-h-[400px]">
           <div className="flex items-center gap-8 mb-6 border-b border-gray-100">
            <button 
              onClick={() => handleTabChange('ai')}
              className={`pb-3 text-[15px] font-bold relative transition-colors flex items-center gap-1 ${
                activeTab === 'ai' ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'ai' ? 'text-primary' : 'text-gray-400'} />
              AI预览
              {activeTab === 'ai' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button 
              onClick={() => handleTabChange('original')}
              className={`pb-3 text-[15px] font-bold relative transition-colors ${
                activeTab === 'original' ? 'text-primary' : 'text-gray-500'
              }`}
            >
              公告原文
              {activeTab === 'original' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => {
                if (opportunity?.sourceUrl) {
                  window.open(opportunity.sourceUrl, '_blank', 'noopener,noreferrer');
                } else {
                  showToast('暂未获取到原文链接');
                }
              }}
              className="ml-auto pb-3 flex items-center gap-1 text-[13px] font-medium text-primary cursor-pointer"
            >
              <ExternalLink size={14} />
              原文链接
            </button>
          </div>

          {activeTab === 'original' ? (
            <div className="min-h-[300px]">
              {isOriginalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                  <RefreshCcw size={32} className="text-primary animate-spin mb-4" />
                  <p className="text-sm text-gray-500">原文加载中...</p>
                </div>
              ) : isOriginalError ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <AlertCircle size={28} />
                  </div>
                  <p className="text-[14px] text-gray-600 font-medium mb-2">加载失败，请稍后重试</p>
                  <p className="text-[12px] text-gray-400 mb-6">目前无法连接到服务器</p>
                  <button 
                    onClick={simulateLoadOriginal}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[13px] font-bold rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <RefreshCcw size={14} />
                    <span>立即重试</span>
                  </button>
                </div>
              ) : (
                <div className="text-[13px] text-gray-600 leading-relaxed animate-in fade-in duration-300">
                   <div className="text-center mb-6">
                     <p className="font-bold text-[15px] text-gray-900">{opportunity.title}</p>
                     <p className="mt-2 text-gray-500">项目编号：{opportunity.projectCode || 'ZYZB2025-08-01'}</p>
                   </div>
                   <h4 className="font-bold text-gray-900 mt-4 mb-2">1、招标条件</h4>
                   <p className="mb-4">本招标项目已由相关部门批准建设，交易甲方为相关单位...</p>
                   <h4 className="font-bold text-gray-900 mt-4 mb-2">2、项目概况</h4>
                   <p>建设地点：详见原文；建设内容：详见原文...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 min-h-[300px]">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                  <Sparkles size={32} className="text-primary animate-spin mb-4" />
                  <p className="text-sm text-gray-500">AI 正在解读公告内容…</p>
                </div>
              ) : isAiError ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <AlertCircle size={28} />
                  </div>
                  <p className="text-[14px] text-gray-600 font-medium mb-6">AI 解读暂不可用，请查看公告原文</p>
                  <button 
                    onClick={() => handleTabChange('original')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[13px] font-bold rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>查看公告原文</span>
                  </button>
                </div>
              ) : !aiSections ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <Sparkles size={28} />
                  </div>
                  <p className="text-[14px] text-gray-600 font-medium mb-6">该公告类型暂不支持智能解析，请查看原文</p>
                  <button 
                    onClick={() => handleTabChange('original')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[13px] font-bold rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>查看公告原文</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 sticky top-0 bg-white z-10 py-2 -mx-4 px-4 border-b border-gray-50 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[14px] font-bold text-gray-900">重点内容速览</h4>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {aiSections.map((section) => (
                        <button 
                          key={section.id} 
                          onClick={() => scrollToSection(section.id)}
                          className="px-3 py-1.5 bg-blue-50 text-primary text-[12px] font-medium rounded-lg whitespace-nowrap hover:bg-blue-100 active:scale-95 transition-all flex-shrink-0"
                        >
                          {section.title}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-6 pb-4">
                    {aiSections.map((section) => (
                      <div key={section.id} id={section.id} className="scroll-mt-36">
                        <h5 className="text-[13px] font-bold text-gray-500 mb-2 flex items-center gap-2">
                          <div className="w-1 h-3 bg-primary rounded-full"></div>
                          {section.title}
                        </h5>
                        <div className="text-[13px] text-gray-900 leading-relaxed bg-gray-50 p-3 rounded-lg whitespace-pre-line border border-gray-100">
                          {section.content}
                        </div>
                      </div>
                    ))}
                    <div className="mt-8 pt-4 border-t border-gray-100 text-center pb-2">
                      <p className="text-[11px] text-gray-400">
                        本摘要由 AI 自动生成，仅供参考，请以公告原文为准。
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
          <div className="flex items-center gap-3 w-full h-[54px]">
            <button 
              onClick={() => onToggleStar(opportunity.id)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[50px] text-gray-500 active:scale-95 transition-transform"
            >
               <Star size={20} className={opportunity.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'} />
               <span className="text-[10px]">{opportunity.isStarred ? '已收藏' : '收藏'}</span>
            </button>
            
            <button 
              onClick={() => {
                if (opportunity.hasPublicContacts === false) {
                  showToast('联系方式未公开');
                  return;
                }
                if (!isSVIP) {
                  onUpgrade?.('CONTACT_PHONE');
                  return;
                }
                setShowContactModal(true);
              }}
              className="relative flex-1 bg-gradient-to-r from-primary to-primary-light text-white h-[44px] rounded-xl flex items-center justify-center gap-2 font-bold shadow-md active:scale-[0.98] transition-transform text-[13px]"
            >
               <User size={16} />
               <span>联系负责人</span>
               <div className="absolute -top-1.5 -right-1 bg-gradient-to-r from-orange-400 to-yellow-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-e-xl rounded-tl-xl border border-white shadow-sm flex items-center gap-0.5">
                 <Crown size={8} strokeWidth={3} />
                 SVIP
               </div>
            </button>
         </div>
      </div>

      { /* Contacts Modal */ }
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
          <div 
            className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[16px] text-gray-900">联系项目负责人</h3>
              <button 
                onClick={() => setShowContactModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {[...ownerContacts, ...agentContacts].map((contact) => (
                <div key={contact.id} className="bg-gray-50 border border-gray-100 block p-3 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">
                        {contact.name}
                        <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-100 text-primary">
                          {contact.role}
                        </span>
                      </h4>
                      <p className="text-[12px] text-gray-500 mt-1">{contact.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 bg-white p-3 rounded-lg border border-gray-100">
                    <span 
                      onClick={() => {
                        if (isSVIP) {
                          handleInitiateCall(contact.name, contact.phone, contact.role);
                        } else {
                          onUpgrade?.('CONTACT_PHONE');
                        }
                      }}
                      className={`font-sans text-[16px] font-bold text-gray-800 cursor-pointer ${isSVIP ? 'hover:text-primary transition-colors' : 'hover:text-amber-500'}`}
                    >
                      {isSVIP ? contact.phone : maskPhone(contact.phone)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          if (isSVIP) {
                            navigator.clipboard.writeText(contact.phone);
                            showToast('已复制号码');
                          } else {
                            navigator.clipboard.writeText(maskPhone(contact.phone));
                            showToast('已复制脱敏号码，完整号码仅限 SVIP 复制');
                          }
                        }}
                        className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 cursor-pointer"
                        title="复制号码"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (isSVIP) {
                            handleInitiateCall(contact.name, contact.phone, contact.role);
                          } else {
                            onUpgrade?.('CONTACT_PHONE');
                          }
                        }}
                        className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 ml-1 cursor-pointer"
                        title="一键拨打"
                      >
                        <Phone size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Quick Toast component */}
      {toast.show && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-sm font-medium z-[999] animate-in fade-in zoom-in-95 shadow-xl flex items-center gap-2 max-w-[90vw] whitespace-nowrap">
          <span>{toast.message}</span>
          {toast.actionText && toast.onAction && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toast.onAction?.();
                setToast({ show: false, message: '' });
              }}
              className="text-[#1677FF] hover:text-[#40a9ff] font-bold ml-1 cursor-pointer select-none"
            >
              {toast.actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};