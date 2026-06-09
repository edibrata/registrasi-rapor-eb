const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// UI Replacement for Toggle -> Radio
const toggleRegex = /<div\s+id="jenis-pesanan-container"[\s\S]*?<p class="text-\[10px\] text-slate-400 mt-1\.5 italic">[\s\S]*?<\/p>\s*<\/div>/;

const newToggleUi = `          <div id="jenis-pesanan-container" class="w-full mt-4 group" style="display: none">
            <label class="block font-bold text-slate-500 mb-2 uppercase tracking-tight group-focus-within:text-teal-600 transition-colors">Kategori Pesanan Kelas</label>
            <div class="flex p-1 bg-slate-100 rounded-lg">
                <label class="flex-1 text-center cursor-pointer relative">
                    <input type="radio" name="jenis-pesanan" value="pesanan_baru" id="jenis-pesanan-baru" class="peer sr-only" checked>
                    <div class="py-2 text-[11px] font-bold text-slate-500 rounded-md transition-all peer-checked:bg-white peer-checked:text-teal-700 peer-checked:shadow-sm">Pesanan Baru</div>
                </label>
                <label class="flex-1 text-center cursor-pointer relative">
                    <input type="radio" name="jenis-pesanan" value="lanjutan" id="jenis-pesanan-lanjut" class="peer sr-only">
                    <div class="py-2 text-[11px] font-bold text-slate-500 rounded-md transition-all peer-checked:bg-white peer-checked:text-teal-700 peer-checked:shadow-sm">Lanjutan</div>
                </label>
            </div>
            <p class="text-[10px] text-slate-400 mt-1.5 italic">
              *Pilih <span class="font-bold text-teal-600">Lanjutan</span> jika penambahan kelas tidak dikenakan biaya dasar (hanya biaya kelas).
            </p>
          </div>`;

content = content.replace(toggleRegex, newToggleUi);

// Fix 1: openActionModal Checkbox Reset -> Radio Reset
const toggleResetRegex = /jpToggle\.checked = false;/g;
content = content.replace(toggleResetRegex, `document.getElementById("jenis-pesanan-baru").checked = true;`);

const toggleCheckRegex = /if \(item\["jenis-pesanan"\] === "lanjutan"\) \{\s*jpToggle\.checked = true;\s*\}/g;
content = content.replace(toggleCheckRegex, `if (item["jenis-pesanan"] === "lanjutan") { document.getElementById("jenis-pesanan-lanjut").checked = true; } else { document.getElementById("jenis-pesanan-baru").checked = true; }`);

const toggleGetRegex = /const isLanjutan = document\.getElementById\(\s*"edit-jenis-pesanan-toggle",\s*\)\.checked;/g;
content = content.replace(toggleGetRegex, `const isLanjutan = document.getElementById("jenis-pesanan-lanjut").checked;`);

const toggleHideRegex = /document\.getElementById\("edit-jenis-pesanan-toggle"\)\.checked =\s*false;/g;
content = content.replace(toggleHideRegex, `document.getElementById("jenis-pesanan-baru").checked = true;`);

// Fix 2: saveProcess timestamp array append
const saveProcessHistoryRegex = /let tempKelas = \[\.\.\.\(docObj\.kelas \|\| \[\]\)\];[\s\S]*?await updateDoc\(doc\(db, "artifacts", appId, "public", "data", collectionName, docObj\.id\), \{\s*\.\.\.textUpdates,\s*kelas: tempKelas,\s*\}\);/g;

const newSaveProcessHistory = `let tempKelas = [...(docObj.kelas || [])];
                             for (const removed of removedParams) {
                                 const idx = tempKelas.indexOf(removed);
                                 if (idx > -1) {
                                     tempKelas.splice(idx, 1);
                                 }
                             }
                             const history = docObj.history || [];
                             history.push(Date.now());
                             await updateDoc(doc(db, "artifacts", appId, "public", "data", collectionName, docObj.id), {
                                 ...textUpdates,
                                 kelas: tempKelas,
                                 history: history
                             });`;

content = content.replace(saveProcessHistoryRegex, newSaveProcessHistory);

// And we must also modify saveProcess to add history when NO classes changed, but other fields changed. Wait, the above logic runs inside `for (const docObj of window.originalDocs)`. This loop runs ALWAYS if it is an existing school, updating text attributes! So every existing doc gets a history push.

// Now, we must update the rendering logic for `allTimestamps`. 
// When building `allTimestamps`, we need to extract from `item.history`.
const extractTimestampsRegex = /uniqueSchoolsMap\.set\(key, \{ \.\.\.item, allTimestamps: \[item\] \}\);/g;
content = content.replace(extractTimestampsRegex, `
              let tsArr = [{ timestamp: item.timestamp, isDraft: item.isDraft }];
              if (item.history && Array.isArray(item.history)) {
                  item.history.forEach(ts => {
                      tsArr.push({ timestamp: ts, isDraft: false });
                  });
              }
              uniqueSchoolsMap.set(key, { ...item, allTimestamps: tsArr });`);

const extractTimestampsPushRegex = /existing\.allTimestamps\.push\(item\);/g;
content = content.replace(extractTimestampsPushRegex, `
              existing.allTimestamps.push({ timestamp: item.timestamp, isDraft: item.isDraft });
              if (item.history && Array.isArray(item.history)) {
                  item.history.forEach(ts => {
                      existing.allTimestamps.push({ timestamp: ts, isDraft: false });
                  });
              }`);

// Export update for history timestamps
const exportTimestampRegex = /return item\.allTimestamps\.sort\(\(a,b\)=>\(\(b\.timestamp\|\|0\)\)-\(\(a\.timestamp\|\|0\)\)\)\.map\(t => formatDisplayDate\(t\.timestamp\) \+ \(t\.isDraft \? ' \(DRAFT\)' : ''\)\)\.join\("\\\\n"\);/g;
content = content.replace(exportTimestampRegex, `
                      // Remove duplicate timestamps
                       const tsSet = new Set();
                       const uniqueTs = [];
                       item.allTimestamps.sort((a,b)=>((b.timestamp||0))-((a.timestamp||0))).forEach(t => {
                           if(!tsSet.has(t.timestamp)) {
                               tsSet.add(t.timestamp);
                               uniqueTs.push(t);
                           }
                       });
                       return uniqueTs.map(t => formatDisplayDate(t.timestamp) + (t.isDraft ? ' (DRAFT)' : '')).join("\\n");`);

// And the same uniqueness for tsHtml
const tsHtmlRegex = /const tsHtml = \(item\.allTimestamps \|\| \[item\]\)[\s\S]*?\.join\(""\);/g;
const newTsHtml = `const tsSet = new Set();
               const uniqueTs = [];
               (item.allTimestamps || [item]).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).forEach(t => {
                   if (!tsSet.has(t.timestamp)) {
                       tsSet.add(t.timestamp);
                       uniqueTs.push(t);
                   }
               });
               const tsHtml = uniqueTs.map(
                   (t) => \`<div class="mb-0.5 border-b border-slate-100 pb-0.5 last:border-0 last:pb-0 \${t.isDraft ? "bg-amber-50" : ""}">\${t.isDraft ? '<span class="bg-amber-100 border border-amber-200 text-amber-600 px-1 py-0.5 rounded shadow-sm font-bold tracking-tight text-[8px]">DRAFT</span>' : formatDisplayDate(t.timestamp)}</div>\`
               ).join("");`;
content = content.replace(tsHtmlRegex, newTsHtml);

fs.writeFileSync('index.html', content);
