const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// There's an extra </div> we added in patch_js_events.cjs around line 1139
const extra = /<\/div>\s*<\/div>\n<\/div>\s*<div\s*class="flex flex-col-reverse/g;
content = content.replace(extra, '</div> </div> <div class="flex flex-col-reverse');

fs.writeFileSync('index.html', content);
