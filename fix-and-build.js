#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting build fix process...');

function patchSchemaUtils() {
  const schemaUtilsPath = path.join(__dirname, 'node_modules/schema-utils/dist/ValidationError.js');
  
  if (fs.existsSync(schemaUtilsPath)) {
    try {
      let content = fs.readFileSync(schemaUtilsPath, 'utf8');
      
      // Fix the typo: memorize -> memoize
      const originalContent = content;
      content = content.replace(/require\(['"]\.\/util\/memorize['"]\)/g, "require('./util/memoize')");
      
      if (content !== originalContent) {
        fs.writeFileSync(schemaUtilsPath, content);
        console.log('✅ Fixed schema-utils memorize -> memoize typo');
        return true;
      } else {
        console.log('ℹ️  Schema-utils already patched or no typo found');
        return true;
      }
    } catch (error) {
      console.error('❌ Error patching schema-utils:', error.message);
      return false;
    }
  } else {
    console.log('⚠️  Schema-utils ValidationError.js not found');
    return false;
  }
}

function createMemoizeFile() {
  const utilDir = path.join(__dirname, 'node_modules/schema-utils/dist/util');
  const memoizePath = path.join(utilDir, 'memoize.js');
  const memorizePath = path.join(utilDir, 'memorize.js');
  
  // Create util directory if it doesn't exist
  if (!fs.existsSync(utilDir)) {
    fs.mkdirSync(utilDir, { recursive: true });
    console.log('📁 Created util directory');
  }
  
  // If memorize.js exists but memoize.js doesn't, copy it
  if (fs.existsSync(memorizePath) && !fs.existsSync(memoizePath)) {
    try {
      fs.copyFileSync(memorizePath, memoizePath);
      console.log('✅ Created memoize.js from memorize.js');
      return true;
    } catch (error) {
      console.error('❌ Error copying memorize to memoize:', error.message);
    }
  }
  
  // If neither exists, create a simple memoize function
  if (!fs.existsSync(memoizePath)) {
    const memoizeContent = `
// Simple memoize function
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

module.exports = memoize;
`;
    
    try {
      fs.writeFileSync(memoizePath, memoizeContent.trim());
      console.log('✅ Created memoize.js function');
      return true;
    } catch (error) {
      console.error('❌ Error creating memoize.js:', error.message);
      return false;
    }
  }
  
  return true;
}

function fixSchemaUtilsVersion() {
  try {
    console.log('🔄 Installing compatible schema-utils version...');
    execSync('npm install schema-utils@4.0.1 --save-dev', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Installed schema-utils@4.0.1');
    return true;
  } catch (error) {
    console.error('❌ Error installing schema-utils:', error.message);
    return false;
  }
}

function runBuild() {
  try {
    console.log('🚀 Running build...');
    execSync('npx react-scripts build', { 
      stdio: 'inherit',
      cwd: __dirname,
      env: { 
        ...process.env, 
        GENERATE_SOURCEMAP: 'false',
        CI: 'false'
      }
    });
    console.log('🎉 Build completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  let success = false;
  
  // Method 1: Try fixing the existing schema-utils
  console.log('\n📝 Method 1: Patching existing schema-utils...');
  if (patchSchemaUtils() && createMemoizeFile()) {
    success = runBuild();
  }
  
  // Method 2: If that fails, try installing compatible version
  if (!success) {
    console.log('\n📝 Method 2: Installing compatible schema-utils version...');
    if (fixSchemaUtilsVersion()) {
      success = runBuild();
    }
  }
  
  // Method 3: Nuclear option - reinstall everything
  if (!success) {
    console.log('\n📝 Method 3: Clean reinstall...');
    try {
      console.log('🧹 Cleaning node_modules...');
      execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
      
      console.log('📦 Reinstalling with legacy peer deps...');
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
      
      // Try patching again
      patchSchemaUtils();
      createMemoizeFile();
      
      success = runBuild();
    } catch (error) {
      console.error('❌ Clean reinstall failed:', error.message);
    }
  }
  
  if (success) {
    console.log('\n🎉 SUCCESS! Build completed.');
    process.exit(0);
  } else {
    console.log('\n💥 All methods failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);