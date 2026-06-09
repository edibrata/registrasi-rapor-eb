const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Change openActionModal in Tab 1 click handler
const tab1ClickRegex = /row\.querySelector\("td:nth-child\(4\)"\)\.onclick = \(\) =>\s*openActionModal\(item\.id\);/g;
content = content.replace(tab1ClickRegex, `row.querySelector("td:nth-child(4)").onclick = () => { window.currentEditId = item.id; document.getElementById("edit-type-modal").classList.add("active"); };`);

// 2. Adjust openActionModal to take mode
const openActionModalDefRegex = /window\.openActionModal = \(id = null\) =>\s*\{/g;
content = content.replace(openActionModalDefRegex, `
        window.openActionModalObj = (id, editModeType) => {
            document.getElementById("edit-type-modal").classList.remove("active");
            openActionModal(id, editModeType);
        };
        window.openHistoryModal = (npsn, tsHtmlItems) => {
            document.getElementById('history-npsn').textContent = npsn;
            document.getElementById('history-list').innerHTML = decodeURIComponent(tsHtmlItems);
            document.getElementById('history-modal').classList.add('active');
        };
        window.openActionModal = (id = null, editModeType = "baru") => {
            window.currentEditMode = editModeType;
`);

// 3. Conditional hiding in openActionModal
const updateKelasUICallRegex = /updateKelasUI\(\);\s*modal\.classList\.add\("active"\);/g;
const condHide = `
          // Hide elements based on mode
          const dataFields = document.getElementById("data-sekolah-fields");
          const pesananFields = document.getElementById("pesanan-fields");
          
          if (editModeType === "data") {
              if(dataFields) dataFields.style.display = "block";
              if(pesananFields) pesananFields.style.display = "none";
              title.textContent = "Edit Data Profil Sekolah";
          } else if (editModeType === "pesanan") {
              if(dataFields) dataFields.style.display = "none";
              if(pesananFields) pesananFields.style.display = "block";
              title.textContent = "Edit Pesanan Kelas";
          } else {
              if(dataFields) dataFields.style.display = "block";
              if(pesananFields) pesananFields.style.display = "block";
          }
          
          updateKelasUI();
          modal.classList.add("active");
`;
content = content.replace(updateKelasUICallRegex, condHide);

// 4. Wrap form fields in div ids
const dataSekolahWrapStart = `<form id="edit-form" class="space-y-4 sm:space-y-6">`;
const dataSekolahWrapStartReplace = `<form id="edit-form" class="space-y-4 sm:space-y-6">
          <div id="data-sekolah-fields" class="space-y-4 sm:space-y-6">`;
content = content.replace(dataSekolahWrapStart, dataSekolahWrapStartReplace);

// End of data-sekolah-fields is before 'edit-kelas-container' label
const dataSekolahWrapEndRegex = /<label[\s\S]*?>Kategori Pesanan Kelas<\/label>/;
const dataSekolahWrapEndReplace = `</div>
          <div id="pesanan-fields" class="space-y-4 sm:space-y-6">
          <label class="block font-bold text-slate-500 mb-2 uppercase tracking-tight group-focus-within:text-teal-600 transition-colors">Kategori Pesanan Kelas</label>`;
content = content.replace(dataSekolahWrapEndRegex, dataSekolahWrapEndReplace);

// End of pesanan fields is after 'edit-kelas-container' div ends
const pesananWrapEndRegex = /(id="edit-kelas-container"[\s\S]*?<\/div>\s*<\/div>)/;
content = content.replace(pesananWrapEndRegex, `$1\n</div>`);


// 5. Update tsHtml generation to show latest with click
const tsHtmlRegex = /const tsHtml = \(item\.allTimestamps \|\| \[item\]\)[\s\S]*?\.join\(""\);/g;
const newTsHtml = `
              const sortedTs = (item.allTimestamps || [item]).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
              const latestTs = sortedTs[0];
              const historyHtml = sortedTs.map(t => \`<div class="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3"><div class="w-2 h-2 rounded-full \${t.isDraft ? 'bg-amber-400' : 'bg-teal-400'}"></div><span class="font-mono text-xs font-bold text-slate-700">\${t.isDraft ? 'DRAFT ' : ''}\${formatDisplayDate(t.timestamp)}</span></div>\`).join("");
              const encodedHistory = encodeURIComponent(historyHtml);
              
              let tsHtml;
              if (sortedTs.length > 1) {
                  tsHtml = \`<div class="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer rounded-md shadow-sm group" onclick="openHistoryModal('\${item.npsn || 'Draft'}', '\${encodedHistory}')" title="Lihat History">
                    <span class="font-bold">\${latestTs.isDraft ? '<span class="bg-amber-100 text-amber-600 px-1 py-0.5 rounded shadow-sm text-[8px]">DRAFT</span>' : formatDisplayDate(latestTs.timestamp)}</span>
                    <svg class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>\`;
              } else {
                 tsHtml = \`<div class="inline-block"><span class="block px-1 py-0.5">\${latestTs.isDraft ? '<span class="bg-amber-100 border border-amber-200 text-amber-600 px-1 py-0.5 rounded shadow-sm font-bold tracking-tight text-[8px]">DRAFT</span>' : formatDisplayDate(latestTs.timestamp)}</span></div>\`;
              }
`;
content = content.replace(tsHtmlRegex, newTsHtml);

fs.writeFileSync('index.html', content);
