const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Insert closing of data-sekolah-fields and opening of pesanan-fields
const splitPoint = '<div\\s*id="jenis-pesanan-container"';
content = content.replace(new RegExp(splitPoint), '</div>\\n<div id="pesanan-fields" class="space-y-4 sm:space-y-6">\\n<div id="jenis-pesanan-container"');

fs.writeFileSync('index.html', content);
