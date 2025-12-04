const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Directory containing images to optimize
const publicDir = path.join(__dirname, '..', 'public');
const outputPath = publicDir;

// Large images that need optimization
const largeImages = [
  { name: 'sign-up-form.jpg', maxWidth: 800, quality: 80 },
  { name: 'login.jpg', maxWidth: 800, quality: 80 },
  { name: 'logo.png', maxWidth: 200, quality: 90 },
  { name: 'office.png', maxWidth: 400, quality: 85 }
];

async function optimizeImage(imageInfo) {
  const inputPath = path.join(publicDir, imageInfo.name);
  const outputPath = path.join(publicDir, imageInfo.name);
  
  try {
    // Check if file exists
    await fs.access(inputPath);
    
    console.log(`Optimizing ${imageInfo.name}...`);
    
    // Get original file size
    const originalStats = await fs.stat(inputPath);
    
    // Optimize the image
    if (imageInfo.name.endsWith('.jpg') || imageInfo.name.endsWith('.jpeg')) {
      await sharp(inputPath)
        .resize({ width: imageInfo.maxWidth, withoutEnlargement: true })
        .jpeg({ quality: imageInfo.quality, progressive: true })
        .toFile(outputPath + '.tmp');
    } else if (imageInfo.name.endsWith('.png')) {
      await sharp(inputPath)
        .resize({ width: imageInfo.maxWidth, withoutEnlargement: true })
        .png({ quality: imageInfo.quality, compressionLevel: 9 })
        .toFile(outputPath + '.tmp');
    }
    
    // Replace the original file
    await fs.rename(outputPath + '.tmp', outputPath);
    
    // Get optimized file size
    const optimizedStats = await fs.stat(outputPath);
    
    console.log(`${imageInfo.name}: ${originalStats.size} -> ${optimizedStats.size} bytes (${Math.round((1 - optimizedStats.size / originalStats.size) * 100)}% reduction)`);
  } catch (error) {
    console.error(`Error optimizing ${imageInfo.name}:`, error.message);
  }
}

async function optimizeAllImages() {
  console.log('Starting image optimization...');
  
  for (const imageInfo of largeImages) {
    await optimizeImage(imageInfo);
  }
  
  console.log('Image optimization complete!');
}

// Run the optimization
optimizeAllImages().catch(console.error);