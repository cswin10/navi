// Script to generate PNG icons from SVG
// Run: node scripts/generate-icons.js

const fs = require('fs');
const { execSync } = require('child_process');

console.log('📦 Generating PWA icons...');

// Read the SVG
const svg = fs.readFileSync('./public/logo.svg', 'utf8');

// Create 192x192 and 512x512 PNG files
// This requires having imagemagick or similar installed
// For now, we'll create a simple HTML that can be used to generate them

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
  <style>
    body { margin: 0; padding: 20px; font-family: sans-serif; }
    .container { max-width: 800px; margin: 0 auto; }
    canvas { border: 1px solid #ccc; margin: 10px 0; }
    button { padding: 10px 20px; margin: 5px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Navi AI Icon Generator</h1>
    <p>Right-click each canvas and "Save image as..." with the correct filename:</p>

    <h3>icon-192.png (192x192)</h3>
    <canvas id="canvas192" width="192" height="192"></canvas>
    <button onclick="download('canvas192', 'icon-192.png')">Download 192x192</button>

    <h3>icon-512.png (512x512)</h3>
    <canvas id="canvas512" width="512" height="512"></canvas>
    <button onclick="download('canvas512', 'icon-512.png')">Download 512x512</button>
  </div>

  <script>
    const svgString = \`${svg}\`;

    function drawToCanvas(canvasId, size) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');

      const img = new Image();
      const svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(svgBlob);

      img.onload = function() {
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    }

    function download(canvasId, filename) {
      const canvas = document.getElementById(canvasId);
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    drawToCanvas('canvas192', 192);
    drawToCanvas('canvas512', 512);
  </script>
</body>
</html>
`;

fs.writeFileSync('./public/generate-icons.html', html);

console.log('✅ Generated generate-icons.html');
console.log('📝 Open http://localhost:3000/generate-icons.html in your browser');
console.log('💾 Download icon-192.png and icon-512.png');
console.log('📁 Place them in the /public folder');
