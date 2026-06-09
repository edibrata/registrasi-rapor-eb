const fs = require('fs');
['index.html', 'src/App.tsx'].forEach(file => {
  if(fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/indigo/g, 'blue').replace(/emerald/g, 'teal');
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
});
