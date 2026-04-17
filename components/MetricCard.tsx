import React from 'react';
import { HealthMetric } from '../types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  metric: HealthMetric;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onClick }) => {
  const data = [
    { name: 'Score', value: metric.score },
    { name: 'Remaining', value: 100 - metric.score },
  ];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center justify-between gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1 group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 truncate" title={metric.name}>{metric.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{metric.score}<span className="text-base text-slate-400 font-medium ml-1">%</span></span>
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold mt-2 px-2 py-1 rounded-md w-fit transition-colors whitespace-nowrap
            ${metric.trend === 'up' ? 'bg-green-50 text-green-600' : metric.trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
            {metric.trend === 'up' && <><ArrowUp size={12} /> 较上周上升</>}
            {metric.trend === 'down' && <><ArrowDown size={12} /> 需要关注</>}
            {metric.trend === 'stable' && <><Minus size={12} /> 保持稳定</>}
        </div>
      </div>
      
      {/* 优化图表容器大小和半径，防止被截断 */}
      <div className="h-16 w-16 relative opacity-90 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={22}
              outerRadius={30}
              paddingAngle={4}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              cornerRadius={4}
            >
              <Cell fill={metric.color} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="text-[8px] font-bold text-slate-300">KPI</span>
        </div>
      </div>
    </div>
  );
};