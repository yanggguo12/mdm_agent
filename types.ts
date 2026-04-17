export enum IssueSeverity {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum IssueType {
  MISSING_FIELD = 'Missing Field',
  DUPLICATE = 'Duplicate',
  FORMAT_ERROR = 'Format Error',
  OUTLIER = 'Outlier',
  REF_INTEGRITY = 'Ref Integrity'
}

export interface DataIssue {
  id: string;
  table: string;
  field: string;
  description: string;
  count: number;
  impact: string;
  severity: IssueSeverity;
  type: IssueType;
  suggestion: string;
  status: 'Open' | 'Pending' | 'Fixed';
  calculationDetails?: {
    sampleBadRecords?: any[];
  };
}

export interface HealthMetric {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  calculationDetails?: {
    formula: string;
    description: string;
    numerator: { label: string; value: number };
    denominator: { label: string; value: number };
    dataSources: string[];
    lastCalculated: string;
    sampleBadRecords?: any[];
    sampleColumns?: { key: string; label: string }[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}