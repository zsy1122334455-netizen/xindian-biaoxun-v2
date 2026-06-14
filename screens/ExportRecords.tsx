import React, { useState } from 'react';
import { ChevronLeft, FileDown, Clock, Download, FileText, RefreshCw, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { ViewName, UserRole, ExportRecord } from '../types';

// Business Rules: 对应文档"文件存储与有效期"要求
const RETENTION_RULES: Record<UserRole, number | null> = {
  [UserRole.FREE]: 7,
  [UserRole.VIP]: 30,
  [UserRole.SVIP]: 90, // 云端保存 90 天
};

interface ExportRecordsProps {
  onBack: () => void;
  userRole: UserRole;
  onNavigate: (view: ViewName) => void;
  onShowPaymentModal: (desc: string) => void;
  onShowExportVipPrompt?: () => void;
  exportRecords: ExportRecord[];
  setExportRecords: React.Dispatch<React.SetStateAction<ExportRecord[]>>;
}

export const ExportRecords: React.FC<ExportRecordsProps> = ({
  onBack,
  userRole,
  onNavigate,
  onShowPaymentModal,
  onShowExportVipPrompt,
  exportRecords,
  setExportRecords,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const showLocalToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const today = new Date();

  // 计算有效期
  const getExpiryDate = (createdAt: string, role: UserRole) => {
    const days = RETENTION_RULES[role];
    if (days === null || days === undefined) return null;
    const date = new Date(`${createdAt}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date;
  };

  const handleDownload = (record: ExportRecord) => {
    if (record.status !== 'completed') return;

    // 1. 判断是否过期
    const expiry = getExpiryDate(record.createdAt, userRole);
    if (expiry && expiry < today) {
      showLocalToast('文件已过期，需重新导出');
      return;
    }

    // FREE 用户进入导出记录页可以看到历史记录（演示场景下角色切换产生），但点击任何下载按钮直接弹上述同款会员引导。
    if (userRole === UserRole.FREE) {
      onShowPaymentModal('EXPORT_DOWNLOAD');
      return;
    }

    // 3. 触发二次下载进度态
    startDownloadSimulation(record.id);
  };

  // 模拟下载过程与进度提示
  const startDownloadSimulation = (id: string) => {
    if (downloadingId) return;
    setDownloadingId(id);
    setProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 20) + 10;
      if (p >= 100) p = 100;
      setProgress(p);

      if (p === 100) {
        clearInterval(interval);
        setTimeout(() => {
          setDownloadingId(null);
          setProgress(0);
        }, 300);
      }
    }, 400);
  };

  // 重试流程修复：点击 [重试] → 该记录 status 回到 'processing'（转圈）→ 3 秒后变 'completed'，toast"已重新加入导出队列"
  const handleRetry = (id: string) => {
    showLocalToast('已重新加入导出队列');
    setExportRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'processing' } : r))
    );

    setTimeout(() => {
      setExportRecords(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'completed' } : r))
      );
    }, 3000);
  };

  // 过期记录补出口：处于"已过期 7 天内"的置灰记录，操作区增加 [重新导出] 按钮，
  // 点击后基于原记录参数创建一条新的 processing 记录（走 3 秒变 completed），toast"已创建新的导出任务"
  const handleReExport = (oldRecord: ExportRecord) => {
    showLocalToast('已创建新的导出任务');

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    let prefix = '商机数据';
    if (oldRecord.name.includes('企业')) {
      prefix = '企业数据';
    } else if (oldRecord.name.includes('商机') || oldRecord.name.includes('招投标') || oldRecord.name.includes('分析')) {
      prefix = '商机数据';
    }

    const newName = `${prefix}_${yyyy}${mm}${dd}_${hh}${min}.xlsx`;
    const dateStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    const dStr = `${yyyy}-${mm}-${dd}`;

    const newRecord: ExportRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      date: dateStr,
      size: oldRecord.size,
      createdAt: dStr,
      status: 'processing',
    };

    setExportRecords(prev => [newRecord, ...prev]);

    setTimeout(() => {
      setExportRecords(prev =>
        prev.map(r => (r.id === newRecord.id ? { ...r, status: 'completed' } : r))
      );
    }, 3000);
  };

  // 柔性过滤逻辑：过期超过 7 天的文件彻底从列表消失；处于过期 7 天内的文件，呈现禁用状态并保留提示并有"重新导出"键。
  const visibleRecords = exportRecords.filter(record => {
    const expiry = getExpiryDate(record.createdAt, userRole);
    if (!expiry) return true;
    const timeDiff = today.getTime() - expiry.getTime();
    const daysExpired = timeDiff / (1000 * 3600 * 24);
    return daysExpired <= 7;
  });

  return (
    <div className="min-h-screen bg-[#F5F8FF] flex flex-col pt-[env(safe-area-inset-top)] relative font-sans">
      {/* Local Toast Indicator */}
      {toast.show && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-900 border border-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs z-[100] animate-fade-in max-w-[80vw] text-center shadow-2xl font-medium tracking-wide">
          {toast.message}
        </div>
      )}

      {/* Header：标题栏居中，左侧返回 */}
      <div className="flex items-center justify-between px-4 py-4 bg-white sticky top-0 z-20 shadow-sm rounded-t-3xl sm:rounded-t-none">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-800 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900 tracking-wide">数据导出记录</h1>
        <div className="w-10"></div>
      </div>

      {/* List Area */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-safe relative">
        {visibleRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 pb-12 text-gray-400">
            <FileText className="w-20 h-20 mb-5 opacity-20" strokeWidth={1} />
            <p className="text-sm mb-6 text-gray-500 font-medium">暂无导出记录</p>
            <button
              onClick={() => onNavigate(ViewName.OPPORTUNITY_LIST)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors active:scale-95 cursor-pointer"
            >
              前往商机列表发起导出
            </button>
          </div>
        ) : (
          visibleRecords.map(record => {
            const expiry = getExpiryDate(record.createdAt, userRole);
            const isExpired = expiry && expiry < today;

            const isXlsx = record.name.endsWith('.xlsx');
            const fileFormat = record.name.split('.').pop()?.toUpperCase() || 'FILE';

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-blue-50/50 flex flex-col gap-3 transition-all relative overflow-hidden"
              >
                {/* 过期文件置灰 */}
                <div className={`flex items-start gap-4 ${isExpired ? 'opacity-50 grayscale-[0.4]' : ''}`}>
                  {/* 左侧图标 */}
                  <div
                    className={`w-12 h-12 flex-shrink-0 rounded-xl relative flex items-center justify-center ${
                      isExpired ? 'bg-gray-100 text-gray-400' : 'bg-[#F0F5FF] text-[#2563EB]'
                    }`}
                  >
                    {isXlsx ? <FileSpreadsheet className="w-7 h-7 stroke-[1.5]" /> : <FileText className="w-7 h-7 stroke-[1.5]" />}
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-[2.5px] border-white ${
                        isExpired ? 'bg-gray-400' : 'bg-[#2563EB]'
                      }`}
                    >
                      <FileDown className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  {/* 消息主体 */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className={`font-bold text-[15px] truncate mb-1.5 ${isExpired ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {record.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {record.date}
                      </span>
                      <span className="text-gray-200">|</span>
                      <span className="font-medium text-gray-600">{record.size}</span>
                      <span className="text-gray-200">|</span>
                      <span
                        className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${
                          isXlsx ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        .{fileFormat}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-gray-50 mt-1"></div>
                <div className="flex items-center justify-between pt-1">
                  {/* 左端有效期提示 */}
                  <div className="flex-1">
                    {record.status === 'processing' ? (
                      <span className="text-[11px] text-blue-500 font-medium flex items-center gap-1">
                        等待文件就绪...
                      </span>
                    ) : expiry ? (
                      isExpired ? (
                        <span className="text-[11px] text-red-500 bg-red-55/5 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> 文件过保存期
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                          有效期至: {expiry.toLocaleDateString()}
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        永久有效
                      </span>
                    )}
                  </div>

                  {/* 右端控制 */}
                  {record.status === 'processing' && (
                    <div className="flex items-center gap-1.5 text-blue-500 font-semibold text-[12px]">
                      <svg className="animate-spin h-4.5 w-4.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>文件生成中…</span>
                    </div>
                  )}

                  {record.status === 'completed' && (
                    <div className="flex-shrink-0">
                      {downloadingId === record.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-blue-600 font-mono w-7 text-right">
                            {progress}%
                          </span>
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 relative">
                            <svg className="w-7 h-7 transform -rotate-90 pointer-events-none">
                              <circle className="text-blue-100" strokeWidth="2.5" stroke="currentColor" fill="transparent" r="10" cx="14" cy="14" />
                              <circle
                                className="text-blue-600 transition-all duration-200 ease-out"
                                strokeWidth="2.5"
                                strokeDasharray={10 * 2 * Math.PI}
                                strokeDashoffset={10 * 2 * Math.PI * (1 - progress / 100)}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="10"
                                cx="14"
                                cy="14"
                              />
                            </svg>
                          </div>
                        </div>
                      ) : isExpired ? (
                        <button
                          onClick={() => handleReExport(record)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-primary bg-[#E6F7FF] hover:bg-[#B3E1FF] rounded-full transition-colors text-[12px] font-bold cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          重新导出
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDownload(record)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-[12px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          二次下载
                        </button>
                      )}
                    </div>
                  )}

                  {record.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(record.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors text-[12px] font-bold cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      重新导出
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
