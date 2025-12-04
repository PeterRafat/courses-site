const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting optimized build process...');

try {
  // 1. Optimize images
  console.log('Step 1: Optimizing images...');
  execSync('node scripts/optimize-images.js', { stdio: 'inherit' });
  
  // 2. Build with production optimizations
  console.log('Step 2: Building with production optimizations...');
  execSync('ng build --prod --optimization=true --build-optimizer=true --vendor-chunk=true --common-chunk=true --extract-css=true --named-chunks=false --source-map=false', { stdio: 'inherit' });
  
  // 3. Show build stats
  console.log('Step 3: Build completed successfully!');
  console.log('Build artifacts are located in the dist/ directory');
  
  // 4. Show file sizes
  const distDir = './dist/courses-site';
  if (fs.existsSync(distDir)) {
    console.log('\nBuild artifact sizes:');
    const files = fs.readdirSync(distDir);
    let totalSize = 0;
    
    files.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
        const stats = fs.statSync(`${distDir}/${file}`);
        const sizeInKB = (stats.size / 1024).toFixed(2);
        console.log(`  ${file}: ${sizeInKB} KB`);
        totalSize += stats.size;
      }
    });
    
    console.log(`\nTotal build size: ${(totalSize / 1024).toFixed(2)} KB`);
  }
  
} catch (error) {
  console.error('Build process failed:', error.message);
  process.exit(1);
}