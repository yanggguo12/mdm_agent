import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Activity, CheckSquare, Square, Trash2, Link as LinkIcon, Plus, 
  Layout, MessageSquare, Send, Bot, User, Sparkles, Loader2, Play, 
  RotateCcw, ShieldCheck, Scale, AlertTriangle, ChevronRight, ChevronLeft, 
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
  const [activeTab, setActiveTab] = useState<'home' | 'issues' | 'ai' | 'settings' | 'profile'>('home');
  const [currentTime, setCurrentTime] = useState('');
  
  // Partition dropdown states
  const [isPartitionDropdownOpen, setIsPartitionDropdownOpen] = useState(false);
  const partitionDropdownRef = useRef<HTMLDivElement>(null);

  // Close partition dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (partitionDropdownRef.current && !partitionDropdownRef.current.contains(event.target as Node)) {
        setIsPartitionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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

  // Active sub-tab state for Issues menu to provide smooth integrated UX
  const [issuesSubTab, setIssuesSubTab] = useState<'diagnosis' | 'policies'>('diagnosis');

  // Active sub-tab state for Settings (rules config) to provide smooth tab preview and avoid lengthy lists
  const [settingsSubTab, setSettingsSubTab] = useState<'completeness' | 'uniqueness' | 'accuracy' | 'compliance' | 'weights'>('completeness');

  // Active sub-view state for home tab to support drill down and back navigation
  const [homeSubView, setHomeSubView] = useState<'main' | 'diagnosis' | 'policies'>('main');

  // Accuracy customized visual thresholds states
  const [accuracyWeightsGroup, setAccuracyWeightsGroup] = useState(true); // "毛重必须大于自定净重" rule
  const [accuracyLengthGroup, setAccuracyLengthGroup] = useState(true);  // "物料编码符合特定规范长度" rule
  const [accuracyOutlierToggle, setAccuracyOutlierToggle] = useState(true);

  // Compliance customized visual toggles
  const [complianceToggles, setComplianceToggles] = useState<Record<string, boolean>>({
    'c1': true, // Customs Tariff Validity
    'c2': true, // RoHS hazardous substances
    'c3': true, // Naming Rule (MAKTX parse check)
    'c4': true  // PLM Drawing association Check
  });
  const [isAuditingCompliance, setIsAuditingCompliance] = useState(false);
  const [complianceAuditResult, setComplianceAuditResult] = useState<{ score: number } | null>(null);

  // Uniqueness rule building local state
  const [isBuildingGroup, setIsBuildingGroup] = useState<string[]>([]);

  // Simulation states
  const [isSimulatingAccuracy, setIsSimulatingAccuracy] = useState(false);
  const [accuracySimResult, setAccuracySimResult] = useState<{ score: number, reduced: number } | null>(null);

  const handleSimulateAccuracy = () => {
    setIsSimulatingAccuracy(true);
    setTimeout(() => {
      setIsSimulatingAccuracy(false);
      setAccuracySimResult({
        score: Math.floor(Math.random() * 5) + 92,
        reduced: Math.floor(Math.random() * 8) + 3
      });
    }, 1200);
  };

  const handleRunComplianceAudit = () => {
    setIsAuditingCompliance(true);
    setTimeout(() => {
      setIsAuditingCompliance(false);
      setComplianceAuditResult({
        score: Math.floor(Math.random() * 5) + 94
      });
    }, 1200);
  };

  // States for metric detail action calculations
  const [isCalculatingSelectedMetric, setIsCalculatingSelectedMetric] = useState(false);
  const [metricProgress, setMetricProgress] = useState(0);
  const [selectedMetricPage, setSelectedMetricPage] = useState(1);
  const [isTrendChartModalOpen, setIsTrendChartModalOpen] = useState(false);

  // Trigger state for micro repair alerts
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [healedIssueName, setHealedIssueName] = useState('');

  // Selected setting partition for settings 5-zone view
  const [selectedSettingPartition, setSelectedSettingPartition] = useState<string | null>(null);

  // Secondary sub-tab states for non-MARA partitions to allow fully interactive demo
  const [marcCompletenessFields, setMarcCompletenessFields] = useState<string[]>(['WERKS', 'DISPO']);
  const [mbewCompletenessFields, setMbewCompletenessFields] = useState<string[]>(['BWKEY', 'BKLAS', 'VPRSV']);
  const [bomCompletenessFields, setBomCompletenessFields] = useState<string[]>(['STLNR', 'IDNRK', 'MENGE']);
  const [wcCompletenessFields, setWcCompletenessFields] = useState<string[]>(['ARBPL', 'KOKRS', 'VERWE']);

  // Extra toggle state features for non-MARA custom rules
  const [marcCustomToggles, setMarcCustomToggles] = useState<Record<string, boolean>>({
    werksUniqueness: true,
    dispoFormat: true,
    beskzLimit: true
  });
  const [mbewCustomToggles, setMbewCustomToggles] = useState<Record<string, boolean>>({
    bwkeyUniqueness: true,
    bklasLimit: true,
    vprsvLimit: true
  });
  const [bomCustomToggles, setBomCustomToggles] = useState<Record<string, boolean>>({
    bomUniqueness: true,
    mengePositive: true,
    lossFactor: true
  });
  const [wcCustomToggles, setWcCustomToggles] = useState<Record<string, boolean>>({
    wcUniqueness: true,
    begztEndzt: true,
    calendarCheck: true
  });

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

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col overflow-hidden relative select-none font-sans">
      
      {/* Background radial gradients matching web desktop style */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/20 rounded-full blur-[140px] pointer-events-none" />

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
          <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-slate-50/50 h-full w-full">
            {viewingIssueDetails ? (
              /* SECOND LEVEL VIEW: QUALITY ISSUE DETAILS PROBE */
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-slate-50/50 h-full w-full relative">
                {/* Secondary Page Navigation Header - Native Mobile Style */}
                <div className="h-12 border-b border-slate-200/60 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                  <button
                    onClick={() => setViewingIssueDetails(null)}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-95 transition-all cursor-pointer"
                    title="返回"
                  >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center whitespace-nowrap">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">质量缺陷深度诊断会诊</h2>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Form Content Scrolling Area */}
                <div className="flex-grow overflow-y-auto px-5 py-5 space-y-4 pb-6 scrollbar-hide bg-slate-50/30">
                  
                  {/* Brief Profile Banner */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5 shadow-3xs">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 text-amber-500 shrink-0">
                      <AlertTriangle size={20} fill="orange" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-slate-900 leading-tight">缺陷靶标探测 Probe</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">字段位置: {viewingIssueDetails.table} ➔ {viewingIssueDetails.field}</p>
                    </div>
                  </div>

                  {/* 1. Brief Metadata and notes details */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">诊断详情 Diagnostic Description</span>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-3xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          viewingIssueDetails.severity === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          错误级别: {viewingIssueDetails.severity}
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 font-mono">
                          缺陷类型: {viewingIssueDetails.type}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-3 font-mono">
                        物理表定位: {viewingIssueDetails.table} 表 ➔ 列: {viewingIssueDetails.field} ({MARA_FIELD_DESCRIPTIONS[viewingIssueDetails.field] || '属性定义'})
                      </h4>
                      <p className="text-xs text-slate-650 leading-relaxed mt-2 font-medium">
                        {viewingIssueDetails.notes || viewingIssueDetails.description || '当前检测到该行数据内容在业务大闭环上产生缺失或格式超重，影响下游生产加工环节的参数解析。'}
                      </p>
                    </div>
                  </div>

                  {/* 2. Business Impact and downstream risks */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">业务潜在危害及传导链路 Risk Passway</span>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-650 leading-relaxed space-y-2 shadow-3xs">
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
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">预置自愈智能建议 Solution</span>
                    <p className="text-xs text-slate-500 leading-relaxed pl-1 font-semibold">
                      系统利用 AI 与预置数据字典规则，已经配置好属性最优自愈文本。您可以一键运行自愈指令，或者进行数据还原。
                    </p>
                  </div>

                  {/* 4. Action buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      onClick={() => setViewingIssueDetails(null)}
                      className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer"
                    >
                      暂不处理
                    </button>
                    <button
                      onClick={() => {
                        executeMobileRepair(viewingIssueDetails);
                        setViewingIssueDetails(null);
                      }}
                      className="py-3 bg-blue-600 hover:bg-emerald-600 text-white rounded-xl text-xs font-black tracking-wide shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-blue-100 cursor-pointer"
                    >
                      <Wand2 size={13} className="animate-pulse" />
                      一键智能自愈
                    </button>
                  </div>

                </div>
              </div>
            ) : isAllIssuesOpen ? (
              /* SECOND LEVEL VIEW: TOTAL ANOMALY TRACKER (FULL LIST) */
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-slate-50/50 h-full w-full relative">
                {/* Secondary Page Navigation Header - Native Mobile Style */}
                <div className="h-12 border-b border-slate-200/60 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                  <button
                    onClick={() => setIsAllIssuesOpen(false)}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-95 transition-all cursor-pointer"
                    title="返回主页"
                  >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center whitespace-nowrap">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">物理数据质量异常全景</h2>
                  </div>
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
                    className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                    title="导出 CSV 数据"
                  >
                    <RefreshCw size={11} className="text-slate-500" />
                    <span>导出 CSV</span>
                  </button>
                </div>

                {/* List content area */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-24 scrollbar-hide bg-slate-50/10">
                  
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
                    <div className="bg-emerald-50 border border-emerald-100/35 p-2.5 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] text-emerald-500 font-extrabold pb-0.5">已结自愈 (Fixed)</span>
                      <span className="text-lg font-black text-emerald-600 font-mono leading-none">{issues.filter(i => i.status === 'Fixed').length}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">质量异常实况数据对碰库 ({issues.length}条扫描)</span>
                    {issues.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          if (item.status !== 'Fixed') {
                            setViewingIssueDetails(item);
                          }
                        }}
                        className={`p-3.5 bg-white rounded-2xl border ${
                          item.status === 'Fixed' ? 'border-emerald-100 opacity-80 bg-emerald-50/10' : 'border-slate-200/80 hover:border-slate-350 hover:shadow-xs'
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
                                已自愈
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  executeMobileRepair(item);
                                }}
                                className="p-2 bg-blue-600 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                              >
                                <Wand2 size={11} className="animate-pulse" />
                              </button>
                            )}
                          </div>

                          <p className="text-[10.5px] text-slate-550 leading-relaxed font-semibold">
                            {item.notes || item.description || '发现数据缺陷或参数校验异常。'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            ) : selectedMetricDetail ? (
              /* SECOND LEVEL VIEW: METRIC DETAIL SPEC SHEET */
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-slate-50/50 h-full w-full relative">
                {/* Secondary Page Navigation Header - Native Mobile Style */}
                <div className="h-12 border-b border-slate-200/60 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                  <button
                    onClick={() => setSelectedMetricDetail(null)}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-95 transition-all cursor-pointer"
                    title="返回主页"
                  >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center whitespace-nowrap">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">{selectedMetricDetail.name}指标诊断 Spec</h2>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Calculating overlay inside Level 2 container */}
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

                {/* Scrollable details container */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-24 scrollbar-hide">
                  
                  {/* METRIC CARD BRIEF SUMMARY */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5 shadow-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                      {getMetricIcon(selectedMetricDetail.name)}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-slate-900 leading-tight">实时得分: {selectedMetricDetail.score}%</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">
                        在已选物理数据分区（MARA等表组）中，整体健康率计算为 {selectedMetricDetail.score}%。
                      </p>
                    </div>
                  </div>

                  {/* METRIC ACTIONS BUTTON GRID (ALIGNED WITH WEB) */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setSelectedMetricDetail(null);
                      }}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-left flex flex-col justify-between h-[60px] transition-all active:scale-95 shadow-3xs cursor-pointer"
                    >
                      <Settings size={14} className="text-slate-600 font-bold" />
                      <span className="text-[10px] font-black text-slate-800">去规则配置</span>
                    </button>

                    <button
                      onClick={handleRunSelectedMetricRule}
                      className="p-2.5 bg-indigo-50/70 hover:bg-indigo-55 border border-indigo-100 rounded-xl text-left flex flex-col justify-between h-[60px] transition-all active:scale-95 shadow-3xs cursor-pointer"
                    >
                      <Play size={14} className="text-indigo-600 font-bold" fill="currentColor" />
                      <span className="text-[10px] font-black text-indigo-900">运行规则</span>
                    </button>

                    <button
                      onClick={() => setIsTrendChartModalOpen(true)}
                      className="p-2.5 bg-blue-50/70 hover:bg-blue-55 border border-blue-100 rounded-xl text-left flex flex-col justify-between h-[60px] transition-all active:scale-95 shadow-3xs cursor-pointer"
                    >
                      <TrendingUp size={14} className="text-blue-600 font-bold" />
                      <span className="text-[10px] font-black text-blue-900">查看趋势图</span>
                    </button>
                  </div>

                  {/* Scoring standard formulas explanation */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">算法公式与数据源对撞关系</p>
                    <p className="text-xs font-mono text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-100 font-bold">
                      {selectedMetricDetail.name.includes('完整性') 
                        ? 'Score = (1 - (MARA 字段留空记录数 / 抽样物料总记录数)) * 100%' 
                        : selectedMetricDetail.name.includes('唯一性') 
                          ? 'Score = (1 - (存在一物多码描述/编码重复项 / 抽样物料总数)) * 100%' 
                          : 'Score = (1 - (数值异常超限或逻辑不相符记录 / 批处理总数)) * 100%'}
                    </p>
                    <div className="text-[10px] text-slate-500 leading-relaxed space-y-1 pt-1 font-semibold">
                      <p>• **主涉物理表**: ERP MARA, MARC, MBEW 主表组</p>
                      <p>• **刷新机理**: 当规则中勾选项变更，后台数据对碰一秒内刷新全局分数。</p>
                    </div>
                  </div>

                  {/* DATA SOURCES DEFT LINEAGE (ALIGNED WITH WEB) */}
                  {selectedMetricDetail.calculationDetails?.dataSources && (
                    <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">数源脉络 Data Lineage (对碰点击查看物理账表)</span>
                      <div className="flex flex-wrap gap-2 pt-1 font-bold">
                        {selectedMetricDetail.calculationDetails.dataSources.map((source: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => onViewRawData(source)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 rounded-lg text-[10px] font-bold shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer"
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
                      <span className="text-[9px] text-slate-505 text-slate-500 font-medium ml-1">项次</span>
                    </div>
                  </div>

                  {/* Simulated list of samples inside active category */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center bg-transparent px-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">异常数据抽样 (Sample Anomalies)</span>
                      {selectedMetricDetail.calculationDetails?.sampleBadRecords && selectedMetricDetail.calculationDetails.sampleBadRecords.length > 0 && (
                        <span className="text-[9px] text-slate-500 font-bold">
                          显示 {(selectedMetricPage - 1) * 3 + 1} - {Math.min(selectedMetricPage * 3, selectedMetricDetail.calculationDetails.sampleBadRecords.length)} 条，共 {selectedMetricDetail.calculationDetails.sampleBadRecords.length} 条
                        </span>
                      )}
                    </div>
                    
                    {(() => {
                      const sampleBadRecords = selectedMetricDetail.calculationDetails?.sampleBadRecords || [];
                      const sampleCols = selectedMetricDetail.calculationDetails?.sampleColumns || [];
                      
                      if (sampleBadRecords.length === 0) {
                        return <p className="text-[10px] text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl bg-white/50">当前指标在已选物理分区中表现合规，无触红异常样本</p>;
                      }

                      const pageSz = 3;
                      const itemsToRender = sampleBadRecords.slice((selectedMetricPage - 1) * pageSz, selectedMetricPage * pageSz);

                      return (
                        <div className="space-y-2.5">
                          {itemsToRender.map((record: any, idx: number) => (
                            <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                              <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                                <span className="text-[9.5px] font-mono font-bold text-slate-450">样品 #{(selectedMetricPage - 1) * pageSz + idx + 1}</span>
                                <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50/50 border border-blue-100/50 px-1.5 py-0.5 rounded-lg shadow-3xs">
                                  MATNR: {record.MATNR || '未知'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 py-0.5">
                                {sampleColumnsMapped(sampleCols, record)}
                              </div>
                            </div>
                          ))}

                          {/* Pagination controller alignment */}
                          {sampleBadRecords.length > pageSz && (
                            <div className="flex justify-between items-center pt-1.5 px-0.5">
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
                                className="px-2.5 py-1.5 bg-white border border-slate-205 border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold shadow-2xs hover:bg-slate-50 disabled:opacity-30 flex items-center select-none active:scale-95 transition-all cursor-pointer"
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
              </div>
            ) : homeSubView === 'main' ? (
              <div className="flex-grow overflow-y-auto px-5 py-5 space-y-6 pb-6 scrollbar-hide">
            
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

              {/* FIRST STEP: BUSINESS PARTITION MULTI-SELECT FILTER DROPDOWN */}
              <div ref={partitionDropdownRef} className="relative space-y-1.5 z-30">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                    <Layers size={10} className="text-indigo-500 animate-pulse" />
                    <span>体检数据分区</span>
                  </span>
                  {selectedCategories.length > 0 && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        ['基础数据MARA', '工厂数据MARC', '财务数据MBEW', 'BOM', '工作中心'].forEach(cat => {
                          if (selectedCategories.includes(cat)) {
                            onToggleCategory(cat.includes('数据') ? '物料主数据' : '生产主数据', cat);
                          }
                        });
                      }}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-650 transition-all cursor-pointer active:scale-95"
                    >
                      清空全部
                    </button>
                  )}
                </div>

                {/* Trigger select box */}
                <button
                  type="button"
                  id="partition_multi_select_dropdown_trigger"
                  onClick={() => setIsPartitionDropdownOpen(!isPartitionDropdownOpen)}
                  className={`w-full p-3.5 bg-white border ${
                    isPartitionDropdownOpen 
                      ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md' 
                      : 'border-slate-200/85 hover:border-slate-350 shadow-xs'
                  } rounded-2xl flex items-center justify-between transition-all duration-200 text-left cursor-pointer`}
                >
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                    {selectedCategories.length === 0 ? (
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                        <ListFilter size={13} className="text-slate-400" />
                        请点击选择物理分区进行扫描与自愈...
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 overflow-hidden">
                        {selectedCategories.map(cat => {
                          const simpleName = cat.replace('数据', '');
                          return (
                            <span 
                              key={cat} 
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-black tracking-wide shrink-0 transition-all shadow-xs"
                            >
                              <Database size={8} className="text-blue-500" />
                              {simpleName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <ChevronDown 
                    size={15} 
                    className={`text-slate-400 shrink-0 ml-2 transition-transform duration-300 ${isPartitionDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} 
                  />
                </button>

                {/* Collapsible Options Container */}
                <AnimatePresence>
                  {isPartitionDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 flex flex-col pt-1 pb-1"
                    >
                      {/* Top Action header line inside dropdown */}
                      <div className="px-3.5 py-1.5 bg-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>当前已选 {selectedCategories.length} / 5 项</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ['基础数据MARA', '工厂数据MARC', '财务数据MBEW', 'BOM', '工作中心'].forEach(cat => {
                                if (!selectedCategories.includes(cat)) {
                                  onToggleCategory(cat.includes('数据') ? '物料主数据' : '生产主数据', cat);
                                }
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700 active:scale-95 transition-all text-[9px] font-bold cursor-pointer"
                          >
                            全选
                          </button>
                        </div>
                      </div>

                      {/* List options inside dropdown panel */}
                      <div className="max-h-60 overflow-y-auto px-1 py-1 space-y-0.5">
                        {[
                          { key: '基础数据MARA', label: '基础数据 (MARA)', desc: '物料编号、名称、单位等核心物理属性' },
                          { key: '工厂数据MARC', label: '工厂数据 (MARC)', desc: '工厂视图中的采购、质检控制主要参数' },
                          { key: '财务数据MBEW', label: '财务数据 (MBEW)', desc: '评估类、价格控制模式等财务核算属性' },
                          { key: 'BOM', label: 'BOM (物料清单)', desc: '物料及配方清单关联依赖与装配阶层' },
                          { key: '工作中心', label: '工作中心 (Work Center)', desc: '排产能力、工艺计算及直接生产单元' }
                        ].map(item => {
                          const isSelected = selectedCategories.includes(item.key);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => onToggleCategory(item.key.includes('数据') ? '物料主数据' : '生产主数据', item.key)}
                              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
                                isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex flex-col pr-3">
                                <span className={`text-[11px] font-black tracking-wide ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                                  {item.label}
                                </span>
                                <span className="text-[9px] text-slate-400 mt-0.5 font-medium leading-normal">
                                  {item.desc}
                                </span>
                              </div>
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs animate-scale-up' 
                                  : 'border-slate-200 text-transparent bg-white'
                              }`}>
                                <Check size={11} className="stroke-[3]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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



            {/* METRICS INTERACTIVE LIST & DRILL DOWNS */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">四大质量指标表现</span>
              
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
                        <div className="p-1.5 bg-white/95 border border-slate-100 rounded-xl shadow-xs">
                          {getMetricIcon(metric.name)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-700 font-extrabold truncate">{metric.name}</div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xl font-extrabold font-mono text-slate-900">{metric.score}</span>
                          <span className="text-[10px] text-slate-550 text-slate-400 font-semibold">分</span>
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

            {/* TWO NAVIGATION CARD ENTRANCES ACCORDING TO USER'S MOBILE COMPLAINT */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">核心治理中心 (极速诊断与策略自愈)</span>
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Diagnostic Entrance Card */}
                <button
                  id="mobile_diagnosis_entry_card"
                  onClick={() => setHomeSubView('diagnosis')}
                  className="p-4 bg-white border border-slate-200/80 hover:border-rose-300 rounded-3xl flex flex-col justify-between text-left space-y-4 shadow-sm relative overflow-hidden cursor-pointer active:scale-95 transition-all group"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-center w-full">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shadow-xs">
                      <AlertTriangle size={15} className="animate-pulse" />
                    </div>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-black leading-none shrink-0 scale-95 font-mono font-bold">
                      {activeIssues.length} 异常
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      <span>关键问题诊断</span>
                      <ChevronRight size={11} className="stroke-[2.5]" />
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">查阅并诊断不合规字段问题清单</p>
                  </div>
                </button>

                {/* Auto-repair Entrance Card */}
                <button
                  id="mobile_policies_entry_card"
                  onClick={() => setHomeSubView('policies')}
                  className="p-4 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-3xl flex flex-col justify-between text-left space-y-4 shadow-sm relative overflow-hidden cursor-pointer active:scale-95 transition-all group"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-center w-full">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                      <Shield size={14} />
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-black leading-none shrink-0 scale-95 font-mono font-bold">
                      84% 自愈
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      <span>自动修复策略</span>
                      <ChevronRight size={11} className="stroke-[2.5]" />
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">查阅并配置规则对仗自愈机制</p>
                  </div>
                </button>

              </div>
            </div>
          </div>
        ) : homeSubView === 'diagnosis' ? (
              /* SECOND LEVEL VIEW: PROBLEM DIAGNOSIS */
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-slate-50/50 h-full w-full">
                {/* Secondary Page Navigation Header - Native Mobile Style */}
                <div className="h-12 border-b border-slate-205 border-slate-200/60 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                  <button
                    onClick={() => setHomeSubView('main')}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-90 transition-all cursor-pointer"
                    title="返回主页"
                  >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">关键问题诊断</h2>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Diagnostics List Content */}
                <div className="flex-grow overflow-y-auto px-5 py-4 pb-6 scrollbar-hide space-y-4">
                  {/* Banner at the top of body */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-xs relative overflow-hidden shrink-0">
                    <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-15 pointer-events-none">
                      <Activity size={90} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-wide">
                        {activeIssues.length} 项主数据异常
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold mt-1.5">主数据重规则校验的实勘清单</h3>
                    <p className="text-[10px] text-indigo-100 mt-1 font-medium">包含留空、超限或不合规格式的主物理表组漏洞反馈</p>
                  </div>

                  <div className="space-y-4">
                    <div id="problem_diagnosis_scroller_card" className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] p-5 flex flex-col space-y-4">
                      
                      {/* Section Issue items */}
                      <div className="space-y-3">
                        {activeIssues.length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">全部对齐合规</p>
                              <p className="text-[9.5px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">物料主数据校验已100%匹配您所设定的智控规则</p>
                            </div>
                          </div>
                        ) : (
                          activeIssues.map((item) => (
                            <div 
                              key={item.id} 
                              onClick={() => setViewingIssueDetails(item)}
                              className="group p-4 bg-slate-50/40 hover:bg-white rounded-2xl border border-slate-200/60 hover:border-blue-200/80 transition-all duration-200 shadow-xs hover:shadow-[0_8px_20px_rgba(59,130,246,0.03)] flex gap-3.5 cursor-pointer active:scale-[0.99] relative overflow-hidden"
                            >
                              {/* Severity indicator */}
                              <div className={`w-1 rounded-full shrink-0 self-stretch my-0.5 ${
                                item.severity === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.25)]' : item.severity === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.25)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                              }`} />

                              <div className="flex-1 min-w-0 flex flex-col gap-2">
                                <div className="flex justify-between items-start gap-1">
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9px] font-bold font-mono text-blue-600 uppercase tracking-wider bg-blue-50/80 px-2 py-0.5 rounded leading-none border border-blue-100/50">
                                        {item.table}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold font-mono">
                                        {item.field}
                                      </span>
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none border ${
                                        item.severity === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100/80' : 'bg-amber-50 text-amber-600 border-amber-100/80'
                                      }`}>
                                        {item.severity === 'High' ? '高优先级' : '中优先级'}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 tracking-tight mt-1.5">
                                      {MARA_FIELD_DESCRIPTIONS[item.field] || item.field} • <span className="text-slate-605 font-black">{item.type}</span>
                                    </h4>
                                  </div>

                                  {/* Floating smart heal quick trigger button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      executeMobileRepair(item);
                                    }}
                                    className="p-2 py-2.5 bg-blue-600 hover:bg-emerald-600 active:scale-90 text-white rounded-xl transition-all shadow-md group-hover:scale-105 duration-200 flex items-center justify-center shrink-0 ml-1.5 cursor-pointer"
                                    title="一键智能修补"
                                  >
                                    <Wand2 size={13} className="animate-pulse" />
                                  </button>
                                </div>

                                <p className="text-[10px] text-slate-505 leading-relaxed font-semibold">
                                  {item.notes || item.description || '检测到该字段存在留空、超限或不合规格式异常。'}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SECOND LEVEL VIEW: AUTO-REPAIR POLICIES */
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-slate-50/50 h-full w-full">
                {/* Secondary Page Navigation Header - Native Mobile Style */}
                <div className="h-12 border-b border-slate-205 border-slate-200/60 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                  <button
                    onClick={() => setHomeSubView('main')}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-90 transition-all cursor-pointer"
                    title="返回主页"
                  >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">自动修复策略</h2>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Policies Content */}
                <div className="flex-grow overflow-y-auto px-5 py-4 pb-6 scrollbar-hide space-y-4">
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-gradient-to-br from-indigo-50/40 via-slate-50/10 to-white rounded-3xl p-5 border border-indigo-100/60 shadow-[0_12px_30px_rgba(99,102,241,0.02)] flex flex-col relative overflow-hidden">
                      {/* Ambient glows */}
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-300 rounded-full blur-[45px] opacity-15 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-indigo-300 rounded-full blur-[45px] opacity-20 pointer-events-none" />
                      
                      <div className="relative z-10 flex-grow flex flex-col space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50/50 border border-indigo-100/80 rounded-xl px-2.5 py-1.5 w-fit">
                          <Shield size={13} className="text-indigo-600 stroke-[2.5]" />
                          <span className="uppercase tracking-widest text-[8px] font-black leading-none font-mono">自动修复策略 (AUTO-REPAIR)</span>
                        </div>
                        
                        <div>
                          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1 leading-none">
                            主动修复规则池
                          </h3>
                          <p className="text-[9px] text-slate-400 mt-1.5 leading-none">Active Policies • 后台静默守护与格式自动对齐状态</p>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Item 1 */}
                          <div 
                            onClick={() => setMobileRepairConfig({ id: 'formatting', title: '格式化修复 (Formatting)', type: 'success' })}
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/10 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                                <CheckCircle2 size={13} className="stroke-[2.5]" />
                              </div>
                              <div>
                                <div className="text-slate-800 font-extrabold text-[11px]">格式化自愈 (Formatting)</div>
                                <div className="text-[9px] text-slate-500 font-semibold">2,316 记录已修补且合规</div>
                              </div>
                            </div>
                            <div className="text-emerald-600 text-[8px] font-black bg-emerald-50 px-2 py-1 rounded border border-emerald-100 font-mono">自动运行中</div>
                          </div>
                          
                          {/* Item 2 */}
                          <div 
                            onClick={() => setMobileRepairConfig({ id: 'inference', title: 'AI 值推断 (Inference)', type: 'warning' })}
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/10 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                                <Wand2 size={13} className="stroke-[2.5] text-amber-500" />
                              </div>
                              <div>
                                <div className="text-slate-800 font-extrabold text-[11px]">AI 值自动推断 (Inference)</div>
                                <div className="text-[9px] text-slate-500 font-semibold">8,612 条记录推荐对齐</div>
                              </div>
                            </div>
                            <div className="text-amber-600 text-[8px] font-black bg-amber-50 px-2 py-1 rounded border border-amber-100 font-mono font-bold">待复核</div>
                          </div>

                          {/* Item 3 */}
                          <div 
                            onClick={() => setMobileRepairConfig({ id: 'validation', title: '域值校验 (Validation)', type: 'info' })}
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/10 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                <Activity size={13} className="stroke-[2.5]" />
                              </div>
                              <div>
                                <div className="text-slate-800 font-extrabold text-[11px]">系统自检 (Validation)</div>
                                <div className="text-[9px] text-slate-500 font-semibold">1,122 数据自动校验规则</div>
                              </div>
                            </div>
                            <div className="text-blue-600 text-[8px] font-black bg-blue-50 px-2 py-1 rounded border border-blue-100 font-mono">系统规则</div>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-[9px] text-indigo-600 font-black flex items-center gap-1">
                              <Sparkles size={10} className="fill-indigo-400 text-indigo-500" />
                              质检自愈成效比率
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold font-sans">大幅降低物料管理人工审核负载与响应耗时</p>
                          </div>
                          <span className="text-2xl font-black text-indigo-600 font-mono tracking-tight">84%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ISSUES (DANGER RESOLUTION CENTER) */}
        {activeTab === 'issues' && false && (
          <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-slate-50/50">
            
            {/* Unified Segmented Slider Header */}
            <div className="px-5 pb-3.5 pt-3.5 border-b border-slate-200/60 bg-white/95 backdrop-blur-md flex flex-col shrink-0 z-10 shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
              {/* Slider Controls */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex w-full relative border border-slate-200/40">
                <button
                  onClick={() => setIssuesSubTab('diagnosis')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                    issuesSubTab === 'diagnosis' 
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/10' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <AlertTriangle size={12} className={issuesSubTab === 'diagnosis' ? 'text-blue-600 animate-pulse' : 'text-slate-400'} />
                  <span>关键问题诊断</span>
                  <span className={`px-1.5 py-0.2 rounded font-black text-[8.5px] font-mono leading-none ${
                    issuesSubTab === 'diagnosis' 
                      ? 'bg-blue-50 text-blue-650' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {activeIssues.length}
                  </span>
                </button>

                <button
                  onClick={() => setIssuesSubTab('policies')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                    issuesSubTab === 'policies' 
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/10' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Shield size={12} className={issuesSubTab === 'policies' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>自动修复策略</span>
                  <span className={`px-1.5 py-0.2 rounded font-black text-[8.5px] font-mono leading-none ${
                    issuesSubTab === 'policies' 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    3
                  </span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-grow overflow-y-auto px-5 py-4 pb-24 scrollbar-hide space-y-4">
              
              {issuesSubTab === 'diagnosis' ? (
                /* Sub-Tab 1: Problem Diagnostics Card Panel */
                <div className="space-y-4 animate-fade-in">
                  <div id="problem_diagnosis_scroller_card" className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] p-5 flex flex-col space-y-4">
                    
                    {/* Header of diagnostics section */}
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shadow-xs">
                          <AlertTriangle size={15} className="animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-850 leading-none">未解决异常清单</span>
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-black leading-none">
                              {activeIssues.length}个不合规
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">主数据强规则校验异常不合规清单</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setIsAllIssuesOpen(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-all active:scale-95 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100/50 cursor-pointer"
                      >
                        <span>全量列表</span>
                        <ArrowRight size={11} className="stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Section Issue items */}
                    <div className="space-y-3">
                      {activeIssues.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">全部对齐合规</p>
                            <p className="text-[9.5px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">物料主数据校验已100%匹配您所设定的智控规则</p>
                          </div>
                        </div>
                      ) : (
                        activeIssues.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => setViewingIssueDetails(item)}
                            className="group p-4 bg-slate-50/40 hover:bg-white rounded-2xl border border-slate-200/60 hover:border-blue-200/80 transition-all duration-200 shadow-xs hover:shadow-[0_8px_20px_rgba(59,130,246,0.03)] flex gap-3.5 cursor-pointer active:scale-[0.99] relative overflow-hidden"
                          >
                            {/* Severity colored left stroke indicator */}
                            <div className={`w-1 rounded-full shrink-0 self-stretch my-0.5 ${
                              item.severity === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.25)]' : item.severity === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.25)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                            }`} />

                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                              <div className="flex justify-between items-start gap-1">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-bold font-mono text-blue-600 uppercase tracking-wider bg-blue-50/80 px-2 py-0.5 rounded leading-none border border-blue-100/50">
                                      {item.table}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold font-mono">
                                      {item.field}
                                    </span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none border ${
                                      item.severity === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100/80' : 'bg-amber-50 text-amber-600 border-amber-100/80'
                                    }`}>
                                      {item.severity === 'High' ? '高优先级' : '中优先级'}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-black text-slate-800 tracking-tight mt-1.5">
                                    {MARA_FIELD_DESCRIPTIONS[item.field] || item.field} • <span className="text-slate-550 font-black">{item.type}</span>
                                  </h4>
                                </div>

                                {/* Floating smart heal quick trigger button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    executeMobileRepair(item);
                                  }}
                                  className="p-2 py-2.5 bg-blue-600 hover:bg-emerald-600 active:scale-90 text-white rounded-xl transition-all shadow-md group-hover:scale-105 duration-200 flex items-center justify-center shrink-0 ml-1.5 cursor-pointer"
                                  title="一键智能修补"
                                >
                                  <Wand2 size={13} className="animate-pulse" />
                                </button>
                              </div>

                              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                                {item.notes || item.description || '检测到该字段存在留空、超限或不合规格式异常。'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                /* Sub-Tab 2: Active Repair Strategy Policies */
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-gradient-to-br from-indigo-50/40 via-slate-50/10 to-white rounded-3xl p-5 border border-indigo-100/60 shadow-[0_12px_30px_rgba(99,102,241,0.02)] flex flex-col relative overflow-hidden">
                    {/* Subtle Ambient Circular Glow effects */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-300 rounded-full blur-[45px] opacity-15 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-indigo-300 rounded-full blur-[45px] opacity-20 pointer-events-none" />
                    
                    <div className="relative z-10 flex-grow flex flex-col space-y-4">
                      <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50/50 border border-indigo-100/80 rounded-xl px-2.5 py-1.5 w-fit">
                        <Shield size={13} className="text-indigo-600 stroke-[2.5]" />
                        <span className="uppercase tracking-widest text-[8px] font-black leading-none">自动修复策略 (AUTO-REPAIR)</span>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1 leading-none">
                          主动修复规则池
                        </h3>
                        <p className="text-[9px] text-slate-400 mt-1.5 leading-none">Active Policies • 后台静默守护与格式自动对齐状态</p>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Item 1 */}
                        <div 
                          onClick={() => setMobileRepairConfig({ id: 'formatting', title: '格式化修复 (Formatting)', type: 'success' })}
                          className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/10 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                              <CheckCircle2 size={13} className="stroke-[2.5]" />
                            </div>
                            <div>
                              <div className="text-slate-805 font-extrabold text-[11px] text-slate-800">格式化自愈 (Formatting)</div>
                              <div className="text-[9px] text-slate-500 font-semibold">2,316 记录已修补且合规</div>
                            </div>
                          </div>
                          <div className="text-emerald-600 text-[8px] font-black bg-emerald-50 px-2 py-1 rounded border border-emerald-100">自动运行中</div>
                        </div>
                        
                        {/* Item 2 */}
                        <div 
                          onClick={() => setMobileRepairConfig({ id: 'inference', title: 'AI 值推断 (Inference)', type: 'warning' })}
                          className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/10 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                              <Wand2 size={13} className="stroke-[2.5] text-amber-500" />
                            </div>
                            <div>
                              <div className="text-slate-805 font-extrabold text-[11px] text-slate-800">AI 值自动推断 (Inference)</div>
                              <div className="text-[9px] text-slate-505 text-slate-500 font-semibold">8,612 条记录推荐对齐</div>
                            </div>
                          </div>
                          <div className="text-amber-605 text-[8px] font-black bg-amber-50 px-2 py-1 rounded border border-amber-100">待复核</div>
                        </div>

                        {/* Item 3 */}
                        <div 
                          onClick={() => setMobileRepairConfig({ id: 'validation', title: '域值校验 (Validation)', type: 'info' })}
                          className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/10 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                              <Activity size={13} className="stroke-[2.5]" />
                            </div>
                            <div>
                              <div className="text-slate-805 font-extrabold text-[11px] text-slate-800">系统自检 (Validation)</div>
                              <div className="text-[9px] text-slate-505 text-slate-500 font-semibold">1,122 数据自动校验规则</div>
                            </div>
                          </div>
                          <div className="text-blue-600 text-[8px] font-black bg-blue-50 px-2 py-1 rounded border border-blue-100">系统规则</div>
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-slate-150 border-slate-100 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-indigo-600 font-black flex items-center gap-1">
                            <Sparkles size={10} className="fill-indigo-400 text-indigo-500" />
                            质检自愈成效比率
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold font-sans">大幅降低物料管理人工审核负载与响应耗时</p>
                        </div>
                        <span className="text-2xl font-black text-indigo-600 font-mono tracking-tight">84%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                      {msg.role === 'user' ? <User size={13} /> : <Bot size={11} />}
                    </div>

                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                      {msg.text.split('\n').map((line: string, lineIdx: number) => {
                        const isList = line.trim().startsWith('- ') || line.trim().startsWith('* ');
                        return (
                          <p key={lineIdx} className={`${isList ? 'pl-2 text-blue-600' : 'text-slate-800'} font-medium`}>
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
                    <Loader2 className="animate-spin text-blue-605 text-blue-600" size={13} />
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
          <div className="flex-grow overflow-hidden flex flex-col pt-0 bg-slate-50/50 h-full w-full">
            {selectedSettingPartition === null ? (
              /* 4 Interactive Indicator Cards Modules directly rendered from top scale */
              <div className="flex-grow overflow-y-auto px-5 py-5 pb-6 scrollbar-hide space-y-3.5 animate-fade-in animate-duration-150">
                {[
                  {
                    id: 'completeness',
                    name: '完整性规则校验',
                    nameEn: 'Completeness',
                    icon: <CheckCircle2 size={16} className="text-emerald-500" />,
                    color: 'border-emerald-100 bg-emerald-50/40',
                    desc: '指定必填物理字段校验范围，全面覆盖物料基础数据、采购销售及财务图纸。',
                    activeRules: `${completenessKeyFields.length} 项必填字段生效中`,
                    weight: metricWeights['completeness'] ?? 25
                  },
                  {
                    id: 'uniqueness',
                    name: '唯一性防重主键',
                    nameEn: 'Uniqueness',
                    icon: <Layers size={16} className="text-blue-500" />,
                    color: 'border-blue-100 bg-blue-50/40',
                    desc: '自定义物料重复性组合校验主键，智能拦截名称、型号、图纸等高相似记录。',
                    activeRules: `${uniquenessKeyFields.length} 组联合唯一标识工作正常`,
                    weight: metricWeights['uniqueness'] ?? 25
                  },
                  {
                    id: 'accuracy',
                    name: '准确性值域常识',
                    nameEn: 'Accuracy',
                    icon: <Activity size={16} className="text-amber-500" />,
                    color: 'border-amber-100 bg-amber-50/40',
                    desc: '管控物理值域极限制约及毛重净重常识，保障财务金额及参数高度贴合。',
                    activeRules: '物理边界限制、毛重常识等 3 大算子稳定监视',
                    weight: metricWeights['accuracy'] ?? 25
                  },
                  {
                    id: 'compliance',
                    name: '合规性内外双环',
                    nameEn: 'Compliance',
                    icon: <ShieldCheck size={16} className="text-violet-500" />,
                    color: 'border-violet-100 bg-violet-50/40',
                    desc: '内置海关STEUC税号通关认证，并与RoHS证书期限在出口前完成双重过滤审计。',
                    activeRules: '海关税号归档、RoHS危化物及分词 4 项安全红线启用',
                    weight: metricWeights['compliance'] ?? 25
                  }
                ].map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setSettingsSubTab(mod.id as any);
                      setSelectedSettingPartition(mod.id as any);
                    }}
                    className="w-full text-left p-4 bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl shadow-3xs transition-all flex items-center justify-between group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${mod.color}`}>
                        {mod.icon}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800">{mod.name}</span>
                          <span className="px-1 py-0.2 bg-slate-100 text-slate-400 border border-slate-250 rounded text-[7px] font-mono font-black uppercase">
                            {mod.nameEn}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed line-clamp-1">
                          {mod.desc}
                        </p>
                        <span className="text-[8.5px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.2 rounded font-black block w-fit mt-1">
                          {mod.activeRules}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                  </button>
                ))}

                {/* Weights balance auditing card removed */}
              </div>
            ) : (
              // SECONDARY LEVEL VIEW: INDIVIDUAL INDICATOR RULES CUSTOMIZATION (二级质量指标设置页面)
              <div className="flex-grow overflow-hidden flex flex-col bg-slate-50/50 animate-fade-in">
                {/* Secondary Page Navigation Header - Native Mobile Style */}
                <div className="h-12 border-b border-slate-200/80 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                  <button
                    onClick={() => setSelectedSettingPartition(null)}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-90 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <h2 className="text-xs font-bold text-slate-800 tracking-tight">
                      {selectedSettingPartition === 'completeness' && '完整性校验配置 (Completeness)'}
                      {selectedSettingPartition === 'uniqueness' && '唯一性防重主键配置 (Uniqueness)'}
                      {selectedSettingPartition === 'accuracy' && '准确性值域规律校验 (Accuracy)'}
                      {selectedSettingPartition === 'compliance' && '合规性政策法规红线 (Compliance)'}
                    </h2>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Rules Customization details area */}
                <div className="flex-grow overflow-y-auto px-5 py-4 pb-6 scrollbar-hide space-y-4">

                  {/* 1. COMPLETENESS CHECKLIST */}
                  {settingsSubTab === 'completeness' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="bg-gradient-to-br from-blue-50/40 via-white to-white rounded-2xl border border-slate-200/80 p-4 shadow-3xs space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            <span>1. 物理字段必填字段目录</span>
                          </span>
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black border border-emerald-100/50">
                            {completenessKeyFields.length} 项有效
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const all = Object.values(CATEGORY_FIELD_GROUPS).flat();
                              onSaveCompletenessFields(all);
                            }}
                            className="text-[9.5px] font-black text-blue-600 bg-blue-50/65 px-2.5 py-1 rounded-md border border-blue-100/50 hover:bg-blue-100/50 transition-colors"
                          >
                            全选
                          </button>
                          <button
                            onClick={() => onSaveCompletenessFields([])}
                            className="text-[9.5px] font-black text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 hover:bg-slate-100/50 transition-colors"
                          >
                            清空
                          </button>
                        </div>

                        <div className="space-y-4 mt-2">
                          {Object.entries(CATEGORY_FIELD_GROUPS).map(([groupName, fields]) => (
                            <div key={groupName} className="space-y-1.5">
                              <span className="text-[8.5px] text-slate-400 font-extrabold tracking-widest uppercase">{groupName} 模块</span>
                              <div className="grid grid-cols-2 gap-2">
                                {fields.map(field => {
                                  const isChecked = completenessKeyFields.includes(field);
                                  return (
                                    <button
                                      key={field}
                                      onClick={() => {
                                        const updated = isChecked
                                          ? completenessKeyFields.filter(f => f !== field)
                                          : [...completenessKeyFields, field];
                                        onSaveCompletenessFields(updated);
                                      }}
                                      className={`p-2 rounded-xl border flex items-center gap-1.5 text-left font-bold transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-blue-50/70 text-blue-600 border-blue-200 shadow-3xs'
                                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 shadow-3xs'
                                      }`}
                                    >
                                      <div className={`w-3 h-3 border rounded flex items-center justify-center shrink-0 ${
                                        isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                                      }`}>
                                        {isChecked && <Check size={8} />}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate text-slate-800 font-semibold font-mono text-[9.5px]">{field}</span>
                                        <span className="text-[7.5px] opacity-70 font-semibold truncate text-slate-505 text-slate-500">{MARA_FIELD_DESCRIPTIONS[field] || field}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. UNIQUENESS CHECKLIST */}
                  {settingsSubTab === 'uniqueness' && (
                    <div className="space-y-4 animate-fade-in animate-duration-150">
                      {/* Active Rules List */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Layers size={13} className="text-indigo-500" />
                            <span>1. 一物多码防重主键规则</span>
                          </span>
                          <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-black border border-indigo-100/50">
                            {uniquenessKeyFields.length} 校验组已加载
                          </span>
                        </div>

                        <div className="space-y-2">
                          {uniquenessKeyFields.map((group, index) => (
                            <div
                              key={index}
                              className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-[10px] font-bold"
                            >
                              <div className="flex flex-wrap items-center gap-1 min-w-0">
                                {group.map((f, compIdx) => (
                                  <React.Fragment key={compIdx}>
                                    <span className="text-[9px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-3xs">
                                      {f} ({MARA_FIELD_DESCRIPTIONS[f] || f})
                                    </span>
                                    {compIdx < group.length - 1 && <span className="text-slate-400 text-xs">+</span>}
                                  </React.Fragment>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  const updated = uniquenessKeyFields.filter((_, i) => i !== index);
                                  onSaveUniquenessFields(updated);
                                }}
                                className="p-1 px-1.5 rounded text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100/20 shadow-3xs cursor-pointer active:scale-95 shrink-0 animate-fade-in"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rule Creation builder */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div>
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Plus size={13} className="text-blue-500" />
                            <span>2. 快速创建防重/唯一性组合</span>
                          </span>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">
                            选择一个或多个字段，来自动生成唯一性或联合唯一校验防御组合。
                          </p>
                        </div>

                        {/* Selected fields tags pending creation */}
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl min-h-[36px] items-center border border-dashed border-slate-200">
                          {isBuildingGroup.length === 0 ? (
                            <span className="text-[9px] text-slate-400 font-bold pl-1.5">点击下方按钮可点选合并多字段...</span>
                          ) : (
                            isBuildingGroup.map(field => (
                              <span key={field} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-blue-200 shadow-3xs animate-fade-in font-mono">
                                {field}
                                <button onClick={() => setIsBuildingGroup(isBuildingGroup.filter(f => f !== field))}>
                                  <X size={9} className="hover:text-red-500" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* List of selectables */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {['MATNR', 'MAKTX', 'BISMT', 'MTART', 'MATKL', 'MEINS', 'BRGEW', 'NTGEW', 'GEWEI'].map(f => {
                            const selected = isBuildingGroup.includes(f);
                            return (
                              <button
                                key={f}
                                onClick={() => {
                                  if (selected) {
                                    setIsBuildingGroup(isBuildingGroup.filter(field => field !== f));
                                  } else {
                                    setIsBuildingGroup([...isBuildingGroup, f]);
                                  }
                                }}
                                className={`px-2 py-1.5 text-[9.5px] font-black rounded-lg border text-center transition-all ${
                                  selected 
                                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {f}
                              </button>
                            );
                          })}
                        </div>

                        {/* Create action button */}
                        <button
                          onClick={() => {
                            if (isBuildingGroup.length === 0) return;
                            // Check if duplicate
                            const sortedNew = [...isBuildingGroup].sort().join('|');
                            const exists = uniquenessKeyFields.some(g => [...g].sort().join('|') === sortedNew);
                            if (!exists) {
                              onSaveUniquenessFields([...uniquenessKeyFields, [...isBuildingGroup]]);
                            }
                            setIsBuildingGroup([]);
                          }}
                          disabled={isBuildingGroup.length === 0}
                          className="w-full mt-1.5 py-2 hover:bg-blue-700 text-white bg-blue-600 text-[10px] font-black rounded-xl shadow-xs hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} /> 
                          确认并创建此防重物理主键组合
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. ACCURACY CHECKLIST */}
                  {settingsSubTab === 'accuracy' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Active Rules & Toggles Group */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Activity size={13} className="text-amber-500" />
                            <span>1. 值域与工业逻辑校验算子</span>
                          </span>
                          <span className="text-[9px] font-bold text-amber-600 font-mono">2 项校验已载入</span>
                        </div>

                        <div className="space-y-2.5">
                          {/* Weight Constraint rule */}
                          <div 
                            onClick={() => setAccuracyWeightsGroup(!accuracyWeightsGroup)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/40 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="font-black text-slate-800 font-mono text-[10px]">BRGEW &gt; NTGEW 常识对等控制</p>
                              <p className="text-[8.5px] text-slate-500 font-semibold leading-normal">物理毛重项目必须严格大于对应的净重字段，防范常识常务异常</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${accuracyWeightsGroup ? 'bg-blue-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${accuracyWeightsGroup ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          {/* Dimensions bounds rule */}
                          <div 
                            onClick={() => setAccuracyLengthGroup(!accuracyLengthGroup)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/40 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="font-black text-slate-800 font-mono text-[10px]">LAENG/BREIT 物数限制管制</p>
                              <p className="text-[8.5px] text-slate-500 font-semibold leading-normal">检查并捕获任何长、宽、高物理尺幅超出合理工业预置阀值的越界事件</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${accuracyLengthGroup ? 'bg-blue-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${accuracyLengthGroup ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          {/* Historical Outlier detection (mock extra slider toggle) */}
                          <div 
                            onClick={() => setAccuracyOutlierToggle(!accuracyOutlierToggle)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/40 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="font-black text-slate-800 font-mono text-[10px]">历史价格离群审计 ∉ [Historical ± 3σ]</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 font-semibold leading-normal">移动平均价与标准计价模型突发性财务偏离审计</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${accuracyOutlierToggle ? 'bg-blue-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${accuracyOutlierToggle ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Accuracy Online interactive simulator */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-3xs">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Play size={13} className="text-emerald-500" />
                            <span>2. 值域精度高仿真运行测试</span>
                          </span>
                          <button
                            onClick={handleSimulateAccuracy}
                            disabled={isSimulatingAccuracy}
                            className="text-[9px] font-black text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-lg shadow-3xs border border-emerald-600 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          >
                            {isSimulatingAccuracy ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                            运行模拟
                          </button>
                        </div>
                        
                        {isSimulatingAccuracy ? (
                          <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 size={18} className="text-emerald-500 animate-spin" />
                            <span className="text-[9px] font-black tracking-widest animate-pulse">正在提取校验池样本进行试对撞算...</span>
                          </div>
                        ) : accuracySimResult ? (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-2 animate-fade-in">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-700">重算后预估评分:</span>
                              <span className="font-mono font-black text-emerald-700">{accuracySimResult.score}%</span>
                            </div>
                            <div className="text-[9px] text-emerald-600 flex items-center gap-1 font-bold">
                              <Check size={12} />
                              诊断异常减少了 {accuracySimResult.reduced} 项 (规则覆盖率提升至 95%)
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-slate-400 font-bold text-center py-2 leading-relaxed">
                            修改规则控制对等指标后，点击右侧的“运行模拟”检测受其控制影响的数据比率。
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. COMPLIANCE CHECKLIST */}
                  {settingsSubTab === 'compliance' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Section 1: Dual-Ring compliance policies */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-violet-500" />
                            <span>1. 法律底线与企业管理双环法规红线</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {[
                            { id: 'c1', bg: 'from-rose-500/10 to-transparent', border: 'border-rose-100/80', ring: '外环：法律底线', title: '海关税号 (STEUC) 有效性核准', desc: '利用2026最新税则通关库，对跨国供应链条目进行一致性强控校验。' },
                            { id: 'c2', bg: 'from-rose-500/10 to-transparent', border: 'border-rose-100/80', ring: '外环：出口生命线', title: 'RoHS 6+10 环保证书期限校验', desc: '动态对撞供应商物性报告截止日期，防范限用危化品未声明出口风险。' },
                            { id: 'c3', bg: 'from-amber-500/10 to-transparent', border: 'border-amber-100/85', ring: '内环：规范基石', title: '物料命名规则语义字根校核', desc: '语义分词评估，强制约束描述排列符合 [品名+技术规格] 自带词汇律。' },
                            { id: 'c4', bg: 'from-amber-500/10 to-transparent', border: 'border-amber-100/85', ring: '内环：协同安全', title: 'PLM E-BOM 图纸文档关联检查', desc: '稽核并捕捉自主设计类零部件缺失图档、技术底稿导致现场乱产损失。' },
                          ].map(item => {
                            const isActive = complianceToggles[item.id];
                            return (
                              <div
                                key={item.id}
                                onClick={() => setComplianceToggles({...complianceToggles, [item.id]: !isActive})}
                                className={`p-3 bg-gradient-to-r ${item.bg} hover:via-slate-50/20 to-white border ${item.border} rounded-xl cursor-pointer transition-all flex items-center justify-between`}
                              >
                                <div className="space-y-1 pr-3 min-w-0">
                                  <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-white/80 text-slate-600 rounded border border-slate-200 uppercase tracking-tight block w-fit">
                                    {item.ring}
                                  </span>
                                  <p className="text-[10px] font-extrabold text-slate-800 truncate">{item.title}</p>
                                  <p className="text-[8.5px] text-slate-400 leading-normal font-semibold line-clamp-2">{item.desc}</p>
                                </div>
                                <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                  <div className={`w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Run Audit test inline */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <ShieldAlert size={13} className="text-violet-500" />
                            <span>2. 内外红线合规审计对撞</span>
                          </span>
                          <button
                            onClick={handleRunComplianceAudit}
                            disabled={isAuditingCompliance}
                            className="text-[9px] font-black text-white bg-violet-600 hover:bg-violet-700 px-2.5 py-1 rounded-lg shadow-3xs border border-violet-700 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          >
                            {isAuditingCompliance ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                            运行审计
                          </button>
                        </div>

                        {isAuditingCompliance ? (
                          <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 size={18} className="text-violet-500 animate-spin" />
                            <span className="text-[9px] font-black tracking-widest animate-pulse">正在提取双环合规条目与模型数据库交叉对撞中...</span>
                          </div>
                        ) : complianceAuditResult ? (
                          <div className="p-3 bg-violet-50 rounded-xl space-y-2 animate-fade-in border border-violet-100">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-700">混合对撞通过重算的合规得分为:</span>
                              <span className="font-mono font-black text-violet-700">{complianceAuditResult.score}%</span>
                            </div>
                            <p className="text-[8.5px] text-violet-600 leading-normal font-semibold">
                              发现 2 处潜在不一致风险。已配置海关和环保规则对撞，检测系统正密切监控。
                            </p>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-slate-405 text-slate-400 font-bold text-center py-2 leading-relaxed">
                            修改双环红线后，轻触右侧的“运行审计”调用外接海关与RoHS服务数据库进行对撞演算。
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. WEIGHTS ALLOCATION */}
                  {settingsSubTab === 'weights' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Weights configuration panel */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Sliders size={13} className="text-indigo-500" />
                            <span>1. 指标权重占比微调</span>
                          </span>
                        </div>

                        <div className="space-y-4">
                          {[
                            { key: 'completeness', label: '完整性 (Completeness)', color: 'accent-emerald-500' },
                            { key: 'uniqueness', label: '唯一性 (Uniqueness)', color: 'accent-blue-500' },
                            { key: 'accuracy', label: '准确性 (Accuracy)', color: 'accent-amber-500' },
                            { key: 'compliance', label: '合规性 (Compliance)', color: 'accent-violet-500' }
                          ].map(item => {
                            const val = metricWeights[item.key] ?? 25;
                            return (
                              <div key={item.key} className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-700">{item.label}</span>
                                  <span className="text-slate-900 font-mono">{val}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={val}
                                  onChange={(e) => {
                                    const nextWeights = { ...metricWeights, [item.key]: Number(e.target.value) };
                                    onSaveWeights(nextWeights);
                                  }}
                                  className={`w-full h-1.5 bg-slate-100 rounded-lg cursor-pointer ${item.color}`}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Summary of weights */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-[9.5px] font-bold">
                            <span className="text-slate-500">权重比例加总:</span>
                            {(() => {
                              const total = Object.values(metricWeights).reduce((sum: number, v: any) => sum + Number(v), 0);
                              const isGreen = total === 100;
                              return (
                                <span className={`font-mono text-[10.5px] font-black ${isGreen ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {total}% {isGreen ? '✓ (平衡模式)' : '⚠️ (非平衡模式，建议加总为100%)'}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {false && (
              // SECONDARY LEVEL VIEW: INDIVIDUAL INDICATOR RULES CUSTOMIZATION (二级质量指标设置页面)
              <div className="flex-grow overflow-hidden flex flex-col h-full w-full bg-slate-50/50">
                {/* Secondary Page Navigation Header - Native Mobile Style */}
                <div className="h-12 border-b border-slate-200/80 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                  <button
                    onClick={() => setSelectedSettingPartition(null)}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-90 transition-all cursor-pointer animate-fade-in"
                  >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <h2 className="text-xs font-bold text-slate-800 tracking-tight animate-fade-in">
                      {selectedSettingPartition === 'completeness' && '完整性校验配置 (Completeness)'}
                      {selectedSettingPartition === 'uniqueness' && '唯一性防重主键配置 (Uniqueness)'}
                      {selectedSettingPartition === 'accuracy' && '准确性值域规律校验 (Accuracy)'}
                      {selectedSettingPartition === 'compliance' && '合规性政策法规红线 (Compliance)'}
                    </h2>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Rules Customization details area */}
                <div className="flex-grow overflow-y-auto px-5 py-4 pb-6 scrollbar-hide space-y-4">
                  {/* Weight allocation panel inside Level 2 indicator */}
                  {(() => {
                    const key = selectedSettingPartition;
                    if (!key) return null;
                    const val = metricWeights[key] ?? 25;
                    const label = key === 'completeness' ? '完整性'
                                : key === 'uniqueness' ? '唯一性'
                                : key === 'accuracy' ? '准确性'
                                : '合规性';
                    return (
                      <div className="bg-gradient-to-br from-blue-50/40 to-white rounded-2xl border border-slate-200 p-4 shadow-3xs space-y-2.5 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <span className="text-[10.5px] font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <Sliders size={13} className="text-blue-600 animate-pulse" />
                            <span>1. 【{label}】数据质量乘数占比权重</span>
                          </span>
                          <span className="text-[11px] font-black text-blue-600 font-mono">{val}%</span>
                        </div>
                        <p className="text-[9.2px] text-slate-400 font-bold leading-normal">
                          在此拉动滑块来配置当前指标项在物料数据综合健康总分中所占的影响占比。
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={val}
                            onChange={(e) => {
                              const nextWeights = { ...metricWeights, [key]: Number(e.target.value) };
                              onSaveWeights(nextWeights);
                            }}
                            className="flex-grow h-1.5 bg-slate-100 rounded-lg cursor-pointer accent-blue-600"
                          />
                          <span className="text-[9.5px] text-slate-550 text-slate-500 font-black font-mono shrink-0">占比: {val}%</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* PARTITION CONFIG: MARA */}
                  {selectedSettingPartition === 'MARA' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Section 1: Completeness checklist */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            <span>1. 物理字段完整性必填要求 (Completeness)</span>
                          </span>
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100/50">
                            {completenessKeyFields.length} 项已激活
                          </span>
                        </div>

                        <div className="space-y-3.5">
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
                                        onSaveCompletenessFields(updated);
                                      }}
                                      className={`p-2 rounded-xl border flex items-center gap-2 text-left font-bold transition-all cursor-pointer ${
                                        isChecked 
                                          ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-xs' 
                                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/40 shadow-xs'
                                      }`}
                                    >
                                      <div className={`w-3 h-3 border rounded flex items-center justify-center shrink-0 ${
                                        isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                                      }`}>
                                        {isChecked && <Check size={8} />}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate text-slate-800 font-mono text-[9.5px]">{field}</span>
                                        <span className="text-[7.5px] opacity-60 font-semibold truncate text-slate-505 text-slate-500">{MARA_FIELD_DESCRIPTIONS[field] || field}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Uniqueness groups list */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <Layers size={13} className="text-indigo-500" />
                            <span>2. 一物多码防重主键组合 (Uniqueness)</span>
                          </span>
                          <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold border border-indigo-100/50">
                            {uniquenessKeyFields.length} 校验主组
                          </span>
                        </div>

                        <div className="space-y-2">
                          {uniquenessKeyFields.map((group, index) => (
                            <div 
                              key={index}
                              className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[11px] font-bold"
                            >
                              <div className="flex flex-wrap items-center gap-1 min-w-0">
                                {group.map((f, compIdx) => (
                                  <React.Fragment key={compIdx}>
                                    <span className="text-[9.5px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                                      {f}
                                    </span>
                                    {compIdx < group.length - 1 && <span className="text-slate-400 text-xs">+</span>}
                                  </React.Fragment>
                                ))}
                              </div>
                              <button 
                                onClick={() => {
                                  const updated = uniquenessKeyFields.filter((_, i) => i !== index);
                                  onSaveUniquenessFields(updated);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors shrink-0 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Range Accuracy checkboxes */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <Activity size={13} className="text-amber-500" />
                            <span>3. 值域及精度格式校验 (Accuracy)</span>
                          </span>
                          <span className="text-[9.5px] font-bold text-amber-600 font-mono">2 校验已激活</span>
                        </div>

                        <div className="space-y-2.5">
                          <div 
                            onClick={() => setAccuracyWeightsGroup(!accuracyWeightsGroup)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5 pr-2">
                              <p className="font-extrabold text-slate-800 font-mono text-[10.5px]">BRGEW &gt; NTGEW 对等控制</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 font-semibold leading-normal">物理毛重项目必须严格大于对应的净重字段</p>
                            </div>
                            <div className={`w-8 h-4 rounded-full p-[2px] transition-colors relative ${accuracyWeightsGroup ? 'bg-blue-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${accuracyWeightsGroup ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setAccuracyLengthGroup(!accuracyLengthGroup)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5 pr-2">
                              <p className="font-extrabold text-slate-800 font-mono text-[10.5px]">LAENG/BREIT/HOEHE 界限设定</p>
                              <p className="text-[8.5px] text-slate-550 text-slate-500 font-semibold leading-normal">检查并捕获任何长、宽、高物理尺幅超出合理工业范围异常</p>
                            </div>
                            <div className={`w-8 h-4 rounded-full p-[2px] transition-colors relative ${accuracyLengthGroup ? 'bg-blue-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${accuracyLengthGroup ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Compliance rules */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-blue-500" />
                            <span>4. 法规及出口合规过滤 (Compliance)</span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          {[
                            { id: 'c1', title: '海关税则归档对核 (STEUC 确认)', desc: '申报进出口税则码的工业有效性判定。' },
                            { id: 'c2', title: 'RoHS 6+10 环保证书期限校验', desc: '锁定并阻止任何RoHS合规说明失效条目。' },
                            { id: 'c3', title: '物料命名及语义字根核查', desc: '强化学理标准的“规格+品名”拼字检验。' }
                          ].map(item => {
                            const isActive = complianceToggles[item.id];
                            return (
                              <div 
                                key={item.id}
                                onClick={() => setComplianceToggles({...complianceToggles, [item.id]: !isActive})}
                                className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                              >
                                <div className="space-y-0.5 pr-3 min-w-0">
                                  <p className="text-[10px] font-extrabold text-slate-800 truncate">{item.title}</p>
                                  <p className="text-[8.5px] text-slate-500 leading-normal font-semibold">{item.desc}</p>
                                </div>
                                <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${isActive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                  <div className={`w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PARTITION CONFIG: MARC */}
                  {selectedSettingPartition === 'MARC' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Section 1: MARC fields completeness */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-indigo-500" />
                            <span>1. MARC 必填参数校验目录 (Completeness)</span>
                          </span>
                          <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                            {marcCompletenessFields.length} / 4 校验项
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { code: 'WERKS', desc: '工厂编号 (工厂唯一主键)' },
                            { code: 'DISPO', desc: 'MRP 控制员' },
                            { code: 'BESKZ', desc: '采购类型参数 (E/F/X)' },
                            { code: 'SOBSL', desc: '特殊采购类参数' }
                          ].map(field => {
                            const isChecked = marcCompletenessFields.includes(field.code);
                            return (
                              <button
                                key={field.code}
                                onClick={() => {
                                  const updated = isChecked 
                                    ? marcCompletenessFields.filter(f => f !== field.code)
                                    : [...marcCompletenessFields, field.code];
                                  setMarcCompletenessFields(updated);
                                }}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left font-bold transition-all cursor-pointer ${
                                  isChecked ? 'bg-indigo-50/50 text-indigo-600 border-indigo-200 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                              >
                                <div className={`w-3 h-3 border rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                  {isChecked && <Check size={8} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate text-slate-800 font-mono text-[9.5px]">{field.code}</span>
                                  <span className="text-[7.5px] opacity-60 font-semibold truncate text-slate-505 text-slate-500">{field.desc}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: MARC custom settings */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <Activity size={13} className="text-indigo-500" />
                            <span>2. 工厂物料防呆防重与值域规则</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div 
                            onClick={() => setMarcCustomToggles({...marcCustomToggles, werksUniqueness: !marcCustomToggles.werksUniqueness})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">工厂行唯一性限制 (MATNR + WERKS)</p>
                              <p className="text-[8.5px] text-slate-500 leading-normal font-semibold">校验同物料在同一个工厂下只存在唯一视图，杜绝视图重合</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${marcCustomToggles.werksUniqueness ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${marcCustomToggles.werksUniqueness ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setMarcCustomToggles({...marcCustomToggles, dispoFormat: !marcCustomToggles.dispoFormat})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">MRP 控制员字母格式核实 (DISPO)</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">系统自动校验MRP控制员是否满足法定字母/数字命名规范字符集</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${marcCustomToggles.dispoFormat ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${marcCustomToggles.dispoFormat ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setMarcCustomToggles({...marcCustomToggles, beskzLimit: !marcCustomToggles.beskzLimit})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">采购限定集管制 (BESKZ ∈ E/F/X)</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">强制锁定采购类型值范围在 E(自制), F(外购), X(双重) 以防手误</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${marcCustomToggles.beskzLimit ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${marcCustomToggles.beskzLimit ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PARTITION CONFIG: MBEW */}
                  {selectedSettingPartition === 'MBEW' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Section 1: MBEW Fields completeness */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-808 text-slate-500" />
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-amber-500" />
                            <span>1. 财务核算必填控制域 (Completeness)</span>
                          </span>
                          <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                            {mbewCompletenessFields.length} / 5 校验项
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { code: 'BWKEY', desc: '评估范围代码 (MBEW核心主键)' },
                            { code: 'BKLAS', desc: '评估类字段' },
                            { code: 'VPRSV', desc: '价格控制字段 (S/V)' },
                            { code: 'VERPR', desc: '财务移动平均价格' },
                            { code: 'STPRS', desc: '标准控制价' }
                          ].map(field => {
                            const isChecked = mbewCompletenessFields.includes(field.code);
                            return (
                              <button
                                key={field.code}
                                onClick={() => {
                                  const updated = isChecked 
                                    ? mbewCompletenessFields.filter(f => f !== field.code)
                                    : [...mbewCompletenessFields, field.code];
                                  setMbewCompletenessFields(updated);
                                }}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left font-bold transition-all cursor-pointer ${
                                  isChecked ? 'bg-amber-50/50 text-amber-700 border-amber-200 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                              >
                                <div className={`w-3 h-3 border rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'}`}>
                                  {isChecked && <Check size={8} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate text-slate-800 font-mono text-[9.5px]">{field.code}</span>
                                  <span className="text-[7.5px] opacity-60 font-semibold truncate text-slate-505 text-slate-500">{field.desc}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: MBEW custom rules */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <Activity size={13} className="text-amber-500" />
                            <span>2. 价格核算防呆防重与特定区间约束</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div 
                            onClick={() => setMbewCustomToggles({...mbewCustomToggles, bwkeyUniqueness: !mbewCustomToggles.bwkeyUniqueness})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">评估范围物理唯一性 (MATNR + BWKEY)</p>
                              <p className="text-[8.5px] text-slate-500 leading-normal font-semibold">稽查防范相同物料在同个评估范围内发生异常多头财务重合建档</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${mbewCustomToggles.bwkeyUniqueness ? 'bg-amber-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${mbewCustomToggles.bwkeyUniqueness ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setMbewCustomToggles({...mbewCustomToggles, bklasLimit: !mbewCustomToggles.bklasLimit})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">评估类法定合规区 (BKLAS ∈ 3000/7900/7920)</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">严格将本批评估类约束在法定原材料、半成品及产成品评估范围内</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${mbewCustomToggles.bklasLimit ? 'bg-amber-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${mbewCustomToggles.bklasLimit ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setMbewCustomToggles({...mbewCustomToggles, vprsvLimit: !mbewCustomToggles.vprsvLimit})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">计价策略双轨强制锁定 (VPRSV ∈ S/V)</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">限制价格控制键仅能取值 S(标准价格结算) 与 V(移动平均价格) 杜绝不合规计价模型</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${mbewCustomToggles.vprsvLimit ? 'bg-amber-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${mbewCustomToggles.vprsvLimit ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PARTITION CONFIG: BOM */}
                  {selectedSettingPartition === 'BOM' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Section 1: BOM fields completeness */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-sky-500" />
                            <span>1. BOM 清单物理结构完整校验 (Completeness)</span>
                          </span>
                          <span className="text-[9px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-bold">
                            {bomCompletenessFields.length} / 4 校验项
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { code: 'STLNR', desc: 'BOM单号主键' },
                            { code: 'IDNRK', desc: '装配组件物料' },
                            { code: 'MENGE', desc: '标准用量数值' },
                            { code: 'MEINS', desc: '清单基本单位' }
                          ].map(field => {
                            const isChecked = bomCompletenessFields.includes(field.code);
                            return (
                              <button
                                key={field.code}
                                onClick={() => {
                                  const updated = isChecked 
                                    ? bomCompletenessFields.filter(f => f !== field.code)
                                    : [...bomCompletenessFields, field.code];
                                  setBomCompletenessFields(updated);
                                }}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left font-bold transition-all cursor-pointer ${
                                  isChecked ? 'bg-sky-50/50 text-sky-600 border-sky-200 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                              >
                                <div className={`w-3 h-3 border rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'}`}>
                                  {isChecked && <Check size={8} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate text-slate-800 font-mono text-[9.5px]">{field.code}</span>
                                  <span className="text-[7.5px] opacity-60 font-semibold truncate text-slate-505 text-slate-500">{field.desc}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: BOM custom rules */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                            <Activity size={13} className="text-sky-500" />
                            <span>2. 物料清单装配与防重检查</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div 
                            onClick={() => setBomCustomToggles({...bomCustomToggles, bomUniqueness: !bomCustomToggles.bomUniqueness})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">BOM组件排重 (STLNR + IDNRK)</p>
                              <p className="text-[8.5px] text-slate-500 leading-normal font-semibold">严防同一BOM清单内出现并存的多头零件多头建档采购浪费</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${bomCustomToggles.bomUniqueness ? 'bg-sky-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${bomCustomToggles.bomUniqueness ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setBomCustomToggles({...bomCustomToggles, mengePositive: !bomCustomToggles.mengePositive})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-805 text-slate-800">标准组件配方零负数检测 (MENGE &gt; 0)</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">稽查并卡止用量为负、缺失或逻辑极值不合规记录</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${bomCustomToggles.mengePositive ? 'bg-sky-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${bomCustomToggles.mengePositive ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setBomCustomToggles({...bomCustomToggles, lossFactor: !bomCustomToggles.lossFactor})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-805 text-slate-800">损耗物理系数与格式审判</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">确保损耗与废品系数位于行业法定允许区间 (0% - 15%)，避免偷工减料</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${bomCustomToggles.lossFactor ? 'bg-sky-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${bomCustomToggles.lossFactor ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PARTITION CONFIG: WC (Work Center) */}
                  {selectedSettingPartition === 'WC' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Section 1: Work Center completeness */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-rose-500" />
                            <span>1. 产能生产能力必填检查 (Completeness)</span>
                          </span>
                          <span className="text-[9px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                            {wcCompletenessFields.length} / 5 校验项
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { code: 'ARBPL', desc: '工作中心代号物理主键' },
                            { code: 'KOKRS', desc: '控制范围代号' },
                            { code: 'VERWE', desc: '工作中心类别码 (VERWE)' },
                            { code: 'BEGZT', desc: '定额开始时时刻段' },
                            { code: 'ENDZT', desc: '定额每日截止时刻' }
                          ].map(field => {
                            const isChecked = wcCompletenessFields.includes(field.code);
                            return (
                              <button
                                key={field.code}
                                onClick={() => {
                                  const updated = isChecked 
                                    ? wcCompletenessFields.filter(f => f !== field.code)
                                    : [...wcCompletenessFields, field.code];
                                  setWcCompletenessFields(updated);
                                }}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left font-bold transition-all cursor-pointer ${
                                  isChecked ? 'bg-rose-50/50 text-rose-700 border-rose-200 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                              >
                                <div className={`w-3 h-3 border rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'}`}>
                                  {isChecked && <Check size={8} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate text-slate-800 font-mono text-[9.5px]">{field.code}</span>
                                  <span className="text-[7.5px] opacity-60 font-semibold truncate text-slate-505 text-slate-500">{field.desc}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: WC custom rules */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-805 text-slate-850 text-slate-800 flex items-center gap-1.5">
                            <Activity size={13} className="text-rose-500" />
                            <span>2. 能力产能及工艺路线偏差规则</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div 
                            onClick={() => setWcCustomToggles({...wcCustomToggles, wcUniqueness: !wcCustomToggles.wcUniqueness})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">工厂工作中心排重 (ARBPL + WERKS)</p>
                              <p className="text-[8.5px] text-slate-500 leading-normal font-semibold">强力防呆同一工厂内建档出具重复工时工效，发生排产阻塞</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${wcCustomToggles.wcUniqueness ? 'bg-rose-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${wcCustomToggles.wcUniqueness ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setWcCustomToggles({...wcCustomToggles, begztEndzt: !wcCustomToggles.begztEndzt})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">工时倒置倒挂检验 (BEGZT &lt; ENDZT)</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">工序及日历班次开始生产时必须前置早于其结束截止生产时间</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${wcCustomToggles.begztEndzt ? 'bg-rose-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${wcCustomToggles.begztEndzt ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>

                          <div 
                            onClick={() => setWcCustomToggles({...wcCustomToggles, calendarCheck: !wcCustomToggles.calendarCheck})}
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div className="space-y-0.5 pr-2 min-w-0">
                              <p className="text-[10.5px] font-extrabold text-slate-800">工厂生产排产工作日历有效对碰</p>
                              <p className="text-[8.5px] text-slate-505 text-slate-500 leading-normal font-semibold">排产日历关联必须属于工厂有效日历序列集内，确保能力派工排得通</p>
                            </div>
                            <div className={`w-8 h-4 shrink-0 rounded-full p-[2px] transition-colors relative ${wcCustomToggles.calendarCheck ? 'bg-rose-600' : 'bg-slate-200'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-all ${wcCustomToggles.calendarCheck ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE CENTER (个人中心) */}
        {activeTab === 'profile' && (
          <div className="flex-grow overflow-y-auto px-5 py-5 space-y-6 pb-6 scrollbar-hide animate-fade-in bg-slate-50/50">
            {/* Header branding */}
            <div className="pb-3 border-b border-slate-200">
              <h1 className="text-base font-black text-slate-900">个人中心</h1>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">管理当前的登录会话与个人偏好参数</p>
            </div>

            {/* Profile detail card */}
            <div className="space-y-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                  <User size={15} />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-850 block">基本账户信息</span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold leading-none">Primary Account</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-100/80 rounded-2xl shadow-inner">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-md shrink-0 text-center">
                  T
                </div>
                <div className="space-y-1 min-w-0 flex-grow">
                  <p className="text-xs font-black text-slate-900 truncate">tangjunsky@gmail.com</p>
                  <p className="text-[9.5px] text-slate-500 font-bold flex items-center gap-1 leading-none mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    主数据高级审计员
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-2xs">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">系统版本</p>
                  <p className="text-xs font-black text-slate-800 mt-1">v1.2.5 LTS</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-2xs">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">当前环境</p>
                  <p className="text-xs font-black text-slate-800 mt-1">生产对齐 Stable</p>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={onLogout}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] rounded-2xl text-xs font-black text-white hover:text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-100 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>安全退出当前登录</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <TrendChartModal 
        isOpen={selectedMetricDetail ? isTrendChartModalOpen : false}
        onClose={() => setIsTrendChartModalOpen(false)}
        metricName={selectedMetricDetail?.name || ''}
        currentScore={selectedMetricDetail?.score || 0}
      />
      <RepairDetailsModal
        isOpen={!!mobileRepairConfig}
        onClose={() => setMobileRepairConfig(null)}
        config={mobileRepairConfig}
      />

      {/* FOOTER NAVIGATION GRID CONTROLS FOR MOBILE NATIVE APP EXPERIENCE */}
      <footer className="bg-white border-t border-slate-200 h-[68px] shrink-0 flex items-center justify-around px-1 relative z-40 pb-2 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        
        {/* BUTTON 1: HOME PANEL */}
        <button
          onClick={() => {
            setActiveTab('home');
            setHomeSubView('main');
          }}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all grow ${
            activeTab === 'home' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity size={18} className={activeTab === 'home' ? 'text-blue-600' : 'text-slate-450 text-slate-400'} />
          <span className="text-[9px] tracking-wide font-black uppercase mt-0.5">健康体检</span>
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
          <Sliders size={18} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'} />
          <span className="text-[9px] tracking-wide font-black uppercase mt-0.5">规则引擎</span>
        </button>

        {/* BUTTON 5: PERSONAL PROFILE PANEL */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all grow ${
            activeTab === 'profile' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={18} className={activeTab === 'profile' ? 'text-blue-600' : 'text-slate-405 text-slate-400'} />
          <span className="text-[9px] tracking-wide font-black uppercase mt-0.5">个人中心</span>
        </button>

      </footer>

    </div>
  );
};
