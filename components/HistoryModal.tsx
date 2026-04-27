import React from 'react';
import { X, Calendar, ArrowRight, History, Trash2, FileText, Activity } from 'lucide-react';
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">扫描历史记录 (Scan History)</h2>
                  <p className="text-sm text-slate-500">查看及加载过往的健康体检报告 • 加权平均公式: 3:3:2:2</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <FileText size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-lg">暂无历史记录</p>
                  <p className="text-sm">执行“主动体检”后将自动保存报告</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4 md:mb-0">
                        <div className="shrink-0 pt-1">
                          <Calendar size={20} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-800 mb-1">
                            {item.timestamp}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                              {item.category}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-xs text-slate-500 font-medium">
                              发现 {item.issues.length} 个潜在问题
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Summary Metrics */}
                        <div className="hidden lg:flex items-center gap-4 border-l border-slate-100 pl-6 h-10">
                          {item.metrics.map((m, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{m.name.charAt(0)}</div>
                              <div className="text-sm font-bold text-slate-700">{m.score}%</div>
                            </div>
                          ))}
                        </div>

                        {/* Overall Score */}
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                          <Activity size={16} className="text-blue-500" />
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">健康得分</div>
                            <div className="text-xl font-black text-blue-600 leading-none">{item.overallScore}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onLoad(item)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                          >
                            加载报告
                            <ArrowRight size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="删除记录"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>系统将保留最近 50 条体检记录</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  已保存: {history.length}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
