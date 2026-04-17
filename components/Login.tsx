import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, Shield, Zap, Globe, Settings, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      onLogin();
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side - Dark Branding */}
        <div className="md:w-[42%] bg-[#0f172a] p-8 lg:p-12 text-white relative flex flex-col justify-between overflow-hidden">
          {/* Background Decorative patterns */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="relative z-10">
            {/* Logo area */}
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Shield size={22} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight leading-none mb-0.5">数据治理健康管家</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider opacity-80">Data Governance Health Steward</span>
              </div>
            </div>

            {/* Hero text */}
            <div className="mb-12">
              <h2 className="text-4xl lg:text-5xl font-extrabold leading-[1.15] mb-6 tracking-tight">
                数智治理 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">重塑资产价值</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                数据治理健康管家为企业核心数据提供全生命周期的主动式健康监测与智能修复。
              </p>
            </div>

            {/* Features Info */}
            <div className="space-y-8">
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
                  <Activity size={20} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-slate-200 uppercase tracking-wide">数据健康巡检</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">围绕数据质量、标准与主题资产，全天候捕捉异常与健康态势</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-600/20 transition-colors">
                  <Zap size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-slate-200 uppercase tracking-wide">管家式智能修复</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">AI 辅助诊断与处置建议，推动治理闭环，让核心资产持续可信可用</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Globe size={14} />
            <span>匠心筑基 · 智领未来</span>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 p-8 lg:p-20 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
              <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">欢迎回来</h3>
              <p className="text-slate-500 text-sm">请输入账号与密码，进入数据库治理健康管家</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">账号 <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="请输入账号"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">密码 <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20" />
                  <span className="ml-2 text-sm text-slate-500 group-hover:text-slate-700 transition-colors tracking-tight">记住我的登录状态</span>
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors tracking-tight">无法登录?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-white font-bold transition-all shadow-xl shadow-blue-600/20 group ${
                  isLoading 
                  ? 'bg-blue-600/50 cursor-wait' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:translate-y-[-2px] hover:shadow-blue-500/40 active:translate-y-0 active:shadow-lg'
                }`}
              >
                <span className="tracking-wide">{isLoading ? '正在进入系统...' : '进入系统'}</span>
                {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-12 flex items-center justify-center gap-2 text-blue-600/80 hover:text-blue-600 cursor-pointer transition-colors">
              <Settings size={16} />
              <span className="text-sm font-medium tracking-tight">切换数据治理平台</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
