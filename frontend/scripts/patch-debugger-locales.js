/**
 * Patch for @react-native/debugger-frontend@0.81.5:
 * The npm package ships only en-US.json and zh.json, but lighthouse-dt-bundle.js
 * references 42 locales. Missing files cause ENOENT errors in the Metro dev server
 * when Chrome DevTools' Lighthouse panel makes requests. Stub files prevent this.
 */
const fs = require('fs');
const path = require('path');

const localesDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'debugger-frontend',
  'dist',
  'third-party',
  'front_end',
  'core',
  'i18n',
  'locales'
);

const EXPECTED_LOCALES = [
  'cs','da','de','el','en-GB','en-XA','en-XL','es-419','es','fi','fil','fr',
  'he','hi','hr','hu','id','it','ja','ko','lt','lv','nl','no','pl','pt-PT',
  'pt','ro','ru','sk','sl','sr-Latn','sr','sv','ta','te','th','tr','uk','vi',
  'zh-HK','zh-TW',
];

if (!fs.existsSync(localesDir)) {
  // Package not installed yet — nothing to patch
  process.exit(0);
}

let created = 0;
for (const locale of EXPECTED_LOCALES) {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}');
    created++;
  }
}

if (created > 0) {
  console.log(`patched @react-native/debugger-frontend: created ${created} stub locale files`);
}
