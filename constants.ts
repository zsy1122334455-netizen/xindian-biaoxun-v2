import { Opportunity, Enterprise } from './types';

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'test_01',
    title: '【测试·自行招标】梅州市下水道管网提升改造工程',
    tags: ['招标公告', '自行招标'],
    region: '广东·梅州',
    amount: '450万',
    date: '刚刚',
    deadline: '2026-07-20 10:00',
    status: '投标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'TEST-01',
    currentStage: '招标公告',
    ownerName: '梅州市市政园林管理局',
    ownerContacts: [{ name: '林工', phone: '13800138001', role: '甲方联系人' }],
    agencyName: null,
    agencyContacts: [],
    hasPublicContacts: true
  },
  {
    id: 'test_02',
    title: '【测试·代理未公开联系人】广州市天河区第一小学智慧校园升级采购项目',
    tags: ['招标公告', '公开招标'],
    region: '广东·广州',
    amount: '120万',
    date: '3分钟前',
    deadline: '2026-07-22 14:00',
    status: '投标中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'TEST-02',
    currentStage: '招标公告',
    ownerName: '广州市天河区第一小学',
    ownerContacts: [{ name: '何老师', phone: '13900139002', role: '项目负责人' }],
    agencyName: '广东宏图招投标代理有限公司',
    agencyContacts: [],
    hasPublicContacts: true
  },
  {
    id: 'test_03',
    title: '【测试·整条未公开联系方式】深圳市南山区科技局智慧系统建设采购公告',
    tags: ['采购公告', '公开招标'],
    region: '广东·深圳',
    amount: '80万',
    date: '5分钟前',
    deadline: '2026-07-28 17:00',
    status: '投标中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'TEST-03',
    currentStage: '采购公告',
    ownerName: '深圳市南山区科技局',
    ownerContacts: [],
    agencyName: '深圳高新技术招投标咨询服务有限公司',
    agencyContacts: [],
    hasPublicContacts: false
  },
  {
    id: 'test_04',
    title: '【测试·甲方未公开(代理有联系人)】深圳市轨道交通15号线声屏障工程项目',
    tags: ['招标公告', '工程建设'],
    region: '广东·深圳',
    amount: '310万',
    date: '8分钟前',
    deadline: '2026-07-18 09:30',
    status: '投标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'TEST-04',
    currentStage: '招标公告',
    ownerName: '深圳市地铁集团有限公司',
    ownerContacts: [],
    agencyName: '深圳市建材招投标代理有限公司',
    agencyContacts: [{ name: '萧工', phone: '13500135005', role: '代理联系人' }],
    hasPublicContacts: true
  },
  {
    id: 'test_05',
    title: '【测试·已中标结果】珠海市高新区科技园区景观绿化工程中标公示',
    tags: ['中标结果', '中标公示'],
    region: '广东·珠海',
    amount: '1800万',
    date: '10分钟前',
    deadline: '2026-06-01 18:00',
    status: '已结束',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'TEST-05',
    currentStage: '中标结果公告',
    ownerName: '珠海市高新区管委会',
    ownerContacts: [{ name: '梁科长', phone: '13600136006', role: '科长' }],
    agencyName: '珠海市正太工程咨询有限公司',
    agencyContacts: [{ name: '陈经理', phone: '13700137007', role: '项目经理' }],
    winnerName: '广东建工集团有限公司',
    hasPublicContacts: true
  },
  {
    id: 'pre_spec_1',
    title: '2026年北京市海淀区教育局智慧校园采购意向公开项目',
    tags: ['采购意向', '公开招标', '政府采购'],
    region: '北京·海淀',
    amount: '800万',
    date: '10分钟前',
    deadline: '2026-10-15 17:00',
    status: '前期公告',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'BJ-HD-2026-PRE01',
    currentStage: '采购意向'
  },
  {
    id: 'pre_spec_2',
    title: '广州市政轨道交通通信配套配电设备升级需求公示',
    tags: ['需求公示', '工程建设'],
    region: '广东·广州',
    amount: '120万',
    date: '1小时前',
    deadline: '2026-10-20 18:00',
    status: '前期公告',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'GZ-GD-2026-PRE02',
    currentStage: '需求公示'
  },
  {
    id: 'pre_spec_3',
    title: '深圳市人民医院数字化医疗制氧机组采购项目资格预审公告',
    tags: ['资格预审公告', '公开招标', '政府采购'],
    region: '广东·深圳',
    amount: '350万',
    date: '3小时前',
    deadline: '2026-07-25 15:00',
    status: '前期公告',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'SZ-YY-2026-PRE03',
    currentStage: '资格预审公告'
  },
  {
    id: 'closed_spec_1',
    title: '成都市高新技术产业区科创中心大楼空调系统维保项目',
    tags: ['招标文件领取截止时间', '公开招标', '政府采购'],
    region: '四川·成都',
    amount: '240万',
    date: '1天前',
    deadline: '2026-06-05 10:00',
    status: '已截止',
    isStarred: false,
    type: 'service',
    projectType: '政府采购',
    projectCode: 'CD-GX-2026-CLS01',
    currentStage: '招标文件领取截止时间'
  },
  {
    id: 'closed_spec_2',
    title: '上海市黄浦区社区卫生服务中心数码超声诊断仪采购项目',
    tags: ['投标截止时间', '邀请招标', '政府采购'],
    region: '上海·黄浦',
    amount: '380万',
    date: '2天前',
    deadline: '2026-06-08 14:00',
    status: '已截止',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'SH-HP-2026-CLS02',
    currentStage: '投标截止时间'
  },
  {
    id: 'result_spec_1',
    title: '南京市鼓楼区公园绿化灌溉水循环及生态节能提升项目评标结果公示',
    tags: ['评标结果公示', '公开招标', '工程建设'],
    region: '江苏·南京',
    amount: '460万',
    date: '2小时前',
    deadline: '2026-06-25 10:00',
    status: '结果公示',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'NJ-GL-2026-RES01',
    currentStage: '评标结果公示'
  },
  {
    id: 'term_spec_1',
    title: '武汉市汉阳区图书馆网络信息安全设备升级建设项目流标公告',
    tags: ['流标公告', '公开招标', '政府采购'],
    region: '湖北·武汉',
    amount: '150万',
    date: '4小时前',
    deadline: '2026-06-10 17:00',
    status: '已终止',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'WH-HY-2026-TRM01',
    currentStage: '流标公告'
  },
  {
    id: 'term_spec_2',
    title: '西安市碑林区道路微循环交通工程施工监理项目终止公告',
    tags: ['终止公告', '公开招标', '工程建设'],
    region: '陕西·西安',
    amount: '80万',
    date: '1天前',
    deadline: '2026-06-08 09:00',
    status: '已终止',
    isStarred: false,
    type: 'service',
    projectType: '工程建设',
    projectCode: 'XA-BL-2026-TRM02',
    currentStage: '终止公告'
  },
  {
    id: 'gov_lifecycle_1',
    title: '2026年广州市政府办公大楼智能化综合能耗监测分析系统采购公告',
    tags: ['采购公告', '公开招标', '政府采购'],
    region: '广东·广州',
    amount: '210万',
    date: '5小时前',
    deadline: '2026-06-28 10:00',
    status: '招标中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'GZ-GOV-LF-2026',
    currentStage: '招标公告'
  },
  {
    id: 'gov_lifecycle_2',
    title: '2026年广州市政府办公大楼智能化综合能耗监测分析系统成交公告',
    tags: ['成交公告', '公开招标', '政府采购'],
    region: '广东·广州',
    amount: '198万',
    date: '2小时前',
    deadline: '2026-06-10 10:00',
    status: '已结束',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'GZ-GOV-LF-2026',
    currentStage: '成交公告'
  },
  {
    id: 'badge_spec_1',
    title: '长春市第一中学信息化教学多媒体多功能教室建设更正公告',
    tags: ['更正公告', '公开招标', '工程建设'],
    region: '吉林·长春',
    amount: '320万',
    date: '30分钟前',
    deadline: '2026-06-30 09:30',
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'CC-JY-2026-CHG',
    currentStage: '更正公告',
    clarificationDate: '2026-06-15 11:30',
    clarificationTitle: '更正公告'
  },
  {
    id: 'badge_spec_2',
    title: '沈阳市铁西区公共卫生应急指挥中心业务系统建设项目答疑澄清公告',
    tags: ['答疑澄清', '竞争性谈判', '政府采购'],
    region: '辽宁·沈阳',
    amount: '560万',
    date: '45分钟前',
    deadline: '2026-07-05 14:00',
    status: '招标中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'SY-TX-2026-CLR',
    currentStage: '答疑澄清',
    clarificationDate: '2026-06-18 10:00',
    clarificationTitle: '答疑澄清公告'
  },
  {
    id: 'demo_today',
    title: '广州市轨道交通八号线北延段工程施工总承包项目',
    tags: ['招标公告', '公开招标'],
    region: '广东·广州',
    amount: '28,500万',
    date: '5分钟前',
    deadline: '', // dynamic
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'GZ-GD-2026-001',
    currentStage: '招标公告',
    isMultiBid: true
  },
  {
    id: 'demo_tomorrow',
    title: '某属地单位2025年度信息化建设项目招标公告',
    tags: ['招标公告', '公开招标'],
    region: '北京·海淀',
    amount: '860万',
    date: '3小时前',
    deadline: '', // dynamic
    status: '招标中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'BJ-HD-2026-042',
    currentStage: '招标公告'
  },
  {
    id: 'demo_3days',
    title: '城市道路照明设施更新维护采购项目',
    tags: ['竞争性磋商', '政府采购'],
    region: '广东·深圳',
    amount: '350万',
    date: '1天前',
    deadline: '', // dynamic
    status: '报名中',
    isStarred: false,
    type: 'service',
    projectType: '政府采购',
    projectCode: 'SZ-CG-2026-115',
    currentStage: '招标公告'
  },
  {
    id: 'demo_7days',
    title: '智慧园区综合服务平台建设项目',
    tags: ['公开招标', '工程建设'],
    region: '四川·成都',
    amount: '1,280万',
    date: '2天前',
    deadline: '', // dynamic
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'CD-ZH-2026-098',
    currentStage: '招标公告'
  },
  {
    id: 'demo_expired',
    title: '某医院设备采购成交公示',
    tags: ['招标公告', '公开招标'],
    region: '浙江·杭州',
    amount: '450万',
    date: '5天前',
    deadline: '', // dynamic
    status: '招标中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'HZ-YY-2026-212',
    currentStage: '招标公告'
  },
  {
    id: 'demo_nodeadline',
    title: '园区物业管理服务采购项目',
    tags: ['招标计划', '政府采购'],
    region: '上海·浦东',
    amount: '180万',
    date: '1小时前',
    deadline: '', // dynamic/none
    status: '招标中',
    isStarred: false,
    type: 'service',
    projectType: '政府采购',
    projectCode: 'SH-PD-2026-888',
    currentStage: '招标计划'
  },
  {
    id: '36_copy',
    title: '这是一个正好三十二个字符的测试项目名称用来测试多标段标签的显示',
    tags: ['招标公告', '公开招标'],
    region: '北京·海淀',
    amount: '500万',
    date: '5小时前',
    deadline: '2025-09-05 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    isMultiBid: true
  },
  {
    id: '35_copy',
    title: '这条测试数据的长度刚刚好比一行多出一个字',
    tags: ['招标公告', '公开招标'],
    region: '北京·海淀',
    amount: '500万',
    date: '5小时前',
    deadline: '2025-09-05 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    isMultiBid: true
  },
  {
    id: '34_copy',
    title: '这是另一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长长长长长长长长长长长长长长长长的测试项目标题，用来测试多标段标签会不会被截断',
    tags: ['招标公告', '公开招标'],
    region: '四川·成都',
    amount: '400万',
    date: '4小时前',
    deadline: '2025-09-04 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    isMultiBid: true
  },
  {
    id: '33_copy',
    title: '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长长长长长长长长长长长长长长的测试项目标题，用来测试两行截断和省略号的显示效果，没有多标段标签',
    tags: ['招标公告', '公开招标'],
    region: '广东·深圳',
    amount: '300万',
    date: '3小时前',
    deadline: '2025-09-03 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '32_copy',
    title: '多标段短标题',
    tags: ['招标公告', '公开招标'],
    region: '北京·朝阳',
    amount: '200万',
    date: '2小时前',
    deadline: '2025-09-02 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    isMultiBid: true
  },
  {
    id: '31_copy',
    title: '短标题项目',
    tags: ['招标公告', '公开招标'],
    region: '上海·浦东',
    amount: '100万',
    date: '1小时前',
    deadline: '2025-09-01 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '1',
    title: '2025年广州市轨道交通八号线北延段工程施工总承包项目',
    tags: ['招标公告', '公开招标'],
    region: '广东·广州',
    amount: '28,500万',
    date: '5分钟前',
    deadline: '2025-09-25 09:30',
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    projectCode: 'GZ-GD-2025-001',
    currentStage: '招标公告',
    isMultiBid: true
  },
  {
    id: '2',
    title: '深圳市智慧城市大数据中心服务器及存储设备采购项目',
    tags: ['招标公告', '电子竞价'],
    region: '广东·深圳',
    amount: '1,280万',
    date: '小于3小时',
    deadline: '2025-08-24 14:00',
    status: '招标中',
    isStarred: true,
    type: 'procurement',
    projectType: '政府采购',
    projectCode: 'SZ-ZH-2025-042',
    hasPublicContacts: false,
    currentStage: '招标文件领取截止时间'
  },
  {
    id: '3',
    title: '上海浦东新区公立医院医疗设备年度维保服务项目',
    tags: ['招标公告', '竞争性磋商'],
    region: '上海·浦东',
    amount: '350万',
    date: '2天前',
    deadline: '2025-08-23 17:00',
    status: '公示中',
    isStarred: false,
    type: 'service',
    projectType: '政府采购',
    projectCode: 'SH-PD-2025-115',
    currentStage: '中标候选人公示'
  },
  {
    id: '4',
    title: '杭州亚运会主场馆周边景观提升工程设计施工一体化',
    tags: ['招标公告', '公开招标'],
    region: '浙江·杭州',
    amount: '4,200万',
    date: '3天前',
    deadline: '2025-09-22 10:00',
    status: '答疑中',
    isStarred: true,
    type: 'engineering',
    projectType: '工程建设',
    currentStage: '答疑澄清'
  },
  {
    id: '5',
    title: '成都市高新区5G基站建设及配套设施安装项目',
    tags: ['招标公告', '邀请招标'],
    region: '四川·成都',
    amount: '8,600万',
    date: '2025-08-21',
    deadline: '2025-09-21 09:30',
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    currentStage: '招标计划'
  },
  {
    id: '6',
    title: '武汉大学主要教学楼修缮及节能改造工程',
    tags: ['招标公告', '校内招标'],
    region: '湖北·武汉',
    amount: '1,500万',
    date: '2025-08-20',
    deadline: '2025-09-20 14:30',
    status: '已结束',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    currentStage: '中标结果公告'
  },
  {
    id: '7',
    title: '中国石油化工股份有限公司年度办公用品集中采购框架协议',
    tags: ['招标公告', '框架协议'],
    region: '北京·朝阳',
    amount: '500万',
    date: '2025-08-19',
    deadline: '2025-09-19 10:00',
    status: '招标中',
    isStarred: false,
    type: 'procurement',
    projectType: '国有产权',
    currentStage: '投标截止时间'
  },
  {
    id: '8',
    title: '南京市玄武湖公园水质生态治理与监测服务',
    tags: ['招标公告', '竞争性谈判'],
    region: '江苏·南京',
    amount: '280万',
    date: '2025-08-18',
    deadline: '2025-08-18 17:00',
    status: '已结束',
    isStarred: false,
    type: 'service',
    projectType: '排污权',
    currentStage: '中标结果公告'
  },
  {
    id: '9',
    title: '西安咸阳国际机场三期扩建工程航站楼弱电系统采购',
    tags: ['招标公告', '公开招标'],
    region: '陕西·西安',
    amount: '15,000万',
    date: '2025-08-17',
    deadline: '2025-09-17 09:30',
    status: '招标中',
    isStarred: true,
    type: 'procurement',
    projectType: '工程建设',
    currentStage: '变更公告'
  },
  {
    id: '10',
    title: '长沙市智能网联汽车测试区道路改造工程',
    tags: ['招标公告', '公开招标'],
    region: '湖南·长沙',
    amount: '3,800万',
    date: '2025-08-16',
    deadline: '2025-09-16 14:00',
    status: '答疑中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    currentStage: '答疑澄清'
  },
  {
    id: '11',
    title: '青岛港自动化码头操作系统软件开发及技术支持服务',
    tags: ['招标公告', '单一来源'],
    region: '山东·青岛',
    amount: '950万',
    date: '2025-08-15',
    deadline: '2025-09-15 10:00',
    status: '报名中',
    isStarred: false,
    type: 'service',
    projectType: '政府采购'
  },
  {
    id: '12',
    title: '郑州市三环快速路桥梁健康监测系统建设项目',
    tags: ['招标公告', '公开招标'],
    region: '河南·郑州',
    amount: '1,100万',
    date: '2025-08-14',
    deadline: '2025-08-14 17:00',
    status: '已截止',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '13',
    title: '厦门大学附属第一医院医疗废物处理服务外包项目',
    tags: ['招标公告', '竞争性磋商'],
    region: '福建·厦门',
    amount: '120万/年',
    date: '2025-08-13',
    deadline: '2025-09-13 09:30',
    status: '报名中',
    isStarred: false,
    type: 'service',
    projectType: '政府采购'
  },
  {
    id: '14',
    title: '重庆市两江新区新能源汽车充电桩建设一期工程',
    tags: ['招标公告', '公开招标'],
    region: '重庆·两江新区',
    amount: '6,500万',
    date: '2025-08-12',
    deadline: '2025-09-12 14:00',
    status: '公示期',
    isStarred: true,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '15',
    title: '天津港保税区进口汽车仓储物流服务项目',
    tags: ['招标公告', '公开招标'],
    region: '天津·滨海新区',
    amount: '800万',
    date: '2025-08-11',
    deadline: '2025-09-11 10:00',
    status: '报名中',
    isStarred: false,
    type: 'service',
    projectType: '国有产权'
  },
  {
    id: '16',
    title: '内蒙古呼伦贝尔市煤炭资源勘查采矿权出让',
    tags: ['竞标公告', '竞买拍卖'],
    region: '内蒙古·呼伦贝尔',
    amount: '58,000万',
    date: '2025-08-10',
    deadline: '2025-09-10 12:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '矿业权'
  },
  {
    id: '17',
    title: '北京大兴国际机场附近商业用地A地块土地使用权挂牌出让',
    tags: ['出让公告', '挂牌'],
    region: '北京·大兴',
    amount: '120,000万',
    date: '2025-08-09',
    deadline: '2025-09-09 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '土地使用权'
  },
  {
    id: '18',
    title: '山西省高平市煤层气排污权交易及在线监测项目',
    tags: ['招标公告', '公开招标'],
    region: '山西·长治',
    amount: '400万',
    date: '2025-08-08',
    deadline: '2025-09-08 09:30',
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '排污权'
  },
  {
    id: '19',
    title: '浙江省疾病预防控制中心2025年度第二批二类疫苗采购项目',
    tags: ['采购公告', '公开采购'],
    region: '浙江·杭州',
    amount: '2,800万',
    date: '2025-08-07',
    deadline: '2025-09-07 14:00',
    status: '公示中',
    isStarred: false,
    type: 'procurement',
    projectType: '二类疫苗'
  },
  {
    id: '20',
    title: '广西百色市右江区连片林权流转拍卖项目',
    tags: ['拍卖公告', '公开拍卖'],
    region: '广西·百色',
    amount: '650万',
    date: '2025-08-06',
    deadline: '2025-09-06 15:30',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '林权'
  },
  {
    id: '21',
    title: '河北钢铁集团2025年度碳排放权余量交易出售公示',
    tags: ['交易公示', '碳现货竞价'],
    region: '河北·石家庄',
    amount: '待定',
    date: '2025-08-05',
    deadline: '2025-09-05 17:00',
    status: '公示中',
    isStarred: false,
    type: 'engineering',
    projectType: '碳排放权'
  },
  {
    id: '22',
    title: '云南省第一人民医院常用抗肿瘤及心血管药品集中采购',
    tags: ['采购公告', '公开招标'],
    region: '云南·昆明',
    amount: '1,500万',
    date: '2025-08-04',
    deadline: '2025-09-04 10:00',
    status: '招标中',
    isStarred: false,
    type: 'procurement',
    projectType: '药品采购权'
  },
  {
    id: '23',
    title: '湖南省交通投资集团高速公路特许经营权转让',
    tags: ['转让公告', '产权招拍挂'],
    region: '湖南·长沙',
    amount: '8,000万',
    date: '2025-08-03',
    deadline: '2025-09-03 14:30',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '国有产权'
  },
  {
    id: '24',
    title: '上海市徐汇区滨江数字产业园二期建设工程施工',
    tags: ['招标公告', '公开招标'],
    region: '上海·徐汇',
    amount: '16,000万',
    date: '2025-08-02',
    deadline: '2025-09-02 09:30',
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '25',
    title: '四川省监狱管理局2025年度服刑人员生活物资定点供应商采购',
    tags: ['采购公告', '竞争性谈判'],
    region: '四川·成都',
    amount: '320万',
    date: '2025-08-01',
    deadline: '2025-09-01 16:00',
    status: '招标中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购'
  },
  {
    id: '26',
    title: '某属地单位2025年度信息化建设项目招标公告',
    tags: ['招标公告', '公开招标', '信息化'],
    region: '北京·海淀',
    amount: '890万',
    date: '10分钟前',
    deadline: '2025-08-30 17:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '27',
    title: '智慧校园信息化基础设施升级采购项目',
    tags: ['采购公告', '竞争性磋商', '教育信息化'],
    region: '江苏·南京',
    amount: '450万',
    date: '2小时前',
    deadline: '2025-08-28 14:30',
    status: '报名中',
    isStarred: false,
    type: 'procurement',
    projectType: '政府采购'
  },
  {
    id: '28',
    title: '市属医疗机构健康数据中心信息化平台建设',
    tags: ['招标公告', '公开招标', '医疗信息化'],
    region: '广东·广州',
    amount: '1,200万',
    date: '1天前',
    deadline: '2025-08-25 09:00',
    status: '招标中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '29',
    title: '自然资源局林权登记流转信息化管控系统迭代',
    tags: ['招标公告', '单一来源', '信息化软件'],
    region: '福建·福州',
    amount: '280万',
    date: '2天前',
    deadline: '2025-08-22 10:00',
    status: '评审中',
    isStarred: false,
    type: 'service',
    projectType: '林权'
  },
  {
    id: '30',
    title: '智慧矿山无人值守信息化系统建设方案公开竞猜',
    tags: ['招标公告', '邀请招标', '矿业信息化'],
    region: '山西·大同',
    amount: '6,600万',
    date: '3天前',
    deadline: '2025-08-20 15:00',
    status: '公示期',
    isStarred: false,
    type: 'engineering',
    projectType: '矿业权'
  },
  {
    id: '31',
    title: '短标题项目',
    tags: ['招标公告', '公开招标'],
    region: '上海·浦东',
    amount: '100万',
    date: '1小时前',
    deadline: '2025-09-01 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '32',
    title: '多标段短标题',
    tags: ['招标公告', '公开招标'],
    region: '北京·朝阳',
    amount: '200万',
    date: '2小时前',
    deadline: '2025-09-02 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    isMultiBid: true
  },
  {
    id: '33',
    title: '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长长长长长长长长长长长长长长的测试项目标题，用来测试两行截断和省略号的显示效果，没有多标段标签',
    tags: ['招标公告', '公开招标'],
    region: '广东·深圳',
    amount: '300万',
    date: '3小时前',
    deadline: '2025-09-03 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设'
  },
  {
    id: '34',
    title: '这是另一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长长长长长长长长长长长长长长长长的测试项目标题，用来测试多标段标签会不会被截断',
    tags: ['招标公告', '公开招标'],
    region: '四川·成都',
    amount: '400万',
    date: '4小时前',
    deadline: '2025-09-04 10:00',
    status: '报名中',
    isStarred: false,
    type: 'engineering',
    projectType: '工程建设',
    isMultiBid: true
  }
];

// Dynamically supplement fields for every opportunity in MOCK_OPPORTUNITIES to support realistic detail matching without bloating mock file size
const citiesList = [
  { p: '北京', c: '北京市' },
  { p: '广东', c: '广州市' },
  { p: '广州', c: '广州市' },
  { p: '深圳', c: '深圳市' },
  { p: '四川', c: '成都市' },
  { p: '成都', c: '成都市' },
  { p: '上海', c: '上海市' },
  { p: '江苏', c: '南京市' },
  { p: '湖北', c: '武汉市' },
  { p: '陕西', c: '西安市' },
  { p: '浙江', c: '杭州市' },
  { p: '吉林', c: '长春市' },
  { p: '辽宁', c: '沈阳市' },
  { p: '湖南', c: '长沙市' },
  { p: '山东', c: '青岛市' },
  { p: '河南', c: '郑州市' },
  { p: '福建', c: '厦门市' },
  { p: '重庆', c: '重庆市' },
  { p: '天津', c: '天津市' },
  { p: '山西', c: '太原市' },
  { p: '广西', c: '南宁市' },
  { p: '河北', c: '石家庄市' },
  { p: '云南', c: '昆明市' }
];

MOCK_OPPORTUNITIES.forEach((opp, index) => {
  if (opp.projectCode && opp.projectCode.startsWith('TEST-')) {
    return;
  }

  // 1. Determine local city name
  let localCity = '广州市';
  const foundRegion = citiesList.find(x => opp.region.includes(x.p));
  if (foundRegion) {
    localCity = foundRegion.c;
  } else {
    const splitRegion = opp.region.split('·');
    localCity = (splitRegion[1] || splitRegion[0] || '广州').trim() + '市';
  }

  // Define some specific hardcoded overrides for premium quality demonstrations
  if (opp.id === 'pre_spec_1') {
    opp.ownerName = '北京市海淀区教育局';
    opp.agencyName = '北京博大资源招投标代理有限公司';
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '陈老师', phone: '13811112222', role: '项目负责人' }];
    opp.agencyContacts = [{ name: '李经理', phone: '13911113333', role: '经办人' }];
    return;
  }
  if (opp.id === 'pre_spec_2') {
    opp.ownerName = '广州地铁集团有限公司';
    opp.agencyName = null; // 自行招标
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '张工', phone: '13511114444', role: '基建部部员' }];
    opp.agencyContacts = [];
    return;
  }
  if (opp.id === 'pre_spec_3') {
    opp.ownerName = '深圳市人民医院';
    opp.agencyName = '深圳市华昊招标有限公司';
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '刘主任', phone: '13611115555', role: '采购科' }];
    opp.agencyContacts = [{ name: '黄工', phone: '13711116666', role: '项目经办' }];
    return;
  }
  if (opp.id === 'result_spec_1') {
    opp.ownerName = '南京市鼓楼区绿化园林局';
    opp.agencyName = '南京城建招投标咨询有限公司';
    opp.winnerName = '江苏省绿化建设集团有限公司';
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '钱科长', phone: '13422221111', role: '绿化管理科' }];
    opp.agencyContacts = [{ name: '孙经理', phone: '13522222222', role: '项目专员' }];
    return;
  }
  if (opp.id === '1') {
    opp.ownerName = '广州地铁集团有限公司';
    opp.agencyName = '广州国资招投标中介服务有限公司';
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '温经理', phone: '13822221000', role: '招标部负责人' }];
    opp.agencyContacts = [{ name: '彭工', phone: '13822223000', role: '项目主审' }];
    return;
  }
  if (opp.id === '2') {
    opp.ownerName = '深圳市智慧城市科技发展集团有限公司';
    opp.agencyName = '深圳市招商工程项目管理有限公司';
    opp.hasPublicContacts = false; // 联系方式未公开
    opp.ownerContacts = [];
    opp.agencyContacts = [];
    return;
  }
  if (opp.id === '6') {
    opp.ownerName = '武汉大学后勤保障部';
    opp.agencyName = '湖北省招标股份有限公司';
    opp.winnerName = '中铁广州工程局集团有限公司';
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '范老师', phone: '15966661111', role: '基建处处长' }];
    opp.agencyContacts = [{ name: '万经理', phone: '15866662222', role: '项目专任' }];
    return;
  }
  if (opp.id === '8') {
    opp.ownerName = '南京市玄武湖公园管理处';
    opp.agencyName = '江苏省设备成套股份有限公司';
    opp.winnerName = '南京市水务规划设计院股份有限公司';
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '卓主任', phone: '15566665555', role: '环保科科长' }];
    opp.agencyContacts = [{ name: '倪工程师', phone: '15466666666', role: '环评业务主任' }];
    return;
  }
  if (opp.id === '35_copy') {
    opp.ownerName = localCity + '生态环境局';
    opp.agencyName = null; // 自行招标
    opp.hasPublicContacts = true;
    opp.ownerContacts = [{ name: '郭科长', phone: '17944445555', role: '环评管理科' }];
    opp.agencyContacts = [];
    return;
  }

  // 2. Generate generic owner name based on title Keywords
  let dept = '后勤保障科';
  if (opp.title.includes('局') || opp.title.includes('政府')) {
    const match = opp.title.match(/(\w+?[局厅院委办])/);
    if (match) {
      dept = match[1];
    } else if (opp.title.includes('教育')) {
      dept = '教育局';
    } else if (opp.title.includes('医院')) {
      dept = '人民医院';
    } else if (opp.title.includes('交通') || opp.title.includes('道路')) {
      dept = '交通运输局';
    } else {
      dept = opp.type === 'engineering' ? '住房和城乡建设局' : '机关事务管理局';
    }
  } else if (opp.title.includes('大学') || opp.title.includes('学校') || opp.title.includes('学院')) {
    const isUni = opp.title.includes('大学') ? '大学' : '中心小学';
    let label = '某高校';
    const firstTwo = opp.title.substring(0, 4);
    if (firstTwo.includes('大学') || firstTwo.includes('学校') || firstTwo.includes('院')) {
      label = firstTwo;
    } else {
      label = localCity + '重点学校';
    }
    dept = label + '基建规划处';
  } else if (opp.title.includes('园区') || opp.title.includes('广场') || opp.title.includes('中心')) {
    dept = '高新投资开发集团';
  } else {
    dept = (opp.type === 'procurement' ? '智慧城市发展中心' : '城市建设投资集团');
  }

  // Assemble full owner name
  if (dept.length >= 8 && (dept.startsWith('北京') || dept.startsWith('上海') || dept.startsWith('广州') || dept.startsWith('深圳') || dept.startsWith('南京') || dept.startsWith('工程') || dept.startsWith('大学') || dept.startsWith('医院'))) {
    opp.ownerName = dept;
  } else {
    opp.ownerName = localCity + dept;
  }

  // 3. Generate generic agency name (Most populated; but 2 entries set to null above)
  const agencyAdjectives = ['广汇', '金远', '同济', '博华', '中正', '国瑞', '德信', '秦源', '联合', '华成'];
  const adj = agencyAdjectives[index % agencyAdjectives.length];
  opp.agencyName = `${localCity}${adj}项目管理招标代理有限公司`;

  // 4. Set currentStage and check for WinnerName
  const isResult = opp.status === '结果公示' || opp.status === '已结束' || opp.currentStage?.includes('结果') || opp.currentStage?.includes('成交');
  if (isResult) {
    const suffix = opp.type === 'engineering' ? '工程建设集团有限公司' : '信息技术服务有限公司';
    const bizNames = ['建工', '建筑', '城建', '软件', '高科', '路桥'];
    opp.winnerName = localCity + bizNames[index % bizNames.length] + suffix;
  }

  // 5. Contacts (Make sure 1-2 entries have hasPublicContacts: false)
  if (opp.id === 'demo_nodeadline' || opp.id === '2') {
    opp.hasPublicContacts = false;
  } else if (opp.hasPublicContacts === undefined) {
    opp.hasPublicContacts = true;
  }

  if (opp.hasPublicContacts !== false) {
    const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '高'];
    const names = ['工', '经理', '老师', '主任', '专员', '主管', '科长'];
    
    const ownerSurname = surnames[(index + 1) % surnames.length];
    const ownerNameSuffix = names[(index + 2) % names.length];
    const ownerPhone = `13${(3 + index % 7)}${index.toString().padStart(4, '0')}${(index * 3 + 1000).toString().substring(0, 4)}`;

    const agencySurname = surnames[(index + 4) % surnames.length];
    const agencyNameSuffix = names[(index + 5) % names.length];
    const agencyPhone = `18${(2 + index % 8)}${index.toString().padStart(4, '0')}${(index * 7 + 2000).toString().substring(0, 4)}`;

    opp.ownerContacts = [{
      name: `${ownerSurname}${ownerNameSuffix}`,
      phone: ownerPhone,
      role: opp.type === 'procurement' ? '采购负责人' : '项目建设代表'
    }];

    opp.agencyContacts = [{
      name: `${agencySurname}${agencyNameSuffix}`,
      phone: agencyPhone,
      role: '招标代理经办'
    }];
  } else {
    opp.ownerContacts = [];
    opp.agencyContacts = [];
  }
});

export const MOCK_ENTERPRISES: Enterprise[] = [
  {
    id: 'owner_1',
    name: '北京市公安局朝阳分局',
    industry: '政府机构',
    role: '招采单位',
    location: '北京市·朝阳区',
    legalRep: '未知',
    date: '1949-10-01',
    isFollowed: false,
    tags: ['政府采购', '业主单位', '朝阳区'],
    winningBids: 2,
  },
  {
    id: 'winner_1',
    name: '神州数码系统集成服务有限公司',
    industry: '软件和信息技术服务业',
    role: '投标单位',
    location: '北京市·海淀区',
    legalRep: '郭为',
    date: '2000-01-01',
    isFollowed: false,
    tags: ['系统集成', '高新技术企业', '上市公司'],
    winningBids: 185,
  },
  {
    id: '1',
    name: '中铁广州工程局集团有限公司',
    industry: '土木工程建筑业',
    role: '投标单位、招采单位',
    location: '广东·广州',
    legalRep: '唐云',
    // capital 缺失
    date: '1986-05-20',
    isFollowed: true,
    tags: ['国有企业', '高新技术企业', '建筑业龙头'],
    enterpriseType: '国企',
    projectContacts: 6,
    winningBids: 255,
    creditCode: '91440100190422176B',
    contactPerson: '张春天',
    contactPhone: '17722330000',
    businessScope: '建设工程施工；文物保护工程施工；建筑劳务分包；',
    address: '广州市南沙区进港大道582号',
  },
  {
    id: '2',
    name: '中国建筑第四工程局有限公司',
    industry: '房屋建筑业',
    role: '投标单位',
    location: '广东·广州',
    legalRep: '易文权',
    capital: '510000万元',
    date: '1982-06-18',
    isFollowed: true,
    tags: ['央企子公司', '世界500强成员', '特级资质'],
    enterpriseType: '央企',
    projectContacts: 6,
    winningBids: 240,
    creditCode: '91440000190333256G',
    contactPerson: '李秋水',
    contactPhone: '13800138000',
    // businessScope 缺失
    address: '广州市天河区科韵路16号',
  },
  {
    id: '3',
    name: '腾讯科技（深圳）有限公司',
    industry: '软件和信息技术服务业',
    role: '招采单位',
    location: '广东·深圳',
    legalRep: '马化腾',
    capital: '200万美元',
    date: '2000-02-24',
    isFollowed: false,
    tags: ['互联网巨头', '独角兽', '科技创新'],
    enterpriseType: '民营企业',
    projectContacts: 6,
    creditCode: '9144030071526726XG',
    contactPerson: '王大锤',
    contactPhone: '13566668888',
    // address 和 businessScope 缺失
    winningBids: 12
  },
  {
    id: '4',
    name: '华为技术有限公司',
    industry: '通信设备制造业',
    role: '招采单位',
    location: '广东·深圳',
    legalRep: '赵明路',
    capital: '5000万元',
    date: '1987-09-15',
    isFollowed: true,
    tags: ['民营500强', '高新技术企业', 'ICT领导者'],
    projectContacts: 6,
    winningBids: 45
  },
  {
    id: '5',
    name: '万科企业股份有限公司',
    industry: '房地产业',
    role: '招采单位',
    location: '广东·深圳',
    legalRep: '郁亮',
    capital: '5000万元',
    date: '1984-05-30',
    isFollowed: false,
    tags: ['上市公司', '房地产龙头', '绿色建筑'],
    projectContacts: 6,
    winningBids: 28
  },
  {
    id: '6',
    name: '中铁一局集团有限公司',
    industry: '土木工程建筑业',
    role: '投标单位',
    location: '陕西·西安',
    legalRep: '马海民',
    capital: '5000万元',
    date: '1980-03-12',
    isFollowed: false,
    tags: ['央企子公司', '铁路建设', '特级资质'],
    projectContacts: 6,
    winningBids: 210
  },
  {
    id: '7',
    name: '比亚迪股份有限公司',
    industry: '汽车制造业',
    role: '招采单位',
    location: '广东·深圳',
    legalRep: '王传福',
    capital: '5000万元',
    date: '1995-02-10',
    isFollowed: true,
    tags: ['新能源汽车', '上市公司', '电池技术'],
    projectContacts: 6,
    winningBids: 35
  },
  {
    id: '8',
    name: '顺丰控股股份有限公司',
    industry: '邮政业',
    role: '招标代理',
    location: '广东·深圳',
    legalRep: '王卫',
    capital: '5000万元',
    date: '2003-05-22',
    isFollowed: false,
    tags: ['物流快递', '上市公司', '航空货运'],
    projectContacts: 6,
    winningBids: 20
  },
  {
    id: '9',
    name: '格力电器股份有限公司',
    industry: '电气机械和器材制造业',
    role: '招采单位',
    location: '广东·珠海',
    legalRep: '董明珠',
    capital: '5000万元',
    date: '1989-12-13',
    isFollowed: false,
    tags: ['家电巨头', '智能制造', '上市公司'],
    projectContacts: 6,
    winningBids: 58
  },
  {
    id: '10',
    name: '招商银行股份有限公司',
    industry: '货币金融服务',
    role: '招标代理',
    location: '广东·深圳',
    legalRep: '缪建民',
    capital: '5000万元',
    date: '1987-03-31',
    isFollowed: false,
    tags: ['股份制银行', '金融科技', '上市公司'],
    projectContacts: 6,
    winningBids: 40
  },
  {
    id: '11',
    name: '中国平安保险（集团）股份有限公司',
    industry: '保险业',
    role: '招采单位',
    location: '广东·深圳',
    legalRep: '马明哲',
    capital: '5000万元',
    date: '1988-03-21',
    isFollowed: false,
    tags: ['综合金融', '世界500强', '上市公司'],
    projectContacts: 6,
    winningBids: 15
  },
  {
    id: '12',
    name: '中兴通讯股份有限公司',
    industry: '计算机、通信和其他电子设备制造业',
    role: '投标单位',
    location: '广东·深圳',
    legalRep: '李自学',
    capital: '5000万元',
    date: '1997-11-11',
    isFollowed: false,
    tags: ['5G技术', '通信设备', '上市公司'],
    projectContacts: 6,
    winningBids: 190
  },
  {
    id: '13',
    name: '广州汽车集团股份有限公司',
    industry: '汽车制造业',
    role: '招采单位',
    location: '广东·广州',
    legalRep: '曾庆洪',
    capital: '5000万元',
    date: '1997-06-06',
    isFollowed: false,
    tags: ['汽车制造', '国有控股', '上市公司'],
    projectContacts: 6,
    winningBids: 72
  },
  {
    id: '14',
    name: '保利发展控股集团股份有限公司',
    industry: '房地产业',
    role: '招标代理',
    location: '广东·广州',
    legalRep: '刘平',
    capital: '5000万元',
    date: '1992-09-14',
    isFollowed: false,
    tags: ['央企地产', '物业服务', '上市公司'],
    projectContacts: 6,
    winningBids: 65
  },
  {
    id: '15',
    name: '美的集团股份有限公司',
    industry: '电气机械和器材制造业',
    role: '投标单位',
    location: '广东·佛山',
    legalRep: '方洪波',
    capital: '5000万元',
    date: '2000-04-07',
    isFollowed: false,
    tags: ['智能家居', '机器人', '世界500强'],
    projectContacts: 6,
    winningBids: 115
  },
  {
    id: '16',
    name: '中国建筑一局（集团）有限公司',
    industry: '房屋建筑业',
    role: '投标单位',
    location: '北京·丰台',
    legalRep: '吴爱国',
    capital: '10000万元',
    date: '1953-03-01',
    isFollowed: false,
    tags: ['央企', '特级资质', '百年老店'],
    projectContacts: 12,
    winningBids: 260
  },
  {
    id: '17',
    name: '上海建工集团股份有限公司',
    industry: '土木工程建筑业',
    role: '投标单位',
    location: '上海·虹口',
    legalRep: '徐征',
    capital: '8900万元',
    date: '1998-06-15',
    isFollowed: false,
    tags: ['地方国企', '建筑龙头', '上市公司'],
    projectContacts: 8,
    winningBids: 245
  },
  {
    id: '18',
    name: '阿里云计算有限公司',
    industry: '软件和信息技术服务业',
    role: '投标单位',
    location: '浙江·杭州',
    legalRep: '张勇',
    capital: '100000万元',
    date: '2008-04-08',
    isFollowed: false,
    tags: ['云计算', '科技巨头', '大数据'],
    projectContacts: 20,
    winningBids: 220
  },
  {
    id: '19',
    name: '中国移动通信集团有限公司',
    industry: '电信、广播电视和卫星传输服务',
    role: '招采单位',
    location: '北京·西城',
    legalRep: '杨杰',
    capital: '300000万元',
    date: '2000-04-20',
    isFollowed: false,
    tags: ['三大运营商', '5G建设', '央企'],
    projectContacts: 15,
    winningBids: 3
  },
  {
    id: '20',
    name: '百度在线网络技术（北京）有限公司',
    industry: '互联网和相关服务',
    role: '招采单位',
    location: '北京·海淀',
    legalRep: '李彦宏',
    capital: '4500万元',
    date: '2000-01-18',
    isFollowed: false,
    tags: ['人工智能', '自动驾驶', '搜索引擎'],
    projectContacts: 10,
    winningBids: 130
  },
  {
    id: '21',
    name: '深圳市大疆创新科技有限公司',
    industry: '专用设备制造业',
    role: '投标单位',
    location: '广东·深圳',
    legalRep: '汪滔',
    capital: '3000万元',
    date: '2006-11-06',
    isFollowed: false,
    tags: ['无人机', '高新技术', '创新榜样'],
    projectContacts: 5,
    winningBids: 95
  },
  {
    id: '22',
    name: '宁德时代新能源科技股份有限公司',
    industry: '电气机械和器材制造业',
    role: '投标单位',
    location: '福建·宁德',
    legalRep: '曾毓群',
    capital: '23300万元',
    date: '2011-12-16',
    isFollowed: false,
    tags: ['动力电池', '创业板指', '储能巨头'],
    projectContacts: 7,
    winningBids: 150
  },
  {
    id: '23',
    name: '中国医药集团有限公司',
    industry: '医药制造业',
    role: '招采单位',
    location: '北京·海淀',
    legalRep: '刘敬桢',
    capital: '50000万元',
    date: '1998-11-26',
    isFollowed: false,
    tags: ['央企', '世界500强', '医药流通'],
    projectContacts: 11,
    winningBids: 50
  },
  {
    id: '24',
    name: '科大讯飞股份有限公司',
    industry: '软件和信息技术服务业',
    role: '投标单位',
    location: '安徽·合肥',
    legalRep: '刘庆峰',
    capital: '2300万元',
    date: '1999-12-30',
    isFollowed: false,
    tags: ['智能语音', '教育信息化', '人工智能'],
    projectContacts: 9,
    winningBids: 175
  },
  {
    id: '25',
    name: '京东方科技集团股份有限公司',
    industry: '计算机、通信和其他电子设备制造业',
    role: '招采单位',
    location: '北京·大兴',
    legalRep: '陈炎顺',
    capital: '34800万元',
    date: '1993-04-09',
    isFollowed: false,
    tags: ['半导体显示', '物联网', '国企'],
    projectContacts: 14,
    winningBids: 88
  },
  {
    id: '26',
    name: '航天信息股份有限公司',
    industry: '软件和信息技术服务业',
    role: '投标单位',
    location: '北京·海淀',
    legalRep: '马天晖',
    capital: '18500万元',
    date: '2000-11-01',
    isFollowed: false,
    tags: ['信息化网络', '政务信息化', '上市国企'],
    projectContacts: 28,
    winningBids: 160
  },
  {
    id: '27',
    name: '太极计算机股份有限公司',
    industry: '软件和信息技术服务业',
    role: '投标单位',
    location: '北京·海淀',
    legalRep: '萧建平',
    capital: '5900万元',
    date: '1987-10-18',
    isFollowed: false,
    tags: ['国家政务', '信息化建设', '大数据'],
    projectContacts: 16,
    winningBids: 140
  },
  {
    id: 'empty_test',
    name: '测试企业（无数据）',
    industry: '互联网和相关服务',
    role: '投标单位',
    location: '未知·北京',
    legalRep: '测试人',
    capital: '100万元',
    date: '2024-01-01',
    isFollowed: false,
    tags: ['测试企业', '数据异常验证'],
    projectContacts: 0,
    winningBids: 0
  },
  {
    id: 'error_test',
    name: '测试企业（需加载异常演示）',
    industry: '技术服务',
    role: '投标单位',
    location: '未知·上海',
    legalRep: '异常测试',
    capital: '0万元',
    date: '2024-01-01',
    isFollowed: false,
    tags: ['异常场景', '加载重试测试'],
    projectContacts: 10,
    winningBids: 5
  }
];
