import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Activity, CheckSquare, Square, Trash2, Link as LinkIcon, Plus, 
  Layout, MessageSquare, Send, Bot, User, Sparkles, Loader2, Play, 
  RotateCcw, ShieldCheck, Scale, AlertTriangle, ChevronRight, 
  CheckCircle2, Database, Wand2, Volume2, Settings, ListFilter,
  Check, Info, ChevronDown, Layers, Laptop, ShieldAlert, ArrowRight,
  Sliders, Shield, ClipboardList, RefreshCw, Sparkle, Smartphone, LogOut,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataIssue, HealthMetric, ScanHistoryItem } from '../types';
import { MARA_FIELDS, MARA_FIELD_DESCRIPTIONS } from '../utils/dataProcessor';
import { sendMessageToGemini } from '../services/geminiService';
import { RepairDetailsModal } from './RepairDetailsModal';
import { TrendChartModal } from './TrendChartModal';

interface MobileViewProps {
  metrics: HealthMetric[];
  issues: DataIssue[];
  scanStep: number;
  selectedCategories: string[];
  completenessKeyFields: string[];
  uniquenessKeyFields: string[][];
  complianceRules: any[];
  history: ScanHistoryItem[];
  metricWeights: Record<string, number>;
  contextData: string;
  onAutoScan: () => void;
  onRepair: (issue: DataIssue) => void;
  onToggleCategory: (major: string, sub: string) => void;
  onSaveCompletenessFields: (fields: string[]) => void;
  onSaveUniquenessFields: (fields: string[][]) => void;
  onBackToDesktop: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onSaveWeights: (weights: Record<string, number>) => void;
  onViewRawData: (source: string) => void;
  onRefresh: () => void;
}

// Group fields into categories for ease of access and completeness checks
const CATEGORY_FIELD_GROUPS: Record<string, string[]> = {
  '核心关键': ['MATNR', 'MAKTX', 'MATKL', 'MEINS'],
  '重量/体积': ['BRGEW', 'NTGEW', 'GEWEI', 'VOLUM', 'VOLEH'],
  '设计属性': ['BISMT', 'ZEINR', 'ZEIVR', 'EXTWG', 'MSTAE']
};

export const MobileView: React.FC<MobileViewProps> = ({
  metrics,
  issues,
  scanStep,
  selectedCategories,
  completenessKeyFields,
  uniquenessKeyFields,
  complianceRules,
  history,
  metricWeights,
  contextData,
  onAutoScan,
  onRepair,
  onToggleCategory,
  onSaveCompletenessFields,
  onSaveUniquenessFields,
  onBackToDesktop,
  onLogout,
  onOpenHistory,
  onSaveWeights,
  onViewRawData,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'issues' | 'ai' | 'settings'>('home');
  const [currentTime, setCurrentTime] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('All');
  
  // Interactive Mobile Modals/Sheets State
  const [selectedMetricDetail, setSelectedMetricDetail] = useState<HealthMetric | null>(null);
  const [viewingIssueDetails, setViewingIssueDetails] = useState<DataIssue | null>(null);
  const [mobileRepairConfig, setMobileRepairConfig] = useState<{ id: string; title: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [isAllIssuesOpen, setIsAllIssuesOpen] = useState(false);

  // Chat agent states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: 'welcome_mobile',
      role: 'model',
      text: "📱 您好！我是您的 AI 数据治理微助手，已同步当前 ERP 系统。我已经针对您的最新的元数据和扫描结果完成了 Context 耦合！\n\n您可以随时问我：\n- **“分析目前的整体健康状况”** \n- **“推荐针对一物多码的处理模式”**"
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isVocalizing, setIsVocalizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Uniqueness group custom manual typing state
  const [uniqFieldInput, setUniqFieldInput] = useState('');

  // Accuracy customized visual thresholds states
  const [accuracyWeightsGroup, setAccuracyWeightsGroup] = useState(true); // "毛重必须大于自定净重" rule
  const [accuracyLengthGroup, setAccuracyLengthGroup] = useState(true);  // "物料编码符合特定规范长度" rule

  // Compliance customized visual toggles
  const [complianceToggles, setComplianceToggles] = useState<Record<string, boolean>>({
    'c1': true, // Customs Tariff Validity
    'c2': true, // RoHS hazardous substances
    'c3': true, // Naming Rule (MAKTX parse check)
    'c4': true  // PLM Drawing association Check
  });
  const [isAuditingCompliance, setIsAuditingCompliance] = useState(false);

  // States for metric detail action calculations
  const [isCalculatingSelectedMetric, setIsCalculatingSelectedMetric] = useState(false);
  const [metricProgress, setMetricProgress] = useState(0);
  const [selectedMetricPage, setSelectedMetricPage] = useState(1);
  const [isTrendChartModalOpen, setIsTrendChartModalOpen] = useState(false);

  // Trigger state for micro repair alerts
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [healedIssueName, setHealedIssueName] = useState('');

  // Keep digital clock updating normally like actual phones
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset pagination page on metric focus change
  useEffect(() => {
    setSelectedMetricPage(1);
  }, [selectedMetricDetail?.name]);

  const handleRunSelectedMetricRule = () => {
    setIsCalculatingSelectedMetric(true);
    setMetricProgress(0);
    const progressInterval = setInterval(() => {
      setMetricProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsCalculatingSelectedMetric(false);
            onRefresh();
          }, 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
  };

  const sampleColumnsMapped = (sampleCols: any[], record: any) => {
    if (sampleCols.length > 0) {
      return sampleCols.map((col: any) => {
        const val = record[col.key];
        const isMissing = val === '' || val === null || val === undefined;
        const isError = 
          (col.key === 'NTGEW' && Number(record.NTGEW) > Number(record.BRGEW)) ||
          (col.key === 'EAN11' && record.MTART === 'FERT' && (!val || String(val).length !== 13)) ||
          isMissing;
        
        return (
          <div key={col.key} className="text-[10px] space-y-0.5 text-left truncate">
            <span className="text-slate-400 font-extrabold text-[8.5px] block">{col.label}:</span>
            <span className={`font-semibold font-mono ${isError ? 'text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-black border border-rose-100/40 inline-block font-bold' : 'text-slate-700'}`}>
              {isMissing ? 'NULL' : String(val)}
            </span>
          </div>
        );
      });
    } else {
      return (
        <>
          <div className="text-[10px] space-y-0.5 text-left">
            <span className="text-slate-400 font-extrabold text-[8.5px] block">物料描述 MAKTX:</span>
            <span className="text-slate-707 text-slate-700 font-medium">{record.MAKTX || 'NULL'}</span>
          </div>
          <div className="text-[10px] space-y-0.5 text-left">
            <span className="text-slate-400 font-extrabold text-[8.5px] block">物料组 MATKL:</span>
            <span className="text-slate-707 text-slate-700 font-mono font-bold">{record.MATKL || 'NULL'}</span>
          </div>
        </>
      );
    }
  };

  // Update scrolling for the Chat tab
  useEffect(() => {
    if (activeTab === 'ai') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, activeTab]);

  const handleMobileChatSend = async (textToSend?: string) => {
    const queryText = textToSend || chatInput;
    if (!queryText.trim() || isChatLoading) return;

    if (!textToSend) setChatInput('');
    
    // Add user message
    const userMsg = { id: Date.now().toString(), role: 'user', text: queryText };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const resp = await sendMessageToGemini(queryText, contextData);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: resp
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "🚨 抱歉，连接 AI 特快专列时出了点岔子。请检查您的互联网或 API 配置密钥。"
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const executeMobileRepair = (issue: DataIssue) => {
    setHealedIssueName(`${issue.field} [${issue.table}]`);
    setTriggerConfetti(true);
    onRepair(issue);
    if (viewingIssueDetails && viewingIssueDetails.id === issue.id) {
      setViewingIssueDetails(null); // auto-close details on heal
    }
    setTimeout(() => {
      setTriggerConfetti(false);
    }, 2500);
  };

  const handleAuditTrigger = () => {
    setIsAuditingCompliance(true);
    setTimeout(() => {
      setIsAuditingCompliance(false);
      alert('🔒 智能合规率检测成功！当前所有已勾选的外部及内部规范均达成 98.4% 符合度对仗。已同步写入健康评分数据库。');
    }, 2000);
  };

  const toggleComplianceItem = (id: string) => {
    setComplianceToggles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getMetricIcon = (name: string) => {
    if (name.includes('完整性')) return <Layout size={20} className="text-emerald-600" />;
    if (name.includes('唯一性')) return <Layers size={20} className="text-indigo-600" />;
    if (name.includes('准确性')) return <Activity size={20} className="text-amber-600" />;
    return <ShieldCheck size={20} className="text-blue-600" />;
  };

  const getMetricColor = (name: string) => {
    if (name.includes('完整性')) return 'from-emerald-50 to-teal-50/10 border-emerald-100 hover:border-emerald-300';
    if (name.includes('唯一性')) return 'from-indigo-50 to-purple-50/10 border-indigo-100 hover:border-indigo-300';
    if (name.includes('准确性')) return 'from-amber-50 to-orange-50/10 border-amber-100 hover:border-amber-300';
    return 'from-blue-50 to-sky-50/10 border-blue-100 hover:border-blue-300';
  };

  const totalScore = Math.round(
    metrics.reduce((acc, m) => acc + (m.score * (metricWeights[m.name] || 25) / 100), 0)
  );

  const activeIssues = issues.filter(i => i.status !== 'Fixed');
  const filteredIssues = activeIssues.filter(i => {
    if (issueTypeFilter === 'All') return true;
    if (issueTypeFilter === 'Missing') return i.type === 'Missing Field';
    if (issueTypeFilter === 'Duplicate') return i.type === 'Duplicate';
    if (issueTypeFilter === 'Accuracy') return i.type === 'Value Out of Range' || i.type === 'Mismatch';
    return false;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col overflow-hidden relative select-none font-sans">
      
      {/* Background radial gradients matching web desktop style */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/20 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HEADER STATUS EMBED (Supports easy logout/exit) */}
      <header className="px-5 py-4 bg-white/90 border-b border-slate-200/80 flex items-center justify-between backdrop-blur-xl shrink-0 z-30">
        <div>
          <h1 className="text-xs font-black tracking-tight text-slate-900">数据治理健康管家</h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5">{currentTime} UTC | 全生命周期品质巡检</p>
        </div>

        <button 
          onClick={onLogout}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/10 rounded-lg text-[10px] font-bold text-rose-400/90 transition-colors active:scale-95"
        >
          <LogOut size={10} />
          <span>退出登录</span>
        </button>
      </header>

      {/* DYNAMIC SCANNERS & PROGRESS CHECKLIST */}
      {scanStep > 0 && scanStep < 4 && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-slate-800">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin flex items-center justify-center">
              <Bot size={32} className="text-blue-600 animate-pulse" />
            </div>
            <div className="absolute inset-0 w-full h-full bg-blue-500/10 rounded-full blur-xl animate-ping" />
          </div>

          <h3 className="text-base font-black text-slate-900">主动治理大脑全速运算中</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-[270px] leading-relaxed">
            正在扫描、验证、评估和校验 ERP 物理字段组合关系，更新多源异构元模型对仗...
          </p>

          {/* Steps Progress Checklist */}
          <div className="mt-8 space-y-3 w-64 text-left">
            {[
              { id: 1, text: '启动数据库物理表连接、MARA 抽样对撞' },
              { id: 2, text: '校验唯一性 composite 键、物料名归类 audit' },
              { id: 3, text: 'AI 加权运算，提取不完整项和准确度偏移量' }
            ].map(step => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  scanStep > step.id 
                    ? 'bg-emerald-500 text-white' 
                    : scanStep === step.id 
                      ? 'bg-blue-600 text-white animate-pulse' 
                      : 'bg-slate-105 bg-slate-100 text-slate-405 text-slate-400'
                }`}>
                  {scanStep > step.id ? <Check size={10} /> : step.id}
                </div>
                <span className={`text-xs ${scanStep >= step.id ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE TRIGGER HEALED CHIPS AND SUCCESS NOTIFICATION */}
      <AnimatePresence>
        {triggerConfetti && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 bg-emerald-50/95 backdrop-blur-xl border border-emerald-200 p-4 rounded-2xl z-50 flex items-start gap-3 shadow-xl"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckSquare size={16} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-emerald-800">属性一键智能自愈成功</h4>
              <p className="text-[10px] text-slate-600 font-medium">已对物料子字段 <span className="font-mono text-emerald-600 font-bold">{healedIssueName}</span> 运行修正。健康度加分已同步更新！</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN DYNAMIC CONTENT */}
      <main className="flex-grow overflow-hidden flex flex-col relative">
        
        {/* TAB 1: HOME (HEALTH REPORT CARD) */}
        {activeTab === 'home' && (
          <div className="flex-grow overflow-y-auto px-5 py-5 space-y-6 pb-24 scrollbar-hide">
            
            {/* Header branding & Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <Bot size={20} className="text-blue-600" />
                    数据治理健康管家
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">一物多码与字段校验闭环管理</p>
                </div>
              </div>

              {/* Elite Action buttons row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onAutoScan}
                  disabled={scanStep > 0}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all duration-200 ${
                    scanStep > 0 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/10'
                  }`}
                  title="实时健康体检"
                >
                  <Play size={12} fill="currentColor" />
                  <span>{scanStep > 0 ? '主动体检中...' : '主动体检'}</span>
                </button>
                <button
                  onClick={onOpenHistory}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-200"
                >
                  <RotateCcw size={12} className="text-slate-500" />
                  <span>历史记录</span>
                </button>
              </div>
            </div>

            {/* CYLINDER RADIAL SPEEDOMETER CARD */}
            <div className="p-5 rounded-3xl bg-white border border-slate-205 border-slate-200/80 shadow-md overflow-hidden relative flex items-center justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 left-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />

              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-slate-400 tracking-widest font-black uppercase">综合健康分 score</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black font-mono text-slate-900 leading-none tracking-tight">{totalScore}</span>
                  <span className="text-sm font-semibold text-slate-500 ml-1">/100分</span>
                </div>
                
                {/* Visual indicator tag */}
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full ${
                  totalScore >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm'
                }`}>
                  <ShieldCheck size={9} />
                  {totalScore >= 85 ? '安全状况良好 (Trustwise)' : '规则红线动作 (Needs Action)'}
                </span>
              </div>

              {/* Progress visual circular bar */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0 z-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" className="text-slate-100 stroke-current" strokeWidth="5.5" fill="none" />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="32" 
                    className="text-indigo-400 text-blue-600 stroke-current transition-all duration-1000" 
                    strokeWidth="5.5" 
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - totalScore / 100)}`}
                    strokeLinecap="round"
                    fill="none" 
                  />
                </svg>
                <div className="absolute text-xs font-black font-mono tracking-tight text-slate-800">
                  {totalScore}%
                </div>
              </div>
            </div>

            {/* ERP SUB-PAGES CHIP CHECKERS */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">物理分区筛选</span>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                {['基础数据MARA', '工厂数据MARC', '财务数据MBEW', 'BOM', '工作中心'].map(cat => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => onToggleCategory(cat.includes('数据') ? '物料主数据' : '生产主数据', cat)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 border ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-100/50' 
                          : 'bg-white text-slate-650 text-slate-600 border-slate-200 hover:border-slate-350 shadow-sm'
                      }`}
                    >
                      {cat.replace('数据', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* METRICS INTERACTIVE LIST & DRILL DOWNS */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">四大质量指标加权表现</span>
              
              <div className="grid grid-cols-2 gap-3.5">
                {metrics.map(metric => {
                  const isSelected = selectedMetricDetail && selectedMetricDetail.name === metric.name;
                  return (
                    <div 
                      key={metric.name}
                      onClick={() => setSelectedMetricDetail(metric)}
                      className={`p-3.5 bg-gradient-to-br ${getMetricColor(metric.name)} border border-slate-100/40 rounded-2xl cursor-pointer transition-all active:scale-98 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-sm`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="p-1.5 bg-white/90 border border-slate-100 rounded-xl shadow-xs">
                          {getMetricIcon(metric.name)}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">{metricWeights[metric.name] || 25}% 权重</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-700 font-extrabold truncate">{metric.name}</div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xl font-extrabold font-mono text-slate-900">{metric.score}</span>
                          <span className="text-[10px] text-slate-550 text-slate-500 font-semibold">分</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            metric.score >= 90 ? 'bg-emerald-500' : metric.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



          </div>
        )}

        {/* TAB 2: ISSUES (DANGER RESOLUTION CENTER) */}
        {activeTab === 'issues' && (
          <div className="flex-grow overflow-hidden flex flex-col pt-2">
            
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-24 scrollbar-hide">
              
              {/* Part 1: 关键问题诊断 (Problem Diagnosis) Container Card */}
              <div id="problem_diagnosis_scroller_card" className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col space-y-3 p-4">
                
                {/* Header of diagnostic section */}
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 bg-rose-50 text-rose-600 rounded-lg animate-pulse">
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-black text-slate-850">关键问题诊断</h3>
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md font-bold text-[8px] font-mono shrink-0">
                          {activeIssues.length} 条未结
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-505 text-slate-500">检测及规则自动治理列表</p>
                    </div>
                  </div>
                  
                  {/* 查看全部 triggers the Full List Modal */}
                  <button 
                    onClick={() => setIsAllIssuesOpen(true)}
                    className="text-xs text-blue-600 font-extrabold hover:text-blue-800 flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    <span>查看全部</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                {/* Category selector chips embedded inside card section */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 border-b border-slate-100/60 pb-2">
                  {[
                    { id: 'All', label: '全部' },
                    { id: 'Missing', label: '信息缺件' },
                    { id: 'Duplicate', label: '重复重叠' },
                    { id: 'Accuracy', label: '范围偏离' }
                  ].map(chip => (
                    <button
                      key={chip.id}
                      onClick={() => setIssueTypeFilter(chip.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold shrink-0 transition-all ${
                        issueTypeFilter === chip.id 
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-100/50' 
                          : 'bg-slate-50 text-slate-550 border border-slate-250 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Section Issue items */}
                <div className="space-y-3.5 pt-1.5">
                  {filteredIssues.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-850">全部对齐合规</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">物料主数据校验已100%匹配您所设定的智控规则</p>
                      </div>
                    </div>
                  ) : (
                    filteredIssues.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => setViewingIssueDetails(item)}
                        className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300/80 transition-all shadow-sm flex gap-3 cursor-pointer active:scale-[0.99] relative overflow-hidden"
                      >
                        {/* Severity colored left stroke indicator */}
                        <div className={`w-1 rounded-full shrink-0 self-stretch my-0.5 ${
                          item.severity === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : item.severity === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                        }`} />

                        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded leading-none border border-blue-100">
                                  {item.table}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  列: {item.field}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-850 mt-1 shrink-0">
                                {MARA_FIELD_DESCRIPTIONS[item.field] || item.field} - {item.type}
                              </h4>
                            </div>

                            {/* Floating smart heal quick trigger button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                executeMobileRepair(item);
                              }}
                              className="p-2 bg-blue-600 hover:bg-emerald-600 active:scale-90 text-white rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ml-1.5"
                              title="一键智能修补"
                            >
                              <Wand2 size={12} className="animate-pulse" />
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-505 text-slate-500 leading-relaxed font-semibold">
                            {item.notes || item.description || '发现疑似由于规则偏差导致的越界或留空异常。'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Part 2: 自动修复策略 (Auto-Repair Strategy / 主动修复规则池) - Redesigned Dark Theme */}
              <div className="bg-[#0f172a] rounded-3xl p-5 text-white shadow-xl flex flex-col relative overflow-hidden">
                {/* Ambient Circular Glow effects */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500 rounded-full blur-[60px] opacity-25 pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-500 rounded-full blur-[60px] opacity-25 pointer-events-none" />
                
                <div className="relative z-10 flex-grow flex flex-col space-y-4">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <Shield size={14} />
                    </div>
                    <span className="uppercase tracking-widest text-[9px] font-black">自动修复策略 (Auto-Repair)</span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-black text-white leading-snug">主动修复规则池</h3>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">Active Correction Policies | 校验执行结果</p>
                  </div>
                  
                  <div className="space-y-2.5">
                    {/* Item 1 */}
                    <div 
                      onClick={() => setMobileRepairConfig({ id: 'formatting', title: '格式化修复 (Formatting)', type: 'success' })}
                      className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:bg-slate-800/60 transition-colors cursor-pointer animate-in fade-in duration-200"
                    >
                      <div className="flex gap-2.5">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
                        <div>
                          <div className="text-slate-400 text-[9px]">格式化修复 (Formatting)</div>
                          <div className="font-extrabold text-[11px] text-white">2,316 记录已自愈</div>
                        </div>
                      </div>
                      <div className="text-green-400 text-[8px] font-bold bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/15">已自动执行</div>
                    </div>
                    
                    {/* Item 2 */}
                    <div 
                      onClick={() => setMobileRepairConfig({ id: 'inference', title: 'AI 值推断 (Inference)', type: 'warning' })}
                      className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:bg-slate-800/60 transition-colors cursor-pointer animate-in fade-in duration-200"
                    >
                      <div className="flex gap-2.5">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                        <div>
                          <div className="text-slate-400 text-[9px]">AI 值推断 (Inference)</div>
                          <div className="font-extrabold text-[11px] text-white">8,612 记录推荐</div>
                        </div>
                      </div>
                      <div className="text-amber-400 text-[8px] font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/15">待复核</div>
                    </div>

                    {/* Item 3 */}
                    <div 
                      onClick={() => setMobileRepairConfig({ id: 'validation', title: '域值校验 (Validation)', type: 'info' })}
                      className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:bg-slate-800/60 transition-colors cursor-pointer animate-in fade-in duration-200"
                    >
                      <div className="flex gap-2.5">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
                        <div>
                          <div className="text-slate-400 text-[9px]">域值校验 (Validation)</div>
                          <div className="font-extrabold text-[11px] text-white">1,122 记录对齐</div>
                        </div>
                      </div>
                      <div className="text-blue-400 text-[8px] font-bold bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/15">系统规则</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-indigo-300 font-bold flex items-center gap-1">
                        <Sparkle size={10} className="fill-indigo-350 text-indigo-300 animate-pulse" />
                        效率提升 (Efficiency Gain)
                      </p>
                      <p className="text-[9px] text-slate-400">减少人工数据清洗工作量</p>
                    </div>
                    <span className="text-3xl font-black text-white font-mono">84%</span>
                  </div>
                </div>
              </div>

            </div>
                
          </div>
        )}

        {/* TAB 3: AI DIALOG (LIVELY BRAIN) */}
        {activeTab === 'ai' && (
          <div className="flex-grow overflow-hidden flex flex-col">
            
            {/* Model detail head */}
            <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow shadow-blue-100">
                    <Bot size={16} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900">质量管家 AI 机器人</h2>
                  <p className="text-[9px] text-slate-500">已载入 1.5 Pro 元语言与实况评分 Context</p>
                </div>
              </div>

              {/* Vocalizing decoration bar */}
              <button
                onClick={() => setIsVocalizing(!isVocalizing)}
                className={`p-2 rounded-xl transition-all shadow-sm ${
                  isVocalizing ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <Volume2 size={14} className={isVocalizing ? 'animate-bounce' : ''} />
              </button>
            </div>

            {/* Simulated live vocal line animation */}
            {isVocalizing && (
              <div className="bg-slate-50 py-2 border-b border-slate-200 px-6 flex items-center justify-center gap-1 shrink-0 animate-in slide-in-from-top-1">
                <span className="text-[8px] font-black tracking-widest text-slate-500 mr-2">VOICE FEEDBACK CHANNEL:</span>
                {[1, 2, 4, 2, 1, 3, 5, 4, 2, 1, 3].map((h, i) => (
                  <span 
                    key={i} 
                    className="w-[2.5px] bg-blue-600 rounded-full transition-all animate-[bounce_0.8s_infinite]" 
                    style={{ 
                      height: `${h * 2.5}px`,
                      animationDelay: `${i * 0.07}s`
                    }} 
                  />
                ))}
              </div>
            )}

            {/* Dialog Scrolling area */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-hide">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={msg.id || idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-slate-100 border-slate-200 text-slate-600' 
                        : 'bg-blue-50 border-blue-100 text-blue-600'
                    }`}>
                      {msg.role === 'user' ? <User size={13} /> : <Sparkles size={11} />}
                    </div>

                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                      {msg.text.split('\n').map((line: string, lineIdx: number) => {
                        const isList = line.trim().startsWith('- ') || line.trim().startsWith('* ');
                        return (
                          <p key={lineIdx} className={`${isList ? 'pl-2 text-blue-605 text-blue-600' : 'text-slate-800'} font-medium`}>
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 items-center bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm">
                    <Loader2 className="animate-spin text-blue-650 text-blue-600" size={13} />
                    <span className="text-[11px] text-slate-500 font-bold">后台大脑检索物料对账关系中...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick preselected shortcuts chips */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
              {[
                "诊断当前 ERP 的五大病灶 🕵️",
                "分析何为一物多码风险规范 📖",
                "推荐快速自愈解决物料缺失 ⚡"
              ].map((txt, index) => (
                <button
                  key={index}
                  onClick={() => handleMobileChatSend(txt.slice(0, -3))}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-bold text-[10px] shrink-0 shadow-sm transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>

            {/* Typing box */}
            <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center relative z-20 shrink-0 shadow-sm">
              <input
                type="text"
                placeholder="在此向 AI 助理提问数据异常..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMobileChatSend()}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium transition-all"
              />
              <button
                onClick={() => handleMobileChatSend()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-100"
              >
                <Send size={14} />
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: SETTINGS (RULES MATRIX CENTER) */}
        {activeTab === 'settings' && (
          <div className="flex-grow overflow-y-auto px-5 py-5 space-y-6 pb-24 scrollbar-hide">
            
            {/* Header branding */}
            <div className="pb-3 border-b border-slate-200">
              <h1 className="text-base font-black text-slate-900">智控规则模型矩阵</h1>
              <p className="text-[10px] text-slate-500">设定完整性、唯一性、准确性和外控文档的闭环阈值</p>
            </div>

            {/* SUBSECTION 1: COMPLETENESS (关键完整性属性校验) */}
            <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-555 bg-emerald-500" />
                  <span className="text-xs font-black text-slate-855 text-slate-800">完整性必填列表 (Completeness)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                  {completenessKeyFields.length} / 12 指定项
                </span>
              </div>

              {/* Group categorization of checkers */}
              <div className="space-y-3.5 pt-1">
                {Object.entries(CATEGORY_FIELD_GROUPS).map(([categoryName, fieldList]) => (
                  <div key={categoryName} className="space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-extrabold tracking-wider">{categoryName} 模块:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {fieldList.map(field => {
                        const isChecked = completenessKeyFields.includes(field);
                        return (
                          <button
                            key={field}
                            onClick={() => {
                              const updated = isChecked 
                                ? completenessKeyFields.filter(f => f !== field)
                                : [...completenessKeyFields, field];
                              onSaveCompletenessFields(updated); // Applied back instantly
                            }}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-left font-bold transition-all ${
                              isChecked 
                                ? 'bg-blue-50 text-blue-600 border-blue-255 border-blue-200 shadow-xs' 
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/60 shadow-xs'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-blue-600 border-blue-650 text-white' : 'border-slate-300'
                            }`}>
                              {isChecked && <Check size={10} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-slate-800 font-mono text-[10px]">{field}</span>
                              <span className="text-[8px] opacity-60 font-semibold truncate text-slate-500">{MARA_FIELD_DESCRIPTIONS[field] || field}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBSECTION 2: UNIQUENESS (一物多码防重主键设置) */}
            <div className="space-y-3.5 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-black text-slate-800">防一件多码强属性组合 (Uniqueness)</span>
                </div>
                <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                  {uniquenessKeyFields.length} 校验主组
                </span>
              </div>

              {/* Render uniqueness items list */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-hide">
                {uniquenessKeyFields.map((group, index) => (
                  <div 
                    key={index}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] font-bold"
                  >
                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                      {group.map((f, componentIdx) => (
                        <React.Fragment key={componentIdx}>
                          <span className="text-[10px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                            {f}
                          </span>
                          {componentIdx < group.length - 1 && <span className="text-slate-400 text-xs">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        const updated = uniquenessKeyFields.filter((_, i) => i !== index);
                        onSaveUniquenessFields(updated);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors shrink-0 hover:bg-rose-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Instant Add and check combo input box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="请输入主键元,如 ZEINR,ZEIVR"
                  value={uniqFieldInput}
                  onChange={(e) => setUniqFieldInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-800"
                />
                <button
                  onClick={() => {
                    const fields = uniqFieldInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                    if (fields.length > 0) {
                      onSaveUniquenessFields([...uniquenessKeyFields, fields]);
                      setUniqFieldInput('');
                    } else {
                      alert('请输入用逗号隔开的字段名称组合。");');
                    }
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shrink-0 shadow shadow-blue-100"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* SUBSECTION 3: ACCURACY THRESHOLDS (范围值偏差) */}
            <div className="space-y-3.5 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-black text-slate-800">值域精确度控制 (Accuracy Core)</span>
                </div>
                <span className="text-[9px] font-mono text-amber-705 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-bold">
                  2 激活校验
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Weight Rule Checker */}
                <div 
                  onClick={() => setAccuracyWeightsGroup(!accuracyWeightsGroup)}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-825 text-slate-800 flex items-center gap-1.5 font-mono text-[11px]">
                      BRGEW &gt; NTGEW
                    </p>
                    <p className="text-[9px] text-slate-500">毛重必须严格大于净重值 (MARA物理字段对仗)</p>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-[2px] transition-colors relative ${
                    accuracyWeightsGroup ? 'bg-blue-600' : 'bg-slate-200'
                  }`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${
                      accuracyWeightsGroup ? 'translate-x-[16px]' : 'translate-x-0'
                    }`} />
                  </div>
                </div>

                {/* Length Code Checker */}
                <div 
                  onClick={() => setAccuracyLengthGroup(!accuracyLengthGroup)}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-825 text-slate-800 flex items-center gap-1.5 font-mono text-[11px]">
                      SIZE RULE PRECISE (长宽高越界)
                    </p>
                    <p className="text-[9px] text-slate-500">长/宽/高 (LAENG/BREIT/HOEHE) 范围校验开启</p>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-[2px] transition-colors relative ${
                    accuracyLengthGroup ? 'bg-blue-600' : 'bg-slate-200'
                  }`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${
                      accuracyLengthGroup ? 'translate-x-[16px]' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>
            </div>

            {/* SUBSECTION 4: COMPLIANCE REGULATIONS (进出口与环保附文对账) */}
            <div className="space-y-3.5 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-black text-slate-800">跨系统环保/海关系数 (Compliance)</span>
                </div>
                <button
                  onClick={handleAuditTrigger}
                  disabled={isAuditingCompliance}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded text-[10px] font-bold shadow flex items-center gap-1 shadow-blue-105-55 shadow-blue-100"
                >
                  {isAuditingCompliance ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                  一键对碰审核
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'c1', title: '海关税则归档对涉 (2026海关税税则对撞)', desc: 'STEUC 申报税则号合法性比对。', severity: 'Fatal (海关阻塞危)' },
                  { id: 'c2', title: 'RoHS 6+10 环保附件失效日期校验', desc: 'SRM 中供应商上传证书对撞。', severity: 'High (环保禁限令)' },
                  { id: 'c3', title: '物料命名拼字法语义对仗模式 (AI Naming)', desc: '确保 MAKTX 满足「品名+规格」标准。', severity: 'Medium (标准化)' },
                  { id: 'c4', title: 'PLM 双关联 Make 主图纸校验', desc: '验证生产项必须含 CAD 文件附件。', severity: 'Warning (工艺缺失)' }
                ].map(rule => {
                  const isActive = complianceToggles[rule.id];
                  return (
                    <div 
                      key={rule.id}
                      onClick={() => toggleComplianceItem(rule.id)}
                      className="p-3 bg-slate-50 border border-slate-200/85 rounded-xl cursor-pointer hover:border-slate-300 transition-colors flex items-center justify-between shadow-xs hover:bg-slate-100/50"
                    >
                      <div className="space-y-1 pr-4 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            rule.severity.includes('Fatal') ? 'bg-rose-50 text-rose-600 border border-rose-100' : rule.severity.includes('High') ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {rule.severity}
                          </span>
                          <span className="text-[10px] font-bold text-slate-800 truncate">{rule.title}</span>
                        </div>
                        <p className="text-[9px] text-slate-500">{rule.desc}</p>
                      </div>

                      <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${
                        isActive ? 'bg-blue-600' : 'bg-slate-255 bg-slate-200'
                      }`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-all ${
                          isActive ? 'translate-x-[16px]' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUBSECTION 5: METRIC WEIGHTS CONFIGURATION (指标加权比重设定 - ALIGNED WITH WEB) */}
            <div className="space-y-3.5 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Sliders size={15} className="text-indigo-650 text-indigo-600" />
                  <span className="text-xs font-black text-slate-800">指标加权比重设定 (Weights Config)</span>
                </div>
                {/* Total sum indicator badge */}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  (Object.values(metricWeights) as number[]).reduce((a: number, b: number) => a + b, 0) === 100 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                }`}>
                  总计: {(Object.values(metricWeights) as number[]).reduce((a: number, b: number) => a + b, 0)}% / 100%
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {Object.entries(metricWeights).map(([name, weight]) => (
                  <div key={name} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-xs">
                    <div className="space-y-0.5 pr-2 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800">{name}</p>
                      <p className="text-[9px] text-slate-500 truncate">{name === '完整性' ? '关键必填物理字段的覆盖率表现' : name === '唯一性' ? '一件多码防重属性防重系数' : name === '准确性' ? '值域精确校验与物理字段对仗' : '外控RoHS、海关税则合规指标'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => {
                          const updatedVal = Math.max(0, (weight as number) - 5);
                          onSaveWeights({ ...metricWeights, [name]: updatedVal });
                        }}
                        className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 active:scale-95 transition-all shadow-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-black font-mono text-slate-800 w-8 text-center">{(weight as number)}%</span>
                      <button
                        onClick={() => {
                          const updatedVal = Math.min(100, (weight as number) + 5);
                          onSaveWeights({ ...metricWeights, [name]: updatedVal });
                        }}
                        className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 active:scale-95 transition-all shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(Object.values(metricWeights) as number[]).reduce((a: number, b: number) => a + b, 0) !== 100 && (
                <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 border border-rose-100 rounded-xl flex items-center gap-1.5 animate-bounce">
                  <Info size={12} />
                  权重和必须等于 100% (当前: {(Object.values(metricWeights) as number[]).reduce((a: number, b: number) => a + b, 0)}%)
                </p>
              )}
            </div>

          </div>
        )}

      </main>

      {/* DETAILED INTERACTIVE MULTI-METRIC DESTRUCTURING BOTTOM SHEET DRAWER */}
      <AnimatePresence>
        {selectedMetricDetail && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMetricDetail(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] cursor-pointer"
            />

            {/* Sliding Mobile Sheet Bottom Box */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white border-t border-slate-205 border-slate-200 rounded-t-[28px] overflow-hidden flex flex-col z-[100] shadow-2xl"
            >
              {/* Calculating overlay inside drawer wrapper */}
              <AnimatePresence>
                {isCalculatingSelectedMetric && (
                  <div className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                    <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="34" className="text-slate-100 stroke-current" strokeWidth="6" fill="none" />
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="34" 
                          className="text-blue-600 stroke-current transition-all duration-150" 
                          strokeWidth="6" 
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - metricProgress / 100)}`}
                          strokeLinecap="round"
                          fill="none" 
                        />
                      </svg>
                      <span className="absolute text-xs font-black font-mono text-slate-800">{metricProgress}%</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900">执行 `{selectedMetricDetail.name}` 物理对仗校验</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                      正在遍历全量 ERP 主数据抽样，重新对仗公式与校验池，刷新统计分布...
                    </p>
                  </div>
                )}
              </AnimatePresence>

              {/* Drag Handle Top Bar */}
              <div className="w-full flex-shrink-0 py-3.5 flex justify-center items-center pointer-events-none">
                <div className="w-12 h-1 bg-slate-300 rounded-full" />
              </div>

              {/* Head profile */}
              <div className="px-5 pb-4 flex justify-between items-start border-b border-slate-200">
                <div className="flex gap-2.5 items-center">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {getMetricIcon(selectedMetricDetail.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{selectedMetricDetail.name}指标诊断分析 Spec</h3>
                    <p className="text-[10px] text-slate-505 text-slate-500">实时分: {selectedMetricDetail.score}% | 重视加权: {metricWeights[selectedMetricDetail.name] || 25}%</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMetricDetail(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Central Details Area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                
                {/* METRIC ACTIONS BUTTON GRID (ALIGNED WITH WEB) */}
                <div className="grid grid-cols-3 gap-2 pb-1">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSelectedMetricDetail(null);
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left flex flex-col justify-between h-[60px] transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Settings size={14} className="text-slate-600 font-bold" />
                    <span className="text-[10px] font-black text-slate-800">去规则配置</span>
                  </button>

                  <button
                    onClick={handleRunSelectedMetricRule}
                    className="p-2.5 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-left flex flex-col justify-between h-[60px] transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Play size={14} className="text-indigo-600 font-bold animate-pulse" fill="currentColor" />
                    <span className="text-[10px] font-black text-indigo-900">运行规则</span>
                  </button>

                  <button
                    onClick={() => setIsTrendChartModalOpen(true)}
                    className="p-2.5 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 rounded-xl text-left flex flex-col justify-between h-[60px] transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <TrendingUp size={14} className="text-blue-600 font-bold" />
                    <span className="text-[10px] font-black text-blue-900">查看趋势图</span>
                  </button>
                </div>

                {/* Scoring standard formulas explanation */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">算法公式与数据源对撞关系</p>
                  <p className="text-xs font-mono text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-100 font-bold">
                    {selectedMetricDetail.name.includes('完整性') 
                      ? 'Score = (1 - (MARA 字段留空记录数 / 抽样物料总记录数)) * 100%' 
                      : selectedMetricDetail.name.includes('唯一性') 
                        ? 'Score = (1 - (存在一物多码描述/编码重复项 / 抽样物料总数)) * 100%' 
                        : 'Score = (1 - (数值异常超限或逻辑不相符记录 / 批处理总数)) * 100%'}
                  </p>
                  <div className="text-[10px] text-slate-500 leading-relaxed space-y-1 pt-1 font-medium">
                    <p>• **主涉物理表**: ERP MARA (物料主数据), MARC (工厂参数表), MBEW (财务价值表)</p>
                    <p>• **刷新机理**: 当规则中勾选项变更，后台数据引擎自动对碰，一秒内刷新全局值。</p>
                  </div>
                </div>

                {/* DATA SOURCES DEFT LINEAGE (ALIGNED WITH WEB) */}
                {selectedMetricDetail.calculationDetails?.dataSources && (
                  <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">数源脉络 Data Lineage (对碰点击查看物理账表)</span>
                    <div className="flex flex-wrap gap-2 pt-1 font-bold">
                      {selectedMetricDetail.calculationDetails.dataSources.map((source: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => onViewRawData(source)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-705 text-slate-700 rounded-lg text-[10px] font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Database size={10} className="text-indigo-500" />
                          <span>{source}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score stats bar details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">合规/补齐记录数</span>
                    <span className="text-sm font-extrabold text-slate-800 font-mono">
                      {selectedMetricDetail.name.includes('完整性') 
                        ? (1000 - issues.filter(i => i.type === 'Missing Field' && i.status !== 'Fixed').length).toLocaleString()
                        : selectedMetricDetail.name.includes('唯一性') 
                          ? (1000 - issues.filter(i => i.type === 'Duplicate' && i.status !== 'Fixed').length).toLocaleString()
                          : selectedMetricDetail.name.includes('准确性')
                            ? (1000 - issues.filter(i => (i.type === 'Value Out of Range' || i.type === 'Mismatch') && i.status !== 'Fixed').length).toLocaleString()
                            : '985'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium ml-1">条行</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">不规范 / 异常记录项</span>
                    <span className="text-sm font-extrabold text-rose-600 font-mono">
                      {selectedMetricDetail.name.includes('完整性') 
                        ? issues.filter(i => i.type === 'Missing Field' && i.status !== 'Fixed').length.toLocaleString()
                        : selectedMetricDetail.name.includes('唯一性') 
                          ? issues.filter(i => i.type === 'Duplicate' && i.status !== 'Fixed').length.toLocaleString()
                          : selectedMetricDetail.name.includes('准确性')
                            ? issues.filter(i => (i.type === 'Value Out of Range' || i.type === 'Mismatch') && i.status !== 'Fixed').length.toLocaleString()
                            : '15'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium ml-1">项次</span>
                  </div>
                </div>

                {/* Simulated list of samples inside active category */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center bg-white">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">异常数据抽样 (Sample Anomalies)</span>
                    {selectedMetricDetail.calculationDetails?.sampleBadRecords && selectedMetricDetail.calculationDetails.sampleBadRecords.length > 0 && (
                      <span className="text-[9px] text-slate-400 font-bold">
                        显示 {(selectedMetricPage - 1) * 3 + 1} - {Math.min(selectedMetricPage * 3, selectedMetricDetail.calculationDetails.sampleBadRecords.length)} 条，共 {selectedMetricDetail.calculationDetails.sampleBadRecords.length} 条
                      </span>
                    )}
                  </div>
                  
                  {(() => {
                    const sampleBadRecords = selectedMetricDetail.calculationDetails?.sampleBadRecords || [];
                    const sampleCols = selectedMetricDetail.calculationDetails?.sampleColumns || [];
                    
                    if (sampleBadRecords.length === 0) {
                      return <p className="text-[10px] text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl">当前指标在已选物理分区中表现合规，无触红异常样本</p>;
                    }

                    const pageSz = 3;
                    const itemsToRender = sampleBadRecords.slice((selectedMetricPage - 1) * pageSz, selectedMetricPage * pageSz);

                    return (
                      <div className="space-y-2.5">
                        {itemsToRender.map((record: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                            <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                              <span className="text-[9.5px] font-mono font-bold text-slate-500">样品 #{(selectedMetricPage - 1) * pageSz + idx + 1}</span>
                              <span className="text-[10px] font-mono font-black text-blue-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                                MATNR: {record.MATNR || '未知'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-0.5">
                              {sampleColumnsMapped(sampleCols, record)}
                            </div>
                          </div>
                        ))}

                        {/* Pagination controller alignment */}
                        {sampleBadRecords.length > pageSz && (
                          <div className="flex justify-between items-center pt-1.5">
                            <button
                              disabled={selectedMetricPage === 1}
                              onClick={() => setSelectedMetricPage(prev => Math.max(1, prev - 1))}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold shadow-2xs hover:bg-slate-50 disabled:opacity-30 flex items-center select-none active:scale-95 transition-all cursor-pointer"
                            >
                              上一页
                            </button>
                            <span className="text-[10px] font-mono font-black text-slate-500">
                              页码 {selectedMetricPage} / {Math.ceil(sampleBadRecords.length / pageSz)}
                            </span>
                            <button
                              disabled={selectedMetricPage >= Math.ceil(sampleBadRecords.length / pageSz)}
                              onClick={() => setSelectedMetricPage(prev => Math.min(Math.ceil(sampleBadRecords.length / pageSz), prev + 1))}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold shadow-2xs hover:bg-slate-50 disabled:opacity-30 flex items-center select-none active:scale-95 transition-all cursor-pointer"
                            >
                              下一页
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TrendChartModal 
        isOpen={selectedMetricDetail ? isTrendChartModalOpen : false}
        onClose={() => setIsTrendChartModalOpen(false)}
        metricName={selectedMetricDetail?.name || ''}
        currentScore={selectedMetricDetail?.score || 0}
      />

      {/* DETAILED INTERACTIVE ISSUE INVESTIGATIONAL BOTTOM SHEET DRAWER */}
      <AnimatePresence>
        {viewingIssueDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingIssueDetails(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[92] cursor-pointer"
            />

            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white border-t border-slate-200 rounded-t-[28px] overflow-hidden flex flex-col z-[100] shadow-2xl"
            >
              {/* Drag Handle Top Bar */}
              <div className="w-full flex-shrink-0 py-3.5 flex justify-center items-center pointer-events-none">
                <div className="w-12 h-1 bg-slate-200 rounded-full" />
              </div>

              {/* Head Profile */}
              <div className="px-5 pb-4 flex justify-between items-start border-b border-slate-200">
                <div className="flex gap-2.5 items-center">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 text-amber-500 shadow-sm">
                    <AlertTriangle size={18} fill="orange" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">质量问题深度会诊分析 Probe</h3>
                    <p className="text-[10px] text-slate-500">字段位置: {viewingIssueDetails.table} ➔ {viewingIssueDetails.field}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingIssueDetails(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form Content Scrolling Area */}
              <div className="flex-grow overflow-y-auto px-5 py-4 space-y-4">
                
                {/* 1. Brief Metadata and notes details */}
                <div className="space-y-2.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">诊断详情 Diagnostic Description</span>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        viewingIssueDetails.severity === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        缺陷级别: {viewingIssueDetails.severity}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 font-mono">
                        分类标签: {viewingIssueDetails.type}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-3 font-mono">
                      表物理位置: {viewingIssueDetails.table} (物料规范表组) ➔ 列: {viewingIssueDetails.field} ({MARA_FIELD_DESCRIPTIONS[viewingIssueDetails.field] || '属性字源'})
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2 font-medium">
                      {viewingIssueDetails.notes || viewingIssueDetails.description || '当前检测到该行数据内容在业务大闭环上产生缺失或格式超重，影响下游生产加工环节的参数解析。'}
                    </p>
                  </div>
                </div>

                {/* 2. Business Impact and downstream risks */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">业务潜在危害及传导链路 Risk Passway</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed space-y-2 shadow-xs">
                    <div className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <p>• **MRP 运算异常**: 若关键字段缺失(物料类型或基本单位)，工厂运行物料资源计划(MRP)计算时会抛出空值异常导致汇总统计中断。</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <p>• **制造库存黑洞**: 一物多码、同一物理物料对应多个系统编号，这直接导致仓库盘点、进出库及采购库存冗余，增加存储和周转盲点。</p>
                    </div>
                  </div>
                </div>

                {/* 3. Action and suggestion */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">系统预置极速修补建议 Treatment</span>
                  <p className="text-xs text-slate-500 leading-relaxed pl-1 font-medium">
                    系统根据 AI 对碰大模型及规则字典，已预先准备好对应属性的最佳修补字，您可以一键确认完成自动修改，也可在此提交人工复核流程。
                  </p>
                </div>

                {/* 4. Large Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-200 flex-shrink-0">
                  <button
                    onClick={() => setViewingIssueDetails(null)}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    暂不处理
                  </button>
                  <button
                    onClick={() => executeMobileRepair(viewingIssueDetails)}
                    className="py-3 bg-blue-600 hover:bg-emerald-600 text-white rounded-xl text-xs font-black tracking-wide shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-blue-100"
                  >
                    <Wand2 size={13} className="animate-pulse" />
                    一键智能自愈
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}

        {/* FULL ALL-ISSUES LIST SLIDE-UP BOTTOM SHEET */}
        {isAllIssuesOpen && (
          <>
            {/* Dark translucent backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAllIssuesOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 pointer-events-auto"
            />

            {/* Slide-up Container Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 top-[8%] bg-white rounded-t-[32px] shadow-2xl z-50 flex flex-col pointer-events-auto overflow-hidden border-t border-slate-200"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />

              {/* Header section with branding, close trigger and CSV download action */}
              <div className="px-5 pb-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <ClipboardList size={18} className="text-blue-600" />
                    全量数据异常清单 ({issues.length})
                  </h2>
                  <p className="text-[10px] text-slate-500">同步 SAP MARA / MARC 实况扫描明细数据</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                        // 1. Define CSV Headers
                        const headers = ['ID', '严重程度', '表名', '字段', '问题描述', '影响范围', '类型', 'AI建议', '状态'];
                        
                        // 2. Map data to rows
                        const rows = issues.map(issue => [
                          issue.id,
                          issue.severity,
                          issue.table,
                          issue.field,
                          `"${issue.description.replace(/"/g, '""')}"`, // Escape quotes
                          issue.impact,
                          issue.type,
                          `"${issue.suggestion.replace(/"/g, '""')}"`,
                          issue.status
                        ]);

                        // 3. Combine to CSV string (add BOM \uFEFF for Excel UTF-8 compatibility)
                        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

                        // 4. Create blob and trigger download
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `SAP_Data_Health_Report_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="p-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all active:scale-95"
                    title="导出 CSV"
                  >
                    <RefreshCw size={11} className="text-slate-500" />
                    <span>导出 CSV</span>
                  </button>
                  <button 
                    onClick={() => setIsAllIssuesOpen(false)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all active:scale-95 flex items-center justify-center shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Scrollable list content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-12 bg-slate-50/50">
                
                {/* Visual statistics badge row */}
                <div className="grid grid-cols-3 gap-2.5 shrink-0">
                  <div className="bg-rose-50 border border-rose-100/60 p-2.5 rounded-2xl flex flex-col justify-between">
                    <span className="text-[9px] text-rose-500 font-extrabold pb-0.5">高优先级 (High)</span>
                    <span className="text-lg font-black text-rose-600 font-mono leading-none">{issues.filter(i => i.severity === 'High' && i.status !== 'Fixed').length}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100/60 p-2.5 rounded-2xl flex flex-col justify-between">
                    <span className="text-[9px] text-amber-500 font-extrabold pb-0.5">中等优先级 (Med)</span>
                    <span className="text-lg font-black text-amber-600 font-mono leading-none">{issues.filter(i => i.severity === 'Medium' && i.status !== 'Fixed').length}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100/30 p-2.5 rounded-2xl flex flex-col justify-between">
                    <span className="text-[9px] text-emerald-500 font-extrabold pb-0.5">已结治理 (Fixed)</span>
                    <span className="text-lg font-black text-emerald-600 font-mono leading-none">{issues.filter(i => i.status === 'Fixed').length}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">数据质量异常全景图谱</span>
                  {issues.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        if (item.status !== 'Fixed') {
                          setViewingIssueDetails(item);
                        }
                      }}
                      className={`p-3.5 bg-white rounded-2xl border ${
                        item.status === 'Fixed' ? 'border-emerald-100 opacity-80 bg-emerald-50/10' : 'border-slate-200/80 hover:border-slate-300/80'
                      } transition-all shadow-sm flex gap-3 cursor-pointer relative overflow-hidden`}
                    >
                      {/* Left stroke severity or fixed status */}
                      <div className={`w-1 rounded-full shrink-0 self-stretch my-0.5 ${
                        item.status === 'Fixed' 
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                          : item.severity === 'High' 
                            ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                            : item.severity === 'Medium' 
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]' 
                              : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                      }`} />

                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded leading-none border border-blue-100">
                                {item.table}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                字段: {item.field}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-850 mt-1 shrink-0">
                              {MARA_FIELD_DESCRIPTIONS[item.field] || item.field} - {item.type}
                            </h4>
                          </div>

                          {/* Action badges or action triggers */}
                          {item.status === 'Fixed' ? (
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded text-[9px] font-extrabold flex items-center gap-0.5 shrink-0">
                              <CheckCircle2 size={10} />
                              已修复
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                executeMobileRepair(item);
                              }}
                              className="p-2 bg-blue-600 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
                            >
                              <Wand2 size={11} className="animate-pulse" />
                            </button>
                          )}
                        </div>

                        <p className="text-[10.5px] text-slate-550 leading-relaxed font-semibold">
                          {item.notes || item.description || '发现数据缺失、重复冗余 or 不符合行业合规规范异常。'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <RepairDetailsModal
        isOpen={!!mobileRepairConfig}
        onClose={() => setMobileRepairConfig(null)}
        config={mobileRepairConfig}
      />

      {/* FOOTER NAVIGATION GRID CONTROLS FOR MOBILE NATIVE APP EXPERIENCE */}
      <footer className="bg-white border-t border-slate-200 h-[68px] shrink-0 flex items-center justify-around px-1 relative z-40 pb-2 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        
        {/* BUTTON 1: HOME PANEL */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all grow ${
            activeTab === 'home' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity size={18} className={activeTab === 'home' ? 'text-blue-600' : 'text-slate-405 text-slate-400'} />
          <span className="text-[9px] tracking-wide font-black uppercase mt-0.5">健康体检</span>
        </button>

        {/* BUTTON 2: DISCOVERY ISSUES POOL */}
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all relative grow ${
            activeTab === 'issues' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle size={18} className={activeTab === 'issues' ? 'text-blue-600' : 'text-slate-405 text-slate-400'} />
          <span className="text-[9px] tracking-wide font-black uppercase mt-0.5">异常治理</span>
          {activeIssues.length > 0 && (
            <span className="absolute top-1 right-[24%] bg-rose-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full border border-white shadow">
              {activeIssues.length}
            </span>
          )}
        </button>

        {/* BUTTON 3: BOT */}
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all relative grow ${
            activeTab === 'ai' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare size={18} className={activeTab === 'ai' ? 'text-blue-600' : 'text-slate-405 text-slate-400'} />
          <span className="text-[9px] tracking-wide font-black uppercase mt-0.5">AI 助手</span>
          <span className="absolute top-1.5 right-[24%] flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
        </button>

        {/* BUTTON 4: CONFIG REGULATORS */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all grow ${
            activeTab === 'settings' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders size={18} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-405 text-slate-400'} />
          <span className="text-[9px] tracking-wide font-black uppercase mt-0.5">智控校验</span>
        </button>

      </footer>

    </div>
  );
};
