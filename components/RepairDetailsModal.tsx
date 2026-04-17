import React, { useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react';

interface RepairDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: { id: string; title: string; type: 'success' | 'warning' | 'info' } | null;
}

export const RepairDetailsModal: React.FC<RepairDetailsModalProps> = ({ isOpen, onClose, config }) => {
  const mockData = useMemo(() => {
    if (!config) return [];
    const data = [];
    for (let i = 0; i < 15; i++) {
      const matId = `MAT-${100000 + Math.floor(Math.random() * 900000)}`;
      if (config.id === 'formatting') {
        data.push({
          id: i,
          materialId: matId,
          field: 'EAN11',
          original: ' 6901234567890 ',
          repaired: '6901234567890',
          confidence: '100%',
          status: '已执行'
        });
      } else if (config.id === 'inference') {
        data.push({
          id: i,
          materialId: matId,
          field: 'MATKL',
          original: '空 (NULL)',
          repaired: ['001', '002', '003', '004'][Math.floor(Math.random() * 4)],
          confidence: `${Math.floor(Math.random() * 15 + 80)}%`,
          status: '待复核'
        });
      } else {
        data.push({
          id: i,
          materialId: matId,
          field: 'NTGEW',
          original: `-${Math.floor(Math.random() * 10 + 1)}`,
          repaired: '0',
          confidence: '100%',
          status: '系统规则'
        });
      }
    }
    return data;
  }, [config]);

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {config.type === 'success' && <CheckCircle2 className="text-green-500" size={24} />}
            {config.type === 'warning' && <AlertCircle className="text-amber-500" size={24} />}
            {config.type === 'info' && <Info className="text-blue-500" size={24} />}
            <h2 className="text-lg font-bold text-slate-800">{config.title} - 修复明细</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-4 py-3">物料号</th>
                  <th className="px-4 py-3">修复字段</th>
                  <th className="px-4 py-3">原始值</th>
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">修复/建议值</th>
                  <th className="px-4 py-3">置信度</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.materialId}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{row.field}</span>
                    </td>
                    <td className="px-4 py-3 text-red-500 line-through decoration-red-300">{row.original}</td>
                    <td className="px-4 py-3 text-slate-300"><ArrowRight size={14} /></td>
                    <td className="px-4 py-3 text-green-600 font-medium">{row.repaired}</td>
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
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        config.type === 'success' ? 'bg-green-100 text-green-700' :
                        config.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
