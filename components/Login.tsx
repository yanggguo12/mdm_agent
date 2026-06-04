import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, Shield, Zap, 
  Globe, Settings, Activity, Smartphone, Laptop, Wifi, Battery, Signal 
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
  viewMode: 'desktop' | 'mobile';
  setViewMode: (mode: 'desktop' | 'mobile') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, viewMode, setViewMode }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:41');

  // simulated clock on phone screen top status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      onLogin();
      setIsLoading(false);
    }, 1200);
  };

  // --- MOBILE PREVIEW LOGIN LAYOUT ---
  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
        {/* Subtle decorative background spots mimicking desktop */}
        <div className="absolute top-0 left-12 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-12 right-12 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Smartphone shell container styled as a premier elite enterprise UI */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 h-[760px] max-h-[92vh] text-slate-800"
        >
          {/* Glass & Mesh smooth gradient background layers inside the phone container */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-72 h-72 bg-blue-100/50 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-indigo-100/40 rounded-full blur-[80px] pointer-events-none" />
          {/* Very fine technical grid pattern watermark */}
          <div className="absolute inset-0 opacity-[0.012] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0055ff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

          {/* Top Simulated Speaker Notch & Dynamic Status Bar Info for light theme pointer */}
          <div className="w-full flex justify-between items-center px-4 pt-1 pb-4 shrink-0 relative z-10">
            <span className="text-[11px] font-extrabold text-slate-700 tracking-tight">{currentTime}</span>
            <div className="w-20 h-4.5 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Signal size={11} className="text-slate-600" />
              <Wifi size={11} className="text-slate-600" />
              <Battery size={13} className="text-emerald-600" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-6 relative z-10">
            {/* Branding header in Web-consistent theme */}
            <div className="text-center mb-7">

              <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl rotate-3 opacity-20" />
                <div className="relative w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                  <Shield size={22} className="text-white" />
                </div>
              </div>

              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                数据治理<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">健康管家</span>
              </h2>
              <p className="text-[8px] text-blue-600/90 mt-1.5 uppercase tracking-widest font-mono font-bold">Data Governance Health Steward</p>
            </div>

            {/* Light forms consistently paired with the desktop style */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-0.5 flex justify-between">
                  <span>输入账号</span>
                  <span className="text-slate-300">Account</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={14} className="transition-transform group-focus-within:scale-110" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/8 focus:border-blue-500 shadow-sm transition-all font-medium"
                    placeholder="请输入测试账号"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-0.5 flex justify-between">
                  <span>输入密码</span>
                  <span className="text-slate-300">Password</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={14} className="transition-transform group-focus-within:scale-110" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-white/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/8 focus:border-blue-500 shadow-sm transition-all font-medium"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-bold text-xs transition-all shadow-md active:scale-98 relative overflow-hidden group ${
                    isLoading 
                      ? 'bg-blue-600/55 cursor-wait' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/25'
                  }`}
                >
                  <div className="absolute inset-0 w-1/2 bg-white/10 skew-x-[-20deg] group-hover:left-full -left-1/4 transition-all duration-1000 ease-in-out pointer-events-none" />
                  <span>{isLoading ? '正在安全登录中...' : '安全登录'}</span>
                  {!isLoading && <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>
          </div>

          {/* Footer segment styled for light layout */}
          <div className="shrink-0 text-center pb-2 pt-4 border-t border-slate-100 relative z-10">
            <p className="text-[10px] text-slate-400 font-bold px-4 leading-relaxed tracking-wide">核心数据全生命周期主动监测与智能自愈</p>
          </div>

        </motion.div>
      </div>
    );
  }

  // --- STANDARD DESKTOP VIEWPORT LOGIN LAYOUT ---
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-100"
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
              <h2 className="text-4xl lg:text-5xl font-extrabold leading-[1.15] mb-6 tracking-tight animate-fade-in">
                数智治理 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">重塑资产价值</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                核心数据全生命周期主动监测与智能自愈。
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
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">围绕数据质量、标准与主题资产，全天候捕捉异常与健康态势</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-600/20 transition-colors">
                  <Zap size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-slate-200 uppercase tracking-wide">管家式智能修复</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">AI 辅助诊断与处置建议，推动治理闭环，让核心资产持续可信可用</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Globe size={14} />
            <span>匠心筑基 · 智领未来</span>
          </div>
        </div>

        {/* Right Side - Login Form with crisp toggling buttons inside */}
        <div className="flex-1 p-8 lg:p-20 flex flex-col justify-center bg-white relative">
          
          {/* Subtle View Mode switcher at top right to quickly access the Mobile style login screen as desired */}
          <div className="absolute top-8 right-8">
            <button
              onClick={() => setViewMode('mobile')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Smartphone size={14} />
              <span>📱 体验手机版登录</span>
            </button>
          </div>

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
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
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
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
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

            <div className="mt-12 flex items-center justify-center gap-2 text-slate-405 hover:text-indigo-600 cursor-pointer transition-colors">
              <Settings size={16} />
              <span className="text-sm font-medium tracking-tight">智能引擎数据服务 v1.5 Pro</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
