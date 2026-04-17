import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Zap, ArrowRight, CheckCircle2, FileSpreadsheet, Sparkles, ArrowUpDown, Flag } from 'lucide-react';
import { DataIssue, IssueSeverity } from '../types';

interface IssueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: DataIssue | null;
  onRepair: (issue: DataIssue) => void;
}

interface RowData {
  id: number;
  materialId: string;
  field: string;
  original: string;
  suggestion: string;
  confidence: string;
  reason: string;
  impactScope: { text: string; level: 'high' | 'medium' | 'low'; details: string[] };
  isException?: boolean;
  _duplicateGroup?: string;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({ isOpen, onClose, issue, onRepair }) => {
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [impactSort, setImpactSort] = useState<'desc' | 'asc' | null>(null);
  const [selectedImpactDetails, setSelectedImpactDetails] = useState<RowData | null>(null);

  useEffect(() => {
    if (!issue || !isOpen) {
      setTableData([]);
      setSelectedRowIds(new Set());
      setImpactSort(null);
      setSelectedImpactDetails(null);
      return;
    }
    const data: RowData[] = [];
    if (issue.type === 'Duplicate' && issue.calculationDetails?.sampleBadRecords) {
      // Use actual sample bad records for duplicates to show grouping
      const records = issue.calculationDetails.sampleBadRecords;
      records.forEach((record: any, i: number) => {
        const matId = record.MATNR;
        const groupDesc = record._duplicateGroup || record.MAKTX;
        const duplicateReasons = record._duplicateReasons || issue.field;
        
        // Generate impact scope
        const rand = Math.random();
        let impactScope: { text: string; level: 'high' | 'medium' | 'low'; details: string[] };
        if (rand > 0.7) {
          const orderCount = Math.floor(Math.random() * 50 + 10);
          impactScope = { 
            text: `关联 ${orderCount} 笔订单`, 
            level: 'high',
            details: [
              `未交货订单: ${Math.floor(orderCount * 0.4)} 笔`,
              `涉及核心客户: 华为, 腾讯等`,
              `预估延期违约金风险: ¥${(Math.random() * 5 + 1).toFixed(1)}万`
            ]
          };
        } else if (rand > 0.3) {
          const stockVal = (Math.random() * 50 + 1).toFixed(1);
          impactScope = { 
            text: `库存 ¥${stockVal}万`, 
            level: 'medium',
            details: [
              `上海中心仓: ¥${(Number(stockVal) * 0.6).toFixed(1)}万`,
              `北京分仓: ¥${(Number(stockVal) * 0.4).toFixed(1)}万`,
              `呆滞天数: ${Math.floor(Math.random() * 60 + 30)} 天`
            ]
          };
        } else {
          impactScope = { 
            text: '新物料/无业务', 
            level: 'low',
            details: [
              `创建时间: 近 7 天内`,
              `当前状态: 尚未发生采购/销售业务`,
              `建议: 尽早修复以防未来业务报错`
            ]
          };
        }

        const similarity = Math.floor(Math.random() * 5 + 95); // 95-99
        data.push({
          id: i,
          materialId: matId,
          field: duplicateReasons,
          original: groupDesc,
          suggestion: `合并至首选编码`,
          confidence: `${similarity}%`,
          reason: `原因：系统检测到该物料在以下字段（${duplicateReasons}）与同组其他记录高度相似或完全一致。`,
          impactScope,
          _duplicateGroup: groupDesc // Store group for coloring
        } as any);
      });
    } else {
      const count = Math.min(issue.count, 15); // Show up to 15 mock records
      
      for (let i = 0; i < count; i++) {
        const matId = `MAT-${100000 + Math.floor(Math.random() * 900000)}`;
        
        // Generate impact scope
        const rand = Math.random();
        let impactScope: { text: string; level: 'high' | 'medium' | 'low'; details: string[] };
        if (rand > 0.7) {
          const orderCount = Math.floor(Math.random() * 50 + 10);
          impactScope = { 
            text: `关联 ${orderCount} 笔订单`, 
            level: 'high',
            details: [
              `未交货订单: ${Math.floor(orderCount * 0.4)} 笔`,
              `涉及核心客户: 华为, 腾讯等`,
              `预估延期违约金风险: ¥${(Math.random() * 5 + 1).toFixed(1)}万`
            ]
          };
        } else if (rand > 0.3) {
          const stockVal = (Math.random() * 50 + 1).toFixed(1);
          impactScope = { 
            text: `库存 ¥${stockVal}万`, 
            level: 'medium',
            details: [
              `上海中心仓: ¥${(Number(stockVal) * 0.6).toFixed(1)}万`,
              `北京分仓: ¥${(Number(stockVal) * 0.4).toFixed(1)}万`,
              `呆滞天数: ${Math.floor(Math.random() * 60 + 30)} 天`
            ]
          };
        } else {
          impactScope = { 
            text: '新物料/无业务', 
            level: 'low',
            details: [
              `创建时间: 近 7 天内`,
              `当前状态: 尚未发生采购/销售业务`,
              `建议: 尽早修复以防未来业务报错`
            ]
          };
        }
        
        if (issue.type === 'Missing Field') {
          const keywords = ['轴承', '齿轮', '电机', '阀门', '传感器', '螺栓', '泵', '控制器'];
          const keyword = keywords[i % keywords.length];
          const suggestion = ['001', '002', '003', '004'][Math.floor(Math.random() * 4)];
          const percent = Math.floor(Math.random() * 10 + 90); // 90-99
          data.push({
            id: i,
            materialId: matId,
            field: issue.field,
            original: '空 (NULL)',
            suggestion: suggestion,
            confidence: `${percent}%`,
            reason: `原因：物料描述中包含“${keyword}”，历史记录中 ${percent}% 的“${keyword}”类物料归属于 ${suggestion} 类别。`,
            impactScope
          });
        } else if (issue.type === 'Duplicate') {
          const duplicateWith = `MAT-${100000 + Math.floor(Math.random() * 900000)}`;
          const similarity = Math.floor(Math.random() * 5 + 95); // 95-99
          data.push({
            id: i,
            materialId: matId,
            field: 'MAKTX',
            original: `重复描述产品 ${i % 5}`,
            suggestion: '合并/标记删除',
            confidence: `${similarity}%`,
            reason: `原因：系统检测到该物料与已有物料 ${duplicateWith} 的描述和规格参数高度相似，相似度达 ${similarity}%。`,
            impactScope
          });
        } else if (issue.type === 'Outlier') {
          const originalWeight = (Math.random() * 10 + 50).toFixed(2); // 50-60
          const suggestedWeight = (Math.random() * 2 + 5).toFixed(2); // 5-7
          data.push({
            id: i,
            materialId: matId,
            field: 'NTGEW',
            original: `${originalWeight} kg`,
            suggestion: `${suggestedWeight} kg`,
            confidence: '100%',
            reason: `原因：当前净重值 (${originalWeight} kg) 超出同类物料历史平均范围 (4.5kg - 7.5kg) 的 3 个标准差，建议修正为 ${suggestedWeight} kg。`,
            impactScope
          });
        } else {
          const originalFormat = `ABC-${Math.floor(Math.random() * 1000)}`;
          const suggestedFormat = `ABC${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
          data.push({
            id: i,
            materialId: matId,
            field: issue.field,
            original: originalFormat,
            suggestion: suggestedFormat,
            confidence: '99%',
            reason: `原因：当前值 '${originalFormat}' 包含非法连接符且长度不足，基于历史数据模式，标准格式应为 '${suggestedFormat}'。`,
            impactScope
          });
        }
      }
    }
    setTableData(data);
    setSelectedRowIds(new Set());
  }, [issue, isOpen]);

  const sortedData = React.useMemo(() => {
    let sortableData = [...tableData];
    if (impactSort !== null) {
      const levelMap = { high: 3, medium: 2, low: 1 };
      sortableData.sort((a, b) => {
        const aLevel = levelMap[a.impactScope.level];
        const bLevel = levelMap[b.impactScope.level];
        if (aLevel < bLevel) return impactSort === 'asc' ? -1 : 1;
        if (aLevel > bLevel) return impactSort === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (issue?.type === 'Duplicate') {
      sortableData.sort((a, b) => (a._duplicateGroup || '').localeCompare(b._duplicateGroup || ''));
    }
    return sortableData;
  }, [tableData, impactSort, issue]);

  const groupColors = ['bg-blue-50/60', 'bg-emerald-50/60', 'bg-amber-50/60', 'bg-purple-50/60', 'bg-rose-50/60'];
  const uniqueGroups = React.useMemo(() => {
    return Array.from(new Set(sortedData.map(r => r._duplicateGroup).filter(Boolean)));
  }, [sortedData]);

  const getRowClassName = (row: RowData) => {
    if (row.isException) return 'bg-slate-50/60 opacity-80 transition-colors';
    if (issue?.type === 'Duplicate' && row._duplicateGroup) {
      const groupIndex = uniqueGroups.indexOf(row._duplicateGroup);
      return `${groupColors[groupIndex % groupColors.length]} hover:brightness-95 transition-all`;
    }
    return 'hover:bg-slate-50 transition-colors';
  };

  if (!isOpen || !issue) return null;

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.HIGH: return 'text-red-600 bg-red-50 border-red-200';
      case IssueSeverity.MEDIUM: return 'text-amber-600 bg-amber-50 border-amber-200';
      case IssueSeverity.LOW: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(new Set(tableData.map(row => row.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (id: number) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRowIds(newSet);
  };

  const handleSuggestionChange = (id: number, newValue: string) => {
    setTableData(prev => prev.map(row => row.id === id ? { ...row, suggestion: newValue } : row));
  };

  const handleManualRepair = () => {
    onRepair(issue);
    onClose();
  };

  const handleMarkException = () => {
    setTableData(prev => prev.map(row => 
      selectedRowIds.has(row.id) ? { ...row, isException: true } : row
    ));
    setSelectedRowIds(new Set());
  };

  const toggleImpactSort = () => {
    if (impactSort === null) setImpactSort('desc');
    else if (impactSort === 'desc') setImpactSort('asc');
    else setImpactSort(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${getSeverityColor(issue.severity)}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">问题明细: {issue.id}</h2>
              <p className="text-sm text-slate-500">{issue.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          
          {/* Issue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">影响对象</div>
              <div className="font-semibold text-slate-800">{issue.table}</div>
              <div className="text-xs font-mono text-slate-400 mt-1">{issue.field}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">问题描述</div>
              <div className="font-semibold text-slate-800">{issue.description}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">影响范围</div>
              <div className="font-semibold text-slate-800">{issue.impact}</div>
              <div className="text-xs text-slate-400 mt-1">共 {issue.count} 条记录</div>
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
              <Zap size={18} className="fill-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-900 mb-1">AI 修复建议</h4>
              <p className="text-sm text-indigo-700">{issue.suggestion}</p>
            </div>
          </div>

          {/* Affected Records Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-slate-400" />
                受影响记录抽样 (Top {tableData.length})
              </h3>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedRowIds.size === tableData.length && tableData.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">物料号</th>
                    <th 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={toggleImpactSort}
                    >
                      <div className="flex items-center gap-1">
                        影响金额/范围
                        <ArrowUpDown size={14} className={impactSort ? 'text-blue-600' : 'text-slate-400'} />
                      </div>
                    </th>
                    <th className="px-4 py-3">异常字段</th>
                    <th className="px-4 py-3">当前值</th>
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">AI 建议值 (可编辑)</th>
                    <th className="px-4 py-3">置信度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedData.map((row) => (
                    <tr key={row.id} className={getRowClassName(row)}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          {row.materialId}
                          {row.isException && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                              特例
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => setSelectedImpactDetails(row)}
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer ${
                            row.impactScope.level === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                            row.impactScope.level === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {row.impactScope.text}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{row.field}</span>
                      </td>
                      <td className="px-4 py-3 text-red-500">{row.original}</td>
                      <td className="px-4 py-3 text-slate-300"><ArrowRight size={14} /></td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.suggestion}
                          onChange={(e) => handleSuggestionChange(row.id, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-green-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <div className="text-xs text-slate-500 mt-1.5 flex items-start gap-1">
                          <Sparkles size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                          <span className="leading-tight">{row.reason}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${parseInt(row.confidence) > 90 ? 'bg-green-500' : 'bg-amber-500'}`} 
                              style={{ width: row.confidence }}
                            />
                          </div>
                          <span className="text-xs">{row.confidence}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            {issue.status === 'Fixed' ? '该问题已修复' : `已选择 ${selectedRowIds.size} 项`}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
              关闭
            </button>
            
            {issue.status !== 'Fixed' && selectedRowIds.size > 0 && (
              <>
                <button 
                  onClick={handleMarkException}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                >
                  <Flag size={16} className="text-amber-500" />
                  标记为特例 ({selectedRowIds.size})
                </button>
                <button 
                  onClick={handleManualRepair}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm shadow-indigo-200"
                >
                  <CheckCircle2 size={16} className="text-white" />
                  人工确认修复 ({selectedRowIds.size})
                </button>
              </>
            )}

            {issue.status !== 'Fixed' && selectedRowIds.size === 0 && (
              <button 
                onClick={() => {
                  onRepair(issue);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200"
              >
                <Zap size={16} className="fill-white" />
                一键自动修复
              </button>
            )}

            {issue.status === 'Fixed' && (
              <button disabled className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium cursor-not-allowed">
                <CheckCircle2 size={16} />
                已修复
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Impact Details Modal */}
      {selectedImpactDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">影响明细 - {selectedImpactDetails.materialId}</h3>
              <button onClick={() => setSelectedImpactDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mb-2 ${
                selectedImpactDetails.impactScope.level === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                selectedImpactDetails.impactScope.level === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                'bg-slate-50 text-slate-500 border border-slate-200'
              }`}>
                {selectedImpactDetails.impactScope.text}
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                {selectedImpactDetails.impactScope.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button onClick={() => setSelectedImpactDetails(null)} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
