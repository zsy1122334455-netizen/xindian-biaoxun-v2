export interface QualNode {
  id: string;
  name: string;
  children?: QualNode[];
}

export const QUALIFICATION_TREE_DATA: QualNode[] = [
  { id: '1', name: '拆迁' },
  { id: '2', name: '施工劳务' },
  { id: '3', name: '工程检测' },
  { id: '4', name: '施工总承包' },
  { id: '5', name: '工程规划' },
  { 
    id: '6', 
    name: '工程监理', 
    children: [
      { id: '6-1', name: '事务所' },
      { 
        id: '6-2', 
        name: '专业资质', 
        children: [
          { id: '6-2-1', name: '航天航空工程' },
          { id: '6-2-2', name: '港口与航道工程' },
          { id: '6-2-3', name: '机电安装工程' }
        ] 
      }
    ]
  },
  {
    id: '7',
    name: '建筑业企业资质',
    children: [
      { id: '7-1', name: '特级' },
      { id: '7-2', name: '一级' },
      { id: '7-3', name: '二级' },
      { id: '7-4', name: '三级' }
    ]
  },
  {
    id: '8',
    name: '工程勘察资质',
    children: [
      { id: '8-1', name: '综合类' },
      { id: '8-2', name: '专业类' },
      { id: '8-3', name: '劳务类' }
    ]
  },
  {
    id: '9',
    name: '工程设计资质',
    children: [
      { id: '9-1', name: '综合资质' },
      { id: '9-2', name: '行业资质' },
      { id: '9-3', name: '专业资质' },
      { id: '9-4', name: '专项资质' }
    ]
  },
  {
    id: '10',
    name: '工程造价咨询资质',
    children: [
      { id: '10-1', name: '甲级' },
      { id: '10-2', name: '乙级' }
    ]
  }
];
