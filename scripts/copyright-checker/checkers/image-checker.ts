import * as fs from 'fs';
import * as path from 'path';
import { ImageCheckResult, ImageIssue, ImageMetadata, Severity } from '../types';
import { STOCK_PHOTO_PATTERNS } from '../config/license-lists';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

interface ExifData {
  Make?: string;
  Model?: string;
  Software?: string;
  Copyright?: string;
  Artist?: string;
  ImageDescription?: string;
  [key: string]: unknown;
}

function findImageFiles(directory: string): string[] {
  const images: string[] = [];

  if (!fs.existsSync(directory)) {
    return images;
  }

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  }

  walkDir(directory);
  return images;
}

function checkForStockPatterns(text: string): boolean {
  return STOCK_PHOTO_PATTERNS.some(pattern => pattern.test(text));
}

// Simple PNG/JPEG metadata extraction without external dependencies
function extractBasicMetadata(filePath: string): ImageMetadata {
  const metadata: ImageMetadata = { hasExif: false };

  try {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('latin1');

    // Check for common metadata strings
    const metadataStrings = [
      'Adobe', 'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'Canva',
      'GIMP', 'Inkscape', 'Affinity', 'CorelDRAW', 'Paint.NET',
      'XMP', 'IPTC', 'Exif'
    ];

    for (const str of metadataStrings) {
      if (content.includes(str)) {
        metadata.hasExif = true;
        metadata.software = str;
        break;
      }
    }

    // Check for stock photo indicators in raw content
    for (const pattern of STOCK_PHOTO_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        metadata.hasExif = true;
        metadata.copyright = match[0];
        break;
      }
    }

    // Look for common PNG text chunks (iTXt, tEXt, zTXt)
    if (filePath.toLowerCase().endsWith('.png')) {
      // Check for PNG software signature
      if (content.includes('Software')) {
        const softwareMatch = content.match(/Software[\x00-\x1f]*([^\x00]+)/);
        if (softwareMatch) {
          metadata.software = softwareMatch[1].replace(/[\x00-\x1f]/g, '').trim();
        }
      }
    }

    // For JPEG, look for APP1 (Exif) or APP13 (IPTC) markers
    if (filePath.toLowerCase().match(/\.jpe?g$/)) {
      if (buffer.includes(Buffer.from([0xFF, 0xE1]))) { // APP1 marker
        metadata.hasExif = true;
      }
    }

  } catch (error) {
    // Silently fail metadata extraction
  }

  return metadata;
}

function analyzeImage(filePath: string): { issue: ImageIssue | null; metadata: ImageMetadata } {
  const fileName = path.basename(filePath);
  const metadata = extractBasicMetadata(filePath);

  // Check if metadata contains stock photo indicators
  if (metadata.copyright && checkForStockPatterns(metadata.copyright)) {
    return {
      issue: {
        filePath,
        fileName,
        type: 'stock_metadata',
        severity: 'high',
        details: `Image contains stock photo metadata: "${metadata.copyright}"`
      },
      metadata
    };
  }

  // Check software for suspicious patterns
  if (metadata.software && checkForStockPatterns(metadata.software)) {
    return {
      issue: {
        filePath,
        fileName,
        type: 'suspicious_metadata',
        severity: 'medium',
        details: `Image may be from stock source - software: "${metadata.software}"`
      },
      metadata
    };
  }

  // Note: Not having metadata is actually common for app icons and custom graphics
  // Only flag this as informational, not as an issue

  return { issue: null, metadata };
}

export async function checkImages(projectPath: string): Promise<ImageCheckResult> {
  const issues: ImageIssue[] = [];
  const metadataMap: Record<string, ImageMetadata> = {};

  const directories = [
    'assets',
    'assets/images',
    'assets/fonts'
  ];

  const allImages: string[] = [];

  for (const dir of directories) {
    const fullPath = path.join(projectPath, dir);
    const images = findImageFiles(fullPath);
    allImages.push(...images);
  }

  // Deduplicate
  const uniqueImages = [...new Set(allImages)];

  let passed = 0;

  for (const imagePath of uniqueImages) {
    const { issue, metadata } = analyzeImage(imagePath);
    const relativePath = path.relative(projectPath, imagePath);
    metadataMap[relativePath] = metadata;

    if (issue) {
      issue.filePath = relativePath; // Use relative path in output
      issues.push(issue);
    } else {
      passed++;
    }
  }

  // Sort issues by severity
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    totalImages: uniqueImages.length,
    passed,
    issues,
    metadata: metadataMap
  };
}
