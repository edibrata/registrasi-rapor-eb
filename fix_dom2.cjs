const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace('<div class="space-y-4 mb-8 text-[11.5px]">', '<div class="space-y-4 mb-8 text-[11.5px]"><div id="data-sekolah-fields" class="space-y-4 sm:space-y-6">');

content = content.replace('</div>\\n<div id="pesanan-fields" class="space-y-4 sm:space-y-6">\\n<div id="jenis-pesanan-container"', '</div><div id="pesanan-fields" class="space-y-4 sm:space-y-6"><div id="jenis-pesanan-container"');

// also close pesanan-fields at the end of edit-kelas-container
const replaceTarget = `              </button>
            </div>
          </div>
</div>
        </div>`;
const replaceWith = `              </button>
            </div>
          </div>
</div>
        </div>`; // wait, what was it previously before I changed it?

fs.writeFileSync('index.html', content);
