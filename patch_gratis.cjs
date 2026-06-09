const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update openActionModal Obj clear
html = html.replace('fieldIds.forEach((fid) => {', `document.getElementById('edit-sekolah-gratis').checked = false;
          fieldIds.forEach((fid) => {`);

// 2. Update openActionModal Obj set
html = html.replace('fieldIds.forEach((fid) => {\n              const el = document.getElementById(`edit-${fid}`);\n              if (el) el.value = item[fid] || "";\n            });', `fieldIds.forEach((fid) => {
              const el = document.getElementById(\`edit-\${fid}\`);
              if (el) el.value = item[fid] || "";
            });
            document.getElementById('edit-sekolah-gratis').checked = !!item['sekolah-gratis'];`);

// 3. Update save-draft-btn
html = html.replace('isDraft: true,\n            kelas: window.currentSelectedKelas || [],\n          };', `isDraft: true,
            kelas: window.currentSelectedKelas || [],
            'sekolah-gratis': document.getElementById('edit-sekolah-gratis').checked
          };`);

// 4. Update saveProcess textUpdates
html = html.replace('textUpdates[fid] = val;\n          });', `textUpdates[fid] = val;
          });
          textUpdates['sekolah-gratis'] = document.getElementById('edit-sekolah-gratis').checked;`);

// 5. Update duplicate-btn
html = html.replace('kelas: window.currentSelectedKelas || [],\n          };', `kelas: window.currentSelectedKelas || [],
            'sekolah-gratis': document.getElementById('edit-sekolah-gratis').checked
          };`);

// 6. Update `costForThisDoc` calculation in total tagihan
html = html.replace('if (kCount > 0) costForThisDoc = 50000 + kCount * 50000;', `if (kCount > 0) costForThisDoc = 50000 + kCount * 50000;`);
// Actually we can do it after the if logic.
// Find `if (isWithinRange) {`
html = html.replace('if (isWithinRange) {\n                    totalSchoolBiaya += costForThisDoc;', `if (doc['sekolah-gratis']) costForThisDoc = 0;
                  if (isWithinRange) {
                    totalSchoolBiaya += costForThisDoc;`);

// 7. Update Excel calculation: search `if (jp === "lanjutan") return kCount * 50000;`
html = html.replace('if (jp === "lanjutan") return kCount * 50000;\n                    return 50000 + kCount * 50000;', `if (item['sekolah-gratis']) return 0;
                    if (jp === "lanjutan") return kCount * 50000;
                    return 50000 + kCount * 50000;`);


fs.writeFileSync('index.html', html);
console.log("Patched index.html");
