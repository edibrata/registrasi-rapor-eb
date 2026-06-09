const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. REVERT history mapping in the uniqueSchoolsMap grouping algorithm
const extractTimestampsRegex = /let tsArr = \[\{ timestamp: item\.timestamp, isDraft: item\.isDraft \}\];[\s\S]*?uniqueSchoolsMap\.set\(key, \{ \.\.\.item, allTimestamps: tsArr \}\);/g;
content = content.replace(extractTimestampsRegex, `existing.allTimestamps.push({ timestamp: item.timestamp, isDraft: item.isDraft });
              const ts1 = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
              const ts2 = item.timestamp ? new Date(item.timestamp).getTime() : 0;
              if (ts2 > ts1) {
                  uniqueSchoolsMap.set(key, { ...item, allTimestamps: existing.allTimestamps });
              }`);

const extractTimestampsPushRegex = /existing\.allTimestamps\.push\(\{ timestamp: item\.timestamp, isDraft: item\.isDraft \}\);[\s\S]*?\}\)/g;
// Wait, the match above might be too broad. Let's rely on standard search and replace for the exact code I injected in patch_t1.cjs.

fs.writeFileSync('index.html.tmp', content);
