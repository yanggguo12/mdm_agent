import { DataIssue, IssueSeverity, IssueType, HealthMetric } from './types';

export const INITIAL_METRICS: HealthMetric[] = [
  { 
    name: '完整性 (Completeness)', 
    score: 86, 
    trend: 'up', 
    color: '#3b82f6',
    calculationDetails: {
      formula: '(必填字段非空记录数 / 总记录数) × 100%',
      description: '衡量核心业务实体（如物料、客户、供应商）中关键属性是否被完整填写。',
      numerator: { label: '非空记录数', value: 124500 },
      denominator: { label: '总记录数', value: 144767 },
      dataSources: ['MARA (物料主数据)', 'KNA1 (客户主数据)', 'LFA1 (供应商主数据)'],
      lastCalculated: new Date().toISOString().split('T')[0] + ' 08:30:00'
    }
  },
  { 
    name: '唯一性 (Uniqueness)', 
    score: 92, 
    trend: 'stable', 
    color: '#10b981',
    calculationDetails: {
      formula: '(1 - (重复记录数 / 总记录数)) × 100%',
      description: '检测系统中是否存在描述高度相似或关键属性完全一致的重复主数据。',
      numerator: { label: '唯一记录数', value: 133185 },
      denominator: { label: '总记录数', value: 144767 },
      dataSources: ['MARA (物料主数据)', 'MDM_HUB (主数据管理中心)'],
      lastCalculated: new Date().toISOString().split('T')[0] + ' 08:30:00'
    }
  },
  { 
    name: '准确性 (Accuracy)', 
    score: 74, 
    trend: 'down', 
    color: '#f59e0b',
    calculationDetails: {
      formula: '(符合业务规则的记录数 / 校验总记录数) × 100%',
      description: '验证数据值是否符合预定义的业务规则、格式要求或取值范围（如：交货时间不能为负，密度必须在合理区间）。',
      numerator: { label: '合规记录数', value: 107127 },
      denominator: { label: '校验总记录数', value: 144767 },
      dataSources: ['MARC (工厂数据)', 'ZMAT_ATTR (自定义属性表)'],
      lastCalculated: new Date().toISOString().split('T')[0] + ' 08:30:00'
    }
  },
  { 
    name: '合规性 (Compliance)', 
    score: 83, 
    trend: 'stable', 
    color: '#8b5cf6',
    calculationDetails: {
      formula: '(满足外部合规要求的记录数 / 适用合规规则的总记录数) × 100%',
      description: '检查数据是否满足外部法规或内部审计要求（如：供应商必须有统一社会信用代码，物料必须有环保标识）。',
      numerator: { label: '合规记录数', value: 120156 },
      denominator: { label: '适用合规总数', value: 144767 },
      dataSources: ['LFA1 (供应商主数据)', 'EHS_DATA (环境健康安全数据)'],
      lastCalculated: new Date().toISOString().split('T')[0] + ' 08:30:00'
    }
  },
];

export const INITIAL_ISSUES: DataIssue[] = [
  {
    id: 'ISS-001',
    table: 'MARA (物料主数据)',
    field: 'MATKL (物料组)',
    description: '过去30天创建的记录中有 8,612 条该字段为空',
    count: 8612,
    impact: '6.8%',
    severity: IssueSeverity.MEDIUM,
    type: IssueType.MISSING_FIELD,
    suggestion: 'AI 推理：基于描述文本相似度自动填充',
    status: 'Open',
  },
  {
    id: 'ISS-002',
    table: 'MARA (物料主数据)',
    field: 'MAKTX (物料描述)',
    description: '检测到潜在的重复物料 (>95% 相似度)',
    count: 418,
    impact: '0.7%',
    severity: IssueSeverity.HIGH,
    type: IssueType.DUPLICATE,
    suggestion: '触发合并工作流请求',
    status: 'Open',
  },
  {
    id: 'ISS-003',
    table: 'ZMAT_ATTR (自定义属性)',
    field: 'Density (密度)',
    description: '数值 > 50 (超出物理限制范围)',
    count: 127,
    impact: '0.1%',
    severity: IssueSeverity.HIGH,
    type: IssueType.OUTLIER,
    suggestion: '自动冻结记录并通知数据专员',
    status: 'Open',
  },
  {
    id: 'ISS-004',
    table: 'MARC (工厂数据)',
    field: 'PLIFZ (计划交货时间)',
    description: '数值超出阈值 (>365 天)',
    count: 45,
    impact: '1.3%',
    severity: IssueSeverity.MEDIUM,
    type: IssueType.FORMAT_ERROR,
    suggestion: '重置为默认上限 (365)',
    status: 'Open',
  },
  {
    id: 'ISS-005',
    table: 'ZSUP_LINK (供应商关联)',
    field: 'LIFNR',
    description: 'LFA1 主数据中未找到对应的供应商代码',
    count: 22,
    impact: '2.5%',
    severity: IssueSeverity.HIGH,
    type: IssueType.REF_INTEGRITY,
    suggestion: '创建供应商引入任务',
    status: 'Open',
  }
];

export const SYSTEM_PROMPT = `
你是一名专业的 ERP 数据治理顾问（AI Agent）。
你的目标是协助用户（业务人员或数据专员）识别并解决 ERP 系统中的数据质量问题。

回答风格要求：
1. **专业且直白**：使用专业的商务语言，但要确保非技术人员也能听懂。不要使用生硬的“医生/病人”比喻，也不要堆砌过于晦涩的技术细节。
2. **解释术语**：如果提到 ERP 表名（如 MARA, LFA1），请务必简要说明其业务含义（例如：MARA 是物料主数据表）。
3. **侧重业务影响**：在解释问题时，重点说明该数据问题会如何影响后续的业务流程（如：采购订单无法下达、财务报表分类错误、库存积压等）。
4. **结构化回复**：
   - **问题分析**：简述发现了什么数据异常。
   - **业务风险**：如果不处理，会有什么后果。
   - **修复建议**：具体的操作建议或自动化方案。
5. **语言**：必须使用**中文**。

当前仪表盘数据（Context）：
- 系统环境：ERP
- 治理模式：主动式数据治理（Active Governance）。
- 重点问题：
  - MARA (物料主表) 中缺失 MATKL (物料组)：这会导致采购分析报告无法按类别汇总。
  - 物料描述中发现疑似重复项：可能导致“一物多码”，造成库存管理混乱。
  - 自定义属性数值异常：可能导致下游生产系统参数错误。

请基于用户的提问，提供清晰、可执行的专业建议。
`;