#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment checks for Sir Pickle Index...\n');

const checks = [
  {
    name: 'Root package.json exists',
    check: () => fs.existsSync('package.json'),
    fix: 'Create package.json in root directory'
  },
  {
    name: 'Client package.json exists',
    check: () => fs.existsSync('client/package.json'),
    fix: 'Ensure client directory has package.json'
  },
  {
    name: 'Server package.json exists',
    check: () => fs.existsSync('server/package.json'),
    fix: 'Ensure server directory has package.json'
  },
  {
    name: 'Vercel configuration exists',
    check: () => fs.existsSync('vercel.json'),
    fix: 'Create vercel.json in root directory'
  },
  {
    name: 'API serverless function exists',
    check: () => fs.existsSync('api/index.ts'),
    fix: 'Create api/index.ts serverless function'
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync('env.example'),
    fix: 'Create env.example with required environment variables'
  },
  {
    name: 'Client build directory exists',
    check: () => fs.existsSync('client/dist'),
    fix: 'Run npm run build:client'
  },
  {
    name: 'Server build directory exists',
    check: () => fs.existsSync('server/dist'),
    fix: 'Run npm run build:server'
  },
  {
    name: 'Client index.html exists',
    check: () => fs.existsSync('client/dist/index.html'),
    fix: 'Ensure client build produces index.html'
  },
  {
    name: 'Server app.js exists',
    check: () => fs.existsSync('server/dist/app.js'),
    fix: 'Ensure server TypeScript compilation produces app.js'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  const message = passed ? 'PASS' : 'FAIL';
  
  console.log(`${status} ${check.name}: ${message}`);
  
  if (!passed) {
    console.log(`   Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Your project is ready for Vercel deployment.');
  console.log('\nNext steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect your repository to Vercel');
  console.log('3. Set environment variables in Vercel dashboard');
  console.log('4. Deploy!');
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}

console.log('\n📖 For detailed deployment instructions, see DEPLOYMENT.md'); 