import React, { useState } from 'react';
import { ChevronLeft, Building2, AlertCircle, Plus, Edit3, Award, FileText, Trash2, X, Check } from 'lucide-react';
import { ViewName, EnterpriseData } from '../types';

interface Props {
  onBack: () => void;
  initialData: EnterpriseData | null;
  onSave: (data: EnterpriseData) => void;
  onDelete: () => void;
}

const QUALIFICATION_OPTIONS = [
  '建筑工程施工总承包特级',
  '建筑工程施工总承包壹级',
  '建筑工程施工总承包贰级',
  '建筑工程施工总承包叁级',
  '市政公用工程施工总承包壹级',
  '市政公用工程施工总承包贰级',
  '机电工程施工总承包壹级',
  '机电工程施工总承包贰级',
  '电子与智能化工程专业承包壹级',
  '电子与智能化工程专业承包贰级',
  '消防设施工程专业承包壹级',
  '消防设施工程专业承包贰级',
  '建筑装修装饰工程专业承包壹级',
  '建筑装修装饰工程专业承包贰级',
  '环保工程专业承包壹级',
  '环保工程专业承包贰级',
  '公路工程施工总承包壹级',
  '水利水电工程施工总承包壹级'
];

export const EnterpriseInfo: React.FC<Props> = ({ onBack, initialData, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQualModal, setShowQualModal] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    qualifications: string[];
    description: string;
  }>({
    name: '',
    qualifications: [],
    description: ''
  });

  const handleSave = () => {
    const newData = {
      name: formData.name || '未命名企业',
      qualifications: formData.qualifications,
      description: formData.description
    };
    onSave(newData);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete();
    setIsEditing(false);
    setFormData({
      name: '',
      qualifications: [],
      description: ''
    });
    setShowDeleteModal(false);
  };

  const handleEdit = () => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        qualifications: [...initialData.qualifications],
        description: initialData.description
      });
    }
    setIsEditing(true);
  };

  const toggleQualification = (qual: string) => {
    setFormData(prev => {
      const exists = prev.qualifications.includes(qual);
      if (exists) {
        return { ...prev, qualifications: prev.qualifications.filter(q => q !== qual) };
      } else {
        return { ...prev, qualifications: [...prev.qualifications, qual] };
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-safe-bottom font-sans flex flex-col relative">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定要删除企业信息吗？删除后将无法恢复。
            </p>
            <div className="flex gap-3">
              <button 
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                取消
              </button>
              <button 
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                onClick={confirmDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Qualification Selection Modal */}
      {showQualModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-[400px] h-[550px] rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="px-[15px] py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 m-[15px]">选择企业资质</h3>
              <button onClick={() => setShowQualModal(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-2 overflow-y-auto flex-1 m-[15px]">
              {QUALIFICATION_OPTIONS.map((option) => {
                const isSelected = formData.qualifications.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleQualification(option)}
                    className={`w-full text-left px-4 py-3 mb-1 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-blue-50 text-primary' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{option}</span>
                    {isSelected && <Check size={18} className="text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+16px)] border-t border-gray-100 bg-white m-[15px]">
              <button 
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-sm active:scale-[0.98] transition-transform"
                onClick={() => setShowQualModal(false)}
              >
                确认 ({formData.qualifications.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white sticky top-0 z-20 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">企业信息</h1>
        <div className="w-10"></div>
      </div>

      {/* Hint */}
      <div className="bg-blue-50 px-4 py-3 flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          该模块内容仅用于辅助AI分析，帮助AI更精准地为您推荐商机、进行竞对分析及投标预测。
        </p>
      </div>

      <main className="flex-1 p-4">
        {isEditing ? (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">企业名称</label>
              <input 
                type="text" 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="请输入企业名称"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">企业资质</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.qualifications.map((q, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 text-primary text-xs rounded-md border border-blue-100 flex items-center gap-1">
                    {q}
                    <button 
                      onClick={() => toggleQualification(q)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button 
                  onClick={() => setShowQualModal(true)}
                  className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-200 border-dashed flex items-center gap-1 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={12} />
                  添加资质
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">企业简介/优势</label>
              <textarea 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="简要描述企业的主营业务、核心优势等"
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="pt-2 flex gap-3">
              {initialData && (
                <>
                  <button 
                    className="px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium"
                    onClick={handleDeleteClick}
                  >
                    删除
                  </button>
                  <button 
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium"
                    onClick={() => setIsEditing(false)}
                  >
                    取消
                  </button>
                </>
              )}
              <button 
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
                onClick={handleSave}
              >
                保存
              </button>
            </div>
          </div>
        ) : initialData ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{initialData.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">已完善企业信息</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                    onClick={handleEdit}
                  >
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Award size={16} className="text-yellow-500" />
                    企业资质
                  </h3>
                  {initialData.qualifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {initialData.qualifications.map((q, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs rounded-md border border-gray-100">
                          {q}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无资质信息</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-blue-500" />
                    企业简介
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {initialData.description || '暂无简介'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center mt-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-4">
              <Building2 size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">暂无企业信息</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[240px]">
              完善企业信息后，AI将为您提供更精准的商机推荐和分析服务
            </p>
            <button 
              className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-transform"
              onClick={() => setIsEditing(true)}
            >
              <Plus size={16} />
              去新增维护
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
