import * as fs from 'fs';
import * as path from 'path';
import { TextCheckResult, TextIssue, Severity } from '../types';
import { VAGUE_SOURCE_PATTERNS } from '../config/license-lists';

interface ParsedMeal {
  id: string;
  name: string;
  source?: string;
  instructions: string[];
}

function extractMealsFromFile(filePath: string): ParsedMeal[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const meals: ParsedMeal[] = [];

  // Find the start of the meals array
  const startMatch = content.match(/export const meals:\s*Meal\[\]\s*=\s*\[/);
  if (!startMatch || startMatch.index === undefined) {
    return meals;
  }

  const startIndex = startMatch.index + startMatch[0].length;

  // Find the matching closing bracket by counting brackets
  let bracketCount = 1;
  let endIndex = startIndex;

  for (let i = startIndex; i < content.length && bracketCount > 0; i++) {
    if (content[i] === '[') bracketCount++;
    if (content[i] === ']') bracketCount--;
    if (bracketCount === 0) {
      endIndex = i;
      break;
    }
  }

  const mealsContent = content.substring(startIndex, endIndex);

  // Split by meal objects - each starts with { and id:
  // We'll use a more robust approach: find each meal block
  const mealBlocks: string[] = [];
  let braceCount = 0;
  let currentBlock = '';
  let inBlock = false;

  for (let i = 0; i < mealsContent.length; i++) {
    const char = mealsContent[i];

    if (char === '{') {
      if (braceCount === 0) {
        inBlock = true;
        currentBlock = '';
      }
      braceCount++;
    }

    if (inBlock) {
      currentBlock += char;
    }

    if (char === '}') {
      braceCount--;
      if (braceCount === 0 && inBlock) {
        mealBlocks.push(currentBlock);
        inBlock = false;
        currentBlock = '';
      }
    }
  }

  // Parse each meal block
  for (const block of mealBlocks) {
    const idMatch = block.match(/id:\s*['"]([^'"]+)['"]/);
    const nameMatch = block.match(/name:\s*['"]([^'"]+)['"]/);
    const sourceMatch = block.match(/source:\s*['"]([^'"]+)['"]/);

    if (idMatch && nameMatch) {
      meals.push({
        id: idMatch[1],
        name: nameMatch[1],
        source: sourceMatch ? sourceMatch[1] : undefined,
        instructions: []
      });
    }
  }

  return meals;
}

function isVagueSource(source: string): boolean {
  return VAGUE_SOURCE_PATTERNS.some(pattern => pattern.test(source));
}

function checkMealForIssues(meal: ParsedMeal): TextIssue | null {
  // Check for missing source
  if (!meal.source) {
    return {
      id: meal.id,
      name: meal.name,
      type: 'missing_source',
      severity: 'medium',
      details: 'Recipe has no source attribution',
      currentSource: undefined
    };
  }

  // Check for vague source
  if (isVagueSource(meal.source)) {
    return {
      id: meal.id,
      name: meal.name,
      type: 'vague_source',
      severity: 'low',
      details: `Source attribution "${meal.source}" is generic and may need more specificity`,
      currentSource: meal.source
    };
  }

  return null;
}

export async function checkTextContent(projectPath: string): Promise<TextCheckResult> {
  const issues: TextIssue[] = [];
  const dataFiles = [
    'src/data/meals.ts'
  ];

  let totalItems = 0;
  let passed = 0;

  for (const dataFile of dataFiles) {
    const filePath = path.join(projectPath, dataFile);

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Data file not found: ${filePath}`);
      continue;
    }

    try {
      const meals = extractMealsFromFile(filePath);
      totalItems += meals.length;

      for (const meal of meals) {
        const issue = checkMealForIssues(meal);
        if (issue) {
          issues.push(issue);
        } else {
          passed++;
        }
      }
    } catch (error) {
      console.error(`Error parsing ${dataFile}:`, error);
    }
  }

  // Sort issues by severity
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    totalItems,
    passed,
    issues
  };
}
