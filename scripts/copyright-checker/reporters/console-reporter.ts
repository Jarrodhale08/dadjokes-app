import { CheckResults, Severity } from '../types';

// ANSI color codes (works without chalk dependency)
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function colorize(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${colors.reset}`;
}

function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return colors.bgRed + colors.white;
    case 'high': return colors.red;
    case 'medium': return colors.yellow;
    case 'low': return colors.dim;
    default: return '';
  }
}

function getSeverityLabel(severity: Severity): string {
  const color = getSeverityColor(severity);
  return colorize(`[${severity.toUpperCase()}]`, color);
}

function printHeader(title: string): void {
  const line = '═'.repeat(60);
  console.log();
  console.log(colorize(line, colors.cyan));
  console.log(colorize(`  ${title}`, colors.bold, colors.cyan));
  console.log(colorize(line, colors.cyan));
}

function printSection(emoji: string, title: string): void {
  console.log();
  console.log(colorize(`${emoji} ${title}`, colors.bold));
  console.log(colorize('─'.repeat(50), colors.dim));
}

export function reportResults(results: CheckResults): { totalIssues: number; hasCritical: boolean } {
  let totalIssues = 0;
  let hasCritical = false;

  printHeader('COPYRIGHT INFRINGEMENT CHECKER');

  // License Check Results
  if (results.licenses) {
    printSection('📦', 'LICENSE CHECK');

    const { totalPackages, allowed, forbidden, unknown, issues } = results.licenses;

    console.log(`  ${colorize('✓', colors.green)} ${totalPackages} packages checked`);
    console.log(`    ${colorize(String(allowed), colors.green)} allowed licenses`);

    if (forbidden > 0) {
      console.log(`    ${colorize(String(forbidden), colors.red)} forbidden licenses`);
    }
    if (unknown > 0) {
      console.log(`    ${colorize(String(unknown), colors.yellow)} unknown licenses`);
    }

    if (issues.length > 0) {
      console.log();
      console.log('  Issues:');
      for (const issue of issues.slice(0, 10)) { // Show first 10
        console.log(`    ${getSeverityLabel(issue.severity)} ${issue.package}@${issue.version}`);
        console.log(colorize(`         License: ${issue.license}`, colors.dim));
        console.log(colorize(`         → ${issue.recommendation}`, colors.dim));
      }
      if (issues.length > 10) {
        console.log(colorize(`    ... and ${issues.length - 10} more issues`, colors.dim));
      }

      totalIssues += issues.length;
      hasCritical = hasCritical || issues.some(i => i.severity === 'critical');
    } else {
      console.log(`  ${colorize('✓', colors.green)} All licenses are permissive`);
    }
  }

  // Text Content Results
  if (results.text) {
    printSection('📝', 'TEXT CONTENT CHECK');

    const { totalItems, passed, issues } = results.text;

    console.log(`  ${colorize('✓', colors.green)} ${totalItems} recipes checked`);
    console.log(`    ${colorize(String(passed), colors.green)} with proper attribution`);

    const missingSource = issues.filter(i => i.type === 'missing_source').length;
    const vagueSource = issues.filter(i => i.type === 'vague_source').length;

    if (missingSource > 0) {
      console.log(`    ${colorize(String(missingSource), colors.yellow)} missing source attribution`);
    }
    if (vagueSource > 0) {
      console.log(`    ${colorize(String(vagueSource), colors.dim)} with vague attribution`);
    }

    if (issues.length > 0) {
      console.log();
      console.log('  Issues:');
      for (const issue of issues.slice(0, 10)) {
        console.log(`    ${getSeverityLabel(issue.severity)} "${issue.name}" (${issue.id})`);
        console.log(colorize(`         ${issue.details}`, colors.dim));
      }
      if (issues.length > 10) {
        console.log(colorize(`    ... and ${issues.length - 10} more issues`, colors.dim));
      }

      totalIssues += issues.length;
      hasCritical = hasCritical || issues.some(i => i.severity === 'critical');
    } else {
      console.log(`  ${colorize('✓', colors.green)} All recipes have proper attribution`);
    }
  }

  // Image Check Results
  if (results.images) {
    printSection('🖼️ ', 'IMAGE CHECK');

    const { totalImages, passed, issues, metadata } = results.images;

    console.log(`  ${colorize('✓', colors.green)} ${totalImages} images checked`);

    if (issues.length > 0) {
      console.log();
      console.log('  Issues:');
      for (const issue of issues) {
        console.log(`    ${getSeverityLabel(issue.severity)} ${issue.fileName}`);
        console.log(colorize(`         ${issue.details}`, colors.dim));
      }

      totalIssues += issues.length;
      hasCritical = hasCritical || issues.some(i => i.severity === 'critical');
    } else {
      console.log(`  ${colorize('✓', colors.green)} No stock photo indicators detected`);
    }

    // Show metadata summary
    const withMetadata = Object.values(metadata).filter(m => m.hasExif).length;
    if (withMetadata > 0) {
      console.log();
      console.log(colorize(`  ℹ️  ${withMetadata}/${totalImages} images have embedded metadata`, colors.dim));
    }
  }

  // Summary
  console.log();
  console.log(colorize('═'.repeat(60), colors.cyan));

  if (totalIssues === 0) {
    console.log(colorize('  ✅ No copyright issues found!', colors.green, colors.bold));
  } else {
    const criticalCount = [
      ...(results.licenses?.issues || []),
      ...(results.text?.issues || []),
      ...(results.images?.issues || [])
    ].filter(i => i.severity === 'critical').length;

    const highCount = [
      ...(results.licenses?.issues || []),
      ...(results.text?.issues || []),
      ...(results.images?.issues || [])
    ].filter(i => i.severity === 'high').length;

    const mediumCount = [
      ...(results.licenses?.issues || []),
      ...(results.text?.issues || []),
      ...(results.images?.issues || [])
    ].filter(i => i.severity === 'medium').length;

    const lowCount = [
      ...(results.licenses?.issues || []),
      ...(results.text?.issues || []),
      ...(results.images?.issues || [])
    ].filter(i => i.severity === 'low').length;

    console.log(colorize(`  ⚠️  ${totalIssues} issues found`, colors.yellow, colors.bold));

    const parts: string[] = [];
    if (criticalCount > 0) parts.push(colorize(`${criticalCount} critical`, colors.bgRed, colors.white));
    if (highCount > 0) parts.push(colorize(`${highCount} high`, colors.red));
    if (mediumCount > 0) parts.push(colorize(`${mediumCount} medium`, colors.yellow));
    if (lowCount > 0) parts.push(colorize(`${lowCount} low`, colors.dim));

    console.log(`     ${parts.join(', ')}`);
  }

  console.log(colorize('═'.repeat(60), colors.cyan));
  console.log();

  return { totalIssues, hasCritical };
}
