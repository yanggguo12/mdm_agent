import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { MetricCard } from './components/MetricCard';
import { IssueTable } from './components/IssueTable';
import { ChatAgent } from './components/ChatAgent';
import { ScanningSteps } from './components/ScanningSteps';
import { IssueModal } from './components/IssueModal';
import { MetricDetailModal } from './components/MetricDetailModal';
import { RawDataModal } from './components/RawDataModal';
import { CompletenessConfigModal } from './components/CompletenessConfigModal';
import { UniquenessConfigModal } from './components/UniquenessConfigModal';
import { AccuracyConfigModal } from './components/AccuracyConfigModal';
import { ComplianceConfigModal } from './components/ComplianceConfigModal';
import { RepairDetailsModal } from './components/RepairDetailsModal';
import { IssueDetailsModal } from './components/IssueDetailsModal';
import { generateAndProcessData, processData } from './utils/dataProcessor';
import { DataIssue, HealthMetric } from './types';
import { Play, RotateCcw, ShieldCheck, Zap, Activity, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DATA_CATEGORIES = {
  '物料主数据': ['基础数据MARA', '工厂数据MARC', '财务数据MBEW'],
  '生产主数据': ['BOM', '工作中心']
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Generate 1000 mock records and calculate metrics/issues on initial load
  const [appData, setAppData] = useState(() => generateAndProcessData(1000));
  
  const [metrics, setMetrics] = useState(appData.metrics);
  const [issues, setIssues] = useState(appData.issues);
  const [scanStep, setScanStep] = useState(0); // 0: Idle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [rawDataSource, setRawDataSource] = useState<string | null>(null);
  const [completenessKeyFields, setCompletenessKeyFields] = useState<string[]>(['MATKL']);
  const [uniquenessKeyFields, setUniquenessKeyFields] = useState<string[]>(['MAKTX']);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isUniquenessConfigModalOpen, setIsUniquenessConfigModalOpen] = useState(false);
  const [isAccuracyConfigModalOpen, setIsAccuracyConfigModalOpen] = useState(false);
  const [isComplianceConfigModalOpen, setIsComplianceConfigModalOpen] = useState(false);
  const [complianceRules, setComplianceRules] = useState<any[]>([]);
  const [repairModalConfig, setRepairModalConfig] = useState<{ id: string, title: string, type: 'success' | 'warning' | 'info' } | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<DataIssue | null>(null);
  
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['基础数据MARA']);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update metrics and issues when selected categories change
  useEffect(() => {
    const { metrics: newMetrics, issues: newIssues } = processData(appData.data, completenessKeyFields, uniquenessKeyFields, selectedCategories, complianceRules);
    setMetrics(newMetrics);
    setIssues(newIssues);
  }, [selectedCategories, appData.data, completenessKeyFields, uniquenessKeyFields, complianceRules]);
  
  // Context string for AI
  const [contextData, setContextData] = useState('');

  // Update context when data changes
  useEffect(() => {
    const context = `
      Overall Score: ${Math.round(metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length)}/100.
      Metrics: ${metrics.map(m => `${m.name}: ${m.score}`).join(', ')}.
      Open Issues: ${issues.filter(i => i.status !== 'Fixed').length}.
      Top Issues: ${issues.map(i => `${i.type} in ${i.table} (${i.field})`).join('; ')}.
    `;
    setContextData(context);
  }, [metrics, issues]);

  const handleCategoryToggle = (majorCat: string, subCat: string) => {
    setSelectedCategories(prev => {
      const currentMajorCat = Object.keys(DATA_CATEGORIES).find(key => 
        prev.some(cat => DATA_CATEGORIES[key as keyof typeof DATA_CATEGORIES].includes(cat))
      );

      if (currentMajorCat && currentMajorCat !== majorCat && prev.length > 0) {
        return [subCat];
      }

      if (prev.includes(subCat)) {
        return prev.filter(c => c !== subCat);
      } else {
        return [...prev, subCat];
      }
    });
  };

  const startActiveCheckup = () => {
    if (scanStep > 0 && scanStep < 4) return;
    
    setScanStep(1);
    
    // Simulate the process steps from the PPT
    setTimeout(() => setScanStep(2), 2000); // Validation
    setTimeout(() => setScanStep(3), 4500); // Scoring
    setTimeout(() => {
      setScanStep(4); // Done
      // Randomly tweak metrics to show "Live" update
      setMetrics(prev => prev.map(m => ({
        ...m,
        score: Math.min(100, Math.max(0, m.score + (Math.random() > 0.5 ? 1 : -1)))
      })));
    }, 6000);
    
    setTimeout(() => setScanStep(0), 8000); // Reset UI after delay
  };

  const handleRepair = (issueToFix: DataIssue) => {
    // Optimistic UI update
    setIssues(prev => prev.map(issue => 
      issue.id === issueToFix.id ? { ...issue, status: 'Fixed' } : issue
    ));
    
    // Boost score slightly
    setMetrics(prev => prev.map(m => {
      if (m.name.includes('Completeness') && issueToFix.type === 'Missing Field') return { ...m, score: m.score + 1 };
      if (m.name.includes('Uniqueness') && issueToFix.type === 'Duplicate') return { ...m, score: m.score + 1 };
      return m;
    }));
  };

  const handleSaveConfig = (fields: string[]) => {
    setCompletenessKeyFields(fields);
    const { metrics: newMetrics, issues: newIssues } = processData(appData.data, fields, uniquenessKeyFields, selectedCategories);
    setMetrics(newMetrics);
    setIssues(newIssues);
    setIsConfigModalOpen(false);
    
    if (selectedMetric && selectedMetric.name.includes('完整性')) {
      setSelectedMetric(newMetrics.find(m => m.name.includes('完整性')) || null);
    }
  };

  const handleSaveUniquenessConfig = (fields: string[]) => {
    setUniquenessKeyFields(fields);
    const { metrics: newMetrics, issues: newIssues } = processData(appData.data, completenessKeyFields, fields, selectedCategories);
    setMetrics(newMetrics);
    setIssues(newIssues);
    setIsUniquenessConfigModalOpen(false);
    
    if (selectedMetric && selectedMetric.name.includes('唯一性')) {
      setSelectedMetric(newMetrics.find(m => m.name.includes('唯一性')) || null);
    }
  };

  const handleSaveAccuracyConfig = (rules: any[]) => {
    console.log('Saved accuracy rules:', rules);
    setIsAccuracyConfigModalOpen(false);
    // In a real app, this would trigger a recalculation of the accuracy metric
    // based on the new rules. For now, we just close the modal.
  };

  const handleSaveComplianceConfig = (config: any) => {
    console.log('Saved compliance rules:', config);
    setComplianceRules(config);
    setIsComplianceConfigModalOpen(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!isLoggedIn ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Login onLogin={() => setIsLoggedIn(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-screen w-full"
        >
          <Layout
            sidebar={<ChatAgent contextData={contextData} />}
            onLogout={() => setIsLoggedIn(false)}
          >
            {/* Top Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-800 tracking-tight">健康概览 (Health Overview)</h2>
                   <p className="text-slate-500 mt-1 flex items-center gap-2">
                      <Activity size={16} className="text-blue-500" />
                      实时数据治理仪表盘
                   </p>
                 </div>
                 
                 {/* Data Category Selector */}
                 <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                   <button 
                     onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                     className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                   >
                     <span>数据类别: {selectedCategories.length === 0 ? '请选择' : `${selectedCategories.length} 项已选`}</span>
                     <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {isCategoryDropdownOpen && (
                     <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                       {Object.entries(DATA_CATEGORIES).map(([major, subs]) => (
                         <div key={major} className="border-b border-slate-100 last:border-0">
                           <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                             {major}
                           </div>
                           <div className="py-1">
                             {subs.map(sub => {
                               const isSelected = selectedCategories.includes(sub);
                               return (
                                 <label 
                                   key={sub} 
                                   className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-slate-50"
                                 >
                                   <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                     {isSelected && <Check size={12} className="text-white" />}
                                   </div>
                                   <span className={isSelected ? 'text-slate-800 font-medium' : 'text-slate-600'}>{sub}</span>
                                   <input 
                                     type="checkbox" 
                                     className="hidden"
                                     checked={isSelected}
                                     onChange={() => handleCategoryToggle(major, sub)}
                                   />
                                 </label>
                               );
                             })}
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all">
                      <RotateCcw size={16} />
                      加载历史记录
                  </button>
                  <button 
                      onClick={startActiveCheckup}
                      disabled={scanStep > 0}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all ${
                          scanStep > 0 
                          ? 'bg-blue-400 cursor-wait' 
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
                      }`}
                  >
                      {scanStep > 0 ? (
                          <span className="flex items-center gap-2">扫描中...</span>
                      ) : (
                          <>
                              <Play size={16} fill="currentColor" />
                              执行主动体检
                          </>
                      )}
                  </button>
              </div>
            </div>

            {/* Animation Area */}
            <ScanningSteps currentStep={scanStep} />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric) => (
                <MetricCard key={metric.name} metric={metric} onClick={() => setSelectedMetric(metric)} />
              ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Issues Table (Span 2) */}
               <div className="lg:col-span-2 h-full">
                  <IssueTable 
                      issues={issues} 
                      onRepair={handleRepair} 
                      onViewAll={() => setIsModalOpen(true)}
                      onRowClick={(issue) => setSelectedIssue(issue)}
                  />
               </div>

               {/* Auto-Repair Strategy Panel (Span 1) - Redesigned Dark Theme */}
               <div className="bg-[#0f172a] rounded-2xl p-6 text-white shadow-2xl flex flex-col relative overflow-hidden h-full min-h-[400px]">
                  {/* Ambient Background Glow */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-6 text-indigo-300">
                          <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                              <ShieldCheck size={18} />
                          </div>
                          <span className="uppercase tracking-widest text-xs font-bold">自动修复策略 (Auto-Repair)</span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-6 text-white leading-tight">主动修正规则池 <br/><span className="text-slate-400 text-sm font-normal">Active Correction Policies</span></h3>
                      
                      <div className="space-y-4 flex-1">
                          {/* Stat Item 1 */}
                          <div 
                              onClick={() => setRepairModalConfig({ id: 'formatting', title: '格式化修复 (Formatting)', type: 'success' })}
                              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl backdrop-blur-md border border-slate-700/50 group hover:bg-slate-800/80 transition-colors cursor-pointer"
                          >
                              <div className="flex gap-3">
                                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                                  <div className="text-sm">
                                      <div className="text-slate-400 text-xs mb-0.5">格式化修复 (Formatting)</div>
                                      <div className="font-bold text-white group-hover:text-indigo-200 transition-colors">2,316 记录</div>
                                  </div>
                              </div>
                              <div className="text-green-400 text-[10px] font-bold bg-green-400/10 px-2 py-1 rounded border border-green-400/20">已自动执行</div>
                          </div>
                          
                          {/* Stat Item 2 */}
                          <div 
                              onClick={() => setRepairModalConfig({ id: 'inference', title: 'AI 值推断 (Inference)', type: 'warning' })}
                              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl backdrop-blur-md border border-slate-700/50 group hover:bg-slate-800/80 transition-colors cursor-pointer"
                          >
                              <div className="flex gap-3">
                                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                                  <div className="text-sm">
                                      <div className="text-slate-400 text-xs mb-0.5">AI 值推断 (Inference)</div>
                                      <div className="font-bold text-white group-hover:text-indigo-200 transition-colors">8,612 记录</div>
                                  </div>
                              </div>
                               <div className="text-amber-400 text-[10px] font-bold bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">待人工复核</div>
                          </div>

                          {/* Stat Item 3 */}
                          <div 
                              onClick={() => setRepairModalConfig({ id: 'validation', title: '域值校验 (Validation)', type: 'info' })}
                              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl backdrop-blur-md border border-slate-700/50 group hover:bg-slate-800/80 transition-colors cursor-pointer"
                          >
                              <div className="flex gap-3">
                                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                                  <div className="text-sm">
                                      <div className="text-slate-400 text-xs mb-0.5">域值校验 (Validation)</div>
                                      <div className="font-bold text-white group-hover:text-indigo-200 transition-colors">1,122 记录</div>
                                  </div>
                              </div>
                              <div className="text-blue-400 text-[10px] font-bold bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">系统规则</div>
                          </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-700/50">
                          <p className="text-xs text-indigo-300 font-medium mb-3 flex items-center gap-2">
                              <Zap size={14} className="fill-indigo-300" />
                              效率提升 (Efficiency Gain)
                          </p>
                          <div className="flex items-end gap-3">
                              <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight">84%</span>
                              <span className="text-xs text-slate-400 mb-2 max-w-[120px] leading-tight">减少人工数据清洗工作量</span>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            <IssueModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              issues={issues} 
              onRepair={handleRepair} 
              onRowClick={(issue) => setSelectedIssue(issue)}
            />

            <MetricDetailModal
              isOpen={!!selectedMetric}
              onClose={() => setSelectedMetric(null)}
              metric={selectedMetric}
              onViewRawData={(source) => setRawDataSource(source)}
              onOpenConfig={() => setIsConfigModalOpen(true)}
              onOpenUniquenessConfig={() => setIsUniquenessConfigModalOpen(true)}
              onOpenAccuracyConfig={() => setIsAccuracyConfigModalOpen(true)}
              onOpenComplianceConfig={() => setIsComplianceConfigModalOpen(true)}
            />

            <RawDataModal
              isOpen={!!rawDataSource}
              onClose={() => setRawDataSource(null)}
              sourceName={rawDataSource || ''}
              data={appData.data}
            />

            <CompletenessConfigModal
              isOpen={isConfigModalOpen}
              onClose={() => setIsConfigModalOpen(false)}
              onSave={handleSaveConfig}
              initialFields={completenessKeyFields}
            />

            <UniquenessConfigModal
              isOpen={isUniquenessConfigModalOpen}
              onClose={() => setIsUniquenessConfigModalOpen(false)}
              onSave={handleSaveUniquenessConfig}
              initialFields={uniquenessKeyFields}
            />

            <AccuracyConfigModal
              isOpen={isAccuracyConfigModalOpen}
              onClose={() => setIsAccuracyConfigModalOpen(false)}
              onSave={handleSaveAccuracyConfig}
            />

            <ComplianceConfigModal
              isOpen={isComplianceConfigModalOpen}
              onClose={() => setIsComplianceConfigModalOpen(false)}
              onSave={handleSaveComplianceConfig}
            />

            <RepairDetailsModal
              isOpen={!!repairModalConfig}
              onClose={() => setRepairModalConfig(null)}
              config={repairModalConfig}
            />

            <IssueDetailsModal
              isOpen={!!selectedIssue}
              onClose={() => setSelectedIssue(null)}
              issue={selectedIssue}
              onRepair={handleRepair}
            />
          </Layout>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
