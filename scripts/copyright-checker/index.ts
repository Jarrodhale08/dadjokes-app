#!/usr/bin/env npx ts-node

/**
 * Copyright Infringement Checker CLI
 *
 * Scans the project for potential copyright issues:
 * - NPM package licenses (GPL, proprietary, etc.)
 * - Text content without proper attribution
 * - Images with stock photo metadata
 *
 * Usage:
 *   npx ts-node scripts/copyright-checker/index.ts --all
 *   npx ts-node scripts/copyright-checker/index.ts --licenses
 *   npx ts-node scripts/copyright-checker/index.ts --text
 *   npx ts-node scripts/copyright-checker/index.ts --images
 *   npx ts-node scripts/copyright-checker/index.ts --strict  # Exit code 1 on issues
 */

import * as path from 'path';
import { CheckResults } from './types';
import { checkLicenses } from './checkers/license-checker';
import { checkTextContent } from './checkers/text-checker';
import { checkImages } from './checkers/image-checker';
import { reportResults } from './reporters/console-reporter';

interface CliOptions {
  all: boolean;
  licenses: boolean;
  text: boolean;
  images: boolean;
  strict: boolean;
  help: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  const options: CliOptions = {
    all: false,
    licenses: false,
    text: false,
    images: false,
    strict: false,
    help: false,
  };

  for (const arg of args) {
    switch (arg) {
      case '--all':
      case '-a':
        options.all = true;
        break;
      case '--licenses':
      case '-l':
        options.licenses = true;
        break;
      case '--text':
      case '-t':
        options.text = true;
        break;
      case '--images':
      case '-i':
        options.images = true;
        break;
      case '--strict':
      case '-s':
        options.strict = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  // Default to --all if no specific check is requested
  if (!options.licenses && !options.text && !options.images && !options.help) {
    options.all = true;
  }

  return options;
}

function printHelp(): void {
  console.log(`
Copyright Infringement Checker

Usage: npx ts-node scripts/copyright-checker/index.ts [options]

Options:
  --all, -a       Run all checks (default)
  --licenses, -l  Check NPM package licenses only
  --text, -t      Check text content attribution only
  --images, -i    Check image metadata only
  --strict, -s    Exit with code 1 if any issues found
  --help, -h      Show this help message

Examples:
  npm run copyright-check              # Run all checks
  npm run copyright-check -- --licenses  # License check only
  npm run copyright-check -- --strict    # Fail CI on issues
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const projectPath = path.resolve(__dirname, '../..');
  const runAll = options.all;

  console.log(`\nScanning project: ${projectPath}\n`);

  const results: CheckResults = {
    licenses: null,
    text: null,
    images: null,
  };

  try {
    // Run license check
    if (runAll || options.licenses) {
      console.log('Checking NPM licenses...');
      results.licenses = await checkLicenses(projectPath);
    }

    // Run text content check
    if (runAll || options.text) {
      console.log('Checking text content...');
      results.text = await checkTextContent(projectPath);
    }

    // Run image check
    if (runAll || options.images) {
      console.log('Checking images...');
      results.images = await checkImages(projectPath);
    }

    // Report results
    const { totalIssues, hasCritical } = reportResults(results);

    // Exit with error code if strict mode and issues found
    if (options.strict && totalIssues > 0) {
      console.log('Strict mode enabled - exiting with error code 1');
      process.exit(1);
    }

    // Exit with error code 2 for critical issues even without strict mode
    if (hasCritical) {
      process.exit(2);
    }

  } catch (error) {
    console.error('Error running copyright check:', error);
    process.exit(1);
  }
}

main();
