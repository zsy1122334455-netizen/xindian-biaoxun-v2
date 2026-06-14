import React from 'react';
import { ChevronLeft, Check, FileText } from 'lucide-react';
import { Opportunity, ViewName } from '../types';
import { getOpportunityStatusInfo, getCountdownText, getDaysDiff } from '../utils/statusUtils';

interface ProjectTimelineProps {
  onBack: () => void;
  opportunity?: Opportunity;
  onNavigate?: (view: ViewName, data?: any) => void;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ onBack, opportunity, onNavigate }) => {
  const currentStage = opportunity?.currentStage || '招标公告';
  const { primary, badges } = getOpportunityStatusInfo(opportunity?.currentStage, opportunity?.deadline);
  
  const hasExplicitClarifyTime = 
    !!opportunity?.clarificationDate ||
    currentStage === '答疑澄清' || 
    currentStage === '更正公告' || 
    currentStage === '变更公告' || 
    currentStage === '补遗公告' ||
    currentStage === '澄清公告' ||
    currentStage === '答疑公告';

  const hasQAIndicator = 
    badges.includes('答疑') || 
    badges.includes('变更') ||
    currentStage.includes('答疑') ||
    currentStage.includes('澄清') ||
    currentStage.includes('更正') ||
    currentStage.includes('变更') ||
    currentStage.includes('补遗') ||
    currentStage.includes('修改') ||
    (opportunity?.title || '').includes('答疑') ||
    (opportunity?.title || '').includes('澄清') ||
    (opportunity?.title || '').includes('更正') ||
    (opportunity?.title || '').includes('变更') ||
    (opportunity?.title || '').includes('补遗') ||
    (opportunity?.title || '').includes('修改') ||
    opportunity?.tags?.some(t => t.includes('答疑') || t.includes('澄清') || t.includes('更正') || t.includes('变更') || t.includes('补遗') || t.includes('修改')) ||
    false;

  const isTerminated = primary === '已终止';

  // 1. Identify active step type:
  let activeStepType: 'pre' | 'pre_qual' | 'announce' | 'closing' | 'clarify' | 'deadline' | 'candidates' | 'result' | 'terminated' = 'deadline';

  if (primary === '前期公告') {
    activeStepType = 'pre';
  } else if (currentStage === '资格预审公告' || currentStage.includes('资格预审')) {
    activeStepType = 'pre_qual';
  } else if (currentStage === '招标公告' || currentStage === '采购公告' || currentStage === '磋商公告' || currentStage === '谈判公告' || currentStage === '询价公告' || currentStage === '招标中') {
    activeStepType = 'announce';
  } else if (currentStage === '招标文件领取截止时间' || currentStage.includes('领取截止')) {
    activeStepType = 'closing';
  } else if (hasExplicitClarifyTime) {
    activeStepType = 'clarify';
  } else if (primary === '已截止' || currentStage === '投标截止时间' || currentStage.includes('投标截止')) {
    activeStepType = 'deadline';
  } else if (primary === '结果公示') {
    activeStepType = 'candidates';
  } else if (primary === '已结束') {
    activeStepType = 'result';
  } else if (primary === '已终止') {
    activeStepType = 'terminated';
  }

  // Precedence order to calculate completion / active status
  const stepPrecedence: ('pre' | 'pre_qual' | 'announce' | 'closing' | 'clarify' | 'deadline' | 'candidates' | 'result')[] = [
    'pre',
    'pre_qual',
    'announce',
    'closing',
    'clarify',
    'deadline',
    'candidates',
    'result'
  ];

  const getStepStatus = (type: typeof stepPrecedence[number]) => {
    if (isTerminated) {
      if (type === 'pre' || type === 'pre_qual' || type === 'announce' || type === 'closing' || type === 'clarify') {
        return 'completed';
      }
      return 'skipped';
    }

    const activeIdx = stepPrecedence.indexOf(activeStepType as any);
    const stepIdx = stepPrecedence.indexOf(type);

    if (activeIdx > stepIdx) {
      return 'completed';
    } else if (activeIdx === stepIdx) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const steps: {
    title: string;
    date: string | null;
    status: 'completed' | 'active' | 'pending' | 'skipped' | 'error';
    isKey?: boolean;
    countdown?: string;
    isUrgent?: boolean;
    description?: string;
  }[] = [];

  // Step 1: Pre-announcement (前期公告)
  let preTitle = '招标计划';
  if (currentStage.includes('采购意向') || opportunity?.currentStage?.includes('采购意向')) {
    preTitle = '采购意向';
  } else if (currentStage.includes('需求公示') || opportunity?.currentStage?.includes('需求公示')) {
    preTitle = '需求公示';
  } else if (currentStage.includes('招标计划') || opportunity?.currentStage?.includes('招标计划')) {
    preTitle = '招标计划';
  } else if (opportunity?.tags?.some(t => t.includes('采购意向'))) {
    preTitle = '采购意向';
  } else if (opportunity?.tags?.some(t => t.includes('需求公示'))) {
    preTitle = '需求公示';
  }
  
  const preStatus = getStepStatus('pre');
  steps.push({
    title: preTitle,
    date: (preStatus === 'active' || preStatus === 'completed') ? (opportunity?.date || '2026-05-25 10:00') : '--',
    status: preStatus
  });

  // Step 2: Pre-qualification (资格预审公告) - Only insert if it is the currentStage, or if the project has it
  const isPreQualProject = currentStage.includes('资格预审') || (opportunity?.tags || []).some(t => t.includes('资格预审'));
  if (isPreQualProject) {
    const preQualStatus = getStepStatus('pre_qual');
    steps.push({
      title: '资格预审公告',
      date: (preQualStatus === 'active' || preQualStatus === 'completed') ? (opportunity?.date || '2026-05-26 09:00') : '--',
      status: preQualStatus
    });
  }

  // Step 3: Announcement (招标/采购公告)
  let announceTitle = '招标公告';
  if (currentStage.includes('采购公告') || (opportunity?.tags || []).some(t => t.includes('采购公告'))) {
    announceTitle = '采购公告';
  }
  const annStatus = getStepStatus('announce');
  let announceDate: string | null = '--';
  if (annStatus === 'completed') {
    announceDate = '2026-05-28 14:16';
  } else if (annStatus === 'active') {
    announceDate = opportunity?.date || '2026-05-28 14:16';
  }
  steps.push({
    title: announceTitle,
    date: announceDate,
    status: annStatus
  });

  // Step 4: Closing of Bid Document Retrieval (招标文件领取截止)
  const closingStatus = getStepStatus('closing');
  let closingDate: string | null = null;
  if (closingStatus === 'completed') {
    closingDate = '2026-06-01 17:00';
  } else if (closingStatus === 'active') {
    closingDate = opportunity?.deadline || '2026-06-01 17:00';
  }
  steps.push({
    title: '招标文件领取截止',
    date: closingDate,
    status: closingStatus
  });

  // Step 5: Clarification/QA (答疑/澄清) - Only insert if clarification Date or Explicit Clarify Time exists
  if (hasExplicitClarifyTime) {
    let clarifyTitle = opportunity?.clarificationTitle || '答疑/澄清';
    if (!opportunity?.clarificationTitle) {
      if (currentStage.includes('答疑')) {
        clarifyTitle = '答疑公告';
      } else if (currentStage.includes('澄清')) {
        clarifyTitle = '澄清公告';
      } else if (currentStage.includes('更正') || currentStage.includes('变更')) {
        clarifyTitle = '变更公告';
      } else if (currentStage.includes('补遗')) {
        clarifyTitle = '补遗公告';
      }
    }
    const clarifyStatus = getStepStatus('clarify');
    let clarifyDate: string | null = null;
    if (opportunity?.clarificationDate) {
      clarifyDate = opportunity.clarificationDate;
    } else if (clarifyStatus === 'completed') {
      clarifyDate = '2026-06-03 10:00';
    } else if (clarifyStatus === 'active') {
      clarifyDate = opportunity?.date || '2026-06-03 10:00';
    }
    steps.push({
      title: clarifyTitle,
      date: clarifyDate,
      status: clarifyStatus
    });
  }

  // Step 6: Bidding Deadline (投标截止)
  const deadlineStatus = getStepStatus('deadline');
  let countdownTxt: string | undefined = undefined;
  let isDeadlineUrgent = false;
  if (deadlineStatus === 'active' && opportunity?.deadline) {
    const countdownInfo = getCountdownText(opportunity.deadline);
    if (countdownInfo) {
      countdownTxt = countdownInfo.text.replace('距截止 ', '剩 ');
      isDeadlineUrgent = countdownInfo.isUrgent;
    }
  }
  steps.push({
    title: '投标截止',
    date: opportunity?.deadline || null,
    status: deadlineStatus,
    isKey: true,
    countdown: countdownTxt,
    isUrgent: isDeadlineUrgent
  });

  if (isTerminated) {
    steps.push({
      title: currentStage || '项目流标/废标终止',
      date: opportunity?.date || '2026-06-11 10:00',
      status: 'error',
      isKey: true,
      description: '项目已在当前阶段终止。原因：流标、废标或采购终止。'
    });
  } else {
    // Step 7: Candidate Announcement (中标候选人公示)
    let candidateTitle = '中标候选人公示';
    if (currentStage === '评标结果公示') {
      candidateTitle = '评标结果公示';
    }
    const candidateStatus = getStepStatus('candidates');
    steps.push({
      title: candidateTitle,
      date: (candidateStatus === 'active' || candidateStatus === 'completed') ? '2026-06-25 10:00' : null,
      status: candidateStatus,
      countdown: candidateStatus === 'active' ? '3天' : undefined
    });

    // Step 8: Result Announcement (中标结果公告)
    let resultTitle = '中标结果公告';
    if (currentStage.includes('成交公告')) {
      resultTitle = '成交公告';
    } else if (currentStage.includes('中标公告')) {
      resultTitle = '中标公告';
    }
    const resultStatus = getStepStatus('result');
    steps.push({
      title: resultTitle,
      date: (resultStatus === 'active' || resultStatus === 'completed') ? '2026-06-28 10:00' : null,
      status: resultStatus
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans text-gray-900 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <header className="sticky top-0 z-50 bg-white px-4 pt-safe-top pb-2 border-b border-gray-100">
        <div className="flex items-center justify-center h-12 relative">
          <button onClick={onBack} className="absolute left-0 flex h-10 w-10 items-center justify-start text-gray-800 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[18px] font-bold text-gray-900 whitespace-nowrap">项目进度</h1>
          <div className="absolute right-0 flex h-10 w-10"></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-5 pb-2">
          <div className="relative">
            {/* Timeline Wrapper */}
            <div className="space-y-0 relative z-10">
              {steps.map((step, index) => {
                const isCompleted = step.status === 'completed';
                const isActive = step.status === 'active';
                const isPending = step.status === 'pending';
                const isSkipped = step.status === 'skipped';
                const isError = step.status === 'error';
                const isLast = index === steps.length - 1;

                return (
                  <div key={index} className="relative flex items-stretch">
                    {/* Vertical Line connecting nodes */}
                    {!isLast && (
                      <div className={`absolute left-[9px] top-6 bottom-[-6px] ${
                        (isCompleted || isSkipped) ? 'bg-primary w-[2px]' :
                        isActive ? 'bg-orange-500 w-[2px]' :
                        isError ? 'bg-red-500 w-[2px]' :
                        'border-l-2 border-dashed border-gray-200 w-0'
                      }`}></div>
                    )}

                    {/* Timeline Node Icon */}
                    <div className="flex-shrink-0 w-5 h-5 mt-1 relative z-10 flex items-center justify-center bg-white rounded-full">
                      {isCompleted && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      {isActive && (
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"></div>
                      )}
                      {isError && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[12px] font-extrabold pb-0.5">!</span>
                        </div>
                      )}
                      {isSkipped && (
                        <div className="w-2.5 h-2.5 rounded-full border-[2px] border-gray-300 bg-gray-100/50"></div>
                      )}
                      {isPending && (
                         <div className="w-2.5 h-2.5 rounded-full border-[2px] border-gray-300 bg-white"></div>
                      )}
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 ml-3 pb-8 min-h-[60px]">
                      <div 
                        className={`flex flex-col flex-1 p-3 rounded-lg ${
                          isError ? 'bg-red-50 border border-red-100' :
                          isActive ? 'bg-orange-50 border border-orange-100' : 
                          (isCompleted || isSkipped) ? 'bg-[#F9FCFF]' : ''
                        } ${step.title.includes('公告') && (isCompleted || isActive) ? 'cursor-pointer active:opacity-70 transition-opacity' : ''}`}
                        onClick={() => {
                          if (onNavigate && opportunity && step.title.includes('公告') && (isCompleted || isActive)) {
                             onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opportunity);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[15px] ${
                                isError ? 'font-bold text-red-600' :
                                isActive ? 'font-bold text-orange-500' : 
                                isCompleted ? 'font-bold text-primary' : 
                                'font-medium text-gray-400'
                              }`}>
                                {step.title}
                              </span>
                              {step.isKey && (
                                <span className="px-1 py-0.5 bg-red-100/80 text-red-600 text-[10px] font-bold rounded-sm border border-red-200/50">
                                  重要
                                </span>
                              )}
                            </div>
                            
                            {/* Date Line */}
                            {step.date ? (
                              <span className={`text-[12px] font-numbers mt-0.5 ${
                                isError ? 'text-red-500/80' :
                                isActive ? 'text-orange-500/80' : 
                                isCompleted ? 'text-primary' : 
                                'text-gray-400'
                              }`}>
                                {step.date}
                              </span>
                            ) : (
                              <span className="text-[12px] text-gray-300 mt-0.5">暂无时间</span>
                            )}

                            {step.description && (
                              <p className="text-[12px] text-red-500/85 font-sans mt-1">
                                {step.description}
                              </p>
                            )}
                          </div>

                          {/* Countdown Bubble Box on Right side */}
                          {isActive && step.countdown && !step.title.includes('公告') && (
                            <div className={`shrink-0 text-[11px] font-bold ${step.isUrgent !== false ? 'text-[#FA8C16] border-[#FFD591] bg-[#FFF7E6]' : 'text-gray-500 border-gray-200 bg-gray-50'} border px-2 py-1 rounded-md flex flex-col items-center justify-center shadow-sm`}>
                              <span className={`text-[10px] ${step.isUrgent !== false ? 'text-[#FA8C16]/80' : 'text-gray-400'} font-medium whitespace-nowrap`}>还剩</span>
                              <span className="whitespace-nowrap">{step.countdown}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions below content */}
                        {isActive && step.title.includes('公告') && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-orange-200/50">
                            <button className="text-[11px] text-gray-600 flex items-center justify-center gap-1 active:opacity-70 flex-1 py-1.5 bg-white rounded shadow-sm border border-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigate && opportunity) {
                                   onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opportunity);
                                }
                              }}
                            >
                              <FileText size={13} />
                              看详情
                            </button>
                          </div>
                        )}
                        {!isActive && isCompleted && step.title.includes('公告') && (
                           <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100/50">
                                <button className="text-[11px] text-primary flex items-center justify-center gap-0.5 active:opacity-70"
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     if (onNavigate && opportunity) {
                                        onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opportunity);
                                     }
                                  }}
                                >
                                  查看详情 <ChevronLeft size={12} className="rotate-180" />
                                </button>
                           </div>
                        )}
                        {step.title === '投标截止' && !hasExplicitClarifyTime && hasQAIndicator && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigate && opportunity) {
                                onNavigate(ViewName.ANNOUNCEMENT_DETAIL, opportunity);
                              }
                            }}
                            className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 hover:text-primary transition-colors cursor-pointer group"
                          >
                            <span className="flex items-center gap-1">
                              <FileText size={12} className="text-gray-400 group-hover:text-primary transition-colors" />
                              <span>相关文件：<span className="font-medium text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-primary transition-colors">答疑澄清公告</span></span>
                            </span>
                            <span className="text-[10px] text-gray-400 group-hover:text-primary flex items-center gap-0.5 font-medium transition-colors">
                              查看详情 <ChevronLeft size={10} className="rotate-180" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
