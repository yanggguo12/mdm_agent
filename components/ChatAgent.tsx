import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Copy } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatAgentProps {
  contextData: string;
}

export const ChatAgent: React.FC<ChatAgentProps> = ({ contextData }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: "您好，我是您的数据治理助手。系统扫描已完成，目前 ERP 环境的整体数据健康度为良好。\n\n我在 **物料主数据 (MARA)** 中发现了一些**字段缺失**（主要是物料组信息），这可能会影响后续的分类统计。请问您需要先查看详细情况吗？" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(input, contextData);
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
       const errorMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "抱歉，连接 AI 服务时出现异常。请检查您的网络或 API 配置。" 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === 'user') {
        return <div className="text-sm">{msg.text}</div>;
    }

    // Simple Markdown-lite parser for Model messages
    return (
        <div className="space-y-1.5">
            {msg.text.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;

                // Basic list detection
                const isList = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
                const isOrdered = /^\d+\.\s/.test(line.trim());
                
                return (
                    <div key={i} className={`text-[13.5px] leading-relaxed break-words ${isList || isOrdered ? 'pl-3 relative' : ''}`}>
                         {isList && <span className="absolute left-0 top-2 w-1 h-1 bg-indigo-400 rounded-full opacity-80"></span>}
                         {line.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, j) => {
                             if (part.startsWith('**') && part.endsWith('**')) {
                                 return <span key={j} className="font-bold text-slate-900 bg-indigo-50/50 -mx-0.5 px-0.5 rounded">{part.slice(2, -2)}</span>;
                             }
                             if (part.startsWith('`') && part.endsWith('`')) {
                                 return <code key={j} className="font-mono text-xs bg-slate-100 text-indigo-600 px-1 py-0.5 rounded border border-slate-200 mx-0.5">{part.slice(1, -1)}</code>;
                             }
                             // Remove list markers for cleaner look if styled with CSS
                             const cleanText = (isList && j === 0) ? part.replace(/^[-*•]\s/, '') : part;
                             return <span key={j}>{cleanText}</span>;
                         })}
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center gap-4 shadow-sm z-10 sticky top-0">
        <div className="relative group">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
                <Bot size={22} className="text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
            </span>
        </div>
        <div>
            <h3 className="font-bold text-slate-800 text-sm">智能数据助手</h3>
            <div className="flex items-center gap-1.5">
                <Sparkles size={10} className="text-indigo-500" />
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                    AI Powered
                </p>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-500`}>
            <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                  msg.role === 'user' 
                  ? 'bg-white border-slate-100' 
                  : 'bg-gradient-to-b from-indigo-600 to-violet-700 border-transparent'
              }`}>
                {msg.role === 'user' ? <User size={15} className="text-slate-600" /> : <Sparkles size={14} className="text-white/90" />}
              </div>

              {/* Bubble */}
              <div className={`px-5 py-3.5 rounded-2xl shadow-sm relative group transition-all duration-300 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-sm shadow-indigo-200' 
                  : 'bg-white text-slate-600 rounded-tl-sm border border-slate-100 shadow-slate-100 hover:shadow-md'
              }`}>
                {renderMessageContent(msg)}
                
                {/* Time/Status (Mock) */}
                 <div className={`text-[9px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 ${msg.role === 'user' ? 'right-0 text-slate-400' : 'left-0 text-slate-400'}`}>
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
                 <div className="flex gap-3 max-w-[85%]">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-b from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Loader2 size={14} className="animate-spin text-white/90" />
                     </div>
                     <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 text-slate-500 text-sm shadow-sm">
                        <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                        </span>
                        <span className="text-xs font-medium text-slate-400">正在分析数据...</span>
                     </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white relative z-20">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-inner group-focus-within:bg-white">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 py-2.5"
            placeholder="输入指令修复数据或分析趋势..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                !input.trim() || isLoading 
                ? 'text-slate-300 bg-transparent' 
                : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex justify-center mt-3 gap-4">
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheckIcon size={10} /> 安全沙箱运行中
            </span>
        </div>
      </div>
    </div>
  );
};

// Helper icon component since ShieldCheck is not imported in original snippet
const ShieldCheckIcon = ({ size = 14, className = "" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);