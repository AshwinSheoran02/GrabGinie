const puppeteer = require('puppeteer');
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  // Navigate to the HTML file
  const filePath = "file:///" + path.resolve(__dirname, '../slides/index.html').replace(/\\/g, '/');
  console.log('Loading slides from', filePath);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Add a tiny bit of CSS to reset margins and ensure screenshots take up the perfect 1920x1080 chunk.
  await page.evaluate(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.gap = '0';
    const slides = document.querySelectorAll('.slide');
    slides.forEach(s => {
      s.style.boxShadow = 'none';
      s.style.borderRadius = '0';
    });
  });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  // Get dynamic slides count
  const slidesCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`Found ${slidesCount} slides to capture.`);

  for (let i = 0; i < slidesCount; i++) {
    console.log(`Capturing slide ${i + 1}...`);
    
    // Select the specific slide div
    const elem = await page.$(`.slide:nth-of-type(${i + 1})`);
    
    // Take a screenshot of that specific div
    const imgPath = path.join(__dirname, `slide_${i + 1}.png`);
    await elem.screenshot({ path: imgPath });

    // Add to PowerPoint
    console.log(`Adding slide ${i + 1} to PowerPoint...`);
    const slide = pptx.addSlide();
    slide.addImage({ path: imgPath, x: 0, y: 0, w: '100%', h: '100%' });
  }

  await browser.close();

  console.log('Saving GrabGenie_Presentation_v2.pptx...');
  const outPath = path.join(__dirname, '../slides/GrabGenie_Presentation_v2.pptx');
  await pptx.writeFile({ fileName: outPath });
  
  // Cleanup tmp images
  for (let i = 0; i < slidesCount; i++) {
    fs.unlinkSync(path.join(__dirname, `slide_${i + 1}.png`));
  }

  console.log(`Done! Presentation saved to ${outPath}`);
})();
