export interface IndustryNode {
  id: string;
  name: string;
  children?: IndustryNode[];
}

export const INDUSTRY_TREE_DATA: IndustryNode[] = [
  { id: '1', name: '房屋建筑业' },
  { id: '2', name: '土木工程建筑业' },
  { id: '3', name: '建筑安装业' },
  { id: '4', name: '建筑装饰和其他建筑业' },
  { id: '5', name: '民航' },
  { id: '6', name: '水运' },
  { id: '7', name: '水利' },
  { id: '8', name: '能源' },
  { id: '9', name: '邮电通信' },
  { id: '10', name: '桥梁' },
  { id: '11', name: '城市轨道' },
  { id: '12', name: '矿产冶金' },
  { id: '13', name: '信息网络' },
  { id: '13-1', name: '信息化' },
  { id: '13-2', name: '教育信息化' },
  { id: '13-3', name: '医疗信息化' },
  { id: '13-4', name: '信息化软件' },
  { id: '13-5', name: '矿业信息化' },
  { id: '14', name: '工业制造' },
  { id: '15', name: '代建' },
  { id: '16', name: '房屋建筑' },
  { id: '17', name: '市政' },
  { id: '18', name: '公路' },
  { id: '19', name: '铁路' },
  { id: '20', name: '工程建设' },
  { id: '21', name: '政府采购' },
  { id: '22', name: '其他' }
];
