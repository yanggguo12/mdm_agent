import { HealthMetric, DataIssue, IssueSeverity, IssueType } from '../types';

export interface SAPMaterial {
  MANDT: string;
  MATNR: string;
  MAKTX: string;
  ERSDA: string;
  ERNAM: string;
  LAEDA: string;
  AENAM: string;
  VPSTA: string;
  PSTAT: string;
  LVORM: string;
  MTART: string;
  MBRSH: string;
  MATKL: string;
  BISMT: string;
  MEINS: string;
  BSTME: string;
  ZEINR: string;
  ZEIAR: string;
  ZEIVR: string;
  ZEIFO: string;
  AESZN: string;
  BLANZ: string;
  FERTH: string;
  FORMT: string;
  GROES: string;
  BRGEW: number;
  NTGEW: number;
  GEWEI: string;
  VOLUM: number;
  VOLEH: string;
  BEHVO: string;
  RAUBE: string;
  TEMPB: string;
  DISST: string;
  TRAGR: string;
  STOFF: string;
  SPART: string;
  KZEFF: string;
  COMPL: string;
  EAN11: string;
  NUMTP: string;
  LAENG: number;
  BREIT: number;
  HOEHE: number;
  MEABM: string;
  PRDHA: string;
  AEKLV: string;
  CADKZ: string;
  QMPUR: string;
  ERGEW: number;
  ERGEI: string;
  ERVOL: number;
  ERVOE: string;
  GEWTO: number;
  VOLTO: number;
  VABME: string;
  KZREV: string;
  KZKFG: string;
  XCHPF: string;
  VHART: string;
  MAGRV: string;
  MSTAE: string;
  EXTWG: string;
  MFRPN: string;
}

export const MARA_FIELDS = [
  'MANDT', 'MATNR', 'MAKTX', 'ERSDA', 'ERNAM', 'LAEDA', 'AENAM', 'VPSTA', 'PSTAT', 'LVORM', 
  'MTART', 'MBRSH', 'MATKL', 'BISMT', 'MEINS', 'BSTME', 'ZEINR', 'ZEIAR', 'ZEIVR', 'ZEIFO', 
  'AESZN', 'BLANZ', 'FERTH', 'FORMT', 'GROES', 'BRGEW', 'NTGEW', 'GEWEI', 'VOLUM', 'VOLEH', 
  'BEHVO', 'RAUBE', 'TEMPB', 'DISST', 'TRAGR', 'STOFF', 'SPART', 'KZEFF', 'COMPL', 'EAN11', 
  'NUMTP', 'LAENG', 'BREIT', 'HOEHE', 'MEABM', 'PRDHA', 'AEKLV', 'CADKZ', 'QMPUR', 'ERGEW', 
  'ERGEI', 'ERVOL', 'ERVOE', 'GEWTO', 'VOLTO', 'VABME', 'KZREV', 'KZKFG', 'XCHPF', 'VHART', 
  'MAGRV', 'MSTAE', 'EXTWG', 'MFRPN'
];

export const MARA_FIELD_DESCRIPTIONS: Record<string, string> = {
  MANDT: '客户端',
  MATNR: '物料号',
  MAKTX: '物料描述',
  ERSDA: '创建日期',
  ERNAM: '创建者',
  LAEDA: '最后更改日期',
  AENAM: '更改者',
  VPSTA: '维护状态',
  PSTAT: '维护状态',
  LVORM: '删除标记',
  MTART: '物料类型',
  MBRSH: '行业领域',
  MATKL: '物料组',
  BISMT: '旧物料号',
  MEINS: '基本计量单位',
  BSTME: '采购订单单位',
  ZEINR: '文档号',
  ZEIAR: '文档类型',
  ZEIVR: '文档版本',
  ZEIFO: '页面格式',
  AESZN: '文档更改号',
  BLANZ: '页数',
  FERTH: '生产备忘录',
  FORMT: '备忘录格式',
  GROES: '大小/量纲',
  BRGEW: '毛重',
  NTGEW: '净重',
  GEWEI: '重量单位',
  VOLUM: '体积',
  VOLEH: '体积单位',
  BEHVO: '容器要求',
  RAUBE: '存储条件',
  TEMPB: '温度条件',
  DISST: '低层代码',
  TRAGR: '运输组',
  STOFF: '危险物料号',
  SPART: '产品组',
  KZEFF: '分配标识',
  COMPL: '物料完成度',
  EAN11: '国际商品编码',
  NUMTP: 'EAN类别',
  LAENG: '长度',
  BREIT: '宽度',
  HOEHE: '高度',
  MEABM: '尺寸单位',
  PRDHA: '产品层次',
  AEKLV: '采购价值键',
  CADKZ: 'CAD标识',
  QMPUR: 'QM采购激活',
  ERGEW: '允许毛重',
  ERGEI: '允许毛重单位',
  ERVOL: '允许体积',
  ERVOE: '允许体积单位',
  GEWTO: '超重容差',
  VOLTO: '超体积容差',
  VABME: '可变采购单位',
  KZREV: '修订级别',
  KZKFG: '配置物料',
  XCHPF: '批次管理',
  VHART: '包装物料类型',
  MAGRV: '包装物料组',
  MSTAE: '跨工厂物料状态',
  EXTWG: '外部物料组',
  MFRPN: '制造商型号'
};

export const FUZZY_DUPLICATE_GROUPS = [
  { canonical: '六角螺栓 M8x30', variations: ['六角螺栓 M8x30 镀锌 (Hex Bolt)', 'M8x30 镀锌六角螺栓', 'Hex Bolt M8x30', '六角螺栓 M8*30'] },
  { canonical: 'O型密封圈 20x2.5', variations: ['O型密封圈 20x2.5 丁腈橡胶 (O-Ring)', '丁腈橡胶 O型密封圈 20*2.5', 'O-Ring 20x2.5'] },
  { canonical: '伺服电机 750W', variations: ['伺服电机 750W 220V (Servo Motor)', '750W 220V 伺服电机', 'Servo Motor 750W'] },
  { canonical: '深沟球轴承 6204', variations: ['深沟球轴承 6204-2RS (Bearing)', '6204-2RS 深沟球轴承', 'Bearing 6204-2RS'] },
  { canonical: '交流接触器 CJX2', variations: ['交流接触器 CJX2-1810 (Contactor)', 'CJX2-1810 交流接触器', 'Contactor CJX2-1810'] }
];

export const getCanonicalDesc = (desc: string) => {
  for (const group of FUZZY_DUPLICATE_GROUPS) {
    if (group.variations.includes(desc) || desc.includes(group.canonical)) {
      return group.canonical;
    }
  }
  return desc;
};

export const processData = (
  data: SAPMaterial[], 
  completenessKeyFields: string[], 
  uniquenessKeyFields: string[] = ['MAKTX'],
  selectedCategories: string[] = ['基础数据MARA'],
  complianceRules: any[] = [] // New parameter for compliance rules
) => {
  if (selectedCategories.length === 0) {
    const now = new Date().toLocaleString();
    const emptyMetrics: HealthMetric[] = [
      { name: '完整性 (Completeness)', score: 0, trend: 'stable', color: '#94a3b8', calculationDetails: { formula: '-', description: '请选择数据类别', numerator: { label: '-', value: 0 }, denominator: { label: '-', value: 0 }, dataSources: [], lastCalculated: now } },
      { name: '唯一性 (Uniqueness)', score: 0, trend: 'stable', color: '#94a3b8', calculationDetails: { formula: '-', description: '请选择数据类别', numerator: { label: '-', value: 0 }, denominator: { label: '-', value: 0 }, dataSources: [], lastCalculated: now } },
      { name: '准确性 (Accuracy)', score: 0, trend: 'stable', color: '#94a3b8', calculationDetails: { formula: '-', description: '请选择数据类别', numerator: { label: '-', value: 0 }, denominator: { label: '-', value: 0 }, dataSources: [], lastCalculated: now } },
      { name: '合规性 (Compliance)', score: 0, trend: 'stable', color: '#94a3b8', calculationDetails: { formula: '-', description: '请选择数据类别', numerator: { label: '-', value: 0 }, denominator: { label: '-', value: 0 }, dataSources: [], lastCalculated: now } }
    ];
    return { metrics: emptyMetrics, issues: [] };
  }

  const total = data.length;
  const tableLabel = selectedCategories.join(', ');

  // 1. Completeness Calculation
  const missingMatklRecords = data.filter(d => 
    completenessKeyFields.some(field => {
      const val = d[field as keyof SAPMaterial];
      return val === '' || val === null || val === undefined;
    })
  );
  const completeRecords = total - missingMatklRecords.length;
  const completenessScore = total === 0 ? 100 : Math.round((completeRecords / total) * 100);

  // 2. Uniqueness Calculation (OR relationship)
  const keyToIndices = new Map<string, number[]>();
  
  data.forEach((d, index) => {
    uniquenessKeyFields.forEach(field => {
      let val = '';
      let isValid = false;

      if (field === 'MAKTX') {
        val = getCanonicalDesc(d.MAKTX);
        isValid = !!val && val.trim() !== '';
      } else if (field === 'ZEINR_ZEIVR') {
        if (d.ZEINR && d.ZEINR.trim() !== '') {
          val = `${d.ZEINR.trim()}_${(d.ZEIVR || '').trim()}`;
          isValid = true;
        }
      } else {
        val = (d[field as keyof SAPMaterial] || '').toString().trim();
        isValid = !!val && val !== '';
      }
      
      if (isValid) {
        const mapKey = `${field}:${val}`;
        if (!keyToIndices.has(mapKey)) {
          keyToIndices.set(mapKey, []);
        }
        keyToIndices.get(mapKey)!.push(index);
      }
    });
  });

  // Build adjacency list for the graph
  const adjList = new Map<number, Set<number>>();
  for (let i = 0; i < total; i++) adjList.set(i, new Set());

  keyToIndices.forEach(indices => {
    if (indices.length > 1) {
      // Connect all indices in this group
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          adjList.get(indices[i])!.add(indices[j]);
          adjList.get(indices[j])!.add(indices[i]);
        }
      }
    }
  });

  // Find connected components
  const visited = new Set<number>();
  let uniqueEntitiesCount = 0;
  const duplicateRecords: any[] = [];
  let duplicateCount = 0; // Number of redundant records

  for (let i = 0; i < total; i++) {
    if (!visited.has(i)) {
      uniqueEntitiesCount++;
      
      // BFS to find all connected nodes
      const component: number[] = [];
      const queue = [i];
      visited.add(i);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        component.push(curr);
        
        adjList.get(curr)!.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
      
      if (component.length > 1) {
        // This component represents a group of duplicates
        duplicateCount += component.length - 1;
        
        // Add all records in this component to duplicateRecords
        const groupId = `Group-${uniqueEntitiesCount}`;
        component.forEach(idx => {
          // Determine which fields caused the duplication for this specific record
          const duplicateReasons: string[] = [];
          uniquenessKeyFields.forEach(field => {
             let val = '';
             let isValid = false;

             if (field === 'MAKTX') {
               val = getCanonicalDesc(data[idx].MAKTX);
               isValid = !!val && val.trim() !== '';
             } else if (field === 'ZEINR_ZEIVR') {
               if (data[idx].ZEINR && data[idx].ZEINR.trim() !== '') {
                 val = `${data[idx].ZEINR.trim()}_${(data[idx].ZEIVR || '').trim()}`;
                 isValid = true;
               }
             } else {
               val = (data[idx][field as keyof SAPMaterial] || '').toString().trim();
               isValid = !!val && val !== '';
             }
             
             if (isValid) {
                 const mapKey = `${field}:${val}`;
                 if (keyToIndices.has(mapKey) && keyToIndices.get(mapKey)!.length > 1) {
                     duplicateReasons.push(field);
                 }
             }
          });

          const record = { 
              ...data[idx], 
              _duplicateGroup: groupId,
              _duplicateReasons: duplicateReasons.join(', ')
          };
          duplicateRecords.push(record);
        });
      }
    }
  }

  // Sort duplicate records by group so they appear together
  duplicateRecords.sort((a, b) => (a._duplicateGroup || '').localeCompare(b._duplicateGroup || ''));

  const uniquenessScore = total === 0 ? 100 : Math.round(((total - duplicateCount) / total) * 100);

  // 3. Accuracy Calculation
  const inaccurateRecords = data.filter(d => d.NTGEW > d.BRGEW);
  const accurateRecords = total - inaccurateRecords.length;
  const accuracyScore = total === 0 ? 100 : Math.round((accurateRecords / total) * 100);

  // 4. Compliance Calculation (Now considering complianceRules)
  let complianceScore = 88;
  let complianceNumeratorValues = 0;
  let complianceDenominatorValues = 100;
  let complianceNonCompliantRecords: any[] = [];
  
  const fertRecords = data.filter(d => d.MTART === 'FERT');
  const totalFert = fertRecords.length;
  // Let's assume a compliance rule: Finished Goods (FERT) must have an EAN11 barcode
  const nonCompliantFert = fertRecords.filter(d => !d.EAN11 || d.EAN11.length !== 13);
  const compliantFert = totalFert - nonCompliantFert.length;
  
  if (complianceRules && complianceRules.length > 0) {
    // Simulate finding issues based on the confirmed rules
    const simulatedIssuesCount = Math.floor(Math.random() * 50) + 10;
    complianceScore = Math.max(0, 100 - Math.ceil(simulatedIssuesCount / Math.max(total, 1) * 100));
    complianceNumeratorValues = Math.max(0, total - simulatedIssuesCount);
    complianceDenominatorValues = total;
    
    // Create non-compliant records
    const flaggedRecords = data.slice(0, Math.min(simulatedIssuesCount, 20)).map((d, index) => {
      const rule = complianceRules[index % complianceRules.length];
      return {
        ...d,
        _complianceType: rule.type,
        _complianceTitle: rule.title,
        _complianceDesc: rule.desc,
        _complianceMsg: rule.type === 'external' ? '外部违规: 未达到法规底线要求。' : '内部违规: 不符合管理规范。'
      };
    });
    complianceNonCompliantRecords = flaggedRecords;
  } else {
    complianceScore = totalFert === 0 ? 100 : Math.round((compliantFert / totalFert) * 100);
    complianceNumeratorValues = compliantFert;
    complianceDenominatorValues = totalFert;
    complianceNonCompliantRecords = nonCompliantFert;
  }

  const now = new Date().toLocaleString();

  const metrics: HealthMetric[] = [
    {
      name: '完整性 (Completeness)',
      score: completenessScore,
      trend: completenessScore >= 90 ? 'up' : 'down',
      color: '#3b82f6',
      calculationDetails: {
        formula: '(关键字段非空记录数 / 总记录数) × 100%',
        description: `衡量核心业务实体中关键属性（${completenessKeyFields.join(', ')}）是否被完整填写。`,
        numerator: { label: '完整记录数', value: completeRecords },
        denominator: { label: '总记录数', value: total },
        dataSources: [tableLabel],
        lastCalculated: now,
        sampleBadRecords: missingMatklRecords,
        sampleColumns: [
          { key: 'MATNR', label: '物料号' },
          { key: 'MAKTX', label: '描述' },
          ...completenessKeyFields.map(field => ({ key: field, label: MARA_FIELD_DESCRIPTIONS[field] || field }))
        ]
      }
    },
    {
      name: '唯一性 (Uniqueness)',
      score: uniquenessScore,
      trend: uniquenessScore >= 90 ? 'stable' : 'down',
      color: '#10b981',
      calculationDetails: {
        formula: '((总记录数 - 冗余记录数) / 总记录数) × 100%',
        description: `检测系统中是否存在关键属性（${uniquenessKeyFields.join(' 或 ')}）重复的物料主数据。`,
        numerator: { label: '唯一记录数', value: total - duplicateCount },
        denominator: { label: '总记录数', value: total },
        dataSources: [tableLabel],
        lastCalculated: now,
        sampleBadRecords: duplicateRecords,
        sampleColumns: [
          { key: 'MATNR', label: '物料号' },
          { key: 'MAKTX', label: '描述' },
          ...uniquenessKeyFields.filter(f => f !== 'MAKTX').flatMap(field => {
            if (field === 'ZEINR_ZEIVR') return [{ key: 'ZEINR', label: '图号' }, { key: 'ZEIVR', label: '版本号' }];
            return [{ key: field, label: MARA_FIELD_DESCRIPTIONS[field] || field }];
          })
        ]
      }
    },
    {
      name: '准确性 (Accuracy)',
      score: accuracyScore,
      trend: accuracyScore >= 90 ? 'up' : 'down',
      color: '#f59e0b',
      calculationDetails: {
        formula: '(符合业务规则的记录数 / 校验总记录数) × 100%',
        description: '验证数据值是否符合预定义的物理与业务规则（如：净重 NTGEW 必须小于等于毛重 BRGEW）。',
        numerator: { label: '合规记录数', value: accurateRecords },
        denominator: { label: '校验总记录数', value: total },
        dataSources: [tableLabel],
        lastCalculated: now,
        sampleBadRecords: inaccurateRecords,
        sampleColumns: [
          { key: 'MATNR', label: '物料号' },
          { key: 'MAKTX', label: '描述' },
          { key: 'BRGEW', label: '毛重' },
          { key: 'NTGEW', label: '净重' }
        ]
      }
    },
    {
      name: '合规性 (Compliance)',
      score: complianceScore,
      trend: complianceScore >= 90 ? 'stable' : 'down',
      color: '#8b5cf6',
      calculationDetails: {
        formula: '(满足外/内部合规要求的记录数 / 适用合规规则的总记录数) × 100%',
        description: complianceRules && complianceRules.length > 0
          ? `验证规则：应用了 ${complianceRules.length} 条文档分析提取的双环模型合规要求（如关务法规、内部命名规范）。`
          : '检查数据是否满足特定业务类型的合规要求（如：成品 FERT 必须维护 13 位 EAN/UPC 条码）。',
        numerator: { label: '合规记录数', value: complianceNumeratorValues },
        denominator: { label: '合规校验总数', value: complianceDenominatorValues },
        dataSources: complianceRules && complianceRules.length > 0 ? [tableLabel, '外部合规政策文档', '内部管理规章制度'] : [tableLabel, 'MEAN (物料的 EAN)'],
        lastCalculated: now,
        sampleBadRecords: complianceNonCompliantRecords,
        sampleColumns: complianceRules && complianceRules.length > 0 ? [
          { key: 'MATNR', label: '物料号' },
          { key: '_complianceType', label: '规范类型' },
          { key: '_complianceTitle', label: '违反规则' },
          { key: '_complianceDesc', label: '诊断建议' },
          { key: '_complianceMsg', label: '违规详情' }
        ] : [
          { key: 'MATNR', label: '物料号' },
          { key: 'MAKTX', label: '描述' },
          { key: 'MTART', label: '类型' },
          { key: 'EAN11', label: '条码' }
        ]
      }
    }
  ];

  const issues: DataIssue[] = [
    {
      id: 'ISS-001',
      table: tableLabel,
      field: completenessKeyFields.join(', '),
      description: `检测到 ${missingMatklRecords.length} 条记录关键字段为空`,
      count: missingMatklRecords.length,
      impact: `${total > 0 ? ((missingMatklRecords.length / total) * 100).toFixed(1) : 0}%`,
      severity: IssueSeverity.MEDIUM,
      type: IssueType.MISSING_FIELD,
      suggestion: 'AI 推理：基于描述文本相似度自动填充',
      status: 'Open',
      calculationDetails: {
        sampleBadRecords: missingMatklRecords
      }
    },
    {
      id: 'ISS-002',
      table: tableLabel,
      field: uniquenessKeyFields.join(', '),
      description: `检测到 ${duplicateCount} 条潜在的重复记录 (基于 ${uniquenessKeyFields.join(', ')})`,
      count: duplicateCount,
      impact: `${total > 0 ? ((duplicateCount / total) * 100).toFixed(1) : 0}%`,
      severity: IssueSeverity.HIGH,
      type: IssueType.DUPLICATE,
      suggestion: '触发合并工作流请求',
      status: 'Open',
      calculationDetails: {
        sampleBadRecords: duplicateRecords
      }
    },
    {
      id: 'ISS-003',
      table: tableLabel,
      field: 'NTGEW (净重)',
      description: `发现 ${inaccurateRecords.length} 条记录净重(NTGEW)大于毛重(BRGEW)`,
      count: inaccurateRecords.length,
      impact: `${total > 0 ? ((inaccurateRecords.length / total) * 100).toFixed(1) : 0}%`,
      severity: IssueSeverity.HIGH,
      type: IssueType.OUTLIER,
      suggestion: '自动冻结记录并通知数据专员核实重量',
      status: 'Open',
      calculationDetails: {
        sampleBadRecords: inaccurateRecords
      }
    }
  ];

  if (complianceRules && complianceRules.length > 0) {
    issues.push({
      id: 'ISS-004',
      table: tableLabel,
      field: '综合合规检查 (法规/制度)',
      description: `双环预警：拦截了 ${complianceNumeratorValues !== 0 ? total - complianceNumeratorValues : complianceNonCompliantRecords.length} 项违规风险 (内/外环)`,
      count: complianceNumeratorValues !== 0 ? total - complianceNumeratorValues : complianceNonCompliantRecords.length,
      impact: `${complianceDenominatorValues > 0 ? (((complianceNumeratorValues !== 0 ? total - complianceNumeratorValues : complianceNonCompliantRecords.length) / complianceDenominatorValues) * 100).toFixed(1) : 0}%`,
      severity: IssueSeverity.HIGH,
      type: IssueType.FORMAT_ERROR, 
      suggestion: '冻结主数据外发并提示风险归因',
      status: 'Open',
      calculationDetails: {
        sampleBadRecords: complianceNonCompliantRecords
      }
    });
  } else {
    issues.push({
      id: 'ISS-004',
      table: tableLabel,
      field: 'EAN11 (国际商品编码)',
      description: `发现 ${nonCompliantFert.length} 个成品(FERT)缺失合规的13位EAN码`,
      count: nonCompliantFert.length,
      impact: `${totalFert > 0 ? ((nonCompliantFert.length / totalFert) * 100).toFixed(1) : 0}% (占成品)`,
      severity: IssueSeverity.MEDIUM,
      type: IssueType.FORMAT_ERROR,
      suggestion: '阻断发货流程，提示业务补充EAN码',
      status: 'Open',
      calculationDetails: {
        sampleBadRecords: nonCompliantFert
      }
    });
  }

  // Ref Integrity (Random Mock)
  issues.push({
    id: 'ISS-005',
    table: 'ZSUP_LINK (供应商关联)',
    field: 'LIFNR (供应商)',
    description: 'LFA1 主数据中未找到对应的供应商代码',
    count: Math.floor(Math.random() * 50) + 10,
    impact: '2.5%',
    severity: IssueSeverity.HIGH,
    type: IssueType.REF_INTEGRITY,
    suggestion: '创建供应商引入任务',
    status: 'Open',
    calculationDetails: {
      sampleBadRecords: []
    }
  });

  const finalIssues = issues.filter(issue => issue.count > 0);

  return { metrics, issues: finalIssues };
};

export const generateAndProcessData = (count: number = 1000, completenessKeyFields: string[] = ['MATKL'], uniquenessKeyFields: string[] = ['MAKTX'], selectedCategories: string[] = ['基础数据MARA']) => {
  const data: SAPMaterial[] = [];
  const materialTypes = ['ROH', 'HALB', 'FERT'];
  const units = ['PC', 'KG', 'M', 'L'];
  const groups = ['001', '002', '003', '004', '']; // '' means missing
  const users = ['SAPUSER', 'ADMIN', 'WANGJ', 'LISI', 'ZHANGS', 'CHENM'];
  const industries = ['M', 'C', 'P', '1'];
  const weightUnits = ['KG', 'G', 'LB'];
  const volumeUnits = ['M3', 'CM3', 'L'];
  const crossPlantStatuses = ['', '01', '02'];
  const divisions = ['10', '20', '30'];

  // Generate 1000 mock records
  for (let i = 0; i < count; i++) {
    const mtart = materialTypes[Math.floor(Math.random() * materialTypes.length)];
    const isFert = mtart === 'FERT';

    // Introduce errors based on probabilities to simulate real-world messy data
    const isMissingGroup = Math.random() < 0.12; // 12% missing MATKL
    const isDuplicate = Math.random() < 0.08; // 8% duplicates
    const isInaccurate = Math.random() < 0.15; // 15% inaccurate (Net Weight > Gross Weight)
    const isNonCompliant = isFert && Math.random() < 0.18; // 18% of FERT missing EAN

    const brgew = parseFloat((Math.random() * 100 + 10).toFixed(2));
    const ntgew = isInaccurate 
      ? brgew + parseFloat((Math.random() * 10 + 1).toFixed(2)) 
      : brgew - parseFloat((Math.random() * 5).toFixed(2));

    let baseDesc = `Material Product ${i}`;
    let zeinr = Math.random() > 0.2 ? `DOC-${Math.floor(Math.random() * 10000)}` : '';
    let zeivr = Math.random() > 0.2 ? `0${Math.floor(Math.random() * 5) + 1}` : '';
    let mfrpn = Math.random() > 0.3 ? `MFG-${Math.floor(Math.random() * 10000)}` : '';
    let bismt = Math.random() > 0.3 ? `OLD-${Math.floor(Math.random() * 10000)}` : '';

    if (i < 20) {
      // Force 20 explicit duplicates (4 of each realistic duplicate group, picking different variations)
      const groupIndex = Math.floor(i / 4);
      const group = FUZZY_DUPLICATE_GROUPS[groupIndex];
      baseDesc = group.variations[i % group.variations.length] || group.canonical;
    } else if (i >= 20 && i < 40) {
      // Force duplicates for ZEINR_ZEIVR
      const groupIndex = Math.floor((i - 20) / 4);
      zeinr = `DOC-DUP-${groupIndex}`;
      zeivr = '01';
    } else if (i >= 40 && i < 60) {
      // Force duplicates for MFRPN
      const groupIndex = Math.floor((i - 40) / 4);
      mfrpn = `MFG-DUP-${groupIndex}`;
    } else if (i >= 60 && i < 80) {
      // Force duplicates for BISMT
      const groupIndex = Math.floor((i - 60) / 4);
      bismt = `OLD-DUP-${groupIndex}`;
    } else if (isDuplicate) {
      const group = FUZZY_DUPLICATE_GROUPS[Math.floor(Math.random() * FUZZY_DUPLICATE_GROUPS.length)];
      baseDesc = group.variations[Math.floor(Math.random() * group.variations.length)] || group.canonical;
    }
    
    // Generate dates
    const createdDate = new Date(Date.now() - Math.random() * 100000000000);
    const changedDate = new Date(createdDate.getTime() + Math.random() * 10000000000);

    data.push({
      MANDT: '800',
      MATNR: `MAT-${100000 + i}`,
      MAKTX: baseDesc,
      ERSDA: createdDate.toISOString().split('T')[0],
      ERNAM: users[Math.floor(Math.random() * users.length)],
      LAEDA: changedDate.toISOString().split('T')[0],
      AENAM: users[Math.floor(Math.random() * users.length)],
      VPSTA: 'KVE',
      PSTAT: 'KVE',
      LVORM: Math.random() < 0.02 ? 'X' : '',
      MTART: mtart,
      MBRSH: industries[Math.floor(Math.random() * industries.length)],
      MATKL: isMissingGroup ? '' : groups[Math.floor(Math.random() * (groups.length - 1))],
      BISMT: bismt,
      MEINS: units[Math.floor(Math.random() * units.length)],
      BSTME: units[Math.floor(Math.random() * units.length)],
      ZEINR: zeinr,
      ZEIAR: Math.random() > 0.8 ? 'DRW' : '',
      ZEIVR: zeivr,
      ZEIFO: Math.random() > 0.8 ? 'A4' : '',
      AESZN: '',
      BLANZ: '',
      FERTH: '',
      FORMT: '',
      GROES: Math.random() > 0.5 ? `${Math.floor(Math.random() * 100)}x${Math.floor(Math.random() * 100)}` : '',
      BRGEW: brgew,
      NTGEW: Math.max(0, parseFloat(ntgew.toFixed(2))),
      GEWEI: weightUnits[Math.floor(Math.random() * weightUnits.length)],
      VOLUM: parseFloat((Math.random() * 50).toFixed(3)),
      VOLEH: volumeUnits[Math.floor(Math.random() * volumeUnits.length)],
      BEHVO: '',
      RAUBE: '',
      TEMPB: '',
      DISST: '',
      TRAGR: '0001',
      STOFF: '',
      SPART: divisions[Math.floor(Math.random() * divisions.length)],
      KZEFF: '',
      COMPL: '',
      EAN11: (isFert && !isNonCompliant) 
        ? `690${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}` 
        : (isFert ? '' : `690${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`),
      NUMTP: 'HE',
      LAENG: parseFloat((Math.random() * 100).toFixed(2)),
      BREIT: parseFloat((Math.random() * 100).toFixed(2)),
      HOEHE: parseFloat((Math.random() * 100).toFixed(2)),
      MEABM: 'CM',
      PRDHA: `00100${Math.floor(Math.random() * 9)}00${Math.floor(Math.random() * 9)}`,
      AEKLV: '',
      CADKZ: '',
      QMPUR: '',
      ERGEW: 0,
      ERGEI: '',
      ERVOL: 0,
      ERVOE: '',
      GEWTO: 0,
      VOLTO: 0,
      VABME: '1',
      KZREV: '',
      KZKFG: '',
      XCHPF: Math.random() > 0.8 ? 'X' : '',
      VHART: '',
      MAGRV: '',
      MSTAE: crossPlantStatuses[Math.floor(Math.random() * crossPlantStatuses.length)],
      EXTWG: `EXT0${Math.floor(Math.random() * 5)}`,
      MFRPN: mfrpn
    });
  }

  const { metrics, issues } = processData(data, completenessKeyFields, uniquenessKeyFields, selectedCategories);

  return { data, metrics, issues };
};
