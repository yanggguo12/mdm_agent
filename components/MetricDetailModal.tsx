import React, { useState } from 'react';
import { HealthMetric } from '../types';
import { X, Calculator, Database, Clock, Info, ExternalLink, Settings, TrendingUp, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendChartModal } from './TrendChartModal';

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: HealthMetric | null;
  onViewRawData?: (source: string) => void;
  onOpenConfig?: () => void;
  onOpenUniquenessConfig?: () => void;
  onOpenAccuracyConfig?: () => void;
  onOpenComplianceConfig?: () => void;
  onRefresh?: () => void;
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  metric, 
  onViewRawData, 
  onOpenConfig, 
  onOpenUniquenessConfig, 
  onOpenAccuracyConfig, 
  onOpenComplianceConfig,
  onRefresh
}) => {
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRunRule = () => {
    setIsCalculating(true);
    setProgress(0);
    
    // Simulate calculation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsCalculating(false);
            onRefresh?.();
          }, 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
  };

  const groupColors = ['bg-blue-50/60', 'bg-emerald-50/60', 'bg-amber-50/60', 'bg-purple-50/60', 'bg-rose-50/60'];
  const uniqueGroups = React.useMemo(() => {
    if (!metric?.calculationDetails?.sampleBadRecords) return [];
    return Array.from(new Set(metric.calculationDetails.sampleBadRecords.map((r: any) => r._duplicateGroup).filter(Boolean)));
  }, [metric]);

  const getRowClassName = (record: any) => {
    if (metric?.name.includes('Uniqueness') && record._duplicateGroup) {
      const groupIndex = uniqueGroups.indexOf(record._duplicateGroup);
      return `${groupColors[groupIndex % groupColors.length]} hover:brightness-95 transition-all`;
    }
    return 'hover:bg-slate-50 transition-colors';
  };

  if (!isOpen || !metric || !metric.calculationDetails) return null;

  const { calculationDetails: details } = metric;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6">
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-start sm:items-center flex-shrink-0" style={{ backgroundColor: `${metric.color}10` }}>
            <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row w-full pr-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: metric.color }}></div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  {metric.name} - 指标溯源
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-2">
                {metric.name.includes('完整性') && (
                  <div className="flex items-center gap-2">
                    {onOpenConfig && (
                      <button 
                        onClick={onOpenConfig}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Settings size={14} /> 规则配置
                      </button>
                    )}
                    <button 
                      onClick={handleRunRule}
                      disabled={isCalculating}
                      className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Play size={14} fill="currentColor" /> {isCalculating ? '运行中...' : '运行规则'}
                    </button>
                    <button 
                      onClick={() => setIsTrendModalOpen(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <TrendingUp size={14} /> 趋势图
                    </button>
                  </div>
                )}
                {metric.name.includes('唯一性') && (
                  <div className="flex items-center gap-2">
                    {onOpenUniquenessConfig && (
                      <button 
                        onClick={onOpenUniquenessConfig}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Settings size={14} /> 规则配置
                      </button>
                    )}
                    <button 
                      onClick={handleRunRule}
                      disabled={isCalculating}
                      className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Play size={14} fill="currentColor" /> {isCalculating ? '运行中...' : '运行规则'}
                    </button>
                    <button 
                      onClick={() => setIsTrendModalOpen(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <TrendingUp size={14} /> 趋势图
                    </button>
                  </div>
                )}
                {metric.name.includes('准确性') && (
                  <div className="flex items-center gap-2">
                    {onOpenAccuracyConfig && (
                      <button 
                        onClick={onOpenAccuracyConfig}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Settings size={14} /> 规则配置
                      </button>
                    )}
                    <button 
                      onClick={handleRunRule}
                      disabled={isCalculating}
                      className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Play size={14} fill="currentColor" /> {isCalculating ? '运行中...' : '运行规则'}
                    </button>
                    <button 
                      onClick={() => setIsTrendModalOpen(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <TrendingUp size={14} /> 趋势图
                    </button>
                  </div>
                )}
                {metric.name.includes('合规性') && (
                  <div className="flex items-center gap-2">
                    {onOpenComplianceConfig && (
                      <button 
                        onClick={onOpenComplianceConfig}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Settings size={14} /> 规则配置
                      </button>
                    )}
                    <button 
                      onClick={handleRunRule}
                      disabled={isCalculating}
                      className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Play size={14} fill="currentColor" /> {isCalculating ? '运行中...' : '运行规则'}
                    </button>
                    <button 
                      onClick={() => setIsTrendModalOpen(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <TrendingUp size={14} /> 趋势图
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-lg transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto relative">
            {/* Calculation Overlay */}
            <AnimatePresence>
              {isCalculating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-12"
                >
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-full max-w-md space-y-6 text-center"
                  >
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-slate-100"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={276.46}
                          initial={{ strokeDashoffset: 276.46 }}
                          animate={{ strokeDashoffset: 276.46 * (1 - progress / 100) }}
                          className="text-indigo-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black text-slate-800">{progress}%</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">正在执行数据诊断</h3>
                      <p className="text-xs text-slate-500">正在遍历扫描数据源，应用最新规则逻辑...</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-500"
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Description */}
            <div className="flex gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Info className="flex-shrink-0 text-blue-500 mt-0.5" size={18} />
              <p className="text-sm leading-relaxed">{details.description}</p>
            </div>

            {/* Calculation Process */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calculator size={16} className="text-slate-500" />
                计算逻辑与过程
              </h3>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">计算公式</span>
                  <div className="mt-2 font-mono text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {details.formula}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">{details.numerator.label}</div>
                    <div className="text-lg font-bold text-slate-800">{details.numerator.value.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center justify-center text-slate-300">
                    <span className="text-2xl">/</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">{details.denominator.label}</div>
                    <div className="text-lg font-bold text-slate-800">{details.denominator.value.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-600">指标得分 / 权重</span>
                    <span className="text-[10px] text-slate-400 font-mono italic">该指标在总分中占比: {metric.weight}%</span>
                  </div>
                  <span className="text-2xl font-extrabold" style={{ color: metric.color }}>
                    {metric.score}<span className="text-lg opacity-70">%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Database size={16} className="text-slate-500" />
                数据来源 (Data Lineage)
              </h3>
              <div className="flex flex-wrap gap-2">
                {details.dataSources.map((source, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => onViewRawData && onViewRawData(source)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-medium hover:bg-indigo-100 hover:border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5 group"
                  >
                    {source}
                    <ExternalLink size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sample Bad Records */}
            {details.sampleBadRecords && details.sampleBadRecords.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Database size={16} className="text-slate-500" />
                  异常数据抽样 (Sample Anomalies)
                </h3>
                <div className="overflow-auto max-h-[400px] border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 font-semibold w-12">序号</th>
                        {details.sampleColumns ? (
                          details.sampleColumns.map((col, idx) => (
                            <th key={idx} className="px-4 py-2 font-semibold">{col.key} ({col.label})</th>
                          ))
                        ) : (
                          <>
                            <th className="px-4 py-2 font-semibold">MATNR (物料号)</th>
                            <th className="px-4 py-2 font-semibold">MAKTX (描述)</th>
                            <th className="px-4 py-2 font-semibold">MATKL (物料组)</th>
                            <th className="px-4 py-2 font-semibold">MTART (类型)</th>
                            <th className="px-4 py-2 font-semibold">BRGEW (毛重)</th>
                            <th className="px-4 py-2 font-semibold">NTGEW (净重)</th>
                            <th className="px-4 py-2 font-semibold">EAN11 (条码)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {details.sampleBadRecords.map((record, idx) => (
                        <tr key={idx} className={getRowClassName(record)}>
                          <td className="px-4 py-2 text-slate-400 font-mono">{idx + 1}</td>
                          {details.sampleColumns ? (
                            details.sampleColumns.map((col, colIdx) => {
                              const val = record[col.key];
                              const isMissing = val === '' || val === null || val === undefined;
                              const isError = 
                                (col.key === 'NTGEW' && record.NTGEW > record.BRGEW) ||
                                (col.key === 'EAN11' && record.MTART === 'FERT' && (!val || val.length !== 13)) ||
                                isMissing;

                              return (
                                <td key={colIdx} className={`px-4 py-2 ${col.key === 'MATNR' ? 'font-mono text-slate-800' : ''} ${col.key === 'MAKTX' ? 'truncate max-w-[120px]' : ''}`} title={col.key === 'MAKTX' ? val : undefined}>
                                  {isError ? (
                                    <span className="text-red-500 font-bold bg-red-50 px-1 py-0.5 rounded">
                                      {isMissing ? 'NULL' : val}
                                    </span>
                                  ) : (
                                    val
                                  )}
                                </td>
                              );
                            })
                          ) : (
                            <>
                              <td className="px-4 py-2 font-mono text-slate-800">{record.MATNR}</td>
                              <td className="px-4 py-2 truncate max-w-[120px]" title={record.MAKTX}>{record.MAKTX}</td>
                              <td className="px-4 py-2">
                                {record.MATKL ? record.MATKL : <span className="text-red-500 font-bold bg-red-50 px-1 py-0.5 rounded">NULL</span>}
                              </td>
                              <td className="px-4 py-2">{record.MTART}</td>
                              <td className="px-4 py-2">{record.BRGEW}</td>
                              <td className="px-4 py-2">
                                {record.NTGEW > record.BRGEW ? <span className="text-red-500 font-bold bg-red-50 px-1 py-0.5 rounded">{record.NTGEW}</span> : record.NTGEW}
                              </td>
                              <td className="px-4 py-2">
                                {record.MTART === 'FERT' && (!record.EAN11 || record.EAN11.length !== 13) ? <span className="text-red-500 font-bold bg-red-50 px-1 py-0.5 rounded">{record.EAN11 || 'NULL'}</span> : record.EAN11}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Info */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <Clock size={14} />
              <span>最后计算时间: {details.lastCalculated}</span>
            </div>
          </div>
        </div>
      </div>

      <TrendChartModal 
        isOpen={isTrendModalOpen}
        onClose={() => setIsTrendModalOpen(false)}
        metricName={metric.name}
        currentScore={metric.score}
      />
    </>
  );
};
