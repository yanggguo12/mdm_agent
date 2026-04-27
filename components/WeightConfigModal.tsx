import React, { useState, useEffect } from 'react';
import { X, Scale, Info, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WeightConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weights: Record<string, number>) => void;
  currentWeights: Record<string, number>;
}

export const WeightConfigModal: React.FC<WeightConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentWeights 
}) => {
  const [weights, setWeights] = useState<Record<string, number>>(currentWeights);
  const [total, setTotal] = useState(100);

  useEffect(() => {
    setWeights(currentWeights);
  }, [currentWeights]);

  useEffect(() => {
    const sum = Object.values(weights).reduce((acc: number, w: number) => acc + w, 0);
    setTotal(sum);
  }, [weights]);

  const handleWeightChange = (key: string, value: string) => {
    const num = parseInt(value) || 0;
    setWeights(prev => ({ ...prev, [key]: num }));
  };

  const isInvalid = total !== 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Scale size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">权重分摊配置 (Authority Weights)</h2>
                <p className="text-sm text-slate-500 font-medium">定义各指标在总分计算中的比重</p>
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
          <div className="p-6 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
              <Info className="shrink-0 text-blue-500 mt-0.5" size={18} />
              <p className="text-xs text-blue-700 leading-relaxed">
                不同的数据领域具有不同的治理优先级。例如，基础数据更侧重于<b>唯一性</b>以防库位膨胀；而财务数据更侧重于<b>准确性</b>。权重总额必须等于 100%。
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all shadow-sm">
                  <div className="font-bold text-slate-700 text-sm">{key}</div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={value}
                      onChange={(e) => handleWeightChange(key, e.target.value)}
                      className="w-32 accent-indigo-600"
                    />
                    <div className="flex items-center gap-1 w-16">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => handleWeightChange(key, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Check */}
            <div className={`p-4 rounded-2xl flex items-center justify-between ${isInvalid ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'}`}>
              <div className="flex items-center gap-2 text-sm font-bold">
                {isInvalid ? <AlertCircle size={18} /> : <Save size={18} />}
                当前总权重: {total}%
              </div>
              <div className="text-xs">
                {isInvalid ? `偏差 ${Math.abs(100 - total)}% (必须等于 100%)` : '权重分配有效'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button 
              disabled={isInvalid}
              onClick={() => { onSave(weights); onClose(); }}
              className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              应用配置
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
