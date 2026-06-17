import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Activity, CheckSquare, Square, Trash2, Link as LinkIcon, Plus, 
  Layout, MessageSquare, Send, Bot, User, Sparkles, Loader2, Play, 
  RotateCcw, ShieldCheck, Scale, AlertTriangle, ChevronRight, ChevronLeft, 
  CheckCircle2, Database, Wand2, Volume2, Settings, ListFilter,
  Check, Info, ChevronDown, Layers, Laptop, ShieldAlert, ArrowRight,
  Sliders, Shield, ClipboardList, RefreshCw, Sparkle, Smartphone, LogOut,
  TrendingUp, Calculator, FileText
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

const getUniappIndexVue = (completenessFields: string[], uniquenessGroups: string[][], selectedCats: string[]) => {
  return `<template>
  <view class="uniapp-container">
    
    <!-- WECHAT MINI-PROGRAM CUSTOM TOP HEADER -->
    <view class="wechat-header flex items-center justify-between">
      <view class="text-slate-400 text-[10px] font-bold">📂 微应用端 (uni-app Vue3)</view>
      <view class="header-title"><text class="font-bold">数据治理健康管家</text></view>
      <view class="capsule-placeholder">⚙️ 行动对账</view>
    </view>
    
    <!-- RADAR ROTATING SCROLLER SCANNER -->
    <view class="radar-scan-box p-6 flex flex-col items-center">
      <view class="pulse-ring animate-ping"></view>
      <text class="score text-2xl font-black text-[#07c160]">88% 健康度</text>
    </view>

    <!-- ERP DYNAMIC RULES CORRESPONDENCE -->
    <view class="section-card bg-white p-4 rounded-xl shadow-sm">
      <view class="title font-bold text-xs mb-2">🔑 物理主键必选必填校验 (同步配置 ${completenessFields.length} 项):</view>
      <view class="tags-row flex flex-wrap gap-2">
        ${completenessFields.map(f => `<text class="tag-cell bg-[#edfbf3] text-[#07c160] px-2 py-1 text-[20rpx] rounded mr-2 mb-2 font-mono">${f}</text>`).join('')}
      </view>
    </view>

    <!-- UNIQUENESS MULTI-CODE DEFENSE COMBINATIONS -->
    <view class="section-card bg-white p-4 rounded-xl shadow-sm mt-3">
      <view class="title font-bold text-xs mb-2">🛡️ 防重一物多码过滤组合 (同步配置 ${uniquenessGroups.length} 组):</view>
      <view class="combinations-column space-y-2">
        ${uniquenessGroups.map(g => `<view class="combo-item py-1.5 border-b border-slate-100 text-[22rpx] text-slate-700 font-mono">☑️ ${g.join(' + ')}</view>`).join('')}
      </view>
    </view>

    <!-- AI AGENT CHAT OVERVIEW -->
    <view class="section-card bg-white p-4 rounded-xl shadow-sm mt-3 flex items-center gap-2">
      <text class="text-xs">💬 AI大语言模型对齐引擎: 已就绪</text>
    </view>

  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const healthScore = ref(88);
const selectedPartitions = ref(${JSON.stringify(selectedCats)});
const currentEngineStatus = ref('NORMAL');

const runLocalAudit = () => {
  console.log('正在执行物理表检查...');
};
</script>

<style>
/* 微信高仿真原生布局重写 */
page { 
  background-color: #F7F7F7; 
  font-family: -apple-system, sans-serif;
}
.tag-cell {
  background: #edfbf3;
  color: #07c160;
  border: 1rpx solid #bfeecf;
}
.section-card {
  border: 1rpx solid #efefef;
}
</style>`;
};

const getUniappPagesJson = () => `{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationStyle": "custom",
        "enablePullDownRefresh": false
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "主数据质量健康管家",
    "navigationBarBackgroundColor": "#FFFFFF",
    "backgroundColor": "#F7F7F7"
  }
}`;

const getUniappAppVue = () => `<script>
export default {
  onLaunch: function() { console.log('App Launch'); },
  onShow: function() { console.log('App Show'); },
  onHide: function() { console.log('App Hide'); }
}
</script>
<style>
@import url("https://unpkg.com/@tailwindcss/browser@4");
page {
  background-color: #f7f7f7;
  color: #333333;
}
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
}
</style>`;

const getUniappPackageJson = () => `{
  "name": "data-health-steward-uniapp",
  "version": "1.0.0",
  "description": "物料主数据治理健康管家 - 微信小程序 (uni-app Vue 3 极速重构版)",
  "scripts": {
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:mp-weixin": "uni build -p mp-weixin"
  },
  "dependencies": {
    "vue": "^3.3.0"
  },
  "devDependencies": {
    "@dcloudio/vite-plugin-uni": "^3.0.0",
    "vite": "^4.0.0"
  }
}`;

const getUniappMainJs = () => `import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}`;

const getUniappReadme = () => `# 微信小程序 / uni-app 移动端运行指南 (主数据健康管家)

为了完美的符合手机版的跨平台性能，我们采用 Vue 3.x 开发了完整的 uni-app 小程序包。

## 🛠️ 环境准备与快速启动

### 准备工作：
1. **下载安装 HBuilderX**: 官方安装 HBuilderX 编译器。
2. **下载并开启微信开发者工具安全端口**:
   - 打开微信开发者工具 -> 【设置】 -> 【安全设置】 -> 【启用服务端口】。

### 编译调取运行：
1. 进入 HBuilderX -> 选择左上角文件菜单的【导入】 -> 【从本地目录导入】，引入 \`/uniapp-mobile\` 项目文件夹。
2. 点击顶部菜单栏 of the HBuilderX -> 【运行】 -> 【运行到小程序模拟器】 -> 【微信开发者工具】。
3. 系统将后台自动进行 NPM 构建，并为您拉起微信客户端。

## ✨ 技术特色
- **物理打标签**: 所有字段均采用微信最简 WXML/WXSS 标准对仗。
- **免除字体加载乱码**: 图标均为精细 SVG，100% 离线完美呈现实体。
`;

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
  const [settingsSubTab, setSettingsSubTab] = useState<'completeness' | 'uniqueness' | 'accuracy' | 'compliance' | 'weights' | 'uniapp'>('completeness');

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
  const [selectedUniappFile, setSelectedUniappFile] = useState<string>('index.vue');
  const [copiedFile, setCopiedFile] = useState<boolean>(false);

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

  // 1:1 Search & Configuration States for the 4 quality indicators
  const [completenessSearchQuery, setCompletenessSearchQuery] = useState('');
  const [uniquenessSearchQuery, setUniquenessSearchQuery] = useState('');
  
  // Accuracy rules dynamic state
  const [accuracyRules, setAccuracyRules] = useState<any[]>([
    { 
      id: 'rule-1', 
      type: 'physical', 
      title: 'BRGEW > NTGEW 常识对等控制', 
      desc: '验证物理毛重项目必须大于对应的自选净重字段，防范逻辑越界', 
      config: { fieldA: 'BRGEW', operator: '>', fieldB: 'NTGEW' } 
    },
    { 
      id: 'rule-2', 
      type: 'mapping', 
      title: '物料类型 (MTART) 与评估类 (BKLAS) 关联映射', 
      desc: '若物料类型为 ROH（原材料），校验对应工厂评估类是否属于 3000 主流范围', 
      config: { ifField: 'MTART', ifValue: 'ROH', thenField: 'BKLAS', thenOperator: '==', thenValue: '3000' } 
    }
  ]);
  
  // Accuracy Knowledge file states
  const [accuracySearchQuery, setAccuracySearchQuery] = useState('');
  const [accuracyDocs, setAccuracyDocs] = useState([
    { id: 'acc1', name: '物料主数据规范_v2.pdf', active: true }
  ]);
  const [showAccuracyExtracted, setShowAccuracyExtracted] = useState(true);
  const [accuracySelectedRuleId, setAccuracySelectedRuleId] = useState<string | null>(null);

  // Compliance Dual-ring document states
  const [complianceActiveFilter, setComplianceActiveFilter] = useState<'external' | 'internal' | null>(null);
  const [complianceDocs, setComplianceDocs] = useState({
    external: [
      { id: 'ext1', name: '2026海关税则目录.pdf', rules: 2 },
      { id: 'ext2', name: 'RoHS环保标准指引.docx', rules: 2 }
    ],
    internal: [
      { id: 'int1', name: '主数据命名规范_V3.pdf', rules: 2 },
      { id: 'int2', name: '物料与图纸关联管理办法.docx', rules: 1 }
    ]
  });
  const [complianceRulesList, setComplianceRulesList] = useState<any[]>([
    { 
      id: 'r1', 
      type: 'external', 
      title: '海关税号 (STEUC) 有效性校验', 
      desc: '验证申报税号是否属于 2026 最新进出口税则目录范围', 
      action: 'API 模糊匹配',
      logic: '将企业物料的 Steuer-ID 与 2026 海关税则数据库进行对撞。若匹配度低于 95% 或税号已失效，则标记为违规。',
      sourceDoc: '2026海关税则目录.pdf',
      severity: '致命 (Blocking)'
    },
    { 
      id: 'r5', 
      type: 'external', 
      title: 'HS Code 归类一致性审计', 
      desc: '检查相同类别的物料是否使用了统一的统计编码', 
      action: '聚类分析',
      logic: '通过 AI 对 MATKL (物料组) 进行聚类，检测群组内的 HS Code 离散度。方差过大则提示归类风险。',
      sourceDoc: '2026海关税则目录.pdf',
      severity: '高危 (Critical)'
    },
    { 
      id: 'r2', 
      type: 'external', 
      title: '环保认证有效期库', 
      desc: '检查物料是否有最新环保认证', 
      action: '跨系统验证',
      logic: '抓取 SRM 系统中的供应商证书附件，识别 RoHS/REACH 证书的截止日期。若日期小于当前时间，则自动触发冻结状态。',
      sourceDoc: 'RoHS环保标准指引.docx',
      severity: '高危 (Critical)'
    },
    { 
      id: 'r6', 
      type: 'external', 
      title: '有害物质清单 (SoP) 强控', 
      desc: '核对物料 BMG (成分清单) 是否包含禁限物质', 
      action: '物性对撞',
      logic: '比对成分清单与 RoHS 6+10 物质限值。',
      sourceDoc: 'RoHS环保标准指引.docx',
      severity: '致命 (Blocking)'
    },
    { 
      id: 'r3', 
      type: 'internal', 
      title: '命名规范逻辑检查', 
      desc: '验证描述结构物料是否符合“品名+规格”的顺序', 
      action: 'LLM 语义分析',
      logic: '利用大模型对 MAKTX 字段进行语义分词。验证分词结构是否满足 [Noun] + [Spec] + [Material] 的排列模型。针对不匹配项给出修复建议。',
      sourceDoc: '主数据命名规范_V3.pdf',
      severity: '中危 (Medium)'
    },
    { 
      id: 'r7', 
      type: 'internal', 
      title: '单位 (MEINS) 与描述逻辑匹配', 
      desc: '检查基本计量单位是否与其物理属性（重量、长度、件数）一致', 
      action: '逻辑推演',
      logic: '若描述包含 "电缆", 单位应为 "M" 或 "FT"，而非 "EA"。若不符则标记为属性错乱。',
      sourceDoc: '主数据命名规范_V3.pdf',
      severity: '高危 (Critical)'
    },
    { 
      id: 'r4', 
      type: 'internal', 
      title: '图纸附件关联系统检查', 
      desc: '核心生产物料关联图纸是否齐全', 
      action: '关联性校验',
      logic: '查询 PLM 系统的物料关联清单 (EBOM)。若物料属性为 "Make" 且关联文档列表为空，则记录为完整性缺失。',
      sourceDoc: '物料与图纸关联管理办法.docx',
      severity: '警告 (Warning)'
    }
  ]);
  const [complianceActiveSelectedRuleId, setComplianceActiveSelectedRuleId] = useState<string | null>(null);
  const [complianceActiveSelectedFileDoc, setComplianceActiveSelectedFileDoc] = useState<string | null>(null);

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

  const getWeChatNavBarTitle = () => {
    if (activeTab === 'home') {
      if (viewingIssueDetails) return '质量缺陷诊断会诊';
      if (selectedMetricDetail) return `指标诊断: ${selectedMetricDetail.name}`;
      if (isAllIssuesOpen) return '物理数据质量异常全景';
      if (homeSubView === 'diagnosis') return '关键问题诊断';
      if (homeSubView === 'policies') return '自动修复策略';
      return '数据治理健康管家';
    }
    if (activeTab === 'ai') return 'AI 数据助手';
    if (activeTab === 'settings') {
      if (selectedSettingPartition === 'completeness') return '完整性规则校验';
      if (selectedSettingPartition === 'uniqueness') return '唯一性防重主键';
      if (selectedSettingPartition === 'accuracy') return '准确性常识校验';
      if (selectedSettingPartition === 'compliance') return '合规性内外双环';
      if (selectedSettingPartition === 'uniapp') return '小程序源码工作台';
      return '规则配置引擎';
    }
    if (activeTab === 'profile') return '个人中心';
    return '微小程序';
  };

  return (
    <div className="w-full min-h-screen bg-[#f7f7f7] text-slate-800 flex flex-col overflow-hidden relative select-none font-sans">
      
      {/* WECHAT MINI-PROGRAM NATIVE TOP BAR */}
      <div className="bg-white border-b border-slate-100/80 h-14 shrink-0 flex items-center justify-between px-4 sticky top-0 z-50">
        {/* Left item - back button representation */}
        <div className="w-20 flex items-center">
          {((activeTab === 'home' && (viewingIssueDetails || selectedMetricDetail || isAllIssuesOpen || homeSubView !== 'main')) ||
            (activeTab === 'settings' && selectedSettingPartition !== null)) ? (
            <button
              onClick={() => {
                if (activeTab === 'home') {
                  if (viewingIssueDetails) setViewingIssueDetails(null);
                  else if (selectedMetricDetail) setSelectedMetricDetail(null);
                  else if (isAllIssuesOpen) setIsAllIssuesOpen(false);
                  else setHomeSubView('main');
                } else if (activeTab === 'settings') {
                  setSelectedSettingPartition(null);
                }
              }}
              className="flex items-center gap-0.5 text-[#111111] hover:opacity-70 active:scale-95 transition-all text-xs font-bold select-none border-0 bg-transparent cursor-pointer"
            >
              <ChevronLeft size={18} className="stroke-[2.5]" />
              <span>返回</span>
            </button>
          ) : (
            <button
              onClick={onBackToDesktop}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors select-none text-[10px] font-black tracking-tight border-0 bg-transparent cursor-pointer"
              title="切换到电脑端"
            >
              <Laptop size={13} />
              <span>桌面端</span>
            </button>
          )}
        </div>

        {/* WeChat Centered Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <span className="text-[13.5px] font-bold text-[#111111] tracking-tight truncate max-w-[150px]">
            {getWeChatNavBarTitle()}
          </span>
        </div>

        {/* WeChat Pill Capsule */}
        <div className="flex items-center">
          <div className="border border-slate-200 bg-white/90 rounded-full px-2.5 h-7 flex items-center gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] select-none">
            {/* Dots */}
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-1 bg-[#111] rounded-full" />
              <span className="w-1.25 h-1.25 bg-[#111] rounded-full" />
              <span className="w-1 h-1 bg-[#111] rounded-full" />
            </div>
            {/* Splitter */}
            <span className="w-[1px] h-3 bg-slate-200" />
            {/* Circle ring */}
            <button
              onClick={onLogout}
              className="flex items-center justify-center p-0 w-3.5 h-3.5 rounded-full border border-slate-800 bg-transparent flex-shrink-0 relative active:scale-90 transition-all cursor-pointer"
              title="安全退出"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </button>
          </div>
        </div>
      </div>

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
          <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-[#f7f7f7] h-full w-full">
            {viewingIssueDetails ? (
              /* SECOND LEVEL VIEW: QUALITY ISSUE DETAILS PROBE */
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-[#f7f7f7] h-full w-full relative">
                {/* Form Content Scrolling Area */}
                <div className="flex-grow overflow-y-auto px-5 py-5 space-y-4 pb-6 scrollbar-hide bg-transparent">
                  
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
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-[#f7f7f7] h-full w-full relative">
                {/* Scroll content list */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20 scrollbar-hide bg-transparent">
                  {/* WeChat-style Quick Summary & Export Action Bar */}
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                    <div className="space-y-0.5 pr-2">
                      <h4 className="text-xs font-bold text-slate-850">质量全景实抄对仗表</h4>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">共检测出 {issues.length} 条物理字段违规</p>
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
                      className="p-1.5 px-3 bg-[#07c160] hover:opacity-90 active:scale-95 text-white rounded-xl text-[10px] font-bold border-0 flex items-center gap-1 transition-all cursor-pointer shadow-sm select-none"
                    >
                      <RefreshCw size={11} className="text-white animate-spin-slow animate-duration-3000" />
                      <span>导出 CSV 报表</span>
                    </button>
                  </div>
                  
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
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-[#f7f7f7] h-full w-full relative">

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
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 shadow-3xs">
                    <Info className="flex-shrink-0 text-blue-500 mt-0.5" size={16} />
                    <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                      {selectedMetricDetail.calculationDetails?.description}
                    </p>
                  </div>

                  {/* METRIC ACTIONS BUTTON GRID (ALIGNED WITH WEB) */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setSelectedMetricDetail(null);
                      }}
                      className="py-2.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-3xs cursor-pointer"
                    >
                      <Settings size={13} className="text-slate-600 shrink-0" />
                      <span className="text-[10px] font-black text-slate-800 whitespace-nowrap">去规则配置</span>
                    </button>

                    <button
                      onClick={handleRunSelectedMetricRule}
                      className="py-2.5 px-2 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100/80 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-3xs cursor-pointer"
                    >
                      <Play size={12} className="text-indigo-600 shrink-0" fill="currentColor" />
                      <span className="text-[10px] font-black text-indigo-900 whitespace-nowrap">运行规则</span>
                    </button>

                    <button
                      onClick={() => setIsTrendChartModalOpen(true)}
                      className="py-2.5 px-2 bg-blue-50/70 hover:bg-blue-100 border border-blue-100/80 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-3xs cursor-pointer"
                    >
                      <TrendingUp size={13} className="text-blue-600 shrink-0" />
                      <span className="text-[10px] font-black text-blue-900 whitespace-nowrap">查看趋势图</span>
                    </button>
                  </div>

                  {/* Calculation Process (Exactly matching Web side details of MetricDetailModal) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3.5">
                    <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Calculator size={14} className="text-slate-500" />
                      <span>计算逻辑与过程</span>
                    </h5>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">计算公式</span>
                      <div className="font-mono text-[10px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 break-all leading-normal">
                        {selectedMetricDetail.calculationDetails?.formula}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-2 bg-slate-50 border border-slate-100/80 rounded-xl">
                        <div className="text-[8px] text-slate-500 mb-0.5 font-bold truncate">
                          {selectedMetricDetail.calculationDetails?.numerator?.label}
                        </div>
                        <div className="text-[13px] font-black text-slate-800 font-mono">
                          {selectedMetricDetail.calculationDetails?.numerator?.value?.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center text-slate-300">
                        <span className="text-xl">/</span>
                      </div>
                      
                      <div className="p-2 bg-slate-50 border border-slate-100/80 rounded-xl">
                        <div className="text-[8px] text-slate-500 mb-0.5 font-bold truncate">
                          {selectedMetricDetail.calculationDetails?.denominator?.label}
                        </div>
                        <div className="text-[13px] font-black text-slate-800 font-mono">
                          {selectedMetricDetail.calculationDetails?.denominator?.value?.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
                      <span className="font-black text-slate-600">指标得分</span>
                      <span className="text-[15px] font-black font-mono text-[#07c160]">
                        {selectedMetricDetail.score}%
                      </span>
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
              
              <div className="grid grid-cols-2 gap-4">
                {metrics.map(metric => {
                  const isSelected = selectedMetricDetail && selectedMetricDetail.name === metric.name;
                  const parts = metric.name.split(' ');
                  const mainName = parts[0] || metric.name;
                  const subName = parts.slice(1).join(' ').replace(/[()]/g, '') || '';
                  
                  return (
                    <div 
                      key={metric.name}
                      onClick={() => setSelectedMetricDetail(metric)}
                      className={`p-4 bg-white border border-slate-150/80 rounded-3xl cursor-pointer transition-all active:scale-97 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between space-y-3.5 relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.015)]`}
                    >
                      {/* Top Row: Icon Container and Trend Indicator */}
                      <div className="flex justify-between items-center w-full">
                        <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                          metric.name.includes('完整性') ? 'bg-emerald-50 text-emerald-600' :
                          metric.name.includes('唯一性') ? 'bg-indigo-50 text-indigo-600' :
                          metric.name.includes('准确性') ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {getMetricIcon(metric.name)}
                        </div>
                        
                        {/* Elegant trend indicator */}
                        <div className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-bold tracking-tight flex items-center gap-0.5 ${
                          metric.trend === 'up' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30' :
                          metric.trend === 'down' ? 'bg-rose-50 text-rose-650 border border-rose-100/30' :
                          'bg-slate-50 text-slate-400 border border-slate-100/30'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            metric.trend === 'up' ? 'bg-emerald-500 animate-pulse' :
                            metric.trend === 'down' ? 'bg-rose-500 animate-pulse' :
                            'bg-slate-300'
                          }`}></span>
                          <span>{metric.trend === 'up' ? '提升' : metric.trend === 'down' ? '需关注' : '稳定'}</span>
                        </div>
                      </div>

                      {/* Middle Row: Score Display & Evaluation Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">{metric.score}</span>
                          <span className="text-[10px] text-slate-400 font-bold">分</span>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${
                          metric.score >= 90 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                          metric.score >= 80 ? 'bg-blue-50 text-blue-600 border border-blue-100/50' :
                          'bg-amber-50 text-amber-600 border border-amber-100/50'
                        }`}>
                          {metric.score >= 90 ? '卓越' : metric.score >= 80 ? '良好' : '待提升'}
                        </span>
                      </div>

                      {/* Stacked Labels Row: Chinese primary, English subtitle without paren/truncation limits */}
                      <div className="space-y-0.5 text-left min-w-0">
                        <h4 className="text-[13.5px] font-black text-slate-800 truncate">
                          {mainName}
                        </h4>
                        {subName && (
                          <p className="text-[8.5px] text-slate-400 font-bold font-mono tracking-wider uppercase truncate leading-none">
                            {subName}
                          </p>
                        )}
                      </div>

                      {/* Bottom Row: Theme-matched beautiful progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            metric.name.includes('完整性') ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                            metric.name.includes('唯一性') ? 'bg-gradient-to-r from-indigo-400 to-purple-500' :
                            metric.name.includes('准确性') ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                            'bg-gradient-to-r from-blue-400 to-sky-500'
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
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-[#f7f7f7] h-full w-full">
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
              <div className="flex-grow overflow-hidden flex flex-col pt-0 animate-fade-in bg-[#f7f7f7] h-full w-full">
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
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-100 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: SETTINGS (RULES MATRIX CENTER) */}
        {activeTab === 'settings' && (
          <div className="flex-grow overflow-hidden flex flex-col pt-0 bg-[#f7f7f7] h-full w-full">
            {selectedSettingPartition === null ? (
              /* WeChat Operational Cell-Group style settings */
              <div className="flex-grow overflow-y-auto px-4 py-4 pb-8 scrollbar-hide space-y-4 animate-fade-in text-slate-800">
                
                {/* WeChat Operation Group Label */}
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide px-1">
                  数据质量核心规则配置
                </div>

                {/* Unified WeChat Cell Group Container */}
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 divide-y divide-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  {[
                    {
                      id: 'completeness',
                      name: '指标完整性规则配置',
                      nameEn: 'Completeness',
                      icon: <CheckCircle2 size={16} className="text-[#07c160]" />,
                      color: 'bg-emerald-50 text-[#07c160]',
                      desc: '指定必填物理字段校验范围，全面覆盖物料基础数据、采购销售及财务图纸。',
                      activeRules: `${completenessKeyFields.length} 项必填字段生效中`,
                    },
                    {
                      id: 'uniqueness',
                      name: '指标唯一性规则配置',
                      nameEn: 'Uniqueness',
                      icon: <Layers size={16} className="text-blue-500" />,
                      color: 'bg-blue-50 text-blue-500',
                      desc: '自定义物料重复性组合校验主键，智能拦截名称、型号、图纸等高相似记录。',
                      activeRules: `${uniquenessKeyFields.length} 组联合唯一标识工作正常`,
                    },
                    {
                      id: 'accuracy',
                      name: '指标准确性规则配置',
                      nameEn: 'Accuracy',
                      icon: <Activity size={16} className="text-amber-500" />,
                      color: 'bg-amber-50 text-amber-550',
                      desc: '管控物理值域极极限值或常识校验，实时拦截倒挂，保障属性可信度。',
                      activeRules: '物理边界限制、毛重常识等 3 大算子稳定监视',
                    },
                    {
                      id: 'compliance',
                      name: '指标合规性规则配置',
                      nameEn: 'Compliance',
                      icon: <ShieldCheck size={16} className="text-violet-500" />,
                      color: 'bg-violet-50 text-violet-500',
                      desc: 'AI 提取双向海关法治红线及 RoHS 成分审核对账。',
                      activeRules: '对外红线对撞、RoHS环保及英文命名等安全红线启用',
                    }
                  ].map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setSettingsSubTab(mod.id as any);
                        setSelectedSettingPartition(mod.id as any);
                      }}
                      className="w-full text-left p-4 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer border-0 active:scale-[0.99] focus:outline-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mod.color}`}>
                          {mod.icon}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">{mod.name}</span>
                            <span className="px-1 py-0.2 bg-slate-100 text-slate-400 border border-slate-200/60 rounded text-[7px] font-mono uppercase">
                              {mod.nameEn}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed line-clamp-1">
                            {mod.desc}
                          </p>
                          <span className="text-[8.5px] text-[#07c160] bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.2 rounded font-semibold block w-fit mt-1">
                            {mod.activeRules}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-350 shrink-0" />
                    </button>
                  ))}

                </div>

              </div>
            ) : (
              // SECONDARY LEVEL VIEW: INDIVIDUAL INDICATOR RULES CUSTOMIZATION (二级质量指标设置页面)
              <div className="flex-grow overflow-hidden flex flex-col bg-[#f7f7f7] animate-fade-in">
                {/* Rules Customization details area */}
                <div className="flex-grow overflow-y-auto px-5 py-4 pb-6 scrollbar-hide space-y-4">

                  {/* 1. COMPLETENESS CHECKLIST */}
                  {settingsSubTab === 'completeness' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Web View Header Translation Card */}
                      <div className="bg-gradient-to-br from-emerald-50/50 via-white to-white rounded-2xl border border-slate-200/80 p-4 shadow-3xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-[#07c160]" />
                          <h3 className="text-xs font-black text-slate-800 leading-tight">配置关键属性 (完整性校验)</h3>
                        </div>
                        <p className="text-[9.5px] text-slate-500 font-bold leading-relaxed">
                          勾选的字段将被视为关键字段。如果记录中任意一个关键字段为空，则该记录将被判定为不完整。
                        </p>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-3xs space-y-3.5 animate-fade-in animate-duration-150">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-[#07c160]" />
                            <span>1. 物理字段完整性强控目录</span>
                          </span>
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black border border-emerald-100/50">
                            {completenessKeyFields.length} 项必填已生效
                          </span>
                        </div>

                        {/* Search and Tool Buttons */}
                        <div className="space-y-2.5">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="轻触检索 70+ 核心工业字典字段及描述..."
                              value={completenessSearchQuery}
                              onChange={(e) => setCompletenessSearchQuery(e.target.value)}
                              className="w-full text-[10px] px-3.5 py-2 border border-slate-250 bg-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all shadow-3xs text-slate-800"
                            />
                            {completenessSearchQuery && (
                              <button 
                                onClick={() => setCompletenessSearchQuery('')}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                              >
                                清除
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onSaveCompletenessFields(MARA_FIELDS);
                              }}
                              className="flex-1 text-[10px] font-black text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100/50 transition-colors cursor-pointer text-center"
                            >
                              全选
                            </button>
                            <button
                              onClick={() => {
                                onSaveCompletenessFields([]);
                              }}
                              className="flex-1 text-[10px] font-black text-rose-600 bg-rose-50 py-2 rounded-xl border border-rose-200 hover:bg-rose-100/50 transition-colors cursor-pointer text-center"
                            >
                              取消全选
                            </button>
                          </div>
                        </div>

                        {/* Flat Field List */}
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {MARA_FIELDS.filter(field => 
                              field.toLowerCase().includes(completenessSearchQuery.toLowerCase()) ||
                              (MARA_FIELD_DESCRIPTIONS[field] || '').toLowerCase().includes(completenessSearchQuery.toLowerCase())
                            ).map(field => {
                              const isChecked = completenessKeyFields.includes(field);
                              const desc = MARA_FIELD_DESCRIPTIONS[field] || field;
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
                                      ? 'border-blue-500 bg-blue-50/50 shadow-3xs text-blue-600' 
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-3xs'
                                  }`}
                                >
                                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                                    isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isChecked && <Check size={10} />}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={`truncate font-mono text-[9.5px] ${isChecked ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>
                                      {field}
                                    </span>
                                    <span className={`text-[7.5px] truncate mt-0.5 leading-none ${isChecked ? 'text-blue-600' : 'text-slate-500'}`}>
                                      {desc}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. UNIQUENESS CHECKLIST */}
                  {settingsSubTab === 'uniqueness' && (
                    <div className="space-y-4 animate-fade-in animate-duration-150">
                      {/* Web View Header Translation Card */}
                      <div className="bg-gradient-to-br from-blue-50/50 via-white to-white rounded-2xl border border-slate-200/80 p-4 shadow-3xs space-y-1.5 animate-fade-in animate-duration-150">
                        <div className="flex items-center gap-2">
                          <Layers size={15} className="text-blue-500" />
                          <h3 className="text-xs font-black text-slate-800 leading-tight">配置关键属性 (唯一性校验)</h3>
                        </div>
                        <p className="text-[9.5px] text-slate-500 font-bold leading-relaxed">
                          通过勾选字段并添加为“唯一性规则”（单字段或复合键）来确保数据不重复。
                        </p>
                      </div>

                      {/* Active Rules List */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Layers size={13} className="text-indigo-500" />
                            <span>1. 一物多码防重主键规则 (Active Rules)</span>
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
                              <div className="flex flex-col gap-1 min-w-0 flex-1 pr-2">
                                <div className="text-[8px] uppercase font-black text-slate-400 tracking-wider">
                                  {group.length > 1 ? '复合关联物理主键 (Composite Key)' : '单维唯一性控制 (Single Key)'}
                                </div>
                                <div className="flex flex-wrap items-center gap-1 min-w-0">
                                  {group.map((f, compIdx) => (
                                    <React.Fragment key={compIdx}>
                                      <span className="text-[9px] font-mono font-bold text-[#312e81] bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 rounded shadow-3xs">
                                        {f} ({MARA_FIELD_DESCRIPTIONS[f] || f})
                                      </span>
                                      {compIdx < group.length - 1 && <span className="text-indigo-400 text-xs">+</span>}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const updated = uniquenessKeyFields.filter((_, i) => i !== index);
                                  onSaveUniquenessFields(updated);
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100/50 shadow-3xs cursor-pointer active:scale-95 shrink-0 animate-fade-in"
                                title="删除此规则"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rule Creation builder */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs animate-fade-in">
                        <div>
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Plus size={13} className="text-blue-500" />
                            <span>2. 拼装防重/复合物理主键 (1:1 工作台)</span>
                          </span>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">
                            在下方快捷筛选中轻触需要合并字段，点击下方按钮一键打包配置。
                          </p>
                        </div>

                        {/* Search and Selection building Area */}
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="检索 70+ 内核字根字段（如 MATNR 或 MAKTX）..."
                              value={uniquenessSearchQuery}
                              onChange={(e) => setUniquenessSearchQuery(e.target.value)}
                              className="w-full text-[10px] px-3.5 py-2 border border-slate-250 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all shadow-3xs"
                            />
                            {uniquenessSearchQuery && (
                              <button 
                                onClick={() => setUniquenessSearchQuery('')}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
                              >
                                清除
                              </button>
                            )}
                          </div>

                          {/* Selected fields tags pending creation */}
                          <div className="flex flex-wrap gap-1.5 p-2.5 bg-indigo-50/20 rounded-xl min-h-[44px] items-center border border-dashed border-indigo-200">
                            {isBuildingGroup.length === 0 ? (
                              <div className="flex items-center gap-1 pl-1 text-[9px] text-indigo-500 font-bold">
                                <Info size={11} />
                                <span>组合框临时清空：请点击下方字段组件加入拼装...</span>
                              </div>
                            ) : (
                              isBuildingGroup.map(field => (
                                <span key={field} className="flex items-center gap-1 bg-blue-100 text-[#1d4ed8] text-[8.5px] px-1.5 py-0.5 rounded font-black border border-blue-200 shadow-3xs animate-fade-in font-mono">
                                  {field} ({MARA_FIELD_DESCRIPTIONS[field] || '未知'})
                                  <button onClick={() => setIsBuildingGroup(isBuildingGroup.filter(f => f !== field))}>
                                    <X size={9} className="hover:text-red-500 shrink-0 cursor-pointer" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Tool Buttons for Builder Selection */}
                        {isBuildingGroup.length > 0 && (
                          <button
                            onClick={() => setIsBuildingGroup([])}
                            className="w-full py-1.5 border border-indigo-200 text-indigo-600 bg-indigo-50/50 text-[9.5px] font-black rounded-xl hover:bg-indigo-100/30 transition-colors cursor-pointer"
                          >
                            清空当前已选项
                          </button>
                        )}

                        {/* List of selectables (searchable Candidates from entire MARA_FIELDS) */}
                        <div className="space-y-2">
                          <p className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider">可选字段候选池 (点击可多选或反选)</p>
                          <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                            {MARA_FIELDS
                              .filter(f => 
                                f.toLowerCase().includes(uniquenessSearchQuery.toLowerCase()) ||
                                (MARA_FIELD_DESCRIPTIONS[f] || '').toLowerCase().includes(uniquenessSearchQuery.toLowerCase())
                              )
                              .map(f => {
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
                                    className={`p-2 text-[9.5px] font-black rounded-xl border text-left truncate transition-all cursor-pointer flex flex-col justify-center shadow-3xs ${
                                      selected 
                                        ? 'bg-blue-50 text-blue-600 border-blue-300 ring-1 ring-blue-100' 
                                        : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                                    }`}
                                    title={MARA_FIELD_DESCRIPTIONS[f] || f}
                                  >
                                    <div className="font-mono text-[10px] text-slate-800">{f}</div>
                                    <div className="text-[7.5px] text-slate-500 opacity-80 truncate mt-0.5 leading-none">{MARA_FIELD_DESCRIPTIONS[f] || f}</div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* Create action button */}
                        <button
                          onClick={() => {
                            if (isBuildingGroup.length === 0) return;
                            const sortedNew = [...isBuildingGroup].sort().join('|');
                            const exists = uniquenessKeyFields.some(g => [...g].sort().join('|') === sortedNew);
                            if (!exists) {
                              onSaveUniquenessFields([...uniquenessKeyFields, [...isBuildingGroup]]);
                            }
                            setIsBuildingGroup([]);
                          }}
                          disabled={isBuildingGroup.length === 0}
                          className="w-full mt-1.5 py-2.5 hover:bg-blue-700 text-white bg-blue-600 text-[10px] font-black rounded-xl shadow-xs hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} /> 
                          确认并将拼装字段添加为防重规则
                        </button>
                      </div>
                    </div>
                  )}


                  {/* 3. ACCURACY CHECKLIST */}
                  {settingsSubTab === 'accuracy' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Web View Header Translation Card */}
                      <div className="bg-gradient-to-br from-amber-50/50 via-white to-white rounded-2xl border border-slate-200/80 p-4 shadow-3xs space-y-1.5 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Activity size={15} className="text-amber-500" />
                          <h3 className="text-xs font-black text-slate-800 leading-tight">准确性配置工作台 (Accuracy Config Studio)</h3>
                        </div>
                        <p className="text-[9.5px] text-slate-500 font-bold leading-relaxed">
                          定义数据准确性校验规则，支持 AI 知识注入与实时模拟。
                        </p>
                      </div>

                      {/* Section 1: Ingestion Knowledge Files & AI extraction Rules */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Database size={13} className="text-amber-500" />
                            <span>1. 关联认知注入区 (Knowledge Files)</span>
                          </span>
                          <span className="text-[9px] font-bold text-amber-600 font-mono">1 份规约已载入</span>
                        </div>

                        {/* Drag and Drop Box Mock */}
                        <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors">
                          <Wand2 size={16} className="text-amber-500 mb-1" />
                          <span className="text-[9px] font-bold text-slate-600">点击或将工业参数文档拖入此处</span>
                          <span className="text-[7.5px] text-slate-400 mt-0.5">AI 将实时解析提炼对等映射和控制公式</span>
                        </div>

                        {/* Ingested File Details */}
                        <div className="space-y-2">
                          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/50">
                              <span className="text-[9.5px] font-black text-slate-700 flex items-center gap-1">
                                <CheckCircle2 size={11} className="text-emerald-500" />
                                <span>物料主数据规范_v2.pdf</span>
                              </span>
                              <span className="text-[8px] font-mono bg-amber-50 text-amber-700 px-1 border border-amber-100 rounded">AI 核心提炼 4 条</span>
                            </div>

                            {/* Extracted Rules Under Pdf */}
                            <div className="space-y-1.5">
                              {/* Rule Item 1 */}
                              <div className="p-1.5 bg-white border border-slate-200/60 rounded-lg flex items-center justify-between text-[9px]">
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-[#475569]">物料类型 ➔ 评估类约束 (Mapping)</div>
                                  <div className="font-mono text-[8px] text-slate-400">MTART="ROH" ➔ BKLAS="3000"</div>
                                </div>
                                <button
                                  onClick={() => {
                                    const exists = accuracyRules.some(r => r.id === 'rule-extracted-1');
                                    if (!exists) {
                                      setAccuracyRules([...accuracyRules, {
                                        id: 'rule-extracted-1',
                                        type: 'mapping',
                                        title: '物料类型 ROH 与评估类 3000 一致性',
                                        desc: '由 AI 自动生成自 "物料主数据规范_v2.pdf"',
                                        config: { ifField: 'MTART', ifValue: 'ROH', thenField: 'BKLAS', thenOperator: '==', thenValue: '3000' }
                                      }]);
                                    }
                                  }}
                                  className="text-[8px] px-1.5 py-0.5 font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded hover:bg-emerald-100/50 transition-colors"
                                >
                                  点选导入
                                </button>
                              </div>

                              {/* Rule Item 2 */}
                              <div className="p-1.5 bg-white border border-slate-200/60 rounded-lg flex items-center justify-between text-[9px]">
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-[#475569]">重量对等逻辑公式 (Constraint)</div>
                                  <div className="font-mono text-[8px] text-slate-400">NTGEW &lt; BRGEW (净重应低于毛重)</div>
                                </div>
                                <button
                                  onClick={() => {
                                    const exists = accuracyRules.some(r => r.id === 'rule-extracted-2');
                                    if (!exists) {
                                      setAccuracyRules([...accuracyRules, {
                                        id: 'rule-extracted-2',
                                        type: 'physical',
                                        title: '物理毛净重常识边界检验',
                                        desc: 'AI 抽取自 "物料主数据规范_v2.pdf"',
                                        config: { fieldA: 'NTGEW', operator: '<', fieldB: 'BRGEW' }
                                      }]);
                                    }
                                  }}
                                  className="text-[8px] px-1.5 py-0.5 font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded hover:bg-emerald-100/50 transition-colors"
                                >
                                  点选导入
                                </button>
                              </div>

                              {/* Rule Item 3 */}
                              <div className="p-1.5 bg-white border border-slate-200/60 rounded-lg flex items-center justify-between text-[9px]">
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-[#475569]">物料组与利润中心规范 (Mapping)</div>
                                  <div className="font-mono text-[8px] text-slate-400">MATKL="1001" ➔ PRCTR="P100"</div>
                                </div>
                                <button
                                  onClick={() => {
                                    const exists = accuracyRules.some(r => r.id === 'rule-extracted-3');
                                    if (!exists) {
                                      setAccuracyRules([...accuracyRules, {
                                        id: 'rule-extracted-3',
                                        type: 'mapping',
                                        title: '物料组与利润中心映射校验',
                                        desc: 'AI 提取：校验高价值工业件组是否及时锁定 P100 利润核算中枢',
                                        config: { ifField: 'MATKL', ifValue: '1001', thenField: 'PRCTR', thenOperator: '==', thenValue: 'P100' }
                                      }]);
                                    }
                                  }}
                                  className="text-[8px] px-1.5 py-0.5 font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded hover:bg-emerald-100/50 transition-colors"
                                >
                                  点选导入
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Rule Orchestrator & Operators */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Activity size={13} className="text-amber-500" />
                            <span>2. 规则编排工作流 (Rule Orchestrator)</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 font-mono">{accuracyRules.length} 校验已载入</span>
                        </div>

                        {/* Four Operators buttons */}
                        <div className="space-y-1.5">
                          <p className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider">选择系统预置算子模版 (一键注入规则包)</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { label: '物理常识算子', desc: 'A < B 关系校验', color: 'hover:border-amber-400 hover:bg-amber-50/20 text-amber-700', type: 'physical' },
                              { label: '映射一致算子', desc: 'If A -> Then B 映射', color: 'hover:border-blue-400 hover:bg-blue-50/20 text-blue-700', type: 'mapping' },
                              { label: '语义关联算子', desc: 'AI MAKTX NLP 解析', color: 'hover:border-indigo-400 hover:bg-indigo-50/20 text-indigo-700', type: 'semantic' },
                              { label: '历史离群算子', desc: 'Price +/- 偏离审计', color: 'hover:border-rose-400 hover:bg-rose-50/20 text-rose-700', type: 'outlier' }
                            ].map((op, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const randomId = 'rule-' + Date.now();
                                  let newRule: any = {
                                    id: randomId,
                                    type: op.type,
                                    title: op.label,
                                    desc: `自定义配置的：${op.label}`,
                                  };
                                  if (op.type === 'physical') {
                                    newRule.config = { fieldA: 'LAENG', operator: '>', fieldB: '0' };
                                  } else if (op.type === 'mapping') {
                                    newRule.config = { ifField: 'MTART', ifValue: 'HALB', thenField: 'BKLAS', thenOperator: '==', thenValue: '7920' };
                                  } else if (op.type === 'semantic') {
                                    newRule.config = { field: 'MAKTX', target: 'MATKL', method: 'NLP' };
                                  } else {
                                    newRule.config = { field: 'BRGEW', limitMode: '3-Sigma' };
                                  }
                                  setAccuracyRules([...accuracyRules, newRule]);
                                }}
                                className={`p-2.5 rounded-xl border border-slate-200 bg-white text-left transition-all cursor-pointer shadow-3xs flex flex-col justify-center ${op.color}`}
                              >
                                <div className="text-[9.5px] font-black">{op.label}</div>
                                <div className="text-[7.5px] opacity-75 mt-0.5 leading-none">{op.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rules List rendering */}
                        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                          {accuracyRules.map((rule, idx) => (
                            <div 
                              key={rule.id}
                              className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2 text-[10px]"
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] uppercase font-black tracking-wider text-amber-600 font-mono bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100">
                                    {rule.type === 'physical' ? '物理规则' : rule.type === 'mapping' ? '映射规则' : rule.type === 'semantic' ? '智能 NLP' : '价格离群'}
                                  </span>
                                  <div className="font-extrabold text-slate-850 mt-1">{rule.title}</div>
                                  <div className="text-[8.5px] text-slate-500 font-semibold">{rule.desc}</div>
                                </div>
                                <button
                                  onClick={() => {
                                    setAccuracyRules(accuracyRules.filter(r => r.id !== rule.id));
                                  }}
                                  className="p-1 rounded text-red-500 hover:bg-red-50/50 cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>

                              {/* Rule Config Block Editor */}
                              <div className="p-2 bg-white rounded-lg border border-slate-200/50 space-y-1.5 font-mono text-[9px] text-slate-700">
                                {rule.type === 'physical' && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-800">{rule.config?.fieldA}</span>
                                    <span>{rule.config?.operator}</span>
                                    <span className="font-bold text-slate-800">{rule.config?.fieldB}</span>
                                    <span className="ml-auto text-slate-400 font-sans text-[7.5px] font-black">逻辑公式合法</span>
                                  </div>
                                )}
                                {rule.type === 'mapping' && (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[8px] bg-slate-100 px-1 rounded uppercase text-slate-500 font-sans font-bold">IF</span>
                                      <span className="font-bold text-slate-850">{rule.config?.ifField} == {rule.config?.ifValue}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[8px] bg-slate-100 px-1 rounded uppercase text-slate-500 font-sans font-bold">THEN</span>
                                      <span className="font-bold text-slate-850">{rule.config?.thenField} {rule.config?.thenOperator} {rule.config?.thenValue}</span>
                                    </div>
                                  </div>
                                )}
                                {rule.type === 'semantic' && (
                                  <div className="flex items-center gap-1">
                                    <span>AI 校验</span>
                                    <span className="font-bold text-blue-600">{rule.config?.field}</span>
                                    <span>是否蕴含并贴合</span>
                                    <span className="font-bold text-indigo-600">{rule.config?.target}</span>
                                  </div>
                                )}
                                {rule.type === 'outlier' && (
                                  <div className="flex items-center gap-1">
                                    <span>评估序列</span>
                                    <span className="font-bold text-red-600">{rule.config?.field}</span>
                                    <span>离群识别:</span>
                                    <span className="text-[8px] bg-red-50 text-red-700 px-1 rounded">{rule.config?.limitMode} 突发阈值</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Accuracy Online interactive simulator */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-3xs">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Play size={13} className="text-emerald-500" />
                            <span>3. 值域精度高仿真运行测试</span>
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
                          <div className="space-y-2.5 animate-fade-in">
                            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-700">重算后预估评分:</span>
                                <span className="font-mono font-black text-emerald-700">{accuracySimResult.score}%</span>
                              </div>
                              <div className="text-[9px] text-emerald-600 flex items-center gap-1 font-bold">
                                <Check size={12} />
                                诊断异常减少了 {accuracySimResult.reduced} 项 (规则覆盖率提升至 95%)
                              </div>
                            </div>

                            {/* Simulated anomalous sample (Anomalies details) */}
                            <div className="space-y-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/50">
                              <div className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider">Top 不合规测试诊断对撞样本</div>
                              
                              {/* Sample 1 */}
                              <div className="p-2 bg-white border border-slate-200/50 rounded-lg text-[9px] font-bold text-slate-700">
                                <div className="flex justify-between pb-1 border-b border-slate-100 mb-1">
                                  <span className="font-mono text-indigo-700">物料 MAND-10024</span>
                                  <span className="text-red-500 text-[8px]">物理常识越界</span>
                                </div>
                                <div className="text-slate-500 text-[8.5px] font-medium leading-normal">
                                  检出 NTGEW &gt; BRGEW (净重：800.5 KG 超出物理总毛重：750.3 KG)
                                </div>
                              </div>

                              {/* Sample 2 */}
                              <div className="p-2 bg-white border border-slate-200/50 rounded-lg text-[9px] font-bold text-slate-700">
                                <div className="flex justify-between pb-1 border-b border-slate-100 mb-1">
                                  <span className="font-mono text-indigo-700">物料 MAND-29910</span>
                                  <span className="text-amber-500 text-[8px]">映射不一致</span>
                                </div>
                                <div className="text-slate-500 text-[8.5px] font-medium leading-normal">
                                  类型为 ROH (原材料)，但评估类字段被手动修改为了 7920 (半成品评估)
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-slate-400 font-bold text-center py-2 leading-relaxed">
                            修改规则控制对等指标后，点击右上角的“运行模拟”检测受其控制影响的数据比率。
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. COMPLIANCE CHECKLIST */}
                  {settingsSubTab === 'compliance' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Web View Header Translation Card */}
                      <div className="bg-gradient-to-br from-violet-50/50 via-white to-white rounded-2xl border border-slate-200/80 p-4 shadow-3xs space-y-1.5 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={15} className="text-violet-500" />
                          <h3 className="text-xs font-black text-slate-800 leading-tight">合规性诊断工作台 (Compliance Config Studio)</h3>
                        </div>
                        <p className="text-[9.5px] text-slate-500 font-bold leading-relaxed">
                          双环模型：管理内外部合规红线，注入法规与企业标准文件。
                        </p>
                      </div>

                      {/* Section 1: Dual-Ring Knowledge base files */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-violet-500" />
                            <span>1. 法律底线与企业标准合规库注入</span>
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* External Law Circle */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.2 rounded font-black uppercase tracking-tight">外环 (法律合规)</span>
                              <span className="text-[8.5px] font-bold text-slate-500">生存底线：海关/环保文件库</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {complianceDocs.external.map(doc => (
                                <button
                                  key={doc.id}
                                  onClick={() => setComplianceActiveSelectedFileDoc(complianceActiveSelectedFileDoc === doc.name ? null : doc.name)}
                                  className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-colors cursor-pointer text-[9px] font-bold shadow-3xs min-h-[50px] ${
                                    complianceActiveSelectedFileDoc === doc.name
                                      ? 'border-red-500 bg-red-50/20 text-red-700' 
                                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <span className="truncate w-full">{doc.name}</span>
                                  <span className="text-[7.5px] opacity-75 text-red-600 font-medium">包含 {doc.rules} 条法规规则</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Internal Codes Circle */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-black uppercase tracking-tight">内环 (企业规范)</span>
                              <span className="text-[8.5px] font-bold text-slate-500">管理规范：命名及 PLM 主册</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {complianceDocs.internal.map(doc => (
                                <button
                                  key={doc.id}
                                  onClick={() => setComplianceActiveSelectedFileDoc(complianceActiveSelectedFileDoc === doc.name ? null : doc.name)}
                                  className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-colors cursor-pointer text-[9px] font-bold shadow-3xs min-h-[50px] ${
                                    complianceActiveSelectedFileDoc === doc.name
                                      ? 'border-amber-550 border-amber-500 bg-amber-50/20 text-amber-700' 
                                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <span className="truncate w-full">{doc.name}</span>
                                  <span className="text-[7.5px] opacity-75 text-amber-600 font-medium">包含 {doc.rules} 条命名条例</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {complianceActiveSelectedFileDoc && (
                          <div className="flex items-center justify-between p-1 px-2.5 bg-violet-50 text-violet-750 text-[8.5px] font-bold rounded-lg border border-violet-100">
                            <span>已锁定文档：{complianceActiveSelectedFileDoc} 规则筛选中</span>
                            <button onClick={() => setComplianceActiveSelectedFileDoc(null)} className="text-violet-600 hover:text-red-500 font-black">
                              取消筛选
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Rule lists & details */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-violet-500" />
                            <span>2. 诊断红线检验项 (Extracted Rules)</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 font-mono">
                            {complianceRulesList.filter(r => !complianceActiveSelectedFileDoc || r.sourceDoc === complianceActiveSelectedFileDoc).length} 项
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {complianceRulesList
                            .filter(rule => !complianceActiveSelectedFileDoc || rule.sourceDoc === complianceActiveSelectedFileDoc)
                            .map(rule => {
                              return (
                                <div
                                  key={rule.id}
                                  onClick={() => setComplianceActiveSelectedRuleId(rule.id)}
                                  className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col justify-between shadow-3xs hover:-translate-y-0.5 active:translate-y-0 ${
                                    rule.type === 'external' 
                                      ? 'bg-gradient-to-r from-red-50/10 to-transparent border-red-200/60 hover:border-red-300' 
                                      : 'bg-gradient-to-r from-amber-50/10 to-transparent border-amber-200/60 hover:border-amber-300'
                                  }`}
                                >
                                  <div className="space-y-1.5 pr-2 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[7.5px] font-bold px-1.5 py-0.2 bg-white/85 rounded border uppercase ${
                                        rule.type === 'external' ? 'text-red-650 border-red-200 text-red-600' : 'text-amber-650 border-amber-200 text-amber-600'
                                      }`}>
                                        {rule.type === 'external' ? '外环法规' : '内环范式'}
                                      </span>
                                      <span className="text-[8px] font-black text-slate-400 font-mono italic truncate max-w-[100px]">{rule.sourceDoc}</span>
                                    </div>
                                    <p className="text-[10px] font-extrabold text-slate-800 truncate">{rule.title}</p>
                                    <p className="text-[8.5px] text-slate-500 leading-normal font-semibold line-clamp-1">{rule.desc}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[8px] uppercase font-black text-slate-400">
                                    <span>对撞方式: {rule.action}</span>
                                    <span className="text-violet-600 flex items-center gap-0.5 font-bold hover:underline">
                                      详情
                                      <ChevronRight size={10} />
                                    </span>
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
                            <span>3. 内外红线合规审计对撞</span>
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
                          <div className="space-y-3.5 animate-fade-in">
                            <div className="p-3 bg-violet-50 rounded-xl space-y-2 border border-violet-100">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-700">混合对撞通过重算的合规得分为:</span>
                                <span className="font-mono font-black text-violet-700">{complianceAuditResult.score}%</span>
                              </div>
                              <p className="text-[8.5px] text-violet-600 leading-normal font-semibold">
                                已配置海关和环保规则自动对撞，当前系统的法律风险隐患极低。
                              </p>
                            </div>

                            {/* Risk grading report */}
                            <div className="space-y-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/50">
                              <div className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider">合规健康度异常诊断明细</div>
                              
                              {/* Customs violated */}
                              <div className="p-2.5 bg-white border border-red-100 rounded-lg text-[9px] font-bold">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-1">
                                  <span className="text-slate-800">物料 MATERIAL-8002</span>
                                  <span className="text-[7.5px] font-mono px-1 bg-red-50 text-red-650 border border-red-100 rounded text-red-600">外环违法危险</span>
                                </div>
                                <p className="text-slate-500 font-medium text-[8.5px] leading-normal">
                                  该跨国供应链物料未维护合法的 HS Code / STEUC 海关税则号，面临通关滞库风险。
                                </p>
                              </div>

                              {/* Internal naming violated */}
                              <div className="p-2.5 bg-white border border-amber-100 rounded-lg text-[9px] font-bold">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-1">
                                  <span className="text-slate-800">物料 MATERIAL-9051</span>
                                  <span className="text-[7.5px] font-mono px-1 bg-amber-50 text-amber-650 border border-amber-100 rounded text-amber-600">内环规范违约</span>
                                </div>
                                <p className="text-slate-500 font-medium text-[8.5px] leading-normal">
                                  MAKTX 命名不合规范，错位字根导致语义比对对撞系统解析失败，极易影响仓库检索效率。
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-slate-400 font-bold text-center py-2 leading-relaxed">
                            修改双环红线后，轻触右上角的“运行审计”调用外接海关与RoHS服务数据库进行对撞演算。
                          </p>
                        )}
                      </div>

                      {/* RULES DETAIL LAYER OVERLAY (SLIDE IN OVER MOBILEVIEW CONTENT) */}
                      {complianceActiveSelectedRuleId && (
                        (() => {
                          const rule = complianceRulesList.find(r => r.id === complianceActiveSelectedRuleId);
                          if (!rule) return null;
                          return (
                            <div className="fixed inset-x-0 bottom-0 top-[120px] bg-white z-50 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden border-t border-slate-200 animate-in slide-in-from-bottom duration-300">
                              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800">规则诊断详情页 (Redline Rule Detail)</span>
                                <button 
                                  onClick={() => setComplianceActiveSelectedRuleId(null)}
                                  className="p-1 px-2 text-[10px] font-black text-slate-500 hover:text-slate-800 bg-slate-200 rounded-lg"
                                >
                                  返回列表
                                </button>
                              </div>
                              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${
                                      rule.type === 'external' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                      {rule.type === 'external' ? '外环法则 (External)' : '内环标准 (Internal)'}
                                    </span>
                                    <span className="text-[8.5px] text-slate-400 font-bold">{rule.sourceDoc}</span>
                                  </div>
                                  <h4 className="text-sm font-black text-slate-850">{rule.title}</h4>
                                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{rule.desc}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">执行模式 (Action)</div>
                                    <div className="text-[9.5px] font-black text-slate-800 mt-0.5">{rule.action}</div>
                                  </div>
                                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">风险评级 (Severity)</div>
                                    <div className={`text-[9.5px] font-black mt-0.5 ${rule.type === 'external' ? 'text-red-650 text-red-600' : 'text-amber-650 text-amber-600'}`}>
                                      {rule.severity}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider">逻辑引擎演算说明 (Mathematical Logic)</div>
                                  <div className="p-3 bg-slate-900 rounded-xl text-[9.5px] text-emerald-400 leading-relaxed font-mono">
                                    {rule.logic}
                                  </div>
                                </div>

                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                                  <FileText size={18} className="text-emerald-600 shrink-0" />
                                  <div className="text-[9.5px] text-emerald-800 leading-normal flex-1">
                                    <div className="font-bold">溯源凭证文件 (Tethered Document)</div>
                                    <div className="opacity-80 text-[8px]">{rule.sourceDoc}</div>
                                  </div>
                                  <button className="text-[8.5px] font-black text-emerald-600 hover:underline">查看原文 PDF</button>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
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

                  {/* 6. UNIAPP WORKSPACE CENTER VIEW */}
                  {settingsSubTab === 'uniapp' && (
                    <div className="space-y-4 animate-fade-in text-slate-800">
                      {/* Introductory banner */}
                      <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <Smartphone size={15} className="text-[#07c160] animate-pulse" />
                          <span className="text-[11px] font-black">uni-app (Vue 3) 微信小程序工作台已就绪</span>
                        </div>
                        <p className="text-[9.5px] text-slate-600 font-semibold leading-relaxed">
                          为满架手机端跨端微信生态，全套代码已基于最新 <span className="font-bold">Vue 3 (Composition API)</span> 进行微信底层对齐，完美融合 44px 原生手势与胶囊重载逻辑。
                        </p>
                        {/* Dynamic Live Variables Sync indicator */}
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex flex-col gap-1.5 shadow-2xs">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                            <RefreshCw size={8} className="animate-spin text-emerald-500" />
                            <span>物理主数据审计核心状态对账 (Live Syncing):</span>
                          </span>
                          <div className="space-y-1 text-[9px] font-bold text-slate-700">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">必填主键:</span>
                              <span className="font-mono text-[8.5px] text-emerald-700 bg-emerald-50/50 px-1 border border-emerald-100/55 rounded">
                                {completenessKeyFields.join(' , ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">去重组合:</span>
                              <span className="font-mono text-[8.5px] text-blue-700 bg-blue-50/50 px-1 border border-blue-100/55 rounded">
                                {uniquenessKeyFields.map(g => `[${g.join('+')}]`).join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code Explorer Structure */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-3xs flex flex-col">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-800 flex items-center gap-1.5">
                            <Layers size={12} className="text-[#07c160]" />
                            <span>小程序工程代码资源管理器</span>
                          </span>
                        </div>

                        {/* File selector tree buttons */}
                        <div className="p-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-1.5">
                          {[
                            { name: 'index.vue', label: '📝 index.vue (核心体检页)' },
                            { name: 'pages.json', label: '⚙️ pages.json' },
                            { name: 'App.vue', label: '🌱 App.vue' },
                            { name: 'package.json', label: '📦 package.json' },
                            { name: 'main.js', label: '🚀 main.js' },
                            { name: 'README.md', label: '📖 README.md' }
                          ].map(file => (
                            <button
                              key={file.name}
                              onClick={() => {
                                setSelectedUniappFile(file.name);
                                setCopiedFile(false);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-bold transition-all border shrink-0 cursor-pointer ${
                                selectedUniappFile === file.name
                                  ? 'bg-[#edfbf3] text-[#07c160] border-[#bfeecf] shadow-3xs'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 shadow-3xs'
                              }`}
                            >
                              {file.name}
                            </button>
                          ))}
                        </div>

                        {/* IDE Display Screen */}
                        <div className="bg-[#0f141c] text-slate-350 font-mono text-[9px] overflow-hidden flex flex-col relative h-[360px] border-b border-slate-200">
                          {/* File Header */}
                          <div className="flex justify-between items-center p-2.5 bg-[#161b22] border-b border-slate-800 text-slate-400 shrink-0 select-text">
                            <span className="text-[7.5px] font-bold text-slate-500 truncate max-w-[180px]">
                              uniapp-mobile/{selectedUniappFile === 'index.vue' ? 'pages/index/index.vue' : selectedUniappFile}
                            </span>
                            <button
                              onClick={() => {
                                let content = '';
                                if (selectedUniappFile === 'index.vue') {
                                  content = getUniappIndexVue(completenessKeyFields, uniquenessKeyFields, selectedCategories);
                                } else if (selectedUniappFile === 'pages.json') {
                                  content = getUniappPagesJson();
                                } else if (selectedUniappFile === 'App.vue') {
                                  content = getUniappAppVue();
                                } else if (selectedUniappFile === 'package.json') {
                                  content = getUniappPackageJson();
                                } else if (selectedUniappFile === 'main.js') {
                                  content = getUniappMainJs();
                                } else if (selectedUniappFile === 'README.md') {
                                  content = getUniappReadme();
                                }
                                navigator.clipboard.writeText(content);
                                setCopiedFile(true);
                                setTimeout(() => setCopiedFile(false), 2000);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[8px] border border-slate-700 font-bold cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                            >
                              {copiedFile ? '✓ 已复制' : '📋 复制该文件'}
                            </button>
                          </div>

                          {/* Code content scroll frame */}
                          <div className="flex-grow overflow-y-auto p-3.5 scrollbar-hide text-left leading-relaxed text-slate-300 font-mono whitespace-pre select-text">
                            {selectedUniappFile === 'index.vue' && getUniappIndexVue(completenessKeyFields, uniquenessKeyFields, selectedCategories)}
                            {selectedUniappFile === 'pages.json' && getUniappPagesJson()}
                            {selectedUniappFile === 'App.vue' && getUniappAppVue()}
                            {selectedUniappFile === 'package.json' && getUniappPackageJson()}
                            {selectedUniappFile === 'main.js' && getUniappMainJs()}
                            {selectedUniappFile === 'README.md' && getUniappReadme()}
                          </div>
                        </div>

                        {/* Export panel bottom toolbar */}
                        <div className="p-3 bg-slate-50 flex items-center justify-between">
                          <span className="text-[8px] text-slate-400 font-bold">微信绿色环境对撞兼容 · Vue 3 ESM</span>
                          <button
                            onClick={() => {
                              const readmeContent = getUniappReadme();
                              const blob = new Blob([readmeContent], { type: 'text/markdown;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = 'uniapp-instructions.md';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="p-1 px-3 bg-[#07c160] hover:bg-[#06ad56] text-white rounded-xl text-[9.5px] font-bold cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 animate-fade-in"
                          >
                            <span>📥 下载部署指南文本</span>
                          </button>
                        </div>
                      </div>

                      {/* Execution workflow */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-slate-800 block">⚡ 小程序导入至开发者工具</span>
                        <div className="space-y-1.5 text-[9px] text-slate-500 font-bold leading-relaxed list-decimal pl-3">
                          <div>1. 将 \`/uniapp-mobile\` 本地文件夹完整解包或导入至 **HBuilderX** 编辑器中。</div>
                          <div>2. 确保在微信小程序开发者工具中，【设置】-【安全设置】下的【服务端口】已打开。</div>
                          <div>3. 在 HBuilderX 菜单中，点击【运行】-&gt;【运行到小程序模拟器】-&gt;【微信开发者工具】。</div>
                          <div>4. 编译开始并唤起微信模拟器，即可真机预览并上传发布！</div>
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

      {/* FOOTER TABBAR - NATIVE WECHAT MINI PROGRAM EXPERIENCE */}
      <footer className="bg-white/95 backdrop-blur-md border-t border-slate-150 h-[56px] shrink-0 flex items-center justify-around px-2 relative z-40 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
        
        {/* BUTTON 1: HOME PANEL */}
        <button
          onClick={() => {
            setActiveTab('home');
            setHomeSubView('main');
          }}
          className="flex flex-col items-center justify-center gap-0.5 grow h-full border-0 bg-transparent cursor-pointer focus:outline-none"
        >
          <Activity 
            size={20} 
            className={`transition-colors ${
              activeTab === 'home' ? 'text-[#07c160] stroke-[2.2]' : 'text-[#888888] stroke-[1.8]'
            }`} 
          />
          <span className={`text-[10px] font-bold mt-0.5 ${
            activeTab === 'home' ? 'text-[#07c160]' : 'text-[#888888]'
          }`}>
            健康体检
          </span>
        </button>

        {/* BUTTON 2: BOT */}
        <button
          onClick={() => setActiveTab('ai')}
          className="flex flex-col items-center justify-center gap-0.5 grow h-full relative border-0 bg-transparent cursor-pointer focus:outline-none"
        >
          <MessageSquare 
            size={20} 
            className={`transition-colors ${
              activeTab === 'ai' ? 'text-[#07c160] stroke-[2.2]' : 'text-[#888888] stroke-[1.8]'
            }`} 
          />
          <span className={`text-[10px] font-bold mt-0.5 ${
            activeTab === 'ai' ? 'text-[#07c160]' : 'text-[#888888]'
          }`}>
            AI 助手
          </span>
          <span className="absolute top-2.5 right-[28%] flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#07c160] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#07c160]"></span>
          </span>
        </button>

        {/* BUTTON 3: CONFIG REGULATORS */}
        <button
          onClick={() => setActiveTab('settings')}
          className="flex flex-col items-center justify-center gap-0.5 grow h-full border-0 bg-transparent cursor-pointer focus:outline-none"
        >
          <Sliders 
            size={20} 
            className={`transition-colors ${
              activeTab === 'settings' ? 'text-[#07c160] stroke-[2.2]' : 'text-[#888888] stroke-[1.8]'
            }`} 
          />
          <span className={`text-[10px] font-bold mt-0.5 ${
            activeTab === 'settings' ? 'text-[#07c160]' : 'text-[#888888]'
          }`}>
            规则引擎
          </span>
        </button>

        {/* BUTTON 4: PERSONAL PROFILE PANEL */}
        <button
          onClick={() => setActiveTab('profile')}
          className="flex flex-col items-center justify-center gap-0.5 grow h-full border-0 bg-transparent cursor-pointer focus:outline-none"
        >
          <User 
            size={20} 
            className={`transition-colors ${
              activeTab === 'profile' ? 'text-[#07c160] stroke-[2.2]' : 'text-[#888888] stroke-[1.8]'
            }`} 
          />
          <span className={`text-[10px] font-bold mt-0.5 ${
            activeTab === 'profile' ? 'text-[#07c160]' : 'text-[#888888]'
          }`}>
            个人中心
          </span>
        </button>

      </footer>

    </div>
  );
};
