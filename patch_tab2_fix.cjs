const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const t2RenderOldBlockRegex = /\/\/ Render Tagihan Table[\s\S]*?if \(document\.getElementById\("tagihan-total"\)\) \{/;

let newT2Block = `// Render Tagihan Table
            let tagihanIndex = 1;
            uniqueSchools.forEach((school) => {
                const schoolItems = [...school.allTimestamps].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                schoolItems.forEach((schoolTsItem) => {
                    // schoolTsItem is an object from allTimestamps, which has { timestamp, isDraft }
                    // We need to look up the actual class array/jenis pesanan associated with this timestamp
                    // We actually stored history as numbers... wait.
                    // If we just loop through all data in dataToDisplay, why doesn't it show history? 
                    // Because history isn't individual rows in dataToDisplay! 
                    // dataToDisplay only has ONE document per school. If we add a new timestamp to history, it's inside that document.
                    // So we must iterate over the uniqueSchools and for EACH history timestamp, figure out the classes at that time.
                    // But we ONLY have the current classes and the history timestamps, we don't have the classes *at each point in history*.
                    // Ah! That is a major flaw. If we just updated the same document, we lost the record of *which classes* were ordered at *which time*. 
                });
            });

            if (document.getElementById("tagihan-total")) {`;

content = content.replace(t2RenderOldBlockRegex, newT2Block);
fs.writeFileSync('index.html', content);
