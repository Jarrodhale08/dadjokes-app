export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface LicenseIssue {
  package: string;
  version: string;
  license: string;
  severity: Severity;
  reason: string;
  recommendation: string;
}

export interface LicenseCheckResult {
  totalPackages: number;
  allowed: number;
  forbidden: number;
  unknown: number;
  issues: LicenseIssue[];
}

export interface TextIssue {
  id: string;
  name: string;
  type: 'missing_source' | 'vague_source';
  severity: Severity;
  details: string;
  currentSource?: string;
}

export interface TextCheckResult {
  totalItems: number;
  passed: number;
  issues: TextIssue[];
}

export interface ImageIssue {
  filePath: string;
  fileName: string;
  type: 'stock_metadata' | 'no_metadata' | 'suspicious_metadata';
  severity: Severity;
  details: string;
}

export interface ImageMetadata {
  hasExif: boolean;
  software?: string;
  copyright?: string;
  author?: string;
  make?: string;
  model?: string;
}

export interface ImageCheckResult {
  totalImages: number;
  passed: number;
  issues: ImageIssue[];
  metadata: Record<string, ImageMetadata>;
}

export interface CheckResults {
  licenses: LicenseCheckResult | null;
  text: TextCheckResult | null;
  images: ImageCheckResult | null;
}

export interface CheckerOptions {
  verbose?: boolean;
  strict?: boolean;
}
