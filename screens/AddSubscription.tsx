import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Crown, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

import { SubscriptionPlan } from '../types';
import { QualificationSelector } from '../components/QualificationSelector';
import { QUALIFICATION_TREE_DATA, QualNode } from '../src/constants/qualifications';
import { IndustrySelector } from '../components/IndustrySelector';
import { INDUSTRY_TREE_DATA, IndustryNode } from '../src/constants/industries';
import { REGIONS } from '../src/constants/regions';
import { RegionSelector } from '../components/RegionSelector';

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

interface Props {
  onBack: () => void;
  onAdd: (plan: Omit<SubscriptionPlan, 'id' | 'isDefault'>) => void;
  onUpdate: (id: string, plan: Partial<SubscriptionPlan>) => void;
  editingPlan: SubscriptionPlan | null;
}

export const AddSubscription: React.FC<Props> = ({ onBack, onAdd, onUpdate, editingPlan }) => {
  const [name, setName] = useState(editingPlan?.name || '');
  const [keywords, setKeywords] = useState(
    Array.isArray(editingPlan?.keywords) 
      ? editingPlan.keywords.join(' ') 
      : (editingPlan?.keywords || '')
  );

  const getInitialRegionObj = (regionStr: string) => {
    if (!regionStr || regionStr === '全国') return { province: '全国', cities: [] };
    const isProvince = REGIONS.some(r => r.name === regionStr);
    if (isProvince) return { province: regionStr, cities: [] };
    const cities = regionStr.split(',');
    const provinceObj = REGIONS.find(r => r.cities.some(c => cities.includes(c)));
    if (provinceObj) return { province: provinceObj.name, cities };
    return { province: '全国', cities: [] };
  };

  const [regionObj, setRegionObj] = useState<{ province: string, cities: string[] }>(() => 
    getInitialRegionObj(editingPlan?.region || '全国')
  );
  const [showRegionSelector, setShowRegionSelector] = useState(false);

  const formatRegionObj = (obj: { province: string, cities: string[] }) => {
    if (obj.province === '全国') return '全国';
    if (obj.cities.length > 0) return obj.cities.join(',');
    return obj.province;
  };

  const [publishTime, setPublishTime] = useState('不限');
  const [customStartTime, setCustomStartTime] = useState<string>('');
  const [customEndTime, setCustomEndTime] = useState<string>('');
  const [amountPreset, setAmountPreset] = useState('不限');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [projectTypes, setProjectTypes] = useState<string[]>(['不限']);
  const [announcementType, setAnnouncementType] = useState('不限');
  const [biddingMethod, setBiddingMethod] = useState<string[]>(['全部']);
  const [bidDeadline, setBidDeadline] = useState('不限');
  const [fundingSource, setFundingSource] = useState<string[]>(['全部']);
  const [industryClassification, setIndustryClassification] = useState<string[]>(['全部']);
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [qualificationIds, setQualificationIds] = useState<string[]>([]);
  const [showQualificationSelector, setShowQualificationSelector] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    keywords: true,
    region: true,
    publishTime: true,
    amount: true,
    projectType: true,
    announcementType: true,
    biddingMethod: true,
    bidDeadline: true,
    fundingSource: true,
    industry: true,
    qualification: true
  });
  const [showStickyBanner, setShowStickyBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (bannerRef.current) {
        const bannerBottom = bannerRef.current.getBoundingClientRect().bottom;
        setShowStickyBanner(bannerBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSave = () => {
    const keywordArray = typeof keywords === 'string' 
      ? keywords.split(/[\s\n]+/).filter(k => k.trim() !== '')
      : keywords;

    const planData: Partial<SubscriptionPlan> = {
      name: name || '未命名方案',
      keywords: keywordArray,
      region: formatRegionObj(regionObj),
      amountRange: {
        preset: amountPreset,
        min: amountMin,
        max: amountMax
      },
      projectTypes: projectTypes,
      publishTime: publishTime === '自定义' ? `${customStartTime} - ${customEndTime}` : publishTime,
      organizationForm: biddingMethod.join(','),
      fundingSource: fundingSource.join(','),
      qualificationRequirement: qualificationIds.join(','),
      openingDeadline: bidDeadline,
      // @ts-ignore - appending un-mapped fields for forward compatibility
      industryClassification: industryClassification,
      announcementType: announcementType
    };

    if (editingPlan) {
      onUpdate(editingPlan.id, planData);
    } else {
      onAdd(planData as any);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      <header className="bg-white px-4 py-3 flex items-center border-b border-gray-100 sticky top-0 z-50">
        <button onClick={onBack} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="flex-1 text-center font-bold text-lg pr-6 text-gray-900">
          {editingPlan ? '编辑订阅方案' : '新增订阅方案'}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Gold Member Banner - Minimalist Professional B2B UI */}
        <div 
            ref={bannerRef}
            className="bg-[#101828] rounded-2xl p-7 flex items-center justify-between relative overflow-hidden shadow-2xl border border-white/5"
        >
            {/* Flowing golden lines background */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <path d="M-50,150 Q100,50 450,100" stroke="#D4AF37" strokeWidth="0.5" fill="none" />
                    <path d="M-50,180 Q150,80 450,130" stroke="#D4AF37" strokeWidth="0.5" fill="none" />
                    <path d="M-50,120 Q50,20 450,70" stroke="#D4AF37" strokeWidth="0.5" fill="none" />
                </svg>
            </div>
            
            {/* Minimalist Efficiency Tag */}
            <div className="absolute top-4 right-6 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
                <span className="text-[#D4AF37] text-[10px] font-medium tracking-tight">Efficiency +50%</span>
            </div>

            <div className="flex flex-col gap-4 relative z-10">
                <div className="space-y-1.5">
                    <h2 className="text-white font-bold text-xl tracking-tight">黄金会员订阅</h2>
                    <div className="space-y-0.5">
                        <p className="text-white/80 text-xs font-medium">解锁多个订阅方案</p>
                        <p className="text-white/80 text-xs font-medium">掌握第一手商机</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <button className="bg-[#F5C543] hover:bg-[#F0B929] text-[#101828] text-sm font-bold px-7 py-2.5 rounded-full shadow-lg shadow-yellow-500/10 active:scale-95 transition-all whitespace-nowrap">
                    立即开通
                </button>
            </div>
        </div>

        {/* Plan Name */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">方案名称</label>
            <input 
                className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 placeholder-gray-400" 
                placeholder="请输入订阅方案名称（如：华东地区基建）" 
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
        </div>

        {/* Keywords */}
        <div className="space-y-2 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('keywords')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">关键词检索 <span className="text-red-500">*</span></label>
                {expandedSections.keywords ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.keywords && (
                <div className="space-y-2 animate-in fade-in duration-300">
                    <textarea 
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 h-28 resize-none placeholder-gray-400" 
                        placeholder="请输入搜索关键词，多个词请用空格或回车隔开" 
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">支持逻辑符：空格(与)、OR(或)、-(排除)</p>
                </div>
            )}
        </div>

        {/* Region */}
        <div className="space-y-2 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('region')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">地区选择</label>
                {expandedSections.region ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.region && (
                <div 
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm flex justify-between items-center bg-white animate-in fade-in duration-300 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => setShowRegionSelector(true)}
                >
                    <span className="text-gray-900 truncate pr-2">{formatRegionObj(regionObj)}</span>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
            )}
        </div>

        {/* Publish Time */}
        <div className="space-y-3 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('publishTime')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">发布时间</label>
                {expandedSections.publishTime ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.publishTime && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="grid grid-cols-4 gap-2">
                        {['不限', '今天', '近3天', '近7天', '近30天', '近60天', '近90天', '近180天', '近一年', '自定义'].map((label) => (
                            <button 
                                key={label}
                                onClick={() => setPublishTime(label)}
                                className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                    publishTime === label 
                                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {publishTime === '自定义' && (
                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex-1 relative">
                                <input 
                                    type="date" 
                                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    value={customStartTime}
                                    onChange={(e) => setCustomStartTime(e.target.value)}
                                />
                                <div className="w-full border border-gray-200 text-gray-500 rounded-lg py-2.5 px-3 text-xs bg-white text-center">
                                    {customStartTime || '开始时间'}
                                </div>
                            </div>
                            <div className="text-gray-400 text-xs px-1">至</div>
                            <div className="flex-1 relative">
                                <input 
                                    type="date" 
                                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    value={customEndTime}
                                    onChange={(e) => setCustomEndTime(e.target.value)}
                                />
                                <div className="w-full border border-gray-200 text-gray-500 rounded-lg py-2.5 px-3 text-xs bg-white text-center">
                                    {customEndTime || '结束时间'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Amount */}
        <div className="space-y-3 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('amount')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">项目金额</label>
                {expandedSections.amount ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.amount && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="grid grid-cols-4 gap-2">
                        {['不限', '<100万', '100-500万', '>500万'].map((label) => (
                            <button 
                                key={label}
                                onClick={() => {
                                    setAmountPreset(label);
                                    setAmountMin('');
                                    setAmountMax('');
                                }}
                                className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                    amountPreset === label 
                                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input 
                                type="number"
                                className="w-full border border-gray-200 rounded-lg py-2.5 pl-3 pr-8 text-sm outline-none focus:border-blue-500 text-center" 
                                placeholder="最小金额"
                                value={amountMin}
                                onChange={(e) => {
                                    setAmountMin(e.target.value);
                                    setAmountPreset('');
                                }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">万</span>
                        </div>
                        <div className="w-4 h-px bg-gray-300"></div>
                        <div className="flex-1 relative">
                            <input 
                                type="number"
                                className="w-full border border-gray-200 rounded-lg py-2.5 pl-3 pr-8 text-sm outline-none focus:border-blue-500 text-center" 
                                placeholder="最大金额"
                                value={amountMax}
                                onChange={(e) => {
                                    setAmountMax(e.target.value);
                                    setAmountPreset('');
                                }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">万</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Project Type / 业务类型 */}
        <div className="space-y-3 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('projectType')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">业务类型</label>
                {expandedSections.projectType ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.projectType && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex flex-wrap gap-2">
                        {['不限', '工程建设', '政府采购', '土地使用权', '矿业权', '国有产权', '碳排放权', '排污权', '药品采购权', '二类疫苗', '林权', '其他'].map((type) => (
                            <button 
                                key={type}
                                onClick={() => {
                                    let newTypes = [...projectTypes];
                                    if (type === '不限') {
                                        newTypes = ['不限'];
                                    } else {
                                        if (newTypes.includes('不限')) newTypes = newTypes.filter(t => t !== '不限');
                                        if (newTypes.includes(type)) newTypes = newTypes.filter(t => t !== type);
                                        else newTypes.push(type);
                                        if (newTypes.length === 0) newTypes = ['不限'];
                                    }
                                    setProjectTypes(newTypes);
                                    setAnnouncementType('不限');
                                }}
                                className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                                    projectTypes.includes(type) 
                                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Announcement Type / 公告类型 */}
        <div className="space-y-3 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('announcementType')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">公告类型</label>
                {expandedSections.announcementType ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.announcementType && (
                <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                    {(() => {
                        const projectType = projectTypes[0] || '不限';
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
                        return options.map((type) => (
                            <button 
                                key={type}
                                onClick={() => setAnnouncementType(type)}
                                className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                                    announcementType === type 
                                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {type}
                            </button>
                        ));
                    })()}
                </div>
            )}
        </div>

        {/* Industry Classification / 行业分类 */}
        <div className="space-y-2 border-b border-gray-50 pb-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-900">行业分类</label>
                <button 
                  className="text-[#1677FF] text-[13px] hover:underline font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIndustrySelector(true);
                  }}
                >
                  设置行业分类
                </button>
            </div>
            <div 
              className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700 min-h-[44px] cursor-pointer flex flex-wrap gap-2 items-center"
              onClick={(e) => {
                e.stopPropagation();
                setShowIndustrySelector(true);
              }}
            >
              {industryClassification.length > 0 && !industryClassification.includes('全部') ? (
                industryClassification.map(name => {
                  const node = findIndustryNodeByName(name, INDUSTRY_TREE_DATA);
                  return node ? (
                    <span key={name} className="px-2 py-1 bg-blue-50 text-[#1677FF] rounded-md text-[13px]">
                      {node.name}
                    </span>
                  ) : (
                    <span key={name} className="px-2 py-1 bg-blue-50 text-[#1677FF] rounded-md text-[13px]">
                      {name}
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-400">点击选择行业分类...</span>
              )}
            </div>
        </div>

        {/* Bidding Method / 招标组织方式 */}
        <div className="space-y-3 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('biddingMethod')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">招标组织方式</label>
                {expandedSections.biddingMethod ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.biddingMethod && (
                <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                    {['全部', '公开招标', '邀请招标', '竞争性磋商', '直接发包', '竞争性谈判', '单一来源', '竞价', '询价'].map((method) => (
                        <button 
                            key={method}
                            onClick={() => {
                                let newMethods = [...biddingMethod];
                                if (method === '全部') {
                                    newMethods = ['全部'];
                                } else {
                                    if (newMethods.includes('全部')) newMethods = newMethods.filter(m => m !== '全部');
                                    if (newMethods.includes(method)) newMethods = newMethods.filter(m => m !== method);
                                    else newMethods.push(method);
                                    if (newMethods.length === 0) newMethods = ['全部'];
                                }
                                setBiddingMethod(newMethods);
                            }}
                            className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                                biddingMethod.includes(method) 
                                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Bid Deadline / 投标截止时间 */}
        <div className="space-y-3 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('bidDeadline')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">投标截止时间</label>
                {expandedSections.bidDeadline ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.bidDeadline && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-2">
                        {['不限', '近三天', '近十天', '近一月', '近三月', '自定义'].map((label) => (
                            <button 
                                key={label}
                                onClick={() => setBidDeadline(label)}
                                className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                    bidDeadline === label 
                                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Funding Source / 资金来源 */}
        <div className="space-y-3 border-b border-gray-50 pb-4">
            <button 
                onClick={() => toggleSection('fundingSource')}
                className="w-full flex justify-between items-center group"
            >
                <label className="text-sm font-bold text-gray-900 cursor-pointer">资金来源</label>
                {expandedSections.fundingSource ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedSections.fundingSource && (
                <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                    {['全部', '企业', '政府', '自筹', '财政', '其他'].map((source) => (
                        <button 
                            key={source}
                            onClick={() => {
                                let newSources = [...fundingSource];
                                if (source === '全部') {
                                    newSources = ['全部'];
                                } else {
                                    if (newSources.includes('全部')) newSources = newSources.filter(s => s !== '全部');
                                    if (newSources.includes(source)) newSources = newSources.filter(s => s !== source);
                                    else newSources.push(source);
                                    if (newSources.length === 0) newSources = ['全部'];
                                }
                                setFundingSource(newSources);
                            }}
                            className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                                fundingSource.includes(source) 
                                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {source}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Qualification Requirements */}
        <div className="space-y-2 border-b border-gray-50 pb-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-900">企业资质要求</label>
                <button 
                  className="text-[#1677FF] text-[13px] hover:underline font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQualificationSelector(true);
                  }}
                >
                  设置企业资质
                </button>
            </div>
            <div 
              className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700 min-h-[44px] cursor-pointer flex flex-wrap gap-2 items-center"
              onClick={(e) => {
                e.stopPropagation();
                setShowQualificationSelector(true);
              }}
            >
              {qualificationIds.length > 0 ? (
                qualificationIds.map(id => {
                  const node = findQualNodeById(id, QUALIFICATION_TREE_DATA);
                  return node ? (
                    <span key={id} className="px-2 py-1 bg-blue-50 text-[#1677FF] rounded-md text-[13px]">
                      {node.name}
                    </span>
                  ) : null;
                })
              ) : (
                <span className="text-gray-400">点击选择企业资质...</span>
              )}
            </div>
        </div>

        {/* List Items */}
        <div className="space-y-0 border-t border-gray-100 pt-2">
            {[
                // Removed Publish Time as it's now a top-level filter
            ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-4 border-b border-gray-50">
                    <span className="text-sm text-gray-900">{item.label}</span>
                    <div className="flex items-center gap-1 text-gray-500">
                        <span className="text-sm text-blue-600">{item.value}</span>
                        <ChevronRight size={16} className="text-gray-300" />
                    </div>
                </div>
            ))}
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 max-w-md mx-auto">
        <button 
          className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 active:bg-blue-600 transition-colors text-base"
          onClick={handleSave}
        >
            {editingPlan ? '保存修改' : '保存并开始订阅'}
        </button>
      </div>

      {/* Sticky Bottom Banner */}
      <div className={`fixed bottom-20 left-4 right-4 z-40 transition-all duration-300 transform ${showStickyBanner ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'} max-w-md mx-auto`}>
        <div className="bg-[#101828] rounded-xl p-3.5 flex items-center justify-between shadow-2xl border border-white/10">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-[#FFE485] to-[#D4AF37] rounded-lg flex items-center justify-center text-[#101828] shadow-lg shadow-yellow-500/10">
                    <Crown size={20} fill="#101828" strokeWidth={1} />
                </div>
                <div>
                    <div className="text-white font-bold text-sm tracking-tight">黄金会员订阅</div>
                    <div className="text-white/60 text-[10px] font-medium">Efficiency +50% · 掌握第一手商机</div>
                </div>
            </div>
            <button className="bg-[#F5C543] text-[#101828] text-xs font-bold px-5 py-2 rounded-full active:scale-95 transition-all">
                立即开通
            </button>
        </div>
      </div>
      {showQualificationSelector && (
        <div className="fixed inset-0 z-[100]">
          <QualificationSelector
            initialSelectedIds={qualificationIds}
            onConfirm={(ids) => {
              setQualificationIds(ids);
              setShowQualificationSelector(false);
            }}
            onClose={() => setShowQualificationSelector(false)}
          />
        </div>
      )}
      {showIndustrySelector && (
        <div className="fixed inset-0 z-[100]">
          <IndustrySelector
            initialSelected={industryClassification}
            onConfirm={(ids) => {
              setIndustryClassification(ids);
              setShowIndustrySelector(false);
            }}
            onClose={() => setShowIndustrySelector(false)}
          />
        </div>
      )}
      {showRegionSelector && (
        <RegionSelector
          initialRegion={regionObj}
          onConfirm={(region) => {
            setRegionObj(region);
            setShowRegionSelector(false);
          }}
          onClose={() => setShowRegionSelector(false)}
        />
      )}
    </div>
  );
};
