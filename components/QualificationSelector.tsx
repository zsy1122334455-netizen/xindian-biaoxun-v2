import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Check, ChevronLeft } from 'lucide-react';
import { QualNode, QUALIFICATION_TREE_DATA } from '../src/constants/qualifications';

interface Props {
  initialSelectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}

export const QualificationSelector: React.FC<Props> = ({ initialSelectedIds, onConfirm, onClose }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['6', '6-2']));

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderNode = (node: QualNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedIds.has(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div 
          className="flex items-center justify-between py-3.5 border-b border-gray-50 bg-white"
          style={{ paddingLeft: `${level * 1.5 + 1}rem`, paddingRight: '1rem' }}
          onClick={() => toggleSelect(node.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
              {isSelected && <Check size={14} strokeWidth={3} />}
            </div>
            <span className={`text-[15px] ${isSelected ? 'text-primary font-medium' : 'text-gray-800'}`}>{node.name}</span>
          </div>
          {hasChildren && (
            <button className="p-2 -mr-2 text-primary" onClick={(e) => toggleExpand(node.id, e)}>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col bg-gray-50/30">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-2 h-12 border-b border-gray-100 flex-shrink-0 pt-safe bg-white shadow-sm z-10">
        <button onClick={onClose} className="p-2 text-gray-900 active:scale-95">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900">企业资质要求</h2>
        <div className="w-10"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {QUALIFICATION_TREE_DATA.map(node => renderNode(node, 0))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-white flex-shrink-0">
        <div className="flex items-center text-sm text-gray-600">
          已选：<span className="text-primary font-bold mx-1 text-base">{selectedIds.size}</span> 个
        </div>
        <button 
          onClick={() => onConfirm(Array.from(selectedIds))}
          className="bg-primary text-white px-8 py-2.5 rounded-full text-[15px] font-bold active:scale-[0.98] transition-transform shadow-md"
        >
          确定
        </button>
      </div>
    </div>
  );
};
