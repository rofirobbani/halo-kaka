// --- File: frontend/js/tabs/tab_kompilasi.js ---
// Logika khusus untuk Tab Kompilasi (Admin Only)
// Menggunakan gaya kodingan yang konsisten dengan tab_pengguna.js

// Variabel Global untuk Tab Ini
let allApps = [];
let currentFilteredApps = [];
let kompPage = 1;
const kompPerPage = 10;

// Konstanta Logo Default (Sama dengan tab_penambahan)
const DEFAULT_BPS_LOGO_KOMPILASI = `<svg class="w-full h-full text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;

// --- FUNGSI GLOBAL WINDOW (Utilitas Logo) ---

window.toggleKompilasiLogoInput = function(value) {
    const uploadContainer = document.getElementById('edit-kompilasi-logo-upload-container');
    if (!uploadContainer) return;

    if (value === 'upload') {
        uploadContainer.classList.remove('hidden');
    } else {
        uploadContainer.classList.add('hidden');
        document.getElementById('edit-kompilasi-logo-file').value = '';
        document.getElementById('edit-kompilasi-logo-preview').innerHTML = DEFAULT_BPS_LOGO_KOMPILASI;
    }
}

// Helper Konversi (Reuse atau definisikan lokal jika tidak global)
const convertKompilasiToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};


// 1. Fungsi Utama Inisialisasi (Wajib Global agar bisa dipanggil dashboard.html)
async function initTabKompilasi() {
    console.log("Fungsi initTabKompilasi dimulai...");

    // Ambil Token & Role TERBARU
    const currentRole = localStorage.getItem('haloKakaUserRole');

    // Security Check: Frontend Guard
    const container = document.getElementById('kompilasi-table-container');
    if (!container) return; 

    if (currentRole !== 'Admin') {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-red-500 bg-red-50 rounded-lg border border-red-200">
                <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <p class="font-semibold">Akses Ditolak. Halaman ini khusus Administrator.</p>
            </div>`;
        return;
    }

    // Reset Filter & Halaman
    const searchInput = document.getElementById('kompilasi-search');
    const statusInput = document.getElementById('kompilasi-filter-status');
    if (searchInput) searchInput.value = '';
    if (statusInput) statusInput.value = '';
    kompPage = 1;

    attachKompilasiListeners(); // Pasang event listener
    await loadKompilasiData();  // Muat data
}

// 2. Load Data dari API
async function loadKompilasiData() {
    const loading = document.getElementById('kompilasi-loading');
    const container = document.getElementById('kompilasi-table-container');
    const noData = document.getElementById('kompilasi-no-data');
    const errorEl = document.getElementById('kompilasi-error');
    
    if(!loading || !container) return;

    loading.style.display = 'block';
    container.style.display = 'none';
    if(noData) noData.style.display = 'none';
    if(errorEl) errorEl.style.display = 'none';

    try {
        const token = localStorage.getItem('haloKakaToken');
        
        const res = await fetch('http://localhost:5000/api/kompilasi', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Gagal mengambil data aplikasi');
        
        allApps = await res.json();
        handleKompilasiFilter(); 
    } catch (err) {
        console.error(err);
        if(errorEl) {
            errorEl.innerText = `Terjadi kesalahan: ${err.message}`;
            errorEl.style.display = 'block';
        }
    } finally {
        loading.style.display = 'none';
    }
}

// 3. Filter Logic
function handleKompilasiFilter() {
    const searchInput = document.getElementById('kompilasi-search');
    const statusInput = document.getElementById('kompilasi-filter-status');

    if (!searchInput || !statusInput) return;

    const query = searchInput.value.toLowerCase();
    const statusView = statusInput.value; // 'active' | 'inactive' | ''

    currentFilteredApps = allApps.filter(a => {
        const matchQuery = (a.nama && a.nama.toLowerCase().includes(query)) ||
                           (a.developer && a.developer.toLowerCase().includes(query)) ||
                           (a.kategori && a.kategori.toLowerCase().includes(query));
        
        let matchStatus = true;
        if (statusView === 'active') matchStatus = (a.flag_view === 1);
        if (statusView === 'inactive') matchStatus = (a.flag_view === 0);
        
        return matchQuery && matchStatus;
    });

    kompPage = 1; // Reset ke halaman 1
    renderKompilasiTable();
}

// 4. Render Tabel
function renderKompilasiTable() {
    const tbody = document.getElementById('kompilasi-table-body');
    const container = document.getElementById('kompilasi-table-container');
    const noData = document.getElementById('kompilasi-no-data');
    const pageInfo = document.getElementById('kompilasi-page-info');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (currentFilteredApps.length === 0) {
        container.style.display = 'none';
        if(noData) noData.style.display = 'block';
        if(pageInfo) pageInfo.innerText = "0 data ditemukan";
        setupKompilasiPagination(0);
        return;
    }

    container.style.display = 'block';
    if(noData) noData.style.display = 'none';

    const start = (kompPage - 1) * kompPerPage;
    const end = start + kompPerPage;
    const items = currentFilteredApps.slice(start, end);

    if(pageInfo) pageInfo.innerText = `Menampilkan ${start + 1}-${Math.min(end, currentFilteredApps.length)} dari ${currentFilteredApps.length} aplikasi`;

    const fragment = document.createDocumentFragment();

    items.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors";
        
        const logoHtml = (a.logo && a.logo.startsWith('<svg')) 
            ? a.logo.replace('w-10 h-10', 'w-8 h-8') 
            : (a.logo ? `<img src="${a.logo}" class="w-8 h-8 object-cover rounded">` : `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500">${a.nama.substring(0,2)}</div>`);

        // Toggle Switch (Checkbox style)
        const isChecked = a.flag_view === 1 ? 'checked' : '';
        const toggleSwitch = `
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" ${isChecked} onchange="toggleAppView('${a.id_app}', this.checked)">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
        `;

        // --- UPDATE: Tombol Aksi menggunakan Ikon SVG & Text Wrapping ---
        const editBtn = `
            <button onclick="openKompilasiEdit('${a.id_app}')" class="text-accent hover:text-accent-dark mr-3 transition-colors" title="Edit">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>`;

        const deleteBtn = `
            <button onclick="openKompilasiDelete('${a.id_app}', '${a.nama.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>`;

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-normal break-words max-w-xs">
                <div class="flex items-center">
                    <div class="flex-shrink-0 mr-3">${logoHtml}</div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${a.nama}</div>
                        <div class="text-xs text-gray-500">${a.tahun_buat || '-'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${a.kategori}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>${a.developer}</div>
                <div class="text-xs text-gray-400">${a.narahubung || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                ${a.jumlah_pengunjung}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                ${toggleSwitch}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                ${editBtn}
                ${deleteBtn}
            </td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    setupKompilasiPagination(currentFilteredApps.length);
}

// 5. Pagination Logic
function setupKompilasiPagination(total) {
    const container = document.getElementById('kompilasi-pagination');
    if (!container) return;
    container.innerHTML = '';
    const pages = Math.ceil(total / kompPerPage);
    if (pages <= 1) return;

    container.innerHTML += `<button class="page-btn" onclick="changeKompilasiPage(${kompPage - 1})" ${kompPage === 1 ? 'disabled' : ''}>Prev</button>`;
    for (let i = 1; i <= pages; i++) {
        container.innerHTML += `<button class="page-btn ${i === kompPage ? 'active' : ''}" onclick="changeKompilasiPage(${i})">${i}</button>`;
    }
    container.innerHTML += `<button class="page-btn" onclick="changeKompilasiPage(${kompPage + 1})" ${kompPage === pages ? 'disabled' : ''}>Next</button>`;
}

// --- GLOBAL HELPERS (Window Attached) ---

window.changeKompilasiPage = function(p) {
    kompPage = p;
    renderKompilasiTable();
    const tableTop = document.getElementById('kompilasi-table-container');
    if(tableTop) tableTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.toggleAppView = async function(id, isChecked) {
    try {
        const token = localStorage.getItem('haloKakaToken');
        const res = await fetch(`http://localhost:5000/api/kompilasi/${id}/toggle-view`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ flag_view: isChecked ? 1 : 0 })
        });
        
        if (!res.ok) {
            loadKompilasiData(); // Revert checkbox if failed
            alert('Gagal mengubah status view.');
        } else {
            // Update local data tanpa reload
            const app = allApps.find(a => a.id_app == id);
            if (app) app.flag_view = isChecked ? 1 : 0;
        }
    } catch (err) {
        console.error(err);
        loadKompilasiData(); // Revert
    }
}

window.openKompilasiEdit = function(id) {
    const a = allApps.find(x => x.id_app == id);
    if (!a) return;

    document.getElementById('edit-kompilasi-id').value = a.id_app;
    document.getElementById('edit-kompilasi-nama').value = a.nama;
    document.getElementById('edit-kompilasi-tahun').value = a.tahun_buat;
    document.getElementById('edit-kompilasi-kategori').value = a.kategori;
    document.getElementById('edit-kompilasi-penjelasan').value = a.penjelasan;
    document.getElementById('edit-kompilasi-link').value = a.link;
    document.getElementById('edit-kompilasi-developer').value = a.developer;
    document.getElementById('edit-kompilasi-narahubung').value = a.narahubung;
    document.getElementById('edit-kompilasi-status').value = a.status_aplikasi;
    
    // --- LOGIKA LOGO BARU ---
    const existingLogoInput = document.getElementById('edit-kompilasi-existing-logo');
    const previewDiv = document.getElementById('edit-kompilasi-logo-preview');
    const radioDefault = document.querySelector('input[name="edit_kompilasi_logo_option"][value="default"]');
    const radioUpload = document.querySelector('input[name="edit_kompilasi_logo_option"][value="upload"]');

    existingLogoInput.value = a.logo || '';
    
    if (!a.logo || a.logo.includes('<svg')) {
        // Jika logo default (SVG) atau kosong
        radioDefault.checked = true;
        toggleKompilasiLogoInput('default');
    } else {
        // Jika logo custom (gambar)
        radioUpload.checked = true;
        toggleKompilasiLogoInput('upload');
        previewDiv.innerHTML = `<img src="${a.logo}" class="w-full h-full object-contain">`;
    }

    openModal('modal-kompilasi-edit');
}

window.openKompilasiDelete = function(id, nama) {
    document.getElementById('delete-kompilasi-id').value = id;
    document.getElementById('delete-kompilasi-name').innerText = nama;
    if(typeof openModal === 'function') openModal('modal-kompilasi-delete');
}

function attachKompilasiListeners() {
    const searchInput = document.getElementById('kompilasi-search');
    const filterStatus = document.getElementById('kompilasi-filter-status');

    if(searchInput) {
        searchInput.oninput = function() {
             clearTimeout(this.delay);
             this.delay = setTimeout(handleKompilasiFilter, 300);
        };
    }
    if(filterStatus) {
        filterStatus.onchange = handleKompilasiFilter;
    }

    // Submit Edit (Updated)
    const formEdit = document.getElementById('form-kompilasi-edit');
    if(formEdit) {
        formEdit.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-kompilasi-id').value;
            const errorEl = document.getElementById('modal-kompilasi-edit-error');
            errorEl.style.display = 'none';

            // Ambil data dasar
            const data = {
                nama: document.getElementById('edit-kompilasi-nama').value,
                tahun_buat: document.getElementById('edit-kompilasi-tahun').value,
                kategori: document.getElementById('edit-kompilasi-kategori').value,
                penjelasan: document.getElementById('edit-kompilasi-penjelasan').value,
                link: document.getElementById('edit-kompilasi-link').value,
                developer: document.getElementById('edit-kompilasi-developer').value,
                narahubung: document.getElementById('edit-kompilasi-narahubung').value,
                status_aplikasi: document.getElementById('edit-kompilasi-status').value
            };

            // LOGIKA LOGO PADA SUBMIT (Mirip tab_penambahan)
            const logoOption = document.querySelector('input[name="edit_kompilasi_logo_option"]:checked').value;
            let finalLogo = DEFAULT_BPS_LOGO_KOMPILASI;

            if (logoOption === 'default') {
                finalLogo = DEFAULT_BPS_LOGO_KOMPILASI;
            } else {
                // Opsi Upload
                const fileInput = document.getElementById('edit-kompilasi-logo-file');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    // Validasi size
                    if (file.size > 2 * 1024 * 1024) {
                        errorEl.innerText = "Ukuran file terlalu besar (Maks 2MB)";
                        errorEl.style.display = 'block';
                        return;
                    }
                    try {
                        finalLogo = await convertKompilasiToBase64(file);
                    } catch (err) {
                        errorEl.innerText = "Gagal memproses gambar.";
                        errorEl.style.display = 'block';
                        return;
                    }
                } else {
                    // Tidak ada file baru dipilih -> Gunakan logo lama (jika bukan svg default)
                    const existing = document.getElementById('edit-kompilasi-existing-logo').value;
                    if (existing && !existing.includes('<svg')) {
                         finalLogo = existing;
                    } else {
                         finalLogo = DEFAULT_BPS_LOGO_KOMPILASI; 
                    }
                }
            }
            data.logo = finalLogo;

            await sendKompilasiRequest(`http://localhost:5000/api/kompilasi/${id}`, 'PUT', data, 'modal-kompilasi-edit');
        };
    }
    
    // Preview Listener
    const fileInput = document.getElementById('edit-kompilasi-logo-file');
    if (fileInput) {
        fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64 = await convertKompilasiToBase64(file);
                    document.getElementById('edit-kompilasi-logo-preview').innerHTML = `<img src="${base64}" class="w-full h-full object-contain">`;
                } catch (err) { console.error(err); }
            }
        });
    }

    // Submit Delete
    const formDelete = document.getElementById('form-kompilasi-delete');
    if(formDelete) {
        formDelete.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('delete-kompilasi-id').value;
            await sendKompilasiRequest(`http://localhost:5000/api/kompilasi/${id}`, 'DELETE', {}, 'modal-kompilasi-delete');
        };
    }
}

// 7. Helper Request
async function sendKompilasiRequest(url, method, body, modalId) {
    const btnSubmit = document.querySelector(`#${modalId} button[type="submit"]`);
    const originalText = btnSubmit ? btnSubmit.innerText : 'Simpan';
    
    if(btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Memproses...';
    }

    try {
        const token = localStorage.getItem('haloKakaToken');
        const opts = {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            }
        };
        if (method !== 'DELETE') opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);
        const resData = await res.json();

        if (res.ok) {
            if(typeof closeModal === 'function') closeModal(modalId);
            loadKompilasiData(); // Reload tabel
            alert('Berhasil: Data telah disimpan.');
        } else {
            alert(`Gagal: ${resData.message || 'Terjadi kesalahan'}`);
        }
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan koneksi ke server.');
    } finally {
        if(btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = originalText;
        }
    }
}