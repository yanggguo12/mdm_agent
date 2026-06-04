import React from 'react';
import { X, Calendar, ArrowRight, History, Trash2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanHistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanHistoryItem[];
  onLoad: (item: ScanHistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onLoad, onDelete }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            className="relative w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[70vh] sm:h-auto sm:max-h-[85vh] border border-slate-200"
          >
            {/* Elegant Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shadow-sm shrink-0">
                  <History size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 tracking-tight">扫描历史记录</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">查看及载入过往的主动健康检测报告</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            </div>

            {/* List Scrolling Workspace */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-350 border border-slate-100 mb-2.5">
                    <FileText size={20} className="text-slate-400 opacity-60" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700">暂无历史记录</h3>
                  <p className="text-[10px] text-slate-400 mt-1 px-4 max-w-xs leading-relaxed">
                    执行“主动体检”后系统将会自动留存诊断报告，方便后续调阅修复。
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200/70 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all gap-3"
                    >
                      {/* Left: Overall Score + Detailed Meta */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Score Indicator Badge */}
                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                          item.overallScore >= 90 
                            ? 'bg-emerald-50/75 border-emerald-100/80 text-emerald-600' 
                            : item.overallScore >= 80 
                            ? 'bg-blue-50/75 border-blue-100/80 text-blue-600' 
                            : 'bg-amber-50/75 border-amber-100/80 text-amber-600'
                        }`}>
                          <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 scale-[0.85] leading-none mb-0.5">得分</span>
                          <span className="text-xs font-black leading-none font-mono">{item.overallScore}</span>
                        </div>

                        {/* Metadata Details */}
                        <div className="min-w-0 flex flex-col gap-0.5">
                          {/* Smaller Timestamp font */}
                          <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 tracking-tight leading-none">
                            <Calendar size={10} className="text-slate-300 shrink-0" />
                            <span className="font-mono whitespace-nowrap">{item.timestamp}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 text-[8.5px] font-bold rounded max-w-[85px] sm:max-w-[120px] truncate leading-none">
                              {item.category}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border leading-none shrink-0 ${
                              item.issues.length > 0 
                                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}>
                              {item.issues.length > 0 ? `${item.issues.length}项异常` : '合规'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-605 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg active:scale-95 transition-all"
                          title="删除当前记录"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          onClick={() => onLoad(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-lg text-[10px] font-black shadow-sm transition-all"
                        >
                          <span>载入</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Bottom summary bar */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              <span>系统智能保留最多 50 次体检记录</span>
              <span>记录数 : {history.length}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
