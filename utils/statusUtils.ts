import { Opportunity } from "../types";

export type PrimaryStatus = '前期公告' | '招标中' | '已截止' | '结果公示' | '已结束' | '已终止';
export type CornerBadgeType = '变更' | '答疑';

export interface StatusInfo {
  primary: PrimaryStatus;
  badges: CornerBadgeType[];
}

export const getDaysDiff = (deadline?: string): number | null => {
  if (!deadline) return null;
  const clean = deadline.trim();
  if (!clean) return null;
  let t = Date.parse(clean.replace(/-/g, '/'));
  if (isNaN(t)) {
    t = new Date(clean).getTime();
  }
  if (isNaN(t)) return null;

  const now = new Date();
  const deadlineDate = new Date(t);
  
  const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const deadlineDayStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()).getTime();
  
  return Math.round((deadlineDayStart - nowDayStart) / (1000 * 60 * 60 * 24));
};

export const hasPassedDeadline = (deadline?: string): boolean => {
  const diff = getDaysDiff(deadline);
  if (diff === null) return false;
  return diff < 0;
};

export const getOpportunityStatusInfo = (currentStage?: string, deadline?: string): StatusInfo => {
  const stage = (currentStage || '').trim();
  let primary: PrimaryStatus = '招标中';
  
  // 1. Definition of stages mapping rules:
  const preAnnounces = ['采购意向', '招标意向', '需求公示', '招标计划'];
  
  const biddingStages = [
    '资格预审公告', '招标公告', '采购公告', '磋商公告', '谈判公告', '询价公告',
    '报名中', '招标文件领取中', '答疑澄清', '答疑澄清公告', '补遗公告', '更正公告', '变更公告'
  ];
  
  const closedStages = ['招标文件领取截止时间', '投标截止时间'];
  
  const resultAnnounces = ['中标候选人公示', '评标结果公示', '成交候选人公示', '公示中', '公示期'];
  
  const endedAnnounces = ['中标结果公告', '中标公告', '成交公告', '合同公告'];
  
  const terminatedAnnounces = ['流标公告', '废标公告', '终止公告', '暂停公告'];

  if (preAnnounces.includes(stage)) {
    primary = '前期公告';
  } else if (terminatedAnnounces.includes(stage)) {
    primary = '已终止';
  } else if (endedAnnounces.includes(stage)) {
    primary = '已结束';
  } else if (resultAnnounces.includes(stage)) {
    primary = '结果公示';
  } else if (closedStages.includes(stage)) {
    primary = '已截止';
  } else if (biddingStages.includes(stage) || stage === '招标中') {
    if (deadline && hasPassedDeadline(deadline)) {
      primary = '已截止';
    } else {
      primary = '招标中';
    }
  } else {
    // Soft/Fuzzy mappings to cover pre-allocated future data correctly:
    if (preAnnounces.some(x => stage.includes(x)) || stage.includes('意向') || stage.includes('计划')) {
      primary = '前期公告';
    } else if (terminatedAnnounces.some(x => stage.includes(x)) || stage.includes('流标') || stage.includes('废标') || stage.includes('终止') || stage.includes('暂停') || stage.includes('中止')) {
      primary = '已终止';
    } else if (endedAnnounces.some(x => stage.includes(x)) || stage.includes('合同') || stage.includes('结果公告') || stage.includes('成交公告') || stage.includes('中标公告') || stage.includes('成交公告')) {
      primary = '已结束';
    } else if (resultAnnounces.some(x => stage.includes(x)) || stage.includes('公示') || stage.includes('候选人')) {
      primary = '结果公示';
    } else if (closedStages.some(x => stage.includes(x)) || stage.includes('截止') || stage === '评审中' || stage === '已截止') {
      primary = '已截止';
    } else {
      if (deadline && hasPassedDeadline(deadline)) {
        primary = '已截止';
      } else {
        primary = '招标中';
      }
    }
  }

  // If the determined primary is '已截止', but the deadline is today or in the future:
  if (primary === '已截止' && deadline) {
    const diff = getDaysDiff(deadline);
    if (diff !== null && diff >= 0) {
      primary = '招标中';
    }
  }

  // 2. Overlapping sub-badges (not mutually exclusive):
  // - 变更 ⟵ 变更, 更正
  // - 答疑 ⟵ 答疑, 澄清, 补遗, 补充
  const badges: CornerBadgeType[] = [];
  if (stage.includes('变更') || stage.includes('更正')) {
    badges.push('变更');
  }
  if (stage.includes('答疑') || stage.includes('澄清') || stage.includes('补遗') || stage.includes('补充')) {
    badges.push('答疑');
  }

  return { primary, badges };
};

export interface CountdownInfo {
  text: string;
  isUrgent: boolean;
}

export const getCountdownText = (deadlineStr?: string): CountdownInfo | null => {
  const diffDaysInt = getDaysDiff(deadlineStr);
  if (diffDaysInt === null) return null;
  
  if (diffDaysInt < 0) {
    return { text: '已截止', isUrgent: false };
  } else if (diffDaysInt === 0) {
    return { text: '今日截止', isUrgent: true };
  } else if (diffDaysInt === 1) {
    return { text: '明日截止', isUrgent: true };
  } else if (diffDaysInt >= 2 && diffDaysInt <= 7) {
    return { text: `距截止 ${diffDaysInt} 天`, isUrgent: diffDaysInt <= 3 };
  } else {
    return null;
  }
};

export interface StatusStyle {
  bg: string;
  text: string;
  border: string;
}

// Color schemes: 前期公告=蓝灰、招标中=蓝、已截止=橙、结果公示=紫、已结束=灰、已终止=红
export const PRIMARY_STATUS_STYLES: Record<PrimaryStatus, StatusStyle> = {
  '前期公告': {
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#475569]',
    border: 'border-[#CBD5E1]'
  },
  '招标中': {
    bg: 'bg-[#E6F4FF]',
    text: 'text-[#1677FF]',
    border: 'border-[#91CAFF]'
  },
  '已截止': {
    bg: 'bg-[#FFF7E6]',
    text: 'text-[#D46B08]',
    border: 'border-[#FFD591]'
  },
  '结果公示': {
    bg: 'bg-[#F9F0FF]',
    text: 'text-[#722ED1]',
    border: 'border-[#D3ADF7]'
  },
  '已结束': {
    bg: 'bg-[#F5F5F5]',
    text: 'text-[#8C8C8C]',
    border: 'border-[#D9D9D9]'
  },
  '已终止': {
    bg: 'bg-[#FFF1F0]',
    text: 'text-[#CF1322]',
    border: 'border-[#FFCCC7]'
  }
};

export const BADGE_STYLES: Record<CornerBadgeType, StatusStyle> = {
  '变更': {
    bg: 'bg-[#FFFBE6]',
    text: 'text-[#D46B08]',
    border: 'border-[#FFE58F]'
  },
  '答疑': {
    bg: 'bg-[#E6FFFB]',
    text: 'text-[#08979C]',
    border: 'border-[#87E8DE]'
  }
};
