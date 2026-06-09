const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add select for Jenis Pesanan in modal
const jenisPesananHtml = `
        <div class="w-full mt-4 group">
            <label class="block font-bold text-slate-500 mb-1.5 uppercase tracking-tight group-focus-within:text-teal-600 transition-colors">Jenis Pesanan</label>
            <select id="edit-jenis-pesanan" class="py-2.5 px-3 w-full bg-slate-50 border border-slate-200 focus:border-teal-400 rounded-lg outline-none font-bold text-slate-600">
                <option value="pesanan_baru">Pesanan Baru (Biaya Dasar + Kelas)</option>
                <option value="lanjutan">Lanjutan (Hanya Harga Kelas)</option>
            </select>
        </div>`;

content = content.replace(/<div class="w-full mt-4">\s*<label class="block font-bold text-slate-500 mb-2 uppercase tracking-tight">Kelas Tersedia<\/label>/, jenisPesananHtml + '\n        <div class="w-full mt-4">\n          <label class="block font-bold text-slate-500 mb-2 uppercase tracking-tight">Kelas Tersedia</label>');

content = content.replace(/const fieldIds = \["nama-sekolah", "npsn", "alamat", "desa-kelurahan-jenis", "desa-kelurahan-nama", "kecamatan", "kabupaten-kota-jenis", "kabupaten-kota-nama", "provinsi"\];/, "const fieldIds = [\"nama-sekolah\", \"npsn\", \"alamat\", \"desa-kelurahan-jenis\", \"desa-kelurahan-nama\", \"kecamatan\", \"kabupaten-kota-jenis\", \"kabupaten-kota-nama\", \"provinsi\", \"jenis-pesanan\"];");

fs.writeFileSync('index.html', content);
