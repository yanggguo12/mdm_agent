import React from 'react';
import { DataIssue, IssueSeverity } from '../types';
import { AlertTriangle, CheckCircle2, Zap, MoreHorizontal, ArrowRight } from 'lucide-react';

interface IssueTableProps {
  issues: DataIssue[];
  onRepair: (issue: DataIssue) => void;
  onViewAll?: () => void;
  onRowClick?: (issue: DataIssue) => void;
}

export const IssueTable: React.FC<IssueTableProps> = ({ issues, onRepair, onViewAll, onRowClick }) => {
  
  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.HIGH:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">高 (High)</span>;
      case IssueSeverity.MEDIUM:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">中 (Medium)</span>;
      case IssueSeverity.LOW:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">低 (Low)</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">关键问题诊断 (Problem Diagnosis)</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">需要关注的优先异常项</p>
        </div>
        <button 
            onClick={onViewAll}
            className="text-xs sm:text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ml-4"
        >
            查看全部 <ArrowRight size={14} />
        </button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 text-xs uppercase text-slate-500 font-bold tracking-wider border-b border-slate-100">
              <th className="px-4 sm:px-6 py-3 sm:py-4">严重程度</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">对象 / 表 (Object)</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">问题描述 (Description)</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">影响范围</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">AI 修复建议</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {issues.map((issue) => (
              <tr 
                key={issue.id} 
                className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                onClick={() => onRowClick?.(issue)}
              >
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  {getSeverityBadge(issue.severity)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="font-semibold text-slate-800">{issue.table}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{issue.field}</div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 max-w-xs transition-colors duration-300" title={issue.description}>
                  <div className={`p-2 rounded-lg border ${
                    issue.description.includes('外环') || issue.description.includes('法规') || issue.description.includes('外部违规') ? 'bg-red-50/80 border-red-200 text-red-700 font-medium' :
                    issue.description.includes('内环') || issue.description.includes('管理规范') || issue.description.includes('内部违规') || issue.description.includes('双环规则') || issue.description.includes('双环预警') ? 'bg-amber-50/80 border-amber-200 text-amber-700 font-medium' :
                    'bg-transparent border-transparent text-slate-600'
                  }`}>
                    {issue.description}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700">
                  {issue.impact}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit max-w-[220px] truncate">
                    <Zap size={14} className="fill-indigo-500 text-indigo-500 shrink-0" />
                    <span className="text-xs font-medium truncate" title={issue.suggestion}>{issue.suggestion}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {issue.status === 'Fixed' ? (
                        <span className="flex items-center justify-end gap-1.5 text-green-600 font-bold text-xs bg-green-50 py-1.5 px-3 rounded-lg border border-green-100 w-fit ml-auto">
                            <CheckCircle2 size={14} /> 已修复
                        </span>
                    ) : (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRepair(issue);
                            }}
                            className="inline-flex items-center px-4 py-1.5 border border-blue-200 text-xs font-semibold rounded-lg shadow-sm text-blue-600 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 focus:outline-none transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-x-2 sm:group-hover:translate-x-0"
                        >
                            自动修复
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
