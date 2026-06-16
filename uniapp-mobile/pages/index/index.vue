<template>
  <view class="uniapp-container">
    
    <!-- WECHAT MINI-PROGRAM TOP HEADER -->
    <view class="wechat-header flex items-center justify-between">
      <view class="w-20 flex items-center">
        <view v-if="activeTab === 'home' && (viewingIssueDetails || selectedMetricDetail || isAllIssuesOpen || homeSubView !== 'main')" 
              @click="handleBack" class="back-btn flex items-center gap-1 font-bold text-xs select-none">
          <text class="back-arrow">&lt;</text>
          <text>返回</text>
        </view>
        <view v-else-if="activeTab === 'settings' && selectedSettingPartition !== null" 
              @click="handleBack" class="back-btn flex items-center gap-1 font-bold text-xs select-none">
          <text class="back-arrow">&lt;</text>
          <text>返回</text>
        </view>
        <view v-else class="text-slate-400 text-[10px] font-bold">
          <text>⚡ 微信小程序版</text>
        </view>
      </view>

      <!-- Centered Title -->
      <view class="header-title flex items-center justify-center">
        <text class="font-bold tracking-tight truncate">{{ wechatNavBarTitle }}</text>
      </view>

      <!-- WeChat Capsule Control Shell Representation -->
      <view class="capsule-container flex items-center">
        <view class="pill-capsule flex items-center gap-3">
          <view class="dots flex items-center gap-0.5">
            <view class="dot-small"></view>
            <view class="dot-big"></view>
            <view class="dot-small"></view>
          </view>
          <view class="divider"></view>
          <view class="ring-circle flex items-center justify-center" @click="handleReset">
            <view class="ring-dot"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- CONTENT SCROLL WORKSPACE -->
    <scroll-view class="wechat-content" scroll-y="true">
      
      <!-- SCANNER SCREEN OVERLAY (AUTO HEALTH SCANNING ANIMATION PROCESSOR) -->
      <view v-if="scanStep > 0 && scanStep < 4" class="scanner-curtain flex flex-col items-center justify-center p-6">
        <view class="radar-box flex items-center justify-center relative mb-6">
          <view class="pulse-ring animate-ping"></view>
          <view class="pulse-ring-slow animate-pulse"></view>
          <view class="radar-core flex flex-col items-center justify-center">
            <text class="text-xs font-bold text-[#07c160] mb-0.5 font-mono">SCANNING</text>
            <text class="text-2xl font-extrabold text-slate-800 font-mono">{{ scanPercent }}%</text>
          </view>
        </view>
        <view class="space-y-1.5 text-center mt-2 w-full max-w-[280px]">
          <text class="text-sm font-bold text-slate-805 block">{{ getScanTitle }}</text>
          <text class="text-[10px] text-slate-400 font-semibold block leading-relaxed">{{ getScanDesc }}</text>
        </view>
      </view>

      <!-- MAIN TABS CONTAINER -->
      <view v-else class="tab-panel">

        <!-- ======================= HOME TAB ======================= -->
        <view v-if="activeTab === 'home' && !viewingIssueDetails && !selectedMetricDetail && !isAllIssuesOpen" class="space-y-6 px-4 py-4">
          
          <!-- BRAND LOGO HEADER -->
          <view v-if="homeSubView === 'main'" class="brand-box flex items-center gap-3 pb-1">
            <image class="brand-logo" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&h=120&q=80" />
            <view class="flex flex-col">
              <text class="text-base font-black text-slate-900 tracking-tight">主数据质量健康管家</text>
              <text class="text-[10px] text-slate-400 font-semibold mt-0.5">面向 ERP 系统一物多码与物料字段自愈闭环</text>
            </view>
          </view>

          <!-- SUBVIEW: MAIN HOME CONTROLLER -->
          <view v-if="homeSubView === 'main'" class="space-y-5">
            
            <!-- PHYSICAL DATABASING PARTITION CHIP DROPDOWN -->
            <view class="partition-dropdown-card bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <view class="flex justify-between items-center mb-3">
                <text class="text-[10px] font-bold text-indigo-600 tracking-wide uppercase flex items-center gap-1">
                  🌐 绑定体检物理数据视图
                </text>
                <text class="text-[9px] font-semibold text-rose-500" @click="clearPartitions" v-if="selectedCategories.length > 0">
                  重置全部
                </text>
              </view>

              <!-- DROPDOWN BUTTON TRIGGER -->
              <view class="dropdown-trigger flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl" @click="isPartitionDropdownOpen = !isPartitionDropdownOpen">
                <view class="selected-chips flex flex-wrap gap-1 w-full overflow-hidden">
                  <text v-if="selectedCategories.length === 0" class="text-xs text-slate-400 font-semibold">
                    请点击在此筛选需要体检的系统大表...
                  </text>
                  <text v-for="cat in selectedCategories" :key="cat" class="chip-item text-[9.5px] font-bold bg-[#edfbf3] text-[#07c160] border border-[#d6f6e1] px-2 py-0.5 rounded-md">
                    📂 {{ cat.replace('数据','') }}
                  </text>
                </view>
                <text class="text-slate-400 text-xs ml-2">{{ isPartitionDropdownOpen ? '▲' : '▼' }}</text>
              </view>

              <!-- COLAPSIBLE LIST OPTIONS PANEL -->
              <view v-if="isPartitionDropdownOpen" class="options-list mt-2 bg-white border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                <view v-for="item in partitions" :key="item.key" 
                      @click="togglePartition(item.key)"
                      class="option-row flex items-center justify-between p-3 hover:bg-slate-50">
                  <view class="flex flex-col">
                    <text class="text-xs font-bold" :class="{'text-[#07c160]': selectedCategories.includes(item.key)}">
                      {{ item.label }}
                    </text>
                    <text class="text-[9px] text-slate-400 mt-0.5">{{ item.desc }}</text>
                  </view>
                  <view class="checkbox-circle flex items-center justify-center shrink-0" 
                        :class="{'checked-bg': selectedCategories.includes(item.key)}">
                    <text v-if="selectedCategories.includes(item.key)" class="check-symbol">✓</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- DIAGNOSTICS & CONTROLS BANNER -->
            <view class="grid grid-cols-2 gap-3">
              <view class="action-card-btn scan-btn flex flex-col justify-between p-4" @click="triggerAutoScan">
                <view class="flex justify-between items-start">
                  <text class="text-xl">🩺</text>
                  <text class="text-[8px] tracking-wide font-black uppercase text-emerald-850 bg-emerald-100/60 px-1 py-0.2 rounded">LIVE</text>
                </view>
                <view class="mt-4">
                  <text class="text-xs font-bold text-white block">全库智能体检</text>
                  <text class="text-[8px] text-emerald-100 mt-0.5 block font-semibold">自适应扫描三大核心视图</text>
                </view>
              </view>

              <view class="action-card-btn view-issues-btn flex flex-col justify-between p-4" @click="isAllIssuesOpen = true">
                <view class="flex justify-between items-start">
                  <text class="text-xl">⚠️</text>
                  <text class="text-[8.5px] font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">{{ issues.length }} 个待治理</text>
                </view>
                <view class="mt-4">
                  <text class="text-xs font-bold text-slate-800 block">查看质量全景</text>
                  <text class="text-[8px] text-slate-400 mt-0.5 block font-semibold flex items-center">实抄对仗表与故障诊断</text>
                </view>
              </view>
            </view>

            <!-- SCORE TICKER COMPASS -->
            <view class="overall-progress-card bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
              <view class="score-ring flex items-center justify-center shrink-0">
                <view class="inner-circle flex flex-col items-center justify-center bg-white rounded-full">
                  <text class="text-xs font-semibold text-slate-400 leading-tight">系统健康分</text>
                  <text class="text-xl font-extrabold text-[#07c160] leading-tight mt-0.5">89.4 <text class="text-[10px] font-medium">%</text></text>
                </view>
              </view>
              <view class="space-y-1">
                <view class="flex items-center gap-1 flex-wrap">
                  <text class="text-xs font-black text-slate-800">数据库结构体检健康率</text>
                  <text class="text-[8px] font-mono bg-blue-50 text-blue-600 px-1 rounded uppercase">EXCELLENT</text>
                </view>
                <text class="text-[9.5px] text-slate-400 font-semibold leading-relaxed block">
                  经过 18 项核心规则拦截计算，已对当前绑定的物理大表实现全域覆载监视，系统保持高能自愈响应。
                </text>
              </view>
            </view>

            <!-- FOUR CORE VIRTUAL INDICATOR PROGRESS GRID -->
            <view class="space-y-3">
              <view class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 pl-1">
                <text>🧬 四大核心质量算子</text>
              </view>
              
              <view class="grid grid-cols-2 gap-3.5">
                <view v-for="metric in metrics" :key="metric.name" 
                      @click="focusMetric(metric)"
                      class="metric-icon-box bg-white p-3.5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between hover:border-slate-350 transition-all">
                  <view class="flex items-start justify-between">
                    <view class="w-8 h-8 rounded-xl flex items-center justify-center" :class="getMetricBg(metric.name)">
                      <text class="text-sm">{{ getMetricEmoji(metric.name) }}</text>
                    </view>
                    <text class="text-[12.5px] font-black font-mono text-slate-800">{{ metric.score }}%</text>
                  </view>
                  <view class="mt-3.5">
                    <text class="text-[11px] font-black text-slate-850 block">{{ metric.name }}</text>
                    <text class="text-[9px] text-[#07c160] font-bold block mt-1">待修复：{{ indexFailuresCount(metric.name) }} 项</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- SUB-TABS WORKBENCH TOGGLEER FOR HOME -->
            <view class="bottom-tab-box bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
              <view class="grid grid-cols-2 h-11 shrink-0">
                <view class="flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                      :class="{'subtab-active text-[#07c160]': issuesSubTab === 'diagnosis'}"
                      @click="issuesSubTab = 'diagnosis'">
                  🔬 关键问题诊断
                </view>
                <view class="flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                      :class="{'subtab-active text-[#07c160]': issuesSubTab === 'policies'}"
                      @click="issuesSubTab = 'policies'">
                  🛡️ 自动修复策略
                </view>
              </view>

              <!-- PANEL 1: CRITICAL ISSUES LIST PREVIEW -->
              <view v-if="issuesSubTab === 'diagnosis'" class="p-4 space-y-3">
                <view class="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                  <text>当前共诊断出 {{ issues.length }} 个质量缺陷</text>
                  <text class="text-blue-600" @click="setHomeSubView('diagnosis')">查看全部 &gt;</text>
                </view>
                <view class="space-y-2.5">
                  <view v-for="issue in issues.slice(0, 3)" :key="issue.id"
                        class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <view class="min-w-0 pr-2">
                      <view class="flex items-center gap-1.5 flex-wrap">
                        <text class="text-[9.5px] font-black font-mono bg-slate-200 px-1 py-0.2 rounded text-slate-600 uppercase">{{ issue.table }}</text>
                        <text class="text-[9.5px] font-mono text-indigo-600 font-black">{{ issue.field }}</text>
                      </view>
                      <text class="text-[10px] text-slate-500 font-semibold truncate block mt-1 leading-normal">{{ issue.description }}</text>
                    </view>
                    <button class="shrink-0 p-1 px-2 text-[9px] font-bold bg-[#07c160] text-white border-0 rounded-lg" @click.stop="executeRepair(issue)">
                      极速自愈
                    </button>
                  </view>
                </view>
              </view>

              <!-- PANEL 2: POLICIES PREVIEW -->
              <view v-if="issuesSubTab === 'policies'" class="p-4 space-y-3">
                <view class="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                  <text>内置规则修复策略矩阵</text>
                  <text class="text-blue-600" @click="setHomeSubView('policies')">查看全部 &gt;</text>
                </view>
                <view class="space-y-2.5">
                  <view v-for="policy in policiesList.slice(0, 2)" :key="policy.id"
                        class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <view class="flex items-center justify-between mb-1">
                      <text class="text-[10.5px] font-bold text-slate-800">{{ policy.title }}</text>
                      <text class="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">自愈中</text>
                    </view>
                    <text class="text-[9.5px] text-slate-400 block leading-normal line-clamp-1">{{ policy.desc }}</text>
                  </view>
                </view>
              </view>
            </view>

          </view>

          <!-- SUBVIEW: DIAGNOSIS LIST DETROUT -->
          <view v-if="homeSubView === 'diagnosis'" class="space-y-4">
            <view class="p-3 bg-[#e8f8f0] border border-[#d3f3e3] rounded-2xl flex items-center justify-between">
              <view class="flex items-center gap-2">
                <text class="text-lg">📈</text>
                <view class="flex flex-col">
                  <text class="text-xs font-bold text-slate-800">全库缺陷自愈监控台</text>
                  <text class="text-[9px] text-[#07c160] font-semibold">一物多码与未填物理属性分类会诊</text>
                </view>
              </view>
            </view>

            <view class="space-y-3">
              <view v-for="issue in issues" :key="issue.id"
                    class="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col shadow-3xs"
                    @click="viewingIssueDetails = issue">
                <view class="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <view class="flex items-center gap-1.5">
                    <text class="severity-dot" :class="issue.severity"></text>
                    <text class="text-[10px] font-mono leading-none bg-slate-100 border border-slate-200 text-slate-500 rounded px-1.5 py-0.5 uppercase font-bold">{{ issue.table }}</text>
                    <text class="text-[10px] font-mono leading-none text-indigo-600 font-bold">{{ issue.field }}</text>
                  </view>
                  <text class="text-[9.5px] font-black" :class="itemStatusColor(issue.severity)">{{ issue.severity === 'critical' ? '红线严重' : '一般黄色' }}</text>
                </view>

                <view class="py-3">
                  <text class="text-[11px] text-slate-500 font-semibold leading-relaxed block">{{ issue.description }}</text>
                  <view class="mt-2.5 flex items-center gap-1.5">
                    <text class="text-[8.5px] font-black text-slate-400">影响层级：</text>
                    <text class="text-[9.5px] text-slate-500 font-bold bg-slate-50 border border-slate-150 px-1.5 py-0.2 rounded font-mono">{{ issue.impact }}</text>
                  </view>
                </view>

                <view class="flex justify-end pt-2 border-t border-slate-100 gap-2">
                  <button class="p-1 px-3 text-[9.5px] font-bold bg-[#07c160] text-white border-0 rounded-xl shadow-xs" @click.stop="executeRepair(issue)">
                    一键自愈
                  </button>
                </view>
              </view>
            </view>
          </view>

          <!-- SUBVIEW: POLICIES GRID VIEW -->
          <view v-if="homeSubView === 'policies'" class="space-y-4">
            <view class="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-2">
              <text class="text-base">🛡️</text>
              <view class="flex flex-col">
                <text class="text-xs font-bold text-slate-800">自动修复安全策略边界</text>
                <text class="text-[9px] text-slate-400 mt-0.5">规则自动覆盖物理大表，安全策略全时坚守</text>
              </view>
            </view>

            <view class="space-y-3">
              <view v-for="policy in policiesList" :key="policy.id" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
                <view class="flex items-center justify-between">
                  <text class="text-xs font-bold text-slate-800">{{ policy.title }}</text>
                  <text class="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">策略工作正常</text>
                </view>
                <text class="text-[10px] text-slate-400 font-semibold leading-relaxed block">{{ policy.desc }}</text>
                <view class="pt-2 border-t border-dashed border-slate-100 flex items-center justify-between">
                  <text class="text-[8.5px] text-slate-400 font-mono">触发器：{{ policy.trigger }}</text>
                  <text class="text-[9px] text-[#07c160] font-bold">已自动校验 {{ policy.count }} 次</text>
                </view>
              </view>
            </view>
          </view>

        </view>

        <!-- ======================= HOME LEVEL 2: DETAILED ISSUE会诊 ======================= -->
        <view v-if="activeTab === 'home' && viewingIssueDetails" class="px-4 py-4 space-y-4">
          <view class="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
            <view class="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <text class="text-base">🔬</text>
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-center gap-1 flex-wrap">
                <text class="text-xs font-black text-slate-800">缺陷深度诊断审计协议</text>
                <text class="text-[7.5px] font-mono bg-slate-100 text-slate-400 px-1 py-0.2 border border-slate-200 rounded uppercase">MD-ST-{{ viewingIssueDetails.id }}</text>
              </view>
              <text class="text-[9px] text-slate-400 font-semibold mt-0.5 block leading-tight">通过主数据深度反检索拦截算子进行审核结果</text>
            </view>
          </view>

          <!-- Diagnostic Metrics Spec Card -->
          <view class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3.5">
            <view class="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <text class="text-xs font-bold text-slate-800">被测物理目标属性</text>
              <text class="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">
                {{ viewingIssueDetails.table }}.{{ viewingIssueDetails.field }}
              </text>
            </view>

            <view class="space-y-3 py-1">
              <view class="flex items-start gap-2">
                <text class="text-[10px] font-bold text-slate-400 mt-0.5 shrink-0">缺陷详情：</text>
                <text class="text-[10px] font-semibold text-slate-700 leading-relaxed">{{ viewingIssueDetails.description }}</text>
              </view>
              <view class="flex items-start gap-2">
                <text class="text-[10px] font-bold text-slate-400 mt-0.5 shrink-0">影响边界：</text>
                <text class="text-[10px] font-bold text-rose-600 font-mono bg-rose-50 px-1.5 rounded">{{ viewingIssueDetails.impact }}</text>
              </view>
              <view class="grid grid-cols-2 gap-2 mt-2">
                <view class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <text class="text-[8.5px] text-slate-400 font-black block uppercase">分词策略</text>
                  <text class="text-[10px] text-slate-700 font-bold block mt-1">智能主客匹配</text>
                </view>
                <view class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <text class="text-[8.5px] text-slate-400 font-black block uppercase">校验基准</text>
                  <text class="text-[10px] text-slate-700 font-bold block mt-1">国标一物一码</text>
                </view>
              </view>
            </view>
          </view>

          <!-- AI Suggested Remediation strategy -->
          <view class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3">
            <text class="text-[11px] text-[#07c160] font-bold block">💡 神经网络自愈大脑修复推荐</text>
            <view class="p-3 bg-[#edfbf3] border border-[#d4f5df]/60 rounded-xl">
              <text class="text-[10px] text-slate-650 font-semibold leading-relaxed block">{{ viewingIssueDetails.aiSuggestion }}</text>
            </view>
          </view>

          <!-- Actions -->
          <view class="pt-2 flex gap-3">
            <button class="flex-1 p-3 text-xs font-bold text-white bg-[#07c160] border-0 rounded-2xl shadow-md-green" @click="executeRepair(viewingIssueDetails)">
              启用大脑极速自愈修复
            </button>
          </view>
        </view>

        <!-- ======================= HOME LEVEL 2: METRIC DETAIL SPEC ======================= -->
        <view v-if="activeTab === 'home' && selectedMetricDetail" class="px-4 py-4 space-y-4">
          <view class="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <view class="flex items-center gap-2">
              <view class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <text class="text-base">{{ getMetricEmoji(selectedMetricDetail.name) }}</text>
              </view>
              <view class="flex flex-col">
                <text class="text-xs font-bold text-slate-800">{{ selectedMetricDetail.name }}</text>
                <text class="text-[9px] text-[#07c160] font-semibold">质量算子物理指标实时诊断</text>
              </view>
            </view>
            <text class="text-xs font-mono font-black text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">{{ selectedMetricDetail.score }}%</text>
          </view>

          <!-- Action block for manual auditing inside metric -->
          <view class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3">
            <text class="text-[11px] font-bold text-slate-800 block">物理对仗校验审计面板</text>
            <text class="text-[10px] text-slate-400 font-semibold leading-relaxed block">
              点击下方按钮将对现有的物料物理记录(MARA表等)启动高带宽轮询校验。
            </text>
            <button class="w-full p-2.5 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 text-blue-600 border border-blue-100 rounded-xl text-center font-bold text-xs"
                    @click="runMetricAuditSim">
              重新运行 18 点算子深度对置校验
            </button>
          </view>

          <!-- Simulated samples of bad records -->
          <view class="space-y-2.5">
            <text class="text-[11.5px] font-bold text-slate-500 block pl-1">📉 质量缺陷异常样品实抄表 (共 3 条)</text>
            
            <view v-for="(record, idx) in indexMetricSamples(selectedMetricDetail.name)" :key="idx"
                  class="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-3xs space-y-2">
              <view class="flex justify-between items-center pb-2 border-b border-slate-100">
                <text class="text-[9.5px] font-mono font-bold text-slate-400">样品 #{{ idx + 1 }}</text>
                <text class="text-[9.5px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-black border border-blue-100/50">MATNR: {{ record.matnr }}</text>
              </view>
              <view class="grid grid-cols-2 gap-2 mt-1">
                <view v-for="(val, key) in record.fields" :key="key" class="text-[10px] flex flex-col">
                  <text class="text-slate-450 text-[8.5px] font-bold">{{ key }} :</text>
                  <text class="text-slate-800 font-mono font-black leading-normal">{{ val }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- ======================= HOME LEVEL 2: TOTAL ANOMALY TRACKER ======================= -->
        <view v-if="activeTab === 'home' && isAllIssuesOpen" class="px-4 py-4 space-y-4">
          <view class="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-xs">
            <view class="flex flex-col gap-0.5 min-w-0 pr-2">
              <text class="text-xs font-bold text-slate-800">全库物理数据对仗表</text>
              <text class="text-[9.5px] text-slate-400 font-semibold leading-relaxed">共实抄扫描到 {{ issues.length }} 个质量缺陷字段</text>
            </view>
            <button class="p-1.5 px-3 bg-[#07c160] hover:opacity-95 text-white border-0 rounded-xl font-bold text-[9px] shadow-sm shrink-0" @click="handleExportCSV">
              导出 CSV 数据
            </button>
          </view>

          <!-- List issues -->
          <view class="space-y-3">
            <view v-for="issue in issues" :key="issue.id"
                  class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs flex flex-col">
              <view class="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                <view class="flex items-center gap-1">
                  <text class="severity-dot" :class="issue.severity"></text>
                  <text class="text-[9px] font-mono bg-slate-100 border border-slate-200 text-slate-500 px-1 py-0.2 rounded uppercase font-bold">{{ issue.table }}</text>
                  <text class="text-[9.5px] font-mono text-indigo-600 font-bold ml-1">{{ issue.field }}</text>
                </view>
                <text class="text-[8.5px] font-black" :class="itemStatusColor(issue.severity)">{{ issue.severity === 'critical' ? '红线严重' : '一般警告' }}</text>
              </view>
              <text class="text-[10px] text-slate-500 font-medium leading-relaxed block">{{ issue.description }}</text>
              <view class="pt-2 border-t border-slate-100 mt-2 flex justify-between items-center">
                <text class="text-[8px] text-slate-400">影响层：{{ issue.impact }}</text>
                <button class="p-1 px-2.5 text-[9px] font-bold bg-[#07c160] text-white border-0 rounded-lg shadow-3xs" @click.stop="executeRepair(issue)">
                  极速纠错
                </button>
              </view>
            </view>
          </view>
        </view>

        <!-- ======================= AI ASSISTANT TAB ======================= -->
        <view v-if="activeTab === 'ai'" class="flex flex-col h-full bg-[#f7f7f7]">
          
          <!-- Banner inside Chat viewport -->
          <view class="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
            <view class="flex items-center gap-2">
              <view class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <text class="text-base">🤖</text>
              </view>
              <view class="flex flex-col">
                <text class="text-xs font-bold text-slate-800">AI 主数据治理特工</text>
                <text class="text-[9px] text-[#07c160] font-semibold leading-none mt-1">与后台神经网络大模型双环关联中</text>
              </view>
            </view>
            <view class="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-150">
              MARA v2.1
            </view>
          </view>

          <!-- Chat messages feed -->
          <scroll-view class="chat-scroller p-4" scroll-y="true">
            <view class="space-y-4 pb-20">
              <view v-for="msg in chatMessages" :key="msg.id" class="flex flex-col shrink-0" :class="{'items-end': msg.role === 'user'}">
                <view class="flex gap-2 max-w-[85%]" :class="{'flex-row-reverse': msg.role === 'user'}">
                  <view class="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-3xs"
                        :class="msg.role === 'user' ? 'bg-[#07c160] text-white' : 'bg-slate-200 text-slate-700'">
                    {{ msg.role === 'user' ? '我' : '智' }}
                  </view>
                  <view class="p-3.5 rounded-2xl text-xs leading-relaxed font-semibold shadow-3xs"
                        :class="msg.role === 'user' ? 'bg-[#07c160] text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'">
                    <text class="block whitespace-pre-wrap">{{ msg.text }}</text>
                  </view>
                </view>
              </view>

              <!-- Loading ticker -->
              <view v-if="isChatLoading" class="flex items-center gap-2 p-3 bg-white border border-slate-100 w-fit rounded-2xl animate-pulse">
                <view class="loading-ring"></view>
                <text class="text-[10px] text-slate-400 font-bold font-mono">AI THINKING...</text>
              </view>
            </view>
          </scroll-view>

          <!-- Fixed inputs desk footer -->
          <view class="chat-input-desk bg-white border-t border-slate-150 p-3 flex flex-col gap-2">
            
            <!-- Quick questions chips -->
            <view class="quick-questions flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide shrink-0">
              <text class="chip-bubble text-[9.5px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2.5 py-1 rounded-xl text-slate-500 whitespace-nowrap"
                    @click="handleQuickSend('分析目前的整体健康状况')">
                📊 分析体检状况
              </text>
              <text class="chip-bubble text-[9.5px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2.5 py-1 rounded-xl text-slate-500 whitespace-nowrap"
                    @click="handleQuickSend('推荐针对一物多码的处理模式')">
                🛡️ 解决一物多码
              </text>
              <text class="chip-bubble text-[9.5px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2.5 py-1 rounded-xl text-slate-500 whitespace-nowrap"
                    @click="handleQuickSend('校验MARA字段的单位规则')">
                📝 单位规则校验
              </text>
            </view>

            <view class="flex items-center gap-2 shrink-0">
              <input class="flex-1 bg-slate-50 border border-slate-200 rounded-xl h-9 px-3 text-xs"
                     v-model="chatInput" placeholder="输入您对数据质量的任何疑问..." confirm-type="send" @confirm="handleChatSend" />
              <button class="w-16 h-9 shrink-0 bg-[#07c160] text-white border-0 rounded-xl font-black text-xs flex items-center justify-center shadow-xs"
                      @click="handleChatSend">
                发送
              </button>
            </view>
          </view>
        </view>

        <!-- ======================= CONFIG REGULATORS TAB ======================= -->
        <view v-if="activeTab === 'settings'" class="flex-grow flex flex-col bg-[#f7f7f7] h-full">
          
          <view v-if="selectedSettingPartition === null" class="space-y-4 px-4 py-4 pb-8">
            <view class="text-[11px] font-black text-slate-500 uppercase tracking-wide px-1">
              数据质量算子参数配置中心
            </view>

            <!-- Unified WeChat Cell Group Container -->
            <view class="bg-white rounded-2xl overflow-hidden border border-slate-100 divide-y divide-slate-100 shadow-sm">
              <view v-for="mod in settingPartitions" :key="mod.id" 
                    @click="selectedSettingPartition = mod.id"
                    class="w-full text-left p-4 bg-white hover:bg-slate-50 flex items-center justify-between group">
                <view class="flex items-center gap-3.5 min-w-0 pr-2">
                  <view class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="mod.color">
                    <text class="text-base">{{ mod.icon }}</text>
                  </view>
                  <view class="min-w-0 space-y-0.5">
                    <view class="flex items-center gap-1.5 flex-wrap">
                      <text class="text-xs font-bold text-slate-800">{{ mod.name }}</text>
                      <text class="px-1.5 py-0.2 bg-slate-50 text-slate-400 border border-slate-200 rounded text-[7px] font-mono uppercase">
                        {{ mod.nameEn }}
                      </text>
                    </view>
                    <text class="text-[10px] text-slate-400 font-semibold leading-relaxed block truncate">
                      {{ mod.desc }}
                    </text>
                  </view>
                </view>
                <text class="text-slate-350 text-xs font-bold font-mono">&gt;</text>
              </view>
            </view>

            <!-- Bottom Disclaimer WeChat style -->
            <view class="pt-16 pb-6 text-center space-y-1">
              <view class="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
                <text>🤖 智联云数据治理终端微应用</text>
              </view>
              <text class="text-[9px] text-slate-400 block max-w-[280px] mx-auto leading-relaxed">
                所有配置已经由分布式引擎在服务端和物理表底层完成映射，随时同步。
              </text>
              <text class="text-[8px] text-slate-350 font-mono block">CLIENT PROTOCOL WECHAT-UNIAPP-v1.1</text>
            </view>
          </view>

          <!-- SETTINGS DETAIL DRAWER -->
          <view v-else class="space-y-4 px-4 py-4">
            
            <view class="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 shadow-xs">
              <view class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <text class="text-base">⚙️</text>
              </view>
              <view class="flex flex-col">
                <text class="text-xs font-bold text-slate-800">{{ getPartitionConfigTitle }}</text>
                <text class="text-[9px] text-slate-400 leading-none mt-1">规则配置实时同步修改</text>
              </view>
            </view>

            <!-- Completeness config panels -->
            <view v-if="selectedSettingPartition === 'completeness'" class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3.5">
              <text class="text-xs font-bold text-slate-850 block">必填物理字段校验边界</text>
              <text class="text-[10px] text-slate-400 font-semibold block leading-relaxed mb-3">
                下述选中的数据库物理列将被强制校验，若为空值立即引发健康报警阻断。
              </text>
              
              <view class="space-y-1.5 pt-1">
                <view v-for="field in ['MATNR', 'MAKTX', 'MATKL', 'MEINS', 'BRGEW', 'NTGEW']" :key="field"
                      @click="toggleCompletenessRule(field)"
                      class="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer">
                  <view class="flex flex-col">
                    <text class="text-xs font-mono font-black text-slate-800">{{ field }}</text>
                    <text class="text-[9px] text-slate-400 font-bold mt-0.5">MARA表指定物理字段列校验</text>
                  </view>
                  <view class="checkbox-box flex items-center justify-center rounded-lg"
                        :class="{'checked-box-bg': completenessKeyFields.includes(field)}">
                    <text v-if="completenessKeyFields.includes(field)" class="check-symbol">✓</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- Uniqueness config panels -->
            <view v-if="selectedSettingPartition === 'uniqueness'" class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3.5">
              <text class="text-xs font-bold text-slate-850 block">联合主键唯一性排重拦截器</text>
              <text class="text-[10px] text-slate-400 font-semibold block leading-relaxed mb-3">
                对以下定义的联合物理主键，如若发生雷同记录，系统分词器将判定为“一物多码”。
              </text>
              
              <view class="space-y-2.5">
                <view v-for="(group, idx) in uniquenessKeyFields" :key="idx"
                      class="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                  <view class="flex flex-wrap gap-1 items-center min-w-0 pr-2">
                    <text v-for="item in group" :key="item" class="text-[9.5px] font-mono font-bold bg-[#edfbf3] text-[#07c160] px-1.5 py-0.2 rounded border border-[#d3f4dd]">
                      {{ item }}
                    </text>
                  </view>
                  <text class="text-[10px] text-rose-500 font-bold" @click="removeUniquenessGroup(idx)">删除</text>
                </view>

                <view class="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-3 flex-wrap">
                  <text class="text-[9.5px] text-slate-400 leading-normal">您可以根据业务场景，增加如图号+物料型号+采购名称等多元校验组合...</text>
                </view>
              </view>
            </view>

            <!-- Accuracy value limits configurations -->
            <view v-if="selectedSettingPartition === 'accuracy'" class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3.5">
              <text class="text-xs font-bold text-slate-851 block">常识性物理值域规则与常数边界</text>
              
              <view class="space-y-4 pt-1">
                <view class="flex items-center justify-between">
                  <view class="flex flex-col">
                    <text class="text-xs font-bold text-slate-800">毛重常识约束规则 (BRGEW &gt; NTGEW)</text>
                    <text class="text-[9.5px] text-slate-400 mt-0.5">阻断物料记录在物理表内因净重违背而导致的财税报错</text>
                  </view>
                  <switch color="#07c160" :checked="accuracyWeightsGroup" @change="accuracyWeightsGroup = !accuracyWeightsGroup" />
                </view>

                <view class="flex items-center justify-between pt-2 border-t border-slate-100">
                  <view class="flex flex-col">
                    <text class="text-xs font-bold text-slate-800">编码格式规则长度 (MATNR Length = 18)</text>
                    <text class="text-[9.5px] text-slate-400 mt-0.5">检查数据库中的主物料编号物理存储长度是否合规</text>
                  </view>
                  <switch color="#07c160" :checked="accuracyLengthGroup" @change="accuracyLengthGroup = !accuracyLengthGroup" />
                </view>
              </view>
            </view>

            <!-- Compliance rule toggles -->
            <view v-if="selectedSettingPartition === 'compliance'" class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3.5">
              <text class="text-xs font-bold text-slate-850 block">法规通关与危化资质红线校验开关</text>
              
              <view class="space-y-4 pt-1">
                <view v-for="(val, key) in complianceToggles" :key="key" class="flex items-center justify-between">
                  <view class="flex flex-col min-w-0 pr-3">
                    <text class="text-xs font-bold text-slate-800">{{ getComplianceRuleName(key) }}</text>
                    <text class="text-[9px] text-slate-400 mt-0.5 block leading-normal line-clamp-1">{{ getComplianceRuleDesc(key) }}</text>
                  </view>
                  <switch color="#07c160" :checked="val" @change="toggleCompliance(key)" />
                </view>
              </view>
            </view>

          </view>
        </view>

        <!-- ======================= PERSONAL PROFILE TAB ======================= -->
        <view v-if="activeTab === 'profile'" class="space-y-4 px-4 py-4">
          
          <!-- Avatar and meta -->
          <view class="bg-[#2d4df7] p-5 rounded-2xl text-white relative overflow-hidden flex items-center gap-4 shadow-sm">
            <view class="absolute right-[-20rpx] bottom-[-40rpx] text-white opacity-10 text-8xl font-black font-mono">
              MDM
            </view>
            <view class="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0">
              <text class="text-xl">👤</text>
            </view>
            <view class="flex flex-col">
              <text class="text-sm font-bold block">admin@example.com</text>
              <view class="flex items-center gap-1 mt-1.5">
                <text class="text-[8px] font-black text-rose-100 bg-rose-500/40 px-1.5 py-0.2 rounded">高级管理员权限</text>
                <text class="text-[8.5px] font-mono text-blue-100">CLIENT WeChat-1.2</text>
              </view>
            </view>
          </view>

          <!-- Core metadata grid stats -->
          <view class="grid grid-cols-3 gap-3">
            <view class="bg-white border border-slate-100 p-3 rounded-2xl text-center flex flex-col items-center">
              <text class="text-xs font-semibold text-slate-400 block">体检计数</text>
              <text class="text-base font-extrabold text-slate-800 mt-1 block">85次</text>
            </view>
            <view class="bg-white border border-slate-100 p-3 rounded-2xl text-center flex flex-col items-center">
              <text class="text-xs font-semibold text-slate-400 block">拦截红线</text>
              <text class="text-base font-extrabold text-slate-800 mt-1 block">34条</text>
            </view>
            <view class="bg-white border border-slate-100 p-3 rounded-2xl text-center flex flex-col items-center">
              <text class="text-xs font-semibold text-slate-400 block">自愈健康率</text>
              <text class="text-base font-extrabold text-[#07c160] mt-1 block">98.2%</text>
            </view>
          </view>

          <!-- System timeline list -->
          <view class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3.5">
            <view class="flex justify-between items-center pb-1">
              <text class="text-xs font-bold text-slate-850">体检对账历史记录簿</text>
              <text class="text-[9.5px] text-slate-400" @click="clearHistoryList" v-if="historyList.length > 0">一键删除</text>
            </view>

            <view class="space-y-3">
              <view v-if="historyList.length === 0" class="py-10 text-center">
                <text class="text-[10px] text-slate-400 font-bold block">目前尚无任何本地体检历史... </text>
              </view>
              <view v-for="(item, idx) in historyList" :key="idx" 
                    class="bg-slate-50 p-3 rounded-xl border border-slate-150 flex justify-between items-center transition-all">
                <view class="min-w-0 pr-2">
                  <view class="flex items-center gap-1">
                    <text class="text-[10.5px] font-bold text-slate-800">{{ item.engine }}</text>
                    <text class="text-[8px] font-black text-[#07c160] bg-emerald-50 border border-emerald-100 px-1 py-0.2 rounded font-semibold">{{ item.status }}</text>
                  </view>
                  <text class="text-[9px] text-slate-400 block mt-1 font-mono leading-none">{{ item.timestamp }}</text>
                </view>
                <text class="text-[10.5px] font-mono text-slate-600 font-bold shrink-0">{{ item.score }}% 得分</text>
              </view>
            </view>
          </view>

        </view>

      </view>
    </scroll-view>

    <!-- FOOTER NAVIGATION GRID CONTROLS FOR MOBILE NATIVE APP EXPERIENCE -->
    <view class="wechat-tabbar flex items-center justify-around">
      <view class="tabbar-item flex flex-col items-center justify-center gap-0.5" 
            :class="{'tabbar-active': activeTab === 'home'}"
            @click="activeTab = 'home'; homeSubView = 'main'">
        <text class="tabbar-icon">🩺</text>
        <text class="tabbar-txt">健康体检</text>
      </view>
      <view class="tabbar-item flex flex-col items-center justify-center gap-0.5 relative" 
            :class="{'tabbar-active': activeTab === 'ai'}"
            @click="activeTab = 'ai'">
        <text class="tabbar-icon">💬</text>
        <text class="tabbar-txt">AI 助手</text>
        <view class="ping-dot"></view>
      </view>
      <view class="tabbar-item flex flex-col items-center justify-center gap-0.5" 
            :class="{'tabbar-active': activeTab === 'settings'}"
            @click="activeTab = 'settings'; selectedSettingPartition = null">
        <text class="tabbar-icon">⚙️</text>
        <text class="tabbar-txt">规则引擎</text>
      </view>
      <view class="tabbar-item flex flex-col items-center justify-center gap-0.5" 
            :class="{'tabbar-active': activeTab === 'profile'}"
            @click="activeTab = 'profile'">
        <text class="tabbar-icon">👤</text>
        <text class="tabbar-txt">个人中心</text>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

// Active tab and subview management
const activeTab = ref('home');
const homeSubView = ref('main');
const isPartitionDropdownOpen = ref(false);

// Active sub-tab state for Issues menu
const issuesSubTab = ref('diagnosis');

// Secondary partition configurations
const selectedSettingPartition = ref(null);
const viewingIssueDetails = ref(null);
const selectedMetricDetail = ref(null);
const isAllIssuesOpen = ref(false);

// Database partition items
const partitions = ref([
  { key: '基础数据MARA', label: '基础数据 (MARA)', desc: '物料编号、名称、单位等核心物理属性' },
  { key: '工厂数据MARC', label: '工厂数据 (MARC)', desc: '工厂视图中的采购、质检控制主要参数' },
  { key: '财务数据MBEW', label: '财务数据 (MBEW)', desc: '评估类、价格控制模式等财务核算属性' },
  { key: 'BOM', label: 'BOM (物料清单)', desc: '物料及配方清单关联依赖与装配阶层' },
  { key: '工作中心', label: '工作中心 (Work Center)', desc: '排产能力、工艺计算及直接生产单元' }
]);

const selectedCategories = ref(['基础数据MARA', '工厂数据MARC', '财务数据MBEW']);

const togglePartition = (key) => {
  const index = selectedCategories.value.indexOf(key);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(key);
  }
};

const clearPartitions = () => {
  selectedCategories.value = [];
};

// Auto scanning simulation states
const scanStep = ref(0);
const scanPercent = ref(0);

const getScanTitle = computed(() => {
  if (scanStep.value === 1) return '🔍 初始化物理大表审计结构中...';
  if (scanStep.value === 2) return '🧠 网络分词并对临近相似图物建立关系对仗...';
  if (scanStep.value === 3) return '🛡️ 正向过滤海关归口税号以及RoHS危化物合格期限...';
  return '数据健康扫描';
});

const getScanDesc = computed(() => {
  if (scanStep.value === 1) return '正在加载 MARA, MARC 表数据，对物料主档进行哈希值主键匹配计算';
  if (scanStep.value === 2) return '检测到 8 组高敏感一物多码可疑记录对立，计算组合主键散布图谱';
  if (scanStep.value === 3) return '对 15 条报关及RoHS出证记录执行双环限期过滤，建立多态报警';
  return '请稍后...';
});

const triggerAutoScan = () => {
  scanStep.value = 1;
  scanPercent.value = 0;
  
  const timer = setInterval(() => {
    scanPercent.value += Math.floor(Math.random() * 8) + 4;
    if (scanPercent.value >= 25 && scanStep.value === 1) {
      scanStep.value = 2;
    } else if (scanPercent.value >= 60 && scanStep.value === 2) {
      scanStep.value = 3;
    }
    if (scanPercent.value >= 100) {
      scanPercent.value = 100;
      clearInterval(timer);
      setTimeout(() => {
        scanStep.value = 0;
        // Seed scan history
        historyList.value.unshift({
          engine: '全自动系统智能体检',
          status: '自愈诊断就绪',
          timestamp: new Date().toLocaleString(),
          score: Math.floor(Math.random() * 10) + 88
        });
      }, 600);
    }
  }, 120);
};

// Database issues structures matching React
const issues = ref([
  {
    id: 'iss_01',
    table: 'MARA',
    field: 'EAN11',
    severity: 'critical',
    description: '成品物料 [MATNR: 3000521] 物理表上未维护国际条形编码 EAN11，阻断扫码出库核销。',
    impact: '出库销售实操物理阻断阻漏',
    aiSuggestion: '自动查询对应成品图册或SAP原始PO记录，自动匹配并反写EAN11标准条码（697开头13位标准条号）。'
  },
  {
    id: 'iss_02',
    table: 'MARA',
    field: 'NTGEW',
    severity: 'warning',
    description: '关键物理字段违规：物料 [MATNR: 1000845] 净重 (21.5 KG) 判定大于毛重 (18.5 KG)，常识逻辑溢出。',
    impact: '基础会计与通关包装总净漏报',
    aiSuggestion: '利用自愈大脑比对MARC工厂包装折算系数，将毛重自动修正为 23.5 KG（保留包装常数误差）。'
  },
  {
    id: 'iss_03',
    table: 'MARC',
    field: 'DISPO',
    severity: 'warning',
    description: '物料 [MATNR: 2000305] 绑定的MRP控制员字段值 (NULL) 不存在，严重延迟物料排程触发。',
    impact: '生产计划MRP计划算子延迟',
    aiSuggestion: '该物料所属BOM顶层采购关联角色为“轴承线”，自动将其修正设置为常驻MRP控制员 D01。'
  }
]);

const executeRepair = (issue) => {
  uni.showLoading({
    title: '神经网络极速修复中'
  });
  
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({
      title: '主数据物理列已完美治愈',
      icon: 'success'
    });
    // Remove the issues from reactivity list
    issues.value = issues.value.filter(i => i.id !== issue.id);
    if (viewingIssueDetails.value && viewingIssueDetails.value.id === issue.id) {
      viewingIssueDetails.value = null;
    }
  }, 1000);
};

// Four metrics progress scores
const metrics = ref([
  { name: '完整性核算 (Completeness)', score: 85 },
  { name: '排重唯一性 (Uniqueness)', score: 92 },
  { name: '常识准确性 (Accuracy)', score: 79 },
  { name: '政策合规性 (Compliance)', score: 96 }
]);

const getMetricEmoji = (name) => {
  if (name.includes('Completeness')) return '📋';
  if (name.includes('Uniqueness')) return '💎';
  if (name.includes('Accuracy')) return '📐';
  return '🛡️';
};

const getMetricBg = (name) => {
  if (name.includes('Completeness')) return 'bg-emerald-50 text-[#07c160]';
  if (name.includes('Uniqueness')) return 'bg-blue-50 text-blue-500';
  if (name.includes('Accuracy')) return 'bg-amber-50 text-amber-550';
  return 'bg-violet-50 text-violet-500';
};

const indexFailuresCount = (name) => {
  if (name.includes('Completeness')) return 1;
  if (name.includes('Uniqueness')) return 0;
  if (name.includes('Accuracy')) return 1;
  return 1;
};

const focusMetric = (metric) => {
  selectedMetricDetail.value = metric;
};

const runMetricAuditSim = () => {
  uni.showLoading({
    title: '扫描物理表计算中'
  });
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({
      title: '对仗检验完美通过',
      icon: 'none'
    });
  }, 800);
};

const indexMetricSamples = (name) => {
  if (name.includes('Completeness')) {
    return [
      { matnr: '3000521', fields: { 'MAKTX': '高精密旋转主轴A', 'EAN11': 'NULL', 'MEINS': 'PCS' } },
      { matnr: '1004921', fields: { 'MAKTX': '铸模碳钢防护盘', 'EAN11': 'NULL', 'MEINS': 'PCS' } }
    ];
  }
  if (name.includes('Uniqueness')) {
    return [
      { matnr: '5001229', fields: { 'MAKTX': '不锈钢高弹弹簧', 'BISMT': 'ZP-023-DUPL', 'ZEINR': 'DWG-903-82' } }
    ];
  }
  return [
    { matnr: '1000845', fields: { 'MAKTX': '铝合金切削挡板', 'NTGEW': '21.5 KG', 'BRGEW': '18.5 KG' } }
  ];
};

// Automatic repair policies
const policiesList = ref([
  { id: 'p1', title: '单位一致性归一化拦截策略', desc: '一旦物理表出现"PCE" / "pc."，自动依据国标格式统一重写为"PCS"。', trigger: 'MARA-MEINS 输入校验', count: 48 },
  { id: 'p2', title: '一物多码分词智能判定阻隔方案', desc: '根据名称分词向量重合度达到 95% 且规格等同的项，拦截重复建档。', trigger: 'MAKTX & BISMT 重复性检索销核', count: 122 },
  { id: 'p3', title: '工厂MRP及控制字段智能反写校准', desc: '对于采购视图空值，自动调取PLM属性反向追溯责任MRP负责人。', trigger: 'MARC-DISPO 完备性自愈', count: 19 }
]);

const itemStatusColor = (sev) => {
  if (sev === 'critical') return 'text-rose-600';
  return 'text-amber-500';
};

// Export CSV handler
const handleExportCSV = () => {
  uni.showToast({
    title: '已生成物理对仗 CSV 审计报表，可以在 PC 终端下载',
    icon: 'none',
    duration: 3000
  });
};

// AI chat agents states
const chatInput = ref('');
const chatMessages = ref([
  {
    id: 'welcome_uni',
    role: 'model',
    text: "📱 您好！我是您的 UniApp 移动终端 AI 主数据治理助手。我已经打通系统后台物理大表与大语言模型双环！\n\n您可以随时问我：\n- **“分析目前的整体健康状况”** \n- **“怎么解决一物多码重复记录”**"
  }
]);
const isChatLoading = ref(false);

const handleChatSend = () => {
  if (!chatInput.value.trim() || isChatLoading.value) return;
  const txt = chatInput.value;
  chatInput.value = '';
  
  chatMessages.value.push({
    id: Date.now().toString(),
    role: 'user',
    text: txt
  });
  
  isChatLoading.value = true;
  
  setTimeout(() => {
    isChatLoading.value = false;
    let reply = "🧠 原理解析：当前物料由于系统没有强制实施组合主键防重拦截，导致相同的“型号+设计图号”被不同的生产工厂重复注册。在治理方案里，主数据自愈大脑建议启用“唯一性防重主键”，绑定 MAKTX 联合校验，即可将物理违规记录彻底解决。";
    if (txt.includes('体检') || txt.includes('状况') || txt.includes('健康')) {
      reply = "📊 诊断简报：当前数据库体检得分为 89.4 分（优秀）。主要的质量缺陷在于 MARA 物理表部分关键会计字段存在空值 NULL，以及毛重净重数据冲突（NTGEW > BRGEW）。这已引发自动修复策略。";
    }
    chatMessages.value.push({
      id: (Date.now()+1).toString(),
      role: 'model',
      text: reply
    });
  }, 1000);
};

const handleQuickSend = (text) => {
  chatInput.value = text;
  handleChatSend();
};

// Settings partitions details
const settingPartitions = ref([
  {
    id: 'completeness',
    name: '完整性规则校验',
    nameEn: 'Completeness',
    icon: '📋',
    color: 'bg-emerald-50 text-[#07c160]',
    desc: '指定必填物理字段校验范围，全面覆盖物料基础数据、采购销售及财务图纸。'
  },
  {
    id: 'uniqueness',
    name: '唯一性防重主键',
    nameEn: 'Uniqueness',
    icon: '💎',
    color: 'bg-blue-50 text-blue-500',
    desc: '自定义物料重复性组合校验主键，智能拦截名称、型号、图纸等高相似记录。'
  },
  {
    id: 'accuracy',
    name: '准确性值域常识',
    nameEn: 'Accuracy',
    icon: '📐',
    color: 'bg-amber-50 text-amber-550',
    desc: '管控物理值域极限制约及毛重净重常识，保障财务金额及参数高度贴合。'
  },
  {
    id: 'compliance',
    name: '合规性内外双环',
    nameEn: 'Compliance',
    icon: '🛡️',
    color: 'bg-violet-50 text-violet-500',
    desc: '内置海关STEUC税号通关认证，并与RoHS证书期限在出口前完成双重过滤审计。'
  }
]);

const getPartitionConfigTitle = computed(() => {
  const p = selectedSettingPartition.value;
  if (p === 'completeness') return '完整性配置 (Completeness)';
  if (p === 'uniqueness') return '唯一性重合度配置 (Uniqueness)';
  if (p === 'accuracy') return '准确性常识配置 (Accuracy)';
  if (p === 'compliance') return '政策法规红线配置 (Compliance)';
  return '引擎参项配置';
});

const completenessKeyFields = ref(['MATNR', 'MAKTX', 'MATKL', 'MEINS']);
const toggleCompletenessRule = (field) => {
  const idx = completenessKeyFields.value.indexOf(field);
  if (idx > -1) {
    completenessKeyFields.value.splice(idx, 1);
  } else {
    completenessKeyFields.value.push(field);
  }
};

const uniquenessKeyFields = ref([
  ['MAKTX', 'BISMT'],
  ['ZEINR', 'ZEIVR']
]);
const removeUniquenessGroup = (idx) => {
  uniquenessKeyFields.value.splice(idx, 1);
  uni.showToast({
    title: '联合主键排重组已销除',
    icon: 'none'
  });
};

const accuracyWeightsGroup = ref(true);
const accuracyLengthGroup = ref(true);

const complianceToggles = ref({
  'c1': true,
  'c2': true,
  'c3': true,
  'c4': false
});

const getComplianceRuleName = (key) => {
  if (key === 'c1') return '海关归档归位税号审计 (STEUC)';
  if (key === 'c2') return '危化学RoHS环境合规认证对账';
  if (key === 'c3') return '一物一码多维名称规则检测';
  return 'PLM物理图纸关联状态联动';
};

const getComplianceRuleDesc = (key) => {
  if (key === 'c1') return '审查核心物料的主表税号在海关总库是否存在错报漏报';
  if (key === 'c2') return '针对出口商品与RoHS证书有效期实现双环验证';
  if (key === 'c3') return '强制校验物料中文文本不包含非法缩写或杂质特殊符号';
  return '对物理档案中缺少对应CAD/EPLAN图纸的目标强制报警';
};

const toggleCompliance = (key) => {
  complianceToggles.value[key] = !complianceToggles.value[key];
};

// Profile center and Scan history timeline logs
const historyList = ref([
  { engine: '一键物料物理字段诊断', status: '自愈诊断就绪', timestamp: '2026-06-11 11:24:09', score: 89 },
  { engine: '合规性内外双环通关检索', status: '审计完毕', timestamp: '2026-06-11 09:12:45', score: 96 },
  { engine: '物料唯一排重机制运算', status: '防重通过', timestamp: '2026-06-10 17:50:33', score: 92 }
]);

const clearHistoryList = () => {
  historyList.value = [];
  uni.showToast({
    title: '对账历史记录已全部格式化清空',
    icon: 'none'
  });
};

// Custom top navigation title computer
const wechatNavBarTitle = computed(() => {
  if (activeTab.value === 'home') {
    if (viewingIssueDetails.value) return '质量缺陷诊断会诊';
    if (selectedMetricDetail.value) return `指标诊断: ${selectedMetricDetail.value.name.split(' ')[0]}`;
    if (isAllIssuesOpen.value) return '全库物理质量异常全景';
    if (homeSubView.value === 'diagnosis') return '关键问题诊治中心';
    if (homeSubView.value === 'policies') return '自动修复策略边界';
    return '数据治理健康管家';
  }
  if (activeTab.value === 'ai') return 'AI 数据特工助手';
  if (activeTab.value === 'settings') {
    if (selectedSettingPartition.value === 'completeness') return '完整性物理列校验';
    if (selectedSettingPartition.value === 'uniqueness') return '唯一性排重匹配';
    if (selectedSettingPartition.value === 'accuracy') return '准确性值域极限';
    if (selectedSettingPartition.value === 'compliance') return '海关环保双效审计';
    return '规则算子配置引擎';
  }
  if (activeTab.value === 'profile') return '移动个人中心';
  return '物理会诊';
});

// Navigation back handler
const handleBack = () => {
  if (activeTab.value === 'home') {
    if (viewingIssueDetails.value) viewingIssueDetails.value = null;
    else if (selectedMetricDetail.value) selectedMetricDetail.value = null;
    else if (isAllIssuesOpen.value) isAllIssuesOpen.value = false;
    else homeSubView.value = 'main';
  } else if (activeTab.value === 'settings') {
    selectedSettingPartition.value = null;
  }
};

const handleReset = () => {
  uni.showModal({
    title: '微程序刷新提示',
    content: '是否重新初始化物理诊断内存引擎？',
    success: (res) => {
      if (res.confirm) {
        issues.value = [
          {
            id: 'iss_01',
            table: 'MARA',
            field: 'EAN11',
            severity: 'critical',
            description: '成品物料 [MATNR: 3000521] 物理表上未维护国际条形编码 EAN11，阻断扫码出库核销。',
            impact: '出库销售实操物理阻断阻漏',
            aiSuggestion: '自动查询对应成品图册或SAP原始PO记录，自动匹配并反写EAN11标准条码。'
          },
          {
            id: 'iss_02',
            table: 'MARA',
            field: 'NTGEW',
            severity: 'warning',
            description: '关键物理字段违规：物料 [MATNR: 1000845] 净重 (21.5 KG) 判定大于毛重 (18.5 KG)，常识逻辑溢出。',
            impact: '基础会计与通关包装总净漏报',
            aiSuggestion: '利用自愈大脑比对MARC工厂包装折算系数，将毛重自动修正为 23.5 KG。'
          },
          {
            id: 'iss_03',
            table: 'MARC',
            field: 'DISPO',
            severity: 'warning',
            description: '物料 [MATNR: 2000305] 绑定的MRP控制员字段值 (NULL) 不存在，严重延迟物料排程触发。',
            impact: '生产计划MRP计划算子延迟',
            aiSuggestion: '该物料所属BOM顶层采购关联角色为“轴承线”，自动将其修正设置为常驻MRP控制员 D01。'
          }
        ];
        selectedCategories.value = ['基础数据MARA', '工厂数据MARC', '财务数据MBEW'];
        activeTab.value = 'home';
        homeSubView.value = 'main';
        viewingIssueDetails.value = null;
        selectedMetricDetail.value = null;
        isAllIssuesOpen.value = false;
        
        uni.showToast({
          title: '已重写复位物理状态',
          icon: 'success'
        });
      }
    }
  });
};
</script>

<style scoped>
/* Mobile WeChat Simulator Grid Definitions */
.uniapp-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #f7f7f7;
  overflow: hidden;
}

/* Custom WeChat Header Style */
.wechat-header {
  height: 56px;
  background-color: #ffffff;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  padding: 0 30rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}

.back-btn {
  color: #111111;
  display: flex;
  align-items: center;
}

.back-arrow {
  font-size: 32rpx;
  margin-right: 6rpx;
}

.header-title {
  max-width: 320rpx;
}

.header-title text {
  font-size: 28rpx;
  color: #111111;
}

/* WeChat Pill capsule representation style */
.pill-capsule {
  border: 1rpx solid #ececec;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 100rpx;
  padding: 10rpx 20rpx;
  height: 54rpx;
  box-sizing: border-box;
}

.dot-small {
  width: 6rpx;
  height: 6rpx;
  background-color: #111111;
  border-radius: 50%;
}
.dot-big {
  width: 8rpx;
  height: 8rpx;
  background-color: #111111;
  border-radius: 50%;
}

.divider {
  width: 1rpx;
  height: 24rpx;
  background-color: #e2e2e2;
}

.ring-circle {
  width: 26rpx;
  height: 26rpx;
  border: 4rpx solid #111111;
  border-radius: 50%;
}

.ring-dot {
  width: 10rpx;
  height: 10rpx;
  background-color: #111111;
  border-radius: 50%;
}

/* Scroll Content */
.wechat-content {
  flex-grow: 1;
  overflow-y: auto;
  box-sizing: border-box;
}

/* Custom WeChat Bottom Tabbar menu */
.wechat-tabbar {
  height: 110rpx;
  background-color: rgba(255, 255, 255, 0.98);
  border-top: 1rpx solid #e5e5e5;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  box-sizing: border-box;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-item {
  flex-grow: 1;
  height: 100%;
}

.tabbar-icon {
  font-size: 38rpx;
  line-height: 1;
}

.tabbar-txt {
  font-size: 20rpx;
  font-weight: bold;
  color: #888888;
}

.tabbar-active .tabbar-txt {
  color: #07c160;
}

.ping-dot {
  position: absolute;
  top: 12rpx;
  right: 28%;
  width: 12rpx;
  height: 12rpx;
  background-color: #07c160;
  border-radius: 50%;
}

/* Scanner CSS animations */
.scanner-curtain {
  padding: 100rpx 40rpx;
  box-sizing: border-box;
}

.radar-box {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background-color: #edfbf3;
  border: 1rpx solid #d4f5df;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid #07c160;
  opacity: 0.3;
}

.pulse-ring-slow {
  position: absolute;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  border: 2rpx dashed #07c160;
  opacity: 0.25;
}

/* Dropdown list customization rules */
.checkbox-circle {
  width: 36rpx;
  height: 36rpx;
  border: 1rpx solid #ddd;
  border-radius: 50%;
}

.checked-bg {
  background-color: #07c160;
  border-color: #07c160;
}

.check-symbol {
  color: #ffffff;
  font-size: 20rpx;
  font-weight: bold;
}

/* Dropdown option row checkbox rules */
.checkbox-box {
  width: 36rpx;
  height: 36rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  background-color: #ffffff;
}

.checked-box-bg {
  background-color: #07c160;
  border-color: #07c160;
}

/* Action button card options background gradients styles */
.action-card-btn {
  border-radius: 32rpx;
  height: 170rpx;
  box-sizing: border-box;
}

.scan-btn {
  background: linear-gradient(135deg, #07c160, #10b981);
  box-shadow: 0 4rpx 14rpx rgba(7, 193, 96, 0.2);
}

.view-issues-btn {
  background-color: #ffffff;
  border: 1rpx solid #eaeaea;
}

/* Score Ring Progress Circle style specs helper */
.score-ring {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: conic-gradient(#07c160 89.4%, #eaeaea 89.4%);
  padding: 8rpx;
  box-sizing: border-box;
}

.inner-circle {
  width: 100%;
  height: 100%;
}

/* Diagnostic subtab active underline */
.subtab-active {
  border-bottom: 4rpx solid #07c160;
}

/* Severity indicators dot styling */
.severity-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  display: inline-block;
}

.severity-dot.critical {
  background-color: #ef4444;
}

.severity-dot.warning {
  background-color: #f59e0b;
}

/* Chat feed window constraints */
.chat-scroller {
  height: 60vh;
  box-sizing: border-box;
}

.loading-ring {
  width: 18rpx;
  height: 18rpx;
  border: 3rpx solid #eaeaea;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.chat-input-desk {
  padding-bottom: calc(constant(safe-area-inset-bottom) + 16rpx);
  padding-bottom: calc(env(safe-area-inset-bottom) + 16rpx);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.brand-logo {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
}
</style>
