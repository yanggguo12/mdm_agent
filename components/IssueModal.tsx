import React from 'react';
import { DataIssue, IssueSeverity } from '../types';
import { X, CheckCircle2, Zap, FileSpreadsheet } from 'lucide-react';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: DataIssue[];
  onRepair: (issue: DataIssue) => void;
  onRowClick?: (issue: DataIssue) => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, issues, onRepair, onRowClick }) => {
  if (!isOpen) return null;

  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.HIGH:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">High</span>;
      case IssueSeverity.MEDIUM:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Medium</span>;
      case IssueSeverity.LOW:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">Low</span>;
    }
  };

  const handleExport = () => {
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <FileSpreadsheet size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-800">全量数据异常清单 (Full Data Anomaly List)</h2>
                <p className="text-sm text-slate-500">检测到的所有质量问题明细</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur shadow-sm z-10">
              <tr className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="px-6 py-4 border-b border-slate-200">ID</th>
                <th className="px-6 py-4 border-b border-slate-200">严重程度</th>
                <th className="px-6 py-4 border-b border-slate-200">表 / 字段</th>
                <th className="px-6 py-4 border-b border-slate-200 w-1/4">详细描述</th>
                <th className="px-6 py-4 border-b border-slate-200">影响</th>
                <th className="px-6 py-4 border-b border-slate-200">状态</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {issues.map((issue) => (
                <tr 
                  key={issue.id} 
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(issue)}
                >
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{issue.id}</td>
                  <td className="px-6 py-4">{getSeverityBadge(issue.severity)}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{issue.table}</div>
                    <div className="text-xs text-slate-500 font-mono">{issue.field}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700">{issue.description}</div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">
                        <Zap size={12} className="fill-indigo-600" />
                        AI: {issue.suggestion}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{issue.impact}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        issue.status === 'Fixed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                        {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {issue.status === 'Fixed' ? (
                       <span className="flex items-center justify-end gap-1 text-green-600 font-medium text-xs">
                          <CheckCircle2 size={14} /> 已处理
                       </span>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRepair(issue);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline"
                      >
                        执行修复
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {/* Fake extra rows for demonstration if list is short */}
              {issues.length < 10 && Array.from({ length: 3 }).map((_, i) => (
                 <tr key={`mock-${i}`} className="opacity-50 grayscale pointer-events-none bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">ISS-00{6+i}</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-400">Low</span></td>
                    <td className="px-6 py-4">
                        <div className="font-bold text-slate-400">EKPO</div>
                        <div className="text-xs text-slate-300 font-mono">NETPR</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">历史归档数据校验 (Archived)</td>
                    <td className="px-6 py-4 text-slate-400">0.0%</td>
                    <td className="px-6 py-4"><span className="bg-slate-100 text-slate-400 px-2 py-1 rounded text-xs">Archived</span></td>
                    <td className="px-6 py-4"></td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs text-slate-500">显示 {issues.length} 条记录 / 共 {issues.length + 32} 条历史记录</span>
            <div className="flex gap-2">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 font-medium hover:bg-slate-50 shadow-sm"
                >
                    关闭
                </button>
                <button 
                    onClick={handleExport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 active:transform active:scale-95 transition-all"
                >
                    导出报告 (Excel)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};