import { execSync } from 'child_process';
import * as path from 'path';
import { LicenseCheckResult, LicenseIssue, Severity } from '../types';
import { FORBIDDEN_LICENSES, ALLOWED_LICENSES } from '../config/license-lists';

interface LicenseInfo {
  licenses: string;
  repository?: string;
  publisher?: string;
  path?: string;
}

type LicenseData = Record<string, LicenseInfo>;

function categorizeLicense(license: string): { category: 'allowed' | 'forbidden' | 'unknown'; severity: Severity } {
  const normalizedLicense = license.toUpperCase().trim();

  // Check if it's a forbidden license
  for (const forbidden of FORBIDDEN_LICENSES) {
    if (normalizedLicense.includes(forbidden.toUpperCase())) {
      // GPL variants are critical
      if (normalizedLicense.includes('GPL') || normalizedLicense.includes('AGPL')) {
        return { category: 'forbidden', severity: 'critical' };
      }
      // Non-commercial is high severity
      if (normalizedLicense.includes('NC')) {
        return { category: 'forbidden', severity: 'high' };
      }
      return { category: 'forbidden', severity: 'high' };
    }
  }

  // Check if it's an allowed license
  for (const allowed of ALLOWED_LICENSES) {
    if (normalizedLicense.includes(allowed.toUpperCase())) {
      return { category: 'allowed', severity: 'low' };
    }
  }

  // Handle special cases
  if (normalizedLicense === 'UNKNOWN' || normalizedLicense === '' || normalizedLicense === 'NONE') {
    return { category: 'unknown', severity: 'medium' };
  }

  // Check for common variations
  if (normalizedLicense.includes('MIT') || normalizedLicense.includes('APACHE') || normalizedLicense.includes('BSD')) {
    return { category: 'allowed', severity: 'low' };
  }

  return { category: 'unknown', severity: 'medium' };
}

function getRecommendation(license: string, category: string): string {
  if (category === 'forbidden') {
    if (license.toUpperCase().includes('GPL')) {
      return 'Replace with MIT/Apache-licensed alternative or ensure compliance with GPL requirements';
    }
    if (license.toUpperCase().includes('NC')) {
      return 'Non-commercial license - cannot be used in commercial apps';
    }
    return 'Review license terms and consider replacement';
  }
  if (category === 'unknown') {
    return 'Review license terms manually to ensure commercial use is permitted';
  }
  return 'No action required';
}

export async function checkLicenses(projectPath: string): Promise<LicenseCheckResult> {
  const issues: LicenseIssue[] = [];
  let licenseData: LicenseData = {};

  try {
    // Run license-checker and get JSON output
    const result = execSync(
      'npx license-checker-rseidelsohn --json --production',
      {
        cwd: projectPath,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large dependency trees
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    licenseData = JSON.parse(result);
  } catch (error: unknown) {
    // Try parsing stdout even if exit code is non-zero
    const execError = error as { stdout?: string; message?: string };
    if (execError.stdout) {
      try {
        licenseData = JSON.parse(execError.stdout);
      } catch {
        console.error('Failed to parse license data:', execError.message);
        return {
          totalPackages: 0,
          allowed: 0,
          forbidden: 0,
          unknown: 0,
          issues: [{
            package: 'license-checker',
            version: 'N/A',
            license: 'ERROR',
            severity: 'high',
            reason: 'Failed to run license checker',
            recommendation: 'Ensure license-checker-rseidelsohn is installed and node_modules exists'
          }]
        };
      }
    }
  }

  const packages = Object.entries(licenseData);
  let allowed = 0;
  let forbidden = 0;
  let unknown = 0;

  for (const [pkgNameVersion, info] of packages) {
    const license = info.licenses || 'UNKNOWN';
    const { category, severity } = categorizeLicense(license);

    // Extract package name and version
    const lastAtIndex = pkgNameVersion.lastIndexOf('@');
    const packageName = lastAtIndex > 0 ? pkgNameVersion.substring(0, lastAtIndex) : pkgNameVersion;
    const version = lastAtIndex > 0 ? pkgNameVersion.substring(lastAtIndex + 1) : 'unknown';

    switch (category) {
      case 'allowed':
        allowed++;
        break;
      case 'forbidden':
        forbidden++;
        issues.push({
          package: packageName,
          version,
          license,
          severity,
          reason: `License "${license}" is not compatible with closed-source commercial use`,
          recommendation: getRecommendation(license, category)
        });
        break;
      case 'unknown':
        unknown++;
        issues.push({
          package: packageName,
          version,
          license,
          severity,
          reason: `License "${license}" needs manual review`,
          recommendation: getRecommendation(license, category)
        });
        break;
    }
  }

  // Sort issues by severity
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    totalPackages: packages.length,
    allowed,
    forbidden,
    unknown,
    issues
  };
}
