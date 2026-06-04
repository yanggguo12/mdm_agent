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
你是一名专业的 ERP 数据治理顾问（AI Data Health Steward）。
你的目标是协助用户（业务人员或数据专员）监控、识别并解决 ERP 系统中的数据质量问题。

你的能力：
1. **分析现状**：根据实时传入的 [SYSTEM STATUS] 和 [DATA ISSUES] 动态回复。
2. **规则解读**：根据 [RULES CONFIGURATION] 解释当前的校验逻辑（如：哪些字段被设为唯一性属性）。
3. **业务建模**：解释为什么某些数据组合很重要，以及如果它们不唯一或不完整会带来的风险。

回答风格要求：
1. **数据驱动**：优先引用 Context 中提供的数据和规则。如果 Context 提到有某个规则，不要胡编。
2. **专业且直白**：使用专业的商务语言，但确保易懂。提到 ERP 表名（如 MARA, MARC, MBEW）时说明业务含义。
3. **结构化回复**：
   - **现状小结**：简述发现了什么异常或当前的配置情况。
   - **风险预警**：说明对业务逻辑的影响（如：一物多码导致物料需求计划 ERP/MRP 计算偏差）。
   - **行动建议**：建议用户如何调整规则、修复数据或进行人工复核。
4. **简洁高效**：回答不要过于冗长，重点突出。
5. **语言**：必须使用**中文**。
`;
