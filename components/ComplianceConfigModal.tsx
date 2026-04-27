import React, { useState } from 'react';
import { X, Upload, FileText, Settings2, Play, AlertCircle, ShieldCheck, Scale, FileSignature, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ComplianceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

export const ComplianceConfigModal: React.FC<ComplianceConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{ score: number, issues: any[] } | null>(null);

  // File upload state for External Rule docs
  const [isDraggingExt, setIsDraggingExt] = useState(false);
  const [isUploadingExt, setIsUploadingExt] = useState(false);
  const [externalDocs, setExternalDocs] = useState([
    { id: 'ext1', name: '2026海关税则目录.pdf', rules: 2 },
    { id: 'ext2', name: 'RoHS环保标准指引.docx', rules: 2 }
  ]);
  const extFileInputRef = React.useRef<HTMLInputElement>(null);

  // File upload state for Internal Rule docs
  const [isDraggingInt, setIsDraggingInt] = useState(false);
  const [isUploadingInt, setIsUploadingInt] = useState(false);
  const [internalDocs, setInternalDocs] = useState([
    { id: 'int1', name: '主数据命名规范_V3.pdf', rules: 2 },
    { id: 'int2', name: '物料与图纸关联管理办法.docx', rules: 1 }
  ]);
  const intFileInputRef = React.useRef<HTMLInputElement>(null);

  // Rules extracted
  const [rules] = useState([
    { 
      id: 'r1', 
      type: 'external', 
      title: '海关税号 (STEUC) 有效性校验', 
      desc: '验证申报税号是否属于 2026 最新进出口税则目录范畴', 
      action: 'API 模糊匹配',
      logic: '将企业物料的 Steuer-ID 与 2026 海关税则数据库进行跨系统对撞。若匹配度低于 95% 或税号已失效，则标记为违规。',
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
      title: '环保认证有效期', 
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
      desc: '规则描述是否符合“品名+规格”的顺序', 
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
      title: '图纸附件关联检查', 
      desc: '核心生产物料是否有对应的图纸附件', 
      action: '关联性校验',
      logic: '查询 PLM 系统的物料关联清单 (EBOM)。若物料属性为 "Make" 且关联文档列表为空，则记录为完整性缺失。',
      sourceDoc: '物料与图纸关联管理办法.docx',
      severity: '警告 (Warning)'
    }
  ]);

  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [filterDoc, setFilterDoc] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRules = filterDoc 
    ? rules.filter(r => r.sourceDoc === filterDoc)
    : rules;

  const handleSimulate = () => {
    setIsSimulating(true);
    setFilterDoc(null); // Clear filter when simulating
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResult({
        score: Math.floor(Math.random() * 10) + 85, // 85-95
        issues: [
          {
            id: 'MAT-8002',
            type: 'external',
            msg: '该物料未维护 HS Code，违反海关监管要求，涉及法律风险。',
            detail: '外部法规违规 (生存底线)'
          },
          {
            id: 'MAT-9051',
            type: 'internal',
            msg: '该物料描述不符合公司《主数据命名法》，影响全局搜索效率及审计合规性。',
            detail: '内部规范违规 (管理红线)'
          },
          {
            id: 'MAT-2114',
            type: 'internal',
            msg: '此核心生产物料缺少对应的工程图纸附件。',
            detail: '内部规范违规 (管理红线)'
          }
        ]
      });
    }, 1500);
  };

  const handleUploadExt = (file: File) => {
    setIsUploadingExt(true);
    setTimeout(() => {
      setExternalDocs(prev => [{ id: Date.now().toString(), name: file.name, rules: Math.floor(Math.random() * 20) + 5 }, ...prev]);
      setIsUploadingExt(false);
    }, 1500);
  };

  const handleUploadInt = (file: File) => {
    setIsUploadingInt(true);
    setTimeout(() => {
      setInternalDocs(prev => [{ id: Date.now().toString(), name: file.name, rules: Math.floor(Math.random() * 20) + 5 }, ...prev]);
      setIsUploadingInt(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <ShieldCheck className="text-violet-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">合规性诊断工作台 (Compliance Config Studio)</h2>
              <p className="text-sm text-slate-500 mt-0.5">双环模型：管理内外部合规红线，注入法规与企业标准文件</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* 3-Column Layout */}
        <div className="flex-1 flex overflow-hidden bg-slate-50/50">
          
          {/* Left: Document Upload Zones */}
          <div className="w-1/3 min-w-[350px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileSignature size={18} className="text-violet-500" />
                合规知识库注入
              </h3>
              <p className="text-xs text-slate-500 mt-1">分别上传外部法规与内部规范，AI自动提取体检规则</p>
            </div>
            
            <div className="p-5 space-y-6">
              {/* External Zone */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Scale size={16} className="text-red-500" />
                  <h4 className="text-sm font-bold text-slate-700">外环：法律与行业合规 (生存底线)</h4>
                </div>
                
                <input type="file" ref={extFileInputRef} onChange={e => e.target.files?.[0] && handleUploadExt(e.target.files[0])} className="hidden" accept=".pdf,.doc,.docx" />
                <div 
                  onClick={() => extFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingExt(true); }}
                  onDragLeave={() => setIsDraggingExt(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDraggingExt(false); if(e.dataTransfer.files?.[0]) handleUploadExt(e.dataTransfer.files[0]); }}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDraggingExt ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:bg-slate-50 hover:border-red-300'}`}
                >
                  {isUploadingExt ? (
                    <div className="py-2"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                    <>
                      <Upload className="text-red-400 mb-2" size={20} />
                      <span className="text-xs font-medium text-slate-600">点击/拖拽上传海关、环保等法规文件</span>
                    </>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {externalDocs.map(doc => (
                    <div 
                      key={doc.id} 
                      onClick={() => setFilterDoc(filterDoc === doc.name ? null : doc.name)}
                      className={`p-2 border rounded transition-all cursor-pointer group ${filterDoc === doc.name ? 'border-red-500 bg-red-100/50 shadow-sm ring-1 ring-red-200' : 'border-red-100 bg-red-50/50 hover:border-red-300 hover:bg-red-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className={`shrink-0 mt-0.5 transition-colors ${filterDoc === doc.name ? 'text-red-600' : 'text-red-500'}`} size={14} />
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-xs font-bold truncate ${filterDoc === doc.name ? 'text-red-700' : 'text-slate-700'}`}>{doc.name}</p>
                          <p className="text-[10px] text-red-600 font-medium group-hover:underline">点击查看提取的 {doc.rules} 条红线规则</p>
                        </div>
                        {filterDoc === doc.name && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mt-1.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Zone */}
              <div>
                <div className="flex items-center gap-2 mb-3 mt-4">
                  <ShieldCheck size={16} className="text-amber-500" />
                  <h4 className="text-sm font-bold text-slate-700">内环：企业管理合规 (管理红线)</h4>
                </div>
                
                <input type="file" ref={intFileInputRef} onChange={e => e.target.files?.[0] && handleUploadInt(e.target.files[0])} className="hidden" accept=".pdf,.doc,.docx" />
                <div 
                  onClick={() => intFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingInt(true); }}
                  onDragLeave={() => setIsDraggingInt(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDraggingInt(false); if(e.dataTransfer.files?.[0]) handleUploadInt(e.dataTransfer.files[0]); }}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDraggingInt ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:bg-slate-50 hover:border-amber-300'}`}
                >
                  {isUploadingInt ? (
                    <div className="py-2"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                    <>
                      <Upload className="text-amber-500 mb-2" size={20} />
                      <span className="text-xs font-medium text-slate-600">点击/拖拽上传企业主数据、流程规范文件</span>
                    </>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {internalDocs.map(doc => (
                    <div 
                      key={doc.id} 
                      onClick={() => setFilterDoc(filterDoc === doc.name ? null : doc.name)}
                      className={`p-2 border rounded transition-all cursor-pointer group ${filterDoc === doc.name ? 'border-amber-500 bg-amber-100/50 shadow-sm ring-1 ring-amber-200' : 'border-amber-100 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className={`shrink-0 mt-0.5 transition-colors ${filterDoc === doc.name ? 'text-amber-600' : 'text-amber-500'}`} size={14} />
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-xs font-bold truncate ${filterDoc === doc.name ? 'text-amber-700' : 'text-slate-700'}`}>{doc.name}</p>
                          <p className="text-[10px] text-amber-600 font-medium group-hover:underline">点击查看提取的 {doc.rules} 条管理规则</p>
                        </div>
                        {filterDoc === doc.name && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mt-1.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Middle: Rules Review */}
          <div className="flex-1 border-r border-slate-200 bg-slate-50/30 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Settings2 size={18} className="text-slate-600" />
                  提取的体检规则
                </h3>
                <p className="text-xs text-slate-500 mt-1">AI 解析产生的具体校验项</p>
              </div>
              <button
                onClick={() => onSave(rules)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> 保存配置
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 relative">
              {filteredRules.length > 0 ? (
                filteredRules.map((r, i) => (
                  <div 
                    key={r.id} 
                    onClick={() => setSelectedRule(r)}
                    className={`p-4 rounded-xl border bg-white shadow-sm flex items-start gap-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${selectedRule?.id === r.id ? 'ring-2 ring-blue-500 border-transparent' : r.type === 'external' ? 'border-red-200/60 hover:border-red-300' : 'border-amber-200/60 hover:border-amber-300'}`}
                  >
                    {r.type === 'external' ? (
                      <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">{r.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.type === 'external' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {r.type === 'external' ? '外环规则 (External)' : '内环规则 (Internal)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{r.desc}</p>
                      <div className="text-[10px] text-slate-500 bg-slate-50 inline-flex px-2 py-1 rounded border border-slate-100">
                        <span className="font-semibold mr-1">执行方式:</span> {r.action}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                  <AlertCircle size={32} className="mb-2 opacity-20" />
                  <p className="text-xs">未找到该文档关联的规则</p>
                </div>
              )}

              {/* Rule Detail Overlay */}
              {selectedRule && (
                <div className="absolute inset-0 z-20 bg-white animate-in slide-in-from-right duration-300 flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                       <button 
                        onClick={() => setSelectedRule(null)}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
                       >
                        <Play size={16} className="rotate-180 fill-slate-500" />
                       </button>
                       <h4 className="font-bold text-slate-800">规则详情 (Rule Detail)</h4>
                    </div>
                    <button onClick={() => setSelectedRule(null)}>
                      <X size={18} className="text-slate-400 hover:text-slate-600" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">规则名称 / Title</div>
                      <div className="text-lg font-bold text-slate-800">{selectedRule.title}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">等级 / Severity</div>
                        <div className={`text-xs font-bold ${selectedRule.type === 'external' ? 'text-red-600' : 'text-amber-600'}`}>{selectedRule.severity}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">执行方式 / Action</div>
                        <div className="text-xs font-bold text-slate-700">{selectedRule.action}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">逻辑说明 / Logic & Methodology</div>
                      <div className="p-4 bg-slate-900 rounded-xl text-slate-300 text-sm leading-relaxed font-mono">
                        {selectedRule.logic}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-emerald-600">溯源依据 / Evidence Source</div>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <FileSignature size={18} className="text-emerald-500" />
                        <div className="text-xs font-medium text-emerald-800">{selectedRule.sourceDoc}</div>
                        <button className="ml-auto text-[10px] font-bold text-emerald-600 hover:underline">查看原文</button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto p-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => setSelectedRule(null)}
                      className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      返回列表
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Simulation */}
          <div className="w-1/3 min-w-[320px] bg-white flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Play size={18} className="text-emerald-500" />
                  合规性试运行
                </h3>
                <p className="text-xs text-slate-500 mt-1">混合模型数据抽样诊断</p>
              </div>
              <button 
                onClick={handleSimulate}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                {isSimulating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={12} fill="currentColor" />}
                运行诊断
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {isSimulating ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm animate-pulse">正在利用AI及API进行全维度体检...</p>
                </div>
              ) : simulationResult ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-2">合规健康度</p>
                    <div className="text-5xl font-black text-slate-800">{simulationResult.score}<span className="text-2xl text-slate-400">%</span></div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">不合规风险分级 (Risk Grading)</h4>
                    <div className="space-y-3">
                      {simulationResult.issues.map((issue, idx) => (
                        <div key={idx} className={`p-3 border rounded-xl shadow-sm ${issue.type === 'external' ? 'border-red-200 bg-red-50/40 text-red-700' : 'border-amber-200 bg-amber-50/40 text-amber-700'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                              {issue.type === 'external' ? <AlertTriangle size={14} className="text-red-500" /> : <AlertCircle size={14} className="text-amber-500" />}
                              物料 {issue.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${issue.type === 'external' ? 'bg-red-100/50 text-red-600' : 'bg-amber-100/50 text-amber-600'}`}>
                              {issue.detail}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed opacity-90">{issue.msg}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  点击上方按钮对现有规则进行试运行诊断
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
