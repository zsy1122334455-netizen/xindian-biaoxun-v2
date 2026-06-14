import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { getExportQuota, addTodayExportUsed } from '../utils/exportQuota';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (count: number) => void;
  userRole: UserRole;
  totalItems: number;
  onUpgrade?: () => void;
  dataType?: 'opportunity' | 'enterprise';
  addExportRecord?: (dataType: 'opportunity' | 'enterprise', count: number, status?: 'completed' | 'failed') => void;
  onViewRecords?: () => void;
  exportStatusOverride?: 'completed' | 'failed';
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  userRole,
  totalItems,
  onUpgrade,
  dataType = 'opportunity',
  addExportRecord,
  onViewRecords,
  exportStatusOverride,
}) => {
  const { dailyLimit, usedToday, remainingToday, maxExportable } = getExportQuota(userRole, totalItems);
  const [count, setCount] = useState<string>('10');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [previewName, setPreviewName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const defaultCount = Math.min(10, totalItems, remainingToday);
      setCount(defaultCount > 0 ? defaultCount.toString() : '0');
      setIsSuccess(false);
      setIsError(false);
      setIsExporting(false);
    }
  }, [isOpen, totalItems, remainingToday]);

  if (!isOpen) return null;

  // 实时校验规则
  const getValidationError = () => {
    if (totalItems === 0) {
      return '当前没有可导出的数据';
    }
    if (remainingToday === 0) {
      return '今日额度已用完，明日恢复';
    }
    const num = parseInt(count, 10);
    if (isNaN(num) || num <= 0 || !/^\d+$/.test(count.trim())) {
      return '请输入有效的导出条数';
    }
    if (num > totalItems) {
      return `当前结果仅有 ${totalItems} 条`;
    }
    if (num > remainingToday) {
      return `今日剩余额度仅 ${remainingToday} 条`;
    }
    return null;
  };

  const validationError = getValidationError();
  const isCountValid = validationError === null;

  const handleExport = () => {
    if (!isCountValid) return;
    const numCount = parseInt(count, 10);

    setIsExporting(true);
    setIsError(false);

    // 预先生成文件名
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const prefix = dataType === 'opportunity' ? '商机数据' : '企业数据';
    const fileName = `${prefix}_${yyyy}${mm}${dd}_${hh}${min}.xlsx`;
    setPreviewName(fileName);

    setTimeout(() => {
      const isOk = (exportStatusOverride ?? 'completed') === 'completed';
      if (isOk) {
        // 扣减当日额度（localStorage）
        addTodayExportUsed(userRole, numCount);

        // 往 App 树里增加新导出记录
        if (addExportRecord) {
          addExportRecord(dataType, numCount, 'completed');
        }

        // 执行外部回调
        onExport(numCount);

        setIsExporting(false);
        setIsSuccess(true);
        setIsError(false);
      } else {
        // 失败：不调用 addTodayExportUsed，额度一条都不扣
        if (addExportRecord) {
          addExportRecord(dataType, numCount, 'failed');
        }

        setIsExporting(false);
        setIsSuccess(false);
        setIsError(true);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 font-sans" onClick={onClose}>
      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl flex flex-col max-h-[85vh] relative z-10 border border-gray-100"
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 rounded-t-2xl">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            数据导出
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 顶部常驻信息条: 今日剩余额度 X 条 · 当前筛选结果 Y 条 */}
        {!isSuccess && !isError && userRole !== UserRole.FREE && (
          <div className="bg-[#E6F7FF]/60 border-b border-[#B3E1FF]/30 px-4 py-2 text-xs text-gray-600 text-center font-medium shrink-0">
            今日剩余额度 <span className="text-primary font-bold">{remainingToday}</span> 条（商机+企业合计） · 当前筛选结果 <span className="text-gray-900 font-bold">{totalItems}</span> 条
          </div>
        )}

        <div className="p-6 space-y-4 overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-500 animate-bounce duration-1000">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 stroke-[2.5]" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-1">导出任务已创建</h4>
              <p className="text-xs text-gray-500 mb-5 px-1 max-w-[260px] truncate" title={previewName}>
                {previewName}
              </p>

              <div className="space-y-2 w-full">
                <button
                  onClick={() => {
                    onClose();
                    if (onViewRecords) {
                      onViewRecords();
                    }
                  }}
                  className="w-full py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.98] transition-transform cursor-pointer"
                >
                  查看导出记录
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform cursor-pointer"
                >
                  完成
                </button>
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 stroke-[2.5]" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-1">导出失败</h4>
              <p className="text-xs text-red-505 font-medium mb-5 px-1 max-w-[260px]">
                导出出错，请重试（本次未消耗额度）
              </p>

              <div className="space-y-2 w-full">
                <button
                  onClick={handleExport}
                  className="w-full py-2.5 bg-[#0D5EFA] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.98] transition-transform cursor-pointer"
                >
                  重新尝试
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          ) : userRole === UserRole.FREE ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">仅限会员使用</h4>
              <p className="text-sm text-gray-500 mb-4">数据导出功能仅对 VIP 及以上用户开放</p>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-2 mb-5 text-left border border-gray-100">
                <div className="font-medium text-gray-900 mb-1">会员权益对比：</div>
                <div className="flex justify-between items-center">
                  <span>VIP</span>
                  <span className="font-bold">10条/天（商机+企业合计）</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SVIP</span>
                  <span className="font-bold">50条/天（商机+企业合计）</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (onUpgrade) onUpgrade();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-md active:scale-[0.98] transition-transform"
              >
                立即升级会员
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  导出条数（最多可导 {maxExportable} 条）
                </label>

                {/* Quick Select Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[10, 30, 50].map((val) => {
                    const isDisabled = val > remainingToday || val > totalItems || val > dailyLimit;
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setCount(val.toString())}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          isDisabled
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : count === val.toString()
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-650 border-gray-200 hover:bg-gray-50 active:scale-95'
                        }`}
                      >
                        {val}条
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    pattern="[0-9]*"
                    value={count}
                    disabled={remainingToday === 0 || totalItems === 0}
                    onChange={(e) => setCount(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-gray-50 border ${
                      validationError ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-primary/20'
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-primary transition-all font-mono text-sm ${
                      (remainingToday === 0 || totalItems === 0) ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                    }`}
                    placeholder={
                      totalItems === 0
                        ? '当前没有可导出的数据'
                        : remainingToday === 0
                          ? '今日额度已用完，明日恢复'
                          : '输入导出数量'
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    条
                  </div>
                </div>

                {/* 错误以内联小字红字展示，无任何 alert */}
                {validationError ? (
                  <p className="text-xs text-[#FF4D4F] font-medium mt-1.5 flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} />
                    {validationError}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1.5">
                    * 单次导出不能超过每日剩余额度且不超过筛选结果
                  </p>
                )}
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || remainingToday === 0 || !isCountValid || totalItems === 0}
                className={`w-full py-3 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 ${
                  isExporting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : (remainingToday === 0 || !isCountValid || totalItems === 0)
                      ? 'bg-gray-300 shadow-none cursor-not-allowed text-gray-500'
                      : 'bg-primary active:scale-[0.98]'
                }`}
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>正在导出...</span>
                  </>
                ) : remainingToday === 0 ? (
                  <span>今日额度已用完，明日恢复</span>
                ) : totalItems === 0 ? (
                  <span>无导出结果</span>
                ) : (
                  <>
                    <Download size={18} />
                    <span>确认导出</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
