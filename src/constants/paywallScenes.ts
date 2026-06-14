import { UserRole } from '../../types';

export interface PaywallScene {
  id: string;
  title: string;
  description: string;
  buttonText: string | ((currentRole: UserRole) => string);
  targetTab: string;
  requiredRole: UserRole;
}

export const PAYWALL_SCENES: Record<string, PaywallScene> = {
  DETAIL_QUOTA: {
    id: 'DETAIL_QUOTA',
    title: '今日免费额度已用完',
    description: '普通用户每日可免费查看 10 条公告详情。开通 VIP 会员即可不限量查看全部公告详情、项目线索与企业信息（更高档位 SVIP 享全国筛选等更多特权）。',
    buttonText: '立即开通 VIP',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  ENTERPRISE_QUOTA: {
    id: 'ENTERPRISE_QUOTA',
    title: '今日企业查看额度已用完',
    description: '普通用户每日可免费查看 10 个企业详情。开通 VIP 会员即可不限量查看企业详情、中标业绩与企业动态（更高档位 SVIP 尊享全国范围高级功能）。',
    buttonText: '立即开通 VIP',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  CONTACT_PHONE: {
    id: 'CONTACT_PHONE',
    title: '联系人电话为 SVIP 专属',
    description: '开通 SVIP 可查看完整联系人电话并一键拨打，快速触达项目负责人。',
    buttonText: (currentRole: UserRole) => {
      return currentRole === UserRole.VIP ? '升级 SVIP' : '立即开通 SVIP';
    },
    targetTab: 'svip',
    requiredRole: UserRole.SVIP,
  },
  CONTACT_FOLLOW: {
    id: 'CONTACT_FOLLOW',
    title: '关注联系人为 SVIP 专属',
    description: '开通 SVIP 可关注项目联系人，第一时间掌握其参与的新项目动态。',
    buttonText: (currentRole: UserRole) => {
      return currentRole === UserRole.VIP ? '升级 SVIP' : '立即开通 SVIP';
    },
    targetTab: 'svip',
    requiredRole: UserRole.SVIP,
  },
  REGION_FILTER: {
    id: 'REGION_FILTER',
    title: '开通会员后可使用筛选',
    description: '开通 VIP 后可自定义筛选已购地市，高配 SVIP 享受全国范围精确筛选。',
    buttonText: '立即开通 VIP',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  REGION_FILTER_VIP: {
    id: 'REGION_FILTER_VIP',
    title: '该地区暂未开通筛选权限',
    description: '升级 SVIP 后可全国范围精确筛选，当前 VIP 用户升级仅需补差价。',
    buttonText: '升级 SVIP',
    targetTab: 'svip',
    requiredRole: UserRole.SVIP,
  },
  MORE_FILTER: {
    id: 'MORE_FILTER',
    title: '开通会员后可使用高级筛选',
    description: '开通 VIP 后可筛选已购地市，高配 SVIP 体验全国范围精确高级筛选。',
    buttonText: '立即开通 VIP',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  REGION_FILTER_VIP_MORE: {
    id: 'REGION_FILTER_VIP_MORE',
    title: '请先选择已购地市',
    description: '当前为全国浏览，VIP 高级筛选需在已购地市内使用。你可以先选择已购地市，或升级 SVIP 解锁全国筛选。',
    buttonText: '选择已购地市',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  SUBSCRIPTION_LIMIT: {
    id: 'SUBSCRIPTION_LIMIT',
    title: '订阅方案数量已达上限',
    description: '普通用户最多创建 1 个订阅方案。开通 VIP 会员即可不限数量创建订阅方案，多维度追踪商机。',
    buttonText: '立即开通 VIP',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  EXPORT_LOCKED: {
    id: 'EXPORT_LOCKED',
    title: '开通 VIP 解锁数据导出',
    description: '开通 VIP 每日可导出 10 条数据（升级至尊 SVIP 每日可大额导出 50 条），支持 Excel 一键下载。',
    buttonText: '立即开通 VIP',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  EXPORT_DOWNLOAD: {
    id: 'EXPORT_DOWNLOAD',
    title: '下载历史文件为会员专属',
    description: '开通 VIP 即可下载历史已导出文件，VIP 云端保存 30 天（升级 SVIP 支持延长至 90 天云端保存）。',
    buttonText: '立即开通 VIP',
    targetTab: 'vip',
    requiredRole: UserRole.VIP,
  },
  ENTERPRISE_ACTIVE: {
    id: 'ENTERPRISE_ACTIVE',
    title: '按中标次数排序为 SVIP 专属',
    description: '开通 SVIP 可按企业中标次数排序，快速锁定头部中标企业。',
    buttonText: (currentRole: UserRole) => {
      return currentRole === UserRole.VIP ? '升级 SVIP' : '立即开通 SVIP';
    },
    targetTab: 'svip',
    requiredRole: UserRole.SVIP,
  },
};
