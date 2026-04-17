import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare, Square, Plus, MessageSquare } from 'lucide-react';
import { MARA_FIELD_DESCRIPTIONS } from '../utils/dataProcessor';

export let UNIQUENESS_OPTIONS = [
  { id: 'MAKTX', label: '物料描述 (MAKTX)' },
  { id: 'ZEINR_ZEIVR', label: '图号 (ZEINR) + 版本号 (ZEIVR)' },
  { id: 'MFRPN', label: '制造商型号 (MFRPN)' },
  { id: 'BISMT', label: '旧物料号 (BISMT)' }
];

interface UniquenessConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fields: string[]) => void;
  initialFields: string[];
}

export const UniquenessConfigModal: React.FC<UniquenessConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFields
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialFields));
  const [options, setOptions] = useState(UNIQUENESS_OPTIONS);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedFields(new Set(initialFields));
      setOptions(UNIQUENESS_OPTIONS);
      setCustomInput('');
    }
  }, [isOpen, initialFields]);

  if (!isOpen) return null;

  const toggleField = (field: string) => {
    const next = new Set(selectedFields);
    if (next.has(field)) {
      next.delete(field);
    } else {
      next.add(field);
    }
    setSelectedFields(next);
  };

  const selectAll = () => {
    setSelectedFields(new Set(options.map(o => o.id)));
  };

  const deselectAll = () => {
    setSelectedFields(new Set());
  };

  const handleSave = () => {
    onSave(Array.from(selectedFields));
  };

  const handleAddCustomField = () => {
    if (!customInput.trim()) return;
    
    const input = customInput.trim().toLowerCase();
    let matchedKey: string | null = null;
    let matchedDesc: string | null = null;

    for (const [key, desc] of Object.entries(MARA_FIELD_DESCRIPTIONS)) {
      if (input.includes(desc.toLowerCase()) || input.includes(key.toLowerCase())) {
        matchedKey = key;
        matchedDesc = desc;
        break;
      }
    }

    if (matchedKey && matchedDesc) {
      if (options.some(o => o.id === matchedKey)) {
        alert('该字段已在配置列表中');
        return;
      }
      
      const newOption = { id: matchedKey, label: `${matchedDesc} (${matchedKey})` };
      UNIQUENESS_OPTIONS.push(newOption);
      setOptions([...UNIQUENESS_OPTIONS]);
      
      const next = new Set(selectedFields);
      next.add(matchedKey);
      setSelectedFields(next);
      
      setCustomInput('');
    } else {
      alert('不属于可配置范围');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">配置关键属性 (唯一性校验)</h2>
            <p className="text-sm text-slate-500 mt-1">
              勾选的字段将被组合作为唯一性校验的关键字段。如果记录中这些字段的组合重复，则该记录将被判定为不唯一。
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <button 
            onClick={selectAll}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5"
          >
            <CheckSquare size={16} /> 全选
          </button>
          <button 
            onClick={deselectAll}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <Square size={16} /> 取消全选
          </button>
          <div className="ml-auto text-sm font-medium text-slate-500">
            已选择 <span className="text-blue-600 font-bold">{selectedFields.size}</span> 个字段
          </div>
        </div>

        {/* Field Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map(option => {
              const isSelected = selectedFields.has(option.id);
              return (
                <label 
                  key={option.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0
                    ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}
                  `}>
                    {isSelected && <CheckSquare size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                      {option.label}
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => toggleField(option.id)}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-2xl">
          <div className="flex-1 flex items-center gap-2 w-full">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageSquare size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomField()}
                placeholder="描述要增加的字段，如：特征值"
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <button
              onClick={handleAddCustomField}
              disabled={!customInput.trim()}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Plus size={16} />
              添加
            </button>
          </div>
          
          <div className="flex gap-3 shrink-0 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSave}
              disabled={selectedFields.size === 0}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
            >
              <Save size={16} />
              保存并重新计算
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
