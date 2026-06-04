import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare, Square, Layers, Trash2, Link as LinkIcon, Plus, Layout, Grid3X3 } from 'lucide-react';
import { MARA_FIELD_DESCRIPTIONS } from '../utils/dataProcessor';

interface UniquenessConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groups: string[][]) => void;
  initialFields: string[][];
  selectedCategories: string[];
}

const CATEGORY_FIELD_GROUPS: Record<string, string[]> = {
  '基础数据MARA': ['MATNR', 'MAKTX', 'BISMT', 'MTART', 'MATKL', 'MEINS', 'BRGEW', 'NTGEW', 'GEWEI', 'MFRPN', 'ZEINR', 'ZEIVR', 'MSTAE', 'EXTWG'],
  '工厂数据MARC': ['WERKS', 'DISMM', 'DISLS', 'PLIFZ', 'LGRZE', 'RGEKZ', 'XCHPF'],
  '财务数据MBEW': ['BWKEY', 'BKLAS', 'VPRSV', 'VERPR', 'STPRS', 'PEINH', 'BWTTY'],
  'BOM': ['STLNR', 'STLAL', 'STKO', 'STPO', 'MATNR', 'WERKS'],
  '工作中心': ['ARBPL', 'WERKS', 'VERWE', 'KTEXT']
};

export const UniquenessConfigModal: React.FC<UniquenessConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFields,
  selectedCategories
}) => {
  const [groups, setGroups] = useState<string[][]>(initialFields);
  const [selection, setSelection] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroups(initialFields);
      setSelection([]);
      setSearchQuery('');
    }
  }, [isOpen, initialFields]);

  if (!isOpen) return null;

  const toggleSelection = (field: string) => {
    setSelection(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const addRule = () => {
    if (selection.length === 0) return;
    
    const sortedNew = [...selection].sort().join('|');
    const exists = groups.some(g => [...g].sort().join('|') === sortedNew);
    
    if (!exists) {
      setGroups([...groups, [...selection]]);
    }
    setSelection([]);
  };

  const removeGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const clearSelection = () => setSelection([]);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="text-blue-600" size={24} />
              配置关键属性 (唯一性校验)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              通过勾选字段并添加为“唯一性规则”（单字段或复合键）来确保数据不重复。
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            
            {/* Search and Quick Selection */}
            <div className="mb-6 flex gap-3 items-center">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="搜索字段名称或代码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm bg-white"
                />
              </div>
              {selection.length > 0 && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                  <span className="text-xs font-bold text-slate-500">已选 {selection.length} 个字段</span>
                  <button 
                    onClick={addRule}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> 添加为{selection.length > 1 ? '复合' : '独立'}规则
                  </button>
                  <button onClick={clearSelection} className="text-xs text-slate-400 hover:text-slate-600 px-2 font-medium">取消</button>
                </div>
              )}
            </div>

            {/* Field Groups (The scrolling part) */}
            <div className="space-y-8">
              {selectedCategories.map(cat => {
                const allFields = CATEGORY_FIELD_GROUPS[cat] || [];
                const filteredFields = allFields.filter(f => 
                  f.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (MARA_FIELD_DESCRIPTIONS[f] || '').toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredFields.length === 0 && searchQuery) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-3 px-1">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Layout size={16} className="text-slate-400" />
                        {cat.replace('数据', '')}
                      </h3>
                      <div className="h-[1px] flex-1 bg-slate-200/60" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {filteredFields.map(field => {
                        const isSelected = selection.includes(field);
                        const desc = MARA_FIELD_DESCRIPTIONS[field] || field;
                        return (
                          <label 
                            key={field}
                            className={`
                              flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 hover:bg-white bg-white/60'}
                            `}
                          >
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={isSelected} 
                              onChange={() => toggleSelection(field)} 
                            />
                            <div className={`
                              w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0
                              ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}
                            `}>
                              {isSelected && <CheckSquare size={14} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'} truncate`}>
                                {field}
                              </span>
                              <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-500'} truncate`}>
                                {desc}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: Active Rules Container */}
          <div className="w-[320px] bg-slate-50 border-l border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Grid3X3 size={14} />
                生效规则集 ({groups.length})
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {groups.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-60 text-center py-10 px-4">
                  <Layers size={32} strokeWidth={1.5} />
                  <p className="text-xs font-medium">尚未配置任何规则，请从左侧选择字段并添加</p>
                </div>
              ) : (
                groups.map((group, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight ${group.length > 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {group.length > 1 ? '复合规则' : '独立规则'}
                      </span>
                      <button 
                        onClick={() => removeGroup(idx)}
                        className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-300 rounded transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {group.map((f, fIdx) => (
                        <React.Fragment key={fIdx}>
                          <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[11px] font-bold text-slate-600">
                             {MARA_FIELD_DESCRIPTIONS[f] || f}
                          </div>
                          {fIdx < group.length - 1 && <LinkIcon size={10} className="text-slate-300" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            放弃修改
          </button>
          <button
            onClick={() => onSave(groups)}
            disabled={groups.length === 0}
            className="px-10 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            保存并应用配置
          </button>
        </div>
      </div>
    </div>
  );
};
