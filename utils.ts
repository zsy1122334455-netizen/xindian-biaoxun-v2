export const getProjectTypeStyle = (type?: string) => {
  if (!type) return 'bg-[#F0F5FF] text-[#2F54EB]';
  if (type.includes('工程')) return 'bg-[#F0F5FF] text-[#2F54EB]'; // Blue
  if (type.includes('政府')) return 'bg-[#F6FFED] text-[#389E0D]'; // Green
  if (type.includes('企业')) return 'bg-[#FFF0F6] text-[#EB2F96]'; // Pink
  if (type.includes('医疗') || type.includes('健康')) return 'bg-[#E6FFFB] text-[#13C2C2]'; // Cyan
  return 'bg-[#F0F5FF] text-[#2F54EB]'; // Default Blue
};

export const getAnnouncementTypeStyle = (type?: string) => {
  if (!type) return 'bg-[#F5F5F5] text-[#666666]';
  if (type.includes('公告') && !type.includes('变更') && !type.includes('结果') && !type.includes('前期') && !type.includes('预') && !type.includes('候选人')) return 'bg-[#FFF2E8] text-[#FA541C]'; // Orange for 新公告
  if (type.includes('前期公告') || type.includes('预公告') || type.includes('计划')) return 'bg-[#E6FFFB] text-[#13C2C2]'; // Cyan for 前期公告
  if (type.includes('变更') || type.includes('答疑') || type.includes('澄清')) return 'bg-[#FFFBE6] text-[#FAAD14]'; // Yellow for 变更
  if (type.includes('候选人') || type.includes('结果') || type.includes('中标')) return 'bg-[#F6FFED] text-[#389E0D]'; // Green for 结果
  if (type.includes('废标') || type.includes('流标') || type.includes('失败')) return 'bg-[#FFF1F0] text-[#FF4D4F]'; // Red for 失败
  return 'bg-[#F5F5F5] text-[#666666]'; // Default Gray
};

export const parseTags = (tags?: string[]): { orgMethod?: string; announcementType?: string } => {
  if (!tags || !Array.isArray(tags)) return {};
  
  const orgMethod = tags.find(t => 
    t.includes('招标') || 
    t.includes('竞价') || 
    t.includes('谈判') || 
    t.includes('磋商') || 
    t.includes('单一来源') || 
    t.includes('询价')
  );

  const announcementType = tags.find(t => 
    t.includes('公告') || 
    t.includes('计划') || 
    t.includes('公示') || 
    t.includes('结果') || 
    t.includes('中标') || 
    t.includes('成交') || 
    t.includes('更正')
  );

  return { orgMethod, announcementType };
};

const isEarlyStage = (currentStage?: string, tags?: string[]): boolean => {
  const words = ['前期', '意向', '需求', '计划'];
  if (currentStage && words.some(w => currentStage.includes(w))) {
    return true;
  }
  if (tags && Array.isArray(tags) && tags.some(t => words.some(w => t.includes(w)))) {
    return true;
  }
  return false;
};

export const getAmountDisplay = (
  amount?: string | null,
  currentStage?: string,
  tags?: string[]
): string => {
  if (amount && amount !== '--' && amount.trim() !== '') {
    return amount;
  }
  return isEarlyStage(currentStage, tags) ? '暂未明确' : '详见招标文件';
};

export const getDeadlineDisplay = (
  deadline?: string | null,
  currentStage?: string,
  tags?: string[],
  shouldFormat: boolean = false
): string => {
  if (deadline && deadline.trim() !== '') {
    if (shouldFormat) {
      const match = deadline.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return match[1];
      }
    }
    return deadline;
  }
  return isEarlyStage(currentStage, tags) ? '待定' : '详见公告';
};


