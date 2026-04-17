import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare, Square } from 'lucide-react';
import { MARA_FIELDS, MARA_FIELD_DESCRIPTIONS } from '../utils/dataProcessor';

interface CompletenessConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fields: string[]) => void;
  initialFields: string[];
}

export const CompletenessConfigModal: React.FC<CompletenessConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFields
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialFields));

  useEffect(() => {
    if (isOpen) {
      setSelectedFields(new Set(initialFields));
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
    setSelectedFields(new Set(MARA_FIELDS));
  };

  const deselectAll = () => {
    setSelectedFields(new Set());
  };

  const handleSave = () => {
    onSave(Array.from(selectedFields));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">配置关键属性 (完整性校验)</h2>
            <p className="text-sm text-slate-500 mt-1">
              勾选的字段将被视为关键字段。如果记录中任意一个关键字段为空，则该记录将被判定为不完整。
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MARA_FIELDS.map(field => {
              const isSelected = selectedFields.has(field);
              const desc = MARA_FIELD_DESCRIPTIONS[field] || '未知';
              return (
                <label 
                  key={field}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                  `}
                >
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={isSelected} 
                    onChange={() => toggleField(field)} 
                  />
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0
                    ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-white'}
                  `}>
                    {isSelected && <CheckSquare size={14} className="opacity-100" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'} truncate`}>
                      {field}
                    </span>
                    <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-500'} truncate`} title={desc}>
                      {desc}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={selectedFields.size === 0}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            保存配置
          </button>
        </div>

      </div>
    </div>
  );
};
