import React from 'react';
import { Database, Search, FileCheck, CheckCircle2 } from 'lucide-react';

interface ScanningStepsProps {
  currentStep: number; // 0: Idle, 1: Extract, 2: Analyze, 3: Score, 4: Done
}

export const ScanningSteps: React.FC<ScanningStepsProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, name: '采样与提取', icon: Database, desc: 'CDC Debezium' },
    { id: 2, name: 'AI 语义校验', icon: Search, desc: 'Semantic Check' },
    { id: 3, name: '评分与归档', icon: FileCheck, desc: 'Rule Engine' },
  ];

  if (currentStep === 0) return null;

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/5 mb-8 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

      <div className="flex justify-between relative max-w-4xl mx-auto overflow-x-auto pb-4 sm:pb-0 scrollbar-hide">
        {/* Connecting Line */}
        <div className="absolute top-6 left-6 right-6 sm:left-12 sm:right-12 h-1 bg-slate-100 rounded-full -z-0 min-w-[300px]">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
        </div>

        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 group min-w-[80px]">
              <div 
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                  isActive ? 'bg-white border-blue-500 text-blue-600 scale-110 shadow-lg shadow-blue-200' : 
                  isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={20} className="sm:w-6 sm:h-6" /> : <step.icon size={16} className="sm:w-5 sm:h-5" />}
              </div>
              <h4 className={`mt-3 sm:mt-4 text-xs sm:text-sm font-bold transition-colors text-center ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>{step.name}</h4>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium text-center">{step.desc}</p>
            </div>
          );
        })}
        
         {/* Final Step Badge */}
         <div className="flex flex-col items-center relative z-10 min-w-[80px]">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${currentStep === 4 ? 'bg-green-500 border-green-500 text-white scale-110 shadow-lg shadow-green-200' : 'bg-white border-slate-200 text-slate-300'}`}>
                <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h4 className={`mt-3 sm:mt-4 text-xs sm:text-sm font-bold transition-colors text-center ${currentStep === 4 ? 'text-green-600' : 'text-slate-600'}`}>完成</h4>
        </div>
      </div>
      
      {currentStep < 4 && (
        <div className="mt-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold animate-pulse border border-blue-100">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
               正在处理 MARA 批次 #2910...
            </span>
        </div>
      )}
    </div>
  );
};