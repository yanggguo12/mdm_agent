import React from 'react';
import { X, Database, FileText } from 'lucide-react';
import { SAPMaterial } from '../utils/dataProcessor';

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceName: string;
  data: SAPMaterial[];
}

export const RawDataModal: React.FC<RawDataModalProps> = ({ isOpen, onClose, sourceName, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm border border-indigo-200">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {sourceName}
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-md font-medium">原始数据</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <FileText size={14} />
                共加载 {data.length.toLocaleString()} 条底层记录
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Table */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full text-left text-sm text-slate-600 relative">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MANDT (客户端)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MATNR (物料号)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MAKTX (物料描述)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ERSDA (创建日期)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ERNAM (创建者)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">LAEDA (最后更改)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">AENAM (更改者)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">VPSTA (维护状态)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">PSTAT (维护状态)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">LVORM (删除标记)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MTART (物料类型)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MBRSH (行业领域)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MATKL (物料组)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">BISMT (旧物料号)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MEINS (基本单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">BSTME (采购单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ZEINR (文档号)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ZEIAR (文档类型)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ZEIVR (文档版本)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ZEIFO (页面格式)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">AESZN (文档更改号)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">BLANZ (页数)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">FERTH (生产备忘录)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">FORMT (备忘录格式)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">GROES (大小/量纲)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">BRGEW (毛重)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">NTGEW (净重)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">GEWEI (重量单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">VOLUM (体积)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">VOLEH (体积单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">BEHVO (容器要求)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">RAUBE (存储条件)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">TEMPB (温度条件)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">DISST (低层代码)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">TRAGR (运输组)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">STOFF (危险物料号)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">SPART (产品组)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">KZEFF (分配有效性)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">COMPL (物料完成度)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">EAN11 (国际条码)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">NUMTP (EAN类别)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">LAENG (长度)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">BREIT (宽度)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">HOEHE (高度)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MEABM (尺寸单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">PRDHA (产品层次)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">AEKLV (分配类)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">CADKZ (CAD标识)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">QMPUR (QM采购激活)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ERGEW (允许毛重)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ERGEI (允许重量单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ERVOL (允许体积)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">ERVOE (允许体积单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">GEWTO (超重容差)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">VOLTO (超体积容差)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">VABME (可变采购单位)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">KZREV (修订级别)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">KZKFG (可配置物料)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">XCHPF (批次管理)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">VHART (包装物料类型)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MAGRV (包装物料组)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">MSTAE (跨工厂状态)</th>
                    <th className="px-4 py-3 font-bold border-b border-slate-200 whitespace-nowrap">EXTWG (外部物料组)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((record, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/60 transition-colors">
                      <td className="px-4 py-2.5">{record.MANDT}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-800 font-medium">{record.MATNR}</td>
                      <td className="px-4 py-2.5 max-w-[250px] truncate" title={record.MAKTX}>{record.MAKTX}</td>
                      <td className="px-4 py-2.5">{record.ERSDA}</td>
                      <td className="px-4 py-2.5">{record.ERNAM}</td>
                      <td className="px-4 py-2.5">{record.LAEDA}</td>
                      <td className="px-4 py-2.5">{record.AENAM}</td>
                      <td className="px-4 py-2.5">{record.VPSTA}</td>
                      <td className="px-4 py-2.5">{record.PSTAT}</td>
                      <td className="px-4 py-2.5 text-center">
                        {record.LVORM ? <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded text-xs">{record.LVORM}</span> : ''}
                      </td>
                      <td className="px-4 py-2.5">{record.MTART}</td>
                      <td className="px-4 py-2.5">{record.MBRSH}</td>
                      <td className="px-4 py-2.5">
                        {record.MATKL ? record.MATKL : <span className="text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded text-xs">NULL</span>}
                      </td>
                      <td className="px-4 py-2.5">{record.BISMT}</td>
                      <td className="px-4 py-2.5">{record.MEINS}</td>
                      <td className="px-4 py-2.5">{record.BSTME}</td>
                      <td className="px-4 py-2.5">{record.ZEINR}</td>
                      <td className="px-4 py-2.5">{record.ZEIAR}</td>
                      <td className="px-4 py-2.5">{record.ZEIVR}</td>
                      <td className="px-4 py-2.5">{record.ZEIFO}</td>
                      <td className="px-4 py-2.5">{record.AESZN}</td>
                      <td className="px-4 py-2.5">{record.BLANZ}</td>
                      <td className="px-4 py-2.5">{record.FERTH}</td>
                      <td className="px-4 py-2.5">{record.FORMT}</td>
                      <td className="px-4 py-2.5">{record.GROES}</td>
                      <td className="px-4 py-2.5">{record.BRGEW}</td>
                      <td className="px-4 py-2.5">
                        {record.NTGEW > record.BRGEW ? <span className="text-red-600 font-bold">{record.NTGEW}</span> : record.NTGEW}
                      </td>
                      <td className="px-4 py-2.5">{record.GEWEI}</td>
                      <td className="px-4 py-2.5">{record.VOLUM}</td>
                      <td className="px-4 py-2.5">{record.VOLEH}</td>
                      <td className="px-4 py-2.5">{record.BEHVO}</td>
                      <td className="px-4 py-2.5">{record.RAUBE}</td>
                      <td className="px-4 py-2.5">{record.TEMPB}</td>
                      <td className="px-4 py-2.5">{record.DISST}</td>
                      <td className="px-4 py-2.5">{record.TRAGR}</td>
                      <td className="px-4 py-2.5">{record.STOFF}</td>
                      <td className="px-4 py-2.5">{record.SPART}</td>
                      <td className="px-4 py-2.5">{record.KZEFF}</td>
                      <td className="px-4 py-2.5">{record.COMPL}</td>
                      <td className="px-4 py-2.5 font-mono">
                        {record.EAN11 ? record.EAN11 : <span className="text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded text-xs">NULL</span>}
                      </td>
                      <td className="px-4 py-2.5">{record.NUMTP}</td>
                      <td className="px-4 py-2.5">{record.LAENG}</td>
                      <td className="px-4 py-2.5">{record.BREIT}</td>
                      <td className="px-4 py-2.5">{record.HOEHE}</td>
                      <td className="px-4 py-2.5">{record.MEABM}</td>
                      <td className="px-4 py-2.5 font-mono">{record.PRDHA}</td>
                      <td className="px-4 py-2.5">{record.AEKLV}</td>
                      <td className="px-4 py-2.5">{record.CADKZ}</td>
                      <td className="px-4 py-2.5">{record.QMPUR}</td>
                      <td className="px-4 py-2.5">{record.ERGEW}</td>
                      <td className="px-4 py-2.5">{record.ERGEI}</td>
                      <td className="px-4 py-2.5">{record.ERVOL}</td>
                      <td className="px-4 py-2.5">{record.ERVOE}</td>
                      <td className="px-4 py-2.5">{record.GEWTO}</td>
                      <td className="px-4 py-2.5">{record.VOLTO}</td>
                      <td className="px-4 py-2.5">{record.VABME}</td>
                      <td className="px-4 py-2.5">{record.KZREV}</td>
                      <td className="px-4 py-2.5">{record.KZKFG}</td>
                      <td className="px-4 py-2.5 text-center">
                        {record.XCHPF ? <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-xs">{record.XCHPF}</span> : ''}
                      </td>
                      <td className="px-4 py-2.5">{record.VHART}</td>
                      <td className="px-4 py-2.5">{record.MAGRV}</td>
                      <td className="px-4 py-2.5">{record.MSTAE}</td>
                      <td className="px-4 py-2.5">{record.EXTWG}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
