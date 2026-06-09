const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Revert `saveProcess` history push and add 'jenis-pesanan' update for ALL existing docs IF NO NEW CLASSES ARE ADDED.
const saveProcessHistoryRegex = /let tempKelas = \[\.\.\.\(docObj\.kelas \|\| \[\]\)\];[\s\S]*?await updateDoc\(doc\(db, "artifacts", appId, "public", "data", collectionName, docObj\.id\), \{\s*\.\.\.textUpdates,\s*kelas: tempKelas,\s*history: history\s*\}\);/g;
const newSaveProcessHistory = `let tempKelas = [...(docObj.kelas || [])];
                             for (const removed of removedParams) {
                                 const idx = tempKelas.indexOf(removed);
                                 if (idx > -1) {
                                     tempKelas.splice(idx, 1);
                                 }
                             }
                             
                             let docUpdates = {
                                 ...textUpdates,
                                 kelas: tempKelas
                             };
                             
                             // If no new classes are added, apply the selected 'jenis-pesanan' to existing docs so user can fix accidental miscategorization without adding classes.
                             if (newlyAddedClasses.length === 0) {
                                 docUpdates["jenis-pesanan"] = chosenJenis;
                             }
                             
                             await updateDoc(doc(db, "artifacts", appId, "public", "data", collectionName, docObj.id), docUpdates);`;
content = content.replace(saveProcessHistoryRegex, newSaveProcessHistory);

// 2. Revert `allTimestamps` in `loadData` for uniqueSchoolsMap init
const extractTimestampsRegex = /let tsArr = \[\{ timestamp: item\.timestamp, isDraft: item\.isDraft \}\];[\s\S]*?uniqueSchoolsMap\.set\(key, \{ \.\.\.item, allTimestamps: tsArr \}\);/g;
const newExtractTs = `uniqueSchoolsMap.set(key, { ...item, allTimestamps: [item] });`;
content = content.replace(extractTimestampsRegex, newExtractTs);

// 3. Revert `allTimestamps` push
const extractTimestampsPushRegex = /existing\.allTimestamps\.push\(\{ timestamp: item\.timestamp, isDraft: item\.isDraft \}\);[\s\S]*?\}\)/g;
const newPush = `existing.allTimestamps.push(item);`;
content = content.replace(extractTimestampsPushRegex, newPush);

// 4. Revert `tsHtml` rendering (restore it to iterate elements smoothly without the Set since they are guaranteed real docs)
const tsHtmlRegex = /const tsSet = new Set\(\);[\s\S]*?const tsHtml = uniqueTs\.map\([\s\S]*?\.join\(""\);/g;
const newTsHtml = `const tsHtml = (item.allTimestamps || [item])
                  .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                  .map(
                    (t) =>
                      \`<div class="mb-0.5 border-b border-slate-100 pb-0.5 last:border-0 last:pb-0 \${t.isDraft ? "bg-amber-50" : ""}"><span class="block px-1 py-0.5">\${t.isDraft ? '<span class="bg-amber-100 border border-amber-200 text-amber-600 px-1 py-0.5 rounded shadow-sm font-bold tracking-tight text-[8px]">DRAFT</span>' : formatDisplayDate(t.timestamp)}</span></div>\`,
                  )
                  .join("");`;
content = content.replace(tsHtmlRegex, newTsHtml);

// 5. Revert export timestamp deduplication
const exportTsRegex = /\/\/ Remove duplicate timestamps[\s\S]*?return uniqueTs\.map\(t => formatDisplayDate\(t\.timestamp\) \+ \(t\.isDraft \? ' \(DRAFT\)' : ''\)\)\.join\("\\\\n"\);/g;
const newExportTs = `return item.allTimestamps.sort((a,b)=>((b.timestamp||0))-((a.timestamp||0))).map(t => formatDisplayDate(t.timestamp) + (t.isDraft ? ' (DRAFT)' : '')).join("\\n");`;
content = content.replace(exportTsRegex, newExportTs);

// 6. Fix `jenis-pesanan-container` toggling bug: The radio buttons shouldn't be hidden by default if the user wants to correct them!
// Let's make jpContainer always visible during edit, OR show it if classes > 0.
// Actually, it's better to just leave it visible.
const hideJpRegex = /jpContainer\.style\.display = "none";/g;
const showJp = `// no hiding randomly
          jpContainer.style.display = "block";`;
content = content.replace(hideJpRegex, showJp);

const hideJp2Regex = /document\.getElementById\("jenis-pesanan-container"\)\.style\.display =\s*"none";/g;
const showJp2 = `document.getElementById("jenis-pesanan-container").style.display = "block";`;
content = content.replace(hideJp2Regex, showJp2);

fs.writeFileSync('index.html', content);
