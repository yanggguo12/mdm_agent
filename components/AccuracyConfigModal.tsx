import React, { useState } from 'react';
import { X, Upload, FileText, Plus, Settings2, Play, AlertCircle, CheckCircle2, ArrowRight, BrainCircuit, Database, History, Scale } from 'lucide-react';

interface AccuracyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rules: any[]) => void;
}

const OPERATORS = [
  { id: 'physical', name: '物理常识算子', icon: Scale, desc: 'Value(A) < Value(B) 或 Value ∈ [Min, Max]', example: '解决“净重 > 毛重”或“长度填成负数”的常识错误。', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'mapping', name: '映射一致算子', icon: ArrowRight, desc: "IF Field(A) == 'X' THEN Field(B) MUST_BE 'Y'", example: '解决“物料类型是原材料，但评估类选了成品”的业务错误。', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: 'semantic', name: '语义关联算子', icon: BrainCircuit, desc: 'AI_Compare(Description, Category_Manual)', example: '解决“描述里写着轴承，但类别选了螺栓”的描述性错误。', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'outlier', name: '历史离群算子', icon: History, desc: 'Value ∉ [Historical_Avg ± 3σ]', example: '解决“价格或提前期异常偏离历史平均水平”的离群错误。', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
];

export const AccuracyConfigModal: React.FC<AccuracyConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [rules, setRules] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{ score: number, issues: number } | null>(null);
  
  // File upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { 
      id: '1', 
      name: '物料主数据规范_v2.pdf', 
      mappings: [
        { 
          id: 'm1', 
          name: '物料类型-评估类映射', 
          type: 'mapping', 
          logic: 'MTART="ROH" -> BKLAS="3000"',
          config: { ifField: 'MTART', ifValue: 'ROH', thenField: 'BKLAS', thenOperator: 'IN', thenValue: '[3000]' }
        },
        { 
          id: 'm2', 
          name: '物料组-利润中心映射', 
          type: 'mapping', 
          logic: 'MATKL="1001" -> PRCTR="P100"',
          config: { ifField: 'MATKL', ifValue: '1001', thenField: 'PRCTR', thenOperator: '==', thenValue: 'P100' }
        }
      ], 
      constraints: [
        { 
          id: 'c1', 
          name: '重量逻辑约束', 
          type: 'physical', 
          logic: 'Net Weight < Gross Weight',
          config: { fieldA: 'NTGEW', operator: '<', fieldB: 'BRGEW' }
        },
        { 
          id: 'c2', 
          name: '长度正值约束', 
          type: 'physical', 
          logic: 'Length > 0',
          config: { fieldA: 'LAENG', operator: '>', fieldB: '0' }
        }
      ]
    }
  ]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const selectedFile = uploadedFiles.find(f => f.id === selectedFileId);

  const importExtractedRule = (rule: any) => {
    setRules([...rules, { 
      id: `ai-${Date.now()}-${rule.id}`, 
      type: rule.type, 
      name: `[AI提炼] ${rule.name}`, 
      config: { ...rule.config } 
    }]);
  };
  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResult({
        score: Math.floor(Math.random() * 15) + 75, // 75-90
        issues: Math.floor(Math.random() * 50) + 10
      });
    }, 1500);
  };

  const addRule = (operatorId: string) => {
    const operator = OPERATORS.find(o => o.id === operatorId);
    if (operator) {
      let defaultConfig = {};
      if (operatorId === 'physical') defaultConfig = { fieldA: 'NTGEW', operator: '<', fieldB: 'BRGEW' };
      if (operatorId === 'mapping') defaultConfig = { ifField: 'MTART', ifValue: 'ROH', thenField: 'BKLAS', thenOperator: 'IN', thenValue: '[3000, 3001]' };
      if (operatorId === 'semantic') defaultConfig = { fieldA: 'MAKTX', fieldB: 'MATKL' };
      if (operatorId === 'outlier') defaultConfig = { field: 'PLIFZ', range: '[ Avg ± 3σ ]' };

      setRules([...rules, { id: Date.now().toString(), type: operator.id, name: operator.name, config: defaultConfig }]);
    }
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRuleConfig = (id: string, newConfig: any) => {
    setRules(rules.map(r => r.id === id ? { ...r, config: newConfig } : r));
  };

  // File upload handlers
  const handleFileUpload = (file: File) => {
    setIsUploading(true);
    // Simulate AI parsing
    setTimeout(() => {
      setUploadedFiles(prev => [{
        id: Date.now().toString(),
        name: file.name,
        rules: Math.floor(Math.random() * 30) + 5,
        constraints: Math.floor(Math.random() * 15) + 2
      }, ...prev]);
      setIsUploading(false);
    }, 2000);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings2 className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">准确性配置工作台 (Accuracy Config Studio)</h2>
              <p className="text-sm text-slate-500 mt-0.5">定义数据准确性校验规则，支持 AI 知识注入与实时模拟</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* 3-Column Layout */}
        <div className="flex-1 flex overflow-hidden bg-slate-50/50">
          
          {/* Left: Knowledge Ingestion */}
          <div className="w-1/4 min-w-[300px] border-r border-slate-200 bg-white flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-blue-500" />
                知识注入区
              </h3>
              <p className="text-xs text-slate-500 mt-1">上传企业规范文档，AI 自动提取约束规则</p>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileInputChange} 
                className="hidden" 
                accept=".pdf,.xls,.xlsx,.doc,.docx,.ppt,.pptx,.txt,image/*" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                  isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50 hover:border-blue-300'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">正在解析文档...</p>
                    <p className="text-xs text-slate-400 mt-1">AI 正在提取约束规则</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="text-blue-500" size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">点击或拖拽上传文档/图片</p>
                    <p className="text-xs text-slate-400 mt-1">支持 PDF, Excel, Word, PPT, TXT, 图片等</p>
                  </>
                )}
              </div>

              <div className="mt-6 flex-1 flex flex-col min-h-0">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">已解析的知识库</h4>
                <div className="space-y-3 overflow-y-auto pr-1">
                  {uploadedFiles.map(file => (
                    <div 
                      key={file.id} 
                      onClick={() => setSelectedFileId(selectedFileId === file.id ? null : file.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer group ${
                        selectedFileId === file.id 
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-100' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className={`shrink-0 mt-0.5 ${selectedFileId === file.id ? 'text-blue-600' : 'text-emerald-500'}`} size={16} />
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-sm font-bold truncate ${selectedFileId === file.id ? 'text-blue-700' : 'text-slate-700'}`}>{file.name}</p>
                          <p className="text-[10px] text-slate-500 mt-1">已提取 {file.mappings.length} 条映射关系, {file.constraints.length} 条数值约束</p>
                          <p className="text-[10px] text-blue-600 font-medium mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-right">
                             {selectedFileId === file.id ? '点击收起' : '点击查看提炼详情'}
                          </p>
                        </div>
                      </div>

                      {/* AI Extracted Items Detail */}
                      {selectedFileId === file.id && (
                        <div className="mt-4 pt-4 border-t border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                          {/* Mappings */}
                          {file.mappings.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">映射关系 (Mappings)</p>
                              <div className="space-y-1.5">
                                {file.mappings.map(m => (
                                  <div key={m.id} className="p-2 bg-white rounded-lg border border-blue-50 flex items-center justify-between group/item hover:border-blue-200 transition-colors">
                                    <div className="flex-1 min-w-0 pr-2">
                                      <div className="text-[11px] font-bold text-slate-700 truncate">{m.name}</div>
                                      <div className="text-[9px] text-blue-600 font-mono mt-0.5 truncate">{m.logic}</div>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); importExtractedRule(m); }}
                                      className="p-1 px-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 shadow-sm"
                                    >
                                      <Plus size={10} /> 导入
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Constraints */}
                          {file.constraints.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">数值约束 (Constraints)</p>
                              <div className="space-y-1.5">
                                {file.constraints.map(c => (
                                  <div key={c.id} className="p-2 bg-white rounded-lg border border-blue-50 flex items-center justify-between group/item hover:border-blue-200 transition-colors">
                                    <div className="flex-1 min-w-0 pr-2">
                                      <div className="text-[11px] font-bold text-slate-700 truncate">{c.name}</div>
                                      <div className="text-[9px] text-blue-600 font-mono mt-0.5 truncate">{c.logic}</div>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); importExtractedRule(c); }}
                                      className="p-1 px-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 shadow-sm"
                                    >
                                      <Plus size={10} /> 导入
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Rule Orchestrator */}
          <div className="flex-1 border-r border-slate-200 bg-slate-50/30 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-white">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Settings2 size={18} className="text-indigo-500" />
                规则编排区
              </h3>
              <p className="text-xs text-slate-500 mt-1">选择高级算子，像搭积木一样组合校验逻辑</p>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Operator Palette */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {OPERATORS.map(op => (
                  <button
                    key={op.id}
                    onClick={() => addRule(op.id)}
                    className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${op.bg} ${op.border} hover:scale-[1.02]`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <op.icon size={16} className={op.color} />
                      <span className={`text-sm font-bold ${op.color}`}>{op.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono mb-1">{op.desc}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{op.example}</p>
                  </button>
                ))}
              </div>

              {/* Configured Rules */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">当前生效规则 ({rules.length})</h4>
                {rules.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                    请从上方选择算子添加规则
                  </div>
                ) : (
                  rules.map((rule, idx) => {
                    const op = OPERATORS.find(o => o.id === rule.type)!;
                    return (
                      <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group">
                        <button 
                          onClick={() => removeRule(rule.id)}
                          className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium">{idx + 1}</span>
                          <op.icon size={16} className={op.color} />
                          <span className="text-sm font-bold text-slate-700">{rule.name}</span>
                        </div>
                        
                        {/* Configuration UI based on type */}
                        <div className="pl-7 space-y-2">
                          {rule.type === 'physical' && (
                            <div className="flex items-center gap-2 text-sm">
                              <select 
                                value={rule.config.fieldA} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, fieldA: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="NTGEW">NTGEW (净重)</option>
                                <option value="BRGEW">BRGEW (毛重)</option>
                                <option value="LAENG">LAENG (长度)</option>
                              </select>
                              <select 
                                value={rule.config.operator} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, operator: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="<">&lt;</option>
                                <option value=">">&gt;</option>
                                <option value="<=">&lt;=</option>
                                <option value=">=">&gt;=</option>
                                <option value="==">==</option>
                              </select>
                              <select 
                                value={rule.config.fieldB} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, fieldB: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="BRGEW">BRGEW (毛重)</option>
                                <option value="NTGEW">NTGEW (净重)</option>
                                <option value="LAENG">LAENG (长度)</option>
                                <option value="0">固定值: 0</option>
                              </select>
                            </div>
                          )}
                          {rule.type === 'mapping' && (
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span className="text-indigo-600 font-mono font-bold">IF</span>
                              <select 
                                value={rule.config.ifField} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, ifField: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="MTART">MTART (物料类型)</option>
                                <option value="MATKL">MATKL (物料组)</option>
                              </select>
                              <span className="text-slate-500">==</span>
                              <input 
                                type="text" 
                                value={rule.config.ifValue} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, ifValue: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 w-20 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                              />
                              <span className="text-indigo-600 font-mono font-bold">THEN</span>
                              <select 
                                value={rule.config.thenField} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, thenField: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="BKLAS">BKLAS (评估类)</option>
                                <option value="MTART">MTART (物料类型)</option>
                              </select>
                              <select 
                                value={rule.config.thenOperator} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, thenOperator: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="IN">IN</option>
                                <option value="==">==</option>
                                <option value="!=">!=</option>
                              </select>
                              <input 
                                type="text" 
                                value={rule.config.thenValue} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, thenValue: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 w-28 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                              />
                            </div>
                          )}
                          {rule.type === 'semantic' && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-purple-600 font-mono font-bold">AI_Compare</span>
                              <span>(</span>
                              <select 
                                value={rule.config.fieldA} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, fieldA: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="MAKTX">MAKTX (描述)</option>
                                <option value="WRKST">WRKST (基本物料)</option>
                              </select>
                              <span>,</span>
                              <select 
                                value={rule.config.fieldB} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, fieldB: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="MATKL">MATKL (物料组)</option>
                                <option value="MTART">MTART (物料类型)</option>
                              </select>
                              <span>)</span>
                            </div>
                          )}
                          {rule.type === 'outlier' && (
                            <div className="flex items-center gap-2 text-sm">
                              <select 
                                value={rule.config.field} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, field: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="PLIFZ">PLIFZ (计划交货时间)</option>
                                <option value="VERPR">VERPR (移动平均价)</option>
                                <option value="STPRS">STPRS (标准价格)</option>
                              </select>
                              <span className="text-orange-600 font-mono font-bold">∉</span>
                              <select 
                                value={rule.config.range} 
                                onChange={e => updateRuleConfig(rule.id, { ...rule.config, range: e.target.value })}
                                className="border border-slate-200 rounded px-2 py-1 bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="[ Avg ± 3σ ]">[ Avg ± 3σ ]</option>
                                <option value="[ Avg ± 2σ ]">[ Avg ± 2σ ]</option>
                                <option value="[ P5, P95 ]">[ P5, P95 ]</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Real-time Simulation */}
          <div className="w-1/4 min-w-[300px] bg-white flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Play size={18} className="text-emerald-500" />
                  实时模拟区
                </h3>
                <p className="text-xs text-slate-500 mt-1">抽样 10 条数据进行试运行</p>
              </div>
              <button 
                onClick={handleSimulate}
                disabled={isSimulating || rules.length === 0}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isSimulating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={12} fill="currentColor" />}
                运行模拟
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {isSimulating ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm animate-pulse">正在应用规则进行抽样计算...</p>
                </div>
              ) : simulationResult ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-2">模拟准确性评分</p>
                    <div className="text-5xl font-black text-slate-800">{simulationResult.score}<span className="text-2xl text-slate-400">%</span></div>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                      <AlertCircle size={14} />
                      发现 {simulationResult.issues} 条异常
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">抽样异常明细 (Top 3)</h4>
                    <div className="space-y-2">
                      <div className="p-3 border border-red-100 bg-red-50/50 rounded-xl text-sm">
                        <div className="font-medium text-slate-800 mb-1">MAT-10024</div>
                        <div className="text-red-600 text-xs">违反物理常识：净重 (15kg) &gt; 毛重 (12kg)</div>
                      </div>
                      <div className="p-3 border border-indigo-100 bg-indigo-50/50 rounded-xl text-sm">
                        <div className="font-medium text-slate-800 mb-1">MAT-29910</div>
                        <div className="text-indigo-600 text-xs">违反映射一致：物料类型 ROH，但评估类为 7920 (成品)</div>
                      </div>
                      <div className="p-3 border border-purple-100 bg-purple-50/50 rounded-xl text-sm">
                        <div className="font-medium text-slate-800 mb-1">MAT-88211</div>
                        <div className="text-purple-600 text-xs">违反语义关联：描述为"深沟球轴承"，物料组为"紧固件"</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Play size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm">配置规则后点击“运行模拟”<br/>查看实时效果</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10">
          <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            取消
          </button>
          <button 
            onClick={() => { onSave(rules); onClose(); }}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
          >
            保存并应用规则
          </button>
        </div>
      </div>
    </div>
  );
};
