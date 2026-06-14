import React from 'react';
import { Crown, X } from 'lucide-react';
import { UserRole } from '../types';

interface VipPromptModalProps {
  isOpen: boolean;
  requiredRole?: UserRole;
  currentUserRole?: UserRole;
  featureDescription?: string;
  onClose: () => void;
  onGoToBuy: () => void;
  title?: string;
  buttonText?: string;
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
}

export const VipPromptModal: React.FC<VipPromptModalProps> = ({ 
  isOpen, 
  requiredRole = UserRole.VIP, 
  currentUserRole = UserRole.FREE, 
  featureDescription, 
  onClose, 
  onGoToBuy,
  title,
  buttonText,
  secondaryButtonText,
  onSecondaryAction
}) => {
  if (!isOpen) return null;

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.VIP: return 'VIP';
      case UserRole.SVIP: return 'SVIP';
      default: return 'VIP';
    }
  };

  const roleName = getRoleName(requiredRole);
  const finalButtonText = buttonText || (currentUserRole === UserRole.FREE ? '去开通' : '去升级');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[320px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="relative bg-gradient-to-br from-[#FFFDF8] to-[#FFF8E6] p-6 text-center border-b border-[#FDEBBA]">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-400 to-[#B8860B] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/30">
            <Crown size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title || `该功能为 ${roleName} 专属`}</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-sans">
            {featureDescription || `开通 ${roleName} 会员，解锁全量商机情报与深度分析功能`}
          </p>
        </div>
        <div className="p-5 flex gap-3">
          <button 
            onClick={onSecondaryAction || onClose}
            className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 text-center cursor-pointer text-[13px] overflow-hidden truncate transition-colors"
          >
            {secondaryButtonText || '暂不需要'}
          </button>
          <button 
            onClick={onGoToBuy}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#B8860B] to-[#9B7000] shadow-lg shadow-yellow-900/20 hover:opacity-90 text-center cursor-pointer text-[13px] overflow-hidden truncate transition-opacity"
          >
            {finalButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
