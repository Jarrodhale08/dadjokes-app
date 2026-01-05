// Licenses that are problematic for commercial closed-source apps
export const FORBIDDEN_LICENSES = [
  'GPL-1.0',
  'GPL-2.0',
  'GPL-2.0-only',
  'GPL-2.0-or-later',
  'GPL-3.0',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'AGPL-1.0',
  'AGPL-3.0',
  'AGPL-3.0-only',
  'AGPL-3.0-or-later',
  'LGPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'SSPL-1.0',
  'BUSL-1.1',
  'CC-BY-NC-1.0',
  'CC-BY-NC-2.0',
  'CC-BY-NC-3.0',
  'CC-BY-NC-4.0',
  'CC-BY-NC-SA-1.0',
  'CC-BY-NC-SA-2.0',
  'CC-BY-NC-SA-3.0',
  'CC-BY-NC-SA-4.0',
  'proprietary',
  'UNLICENSED',
];

// Licenses that are safe for commercial use
export const ALLOWED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'Unlicense',
  'WTFPL',
  'Zlib',
  'BlueOak-1.0.0',
  'Python-2.0',
  'PSF-2.0',
  'MPL-2.0', // Weak copyleft, usually OK
];

// Vague source attributions that should be flagged
export const VAGUE_SOURCE_PATTERNS = [
  /^traditional/i,
  /^classic/i,
  /^modern/i,
  /^homemade/i,
  /^family recipe/i,
  /^inspired by/i,
  /^based on/i,
  /^adapted from$/i, // "adapted from" alone without source
];

// Stock photo metadata patterns
export const STOCK_PHOTO_PATTERNS = [
  /adobe\s*stock/i,
  /shutterstock/i,
  /getty\s*images/i,
  /istock/i,
  /depositphotos/i,
  /dreamstime/i,
  /123rf/i,
  /stock\s*photo/i,
  /bigstock/i,
  /alamy/i,
  /pond5/i,
];
