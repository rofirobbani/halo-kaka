// --- File: frontend/js/tabs/tab_penambahan.js ---

// --- Variabel Global untuk Tab Ini ---
let allSubmissions = []; 
let currentFilteredSubmissions = []; 
const token = localStorage.getItem('haloKakaToken');
const userRole = localStorage.getItem('haloKakaUserRole');

// --- State untuk Pagination ---
let currentPage = 1;
const itemsPerPage = 10; 

// --- Konstanta SVG Default ---
const DEFAULT_BPS_LOGO = `<svg class="w-full h-full text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;

// --- Fungsi Global Window (untuk dipanggil onclick HTML) ---

// Fungsi Toggle Logo Input (Edit/Add)
window.toggleEditLogoInput = function(value) {
    const uploadContainer = document.getElementById('edit-logo-upload-container');
    if (!uploadContainer) return;

    if (value === 'upload') {
        uploadContainer.classList.remove('hidden');
    } else {
        uploadContainer.classList.add('hidden');
        // Reset input file jika pilih default
        document.getElementById('edit-logo-file').value = '';
        // Reset preview ke default (opsional, tapi baik)
        document.getElementById('edit-logo-preview').innerHTML = DEFAULT_BPS_LOGO;
    }
}

/**
 * Helper: Convert File to Base64
 */
const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};


/**
 * Fungsi Inisialisasi
 */
async function initTabPenambahan() {
    console.log("Logika tab_penambahan.js berhasil dimuat!");
    const loadingEl = document.getElementById('penambahan-loading');
    const errorEl = document.getElementById('penambahan-error');
    
    if (!token) {
        if(loadingEl) loadingEl.style.display = 'none';
        if(errorEl) {
            errorEl.innerText = 'Autentikasi gagal. Silakan login kembali.';
            errorEl.style.display = 'block';
        }
        return;
    }
    await loadSubmissionData();
    attachTabListeners();
}

/**
 * Load Data
 */
async function loadSubmissionData() {
    const loadingEl = document.getElementById('penambahan-loading');
    const noDataEl = document.getElementById('penambahan-no-data');
    const errorEl = document.getElementById('penambahan-error');
    const tableContainer = document.getElementById('penambahan-table-container');

    if(loadingEl) loadingEl.style.display = 'block';
    if(noDataEl) noDataEl.style.display = 'none';
    if(errorEl) errorEl.style.display = 'none';
    if(tableContainer) tableContainer.style.display = 'none';

    try {
        const response = await fetch('http://localhost:5000/api/submissions', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Gagal mengambil data.');
        }

        const data = await response.json();
        allSubmissions = data; 
        
        if(loadingEl) loadingEl.style.display = 'none'; 
        
        // Render ulang (yang akan mengurus pagination & filter)
        handleFilterChange();

    } catch (error) {
        console.error('Error memuat data penambahan:', error);
        if(loadingEl) loadingEl.style.display = 'none';
        if(errorEl) {
            errorEl.innerText = `Error: ${error.message}`;
            errorEl.style.display = 'block';
        }
    }
}

function handleFilterChange() {
    const queryEl = document.getElementById('penambahan-search');
    const statusEl = document.getElementById('penambahan-filter-status');
    
    const query = queryEl ? queryEl.value.toLowerCase() : '';
    const status = statusEl ? statusEl.value : '';

    currentFilteredSubmissions = allSubmissions.filter(app => {
        const matchesQuery = 
            (app.nama && app.nama.toLowerCase().includes(query)) ||
            (app.kategori && app.kategori.toLowerCase().includes(query)) ||
            (app.developer && app.developer.toLowerCase().includes(query)) ||
            (app.penjelasan && app.penjelasan.toLowerCase().includes(query)) ||
            (app.narahubung && app.narahubung.toLowerCase().includes(query));
        
        const matchesStatus = !status || app.status_aplikasi === status;

        return matchesQuery && matchesStatus;
    });

    currentPage = 1; 
    renderSubmissionTable(); 
}

function renderSubmissionTable() {
    const tableBody = document.getElementById('penambahan-table-body');
    const tableContainer = document.getElementById('penambahan-table-container');
    const noDataEl = document.getElementById('penambahan-no-data');
    const pageInfoEl = document.getElementById('penambahan-page-info');

    if (!tableBody || !tableContainer || !noDataEl || !pageInfoEl) return;

    const data = currentFilteredSubmissions;
    const totalItems = data.length;
    
    tableBody.innerHTML = ''; 

    if (totalItems === 0) {
        noDataEl.style.display = 'block';
        tableContainer.style.display = 'none';
        pageInfoEl.innerText = "Menampilkan 0 dari 0 aplikasi";
        setupPenambahanPagination(0);
        return;
    }

    noDataEl.style.display = 'none';
    tableContainer.style.display = 'block';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToRender = data.slice(startIndex, endIndex);

    const endInfo = Math.min(endIndex, totalItems);
    pageInfoEl.innerText = `Menampilkan ${startIndex + 1}-${endInfo} dari ${totalItems} aplikasi`;

    itemsToRender.forEach(app => {
        let statusClass = 'bg-gray-100 text-gray-800';
        if (app.status_aplikasi === 'Disetujui') statusClass = 'bg-green-100 text-green-800';
        else if (app.status_aplikasi === 'Ditolak') statusClass = 'bg-red-100 text-red-800';
        else if (app.status_aplikasi === 'Menunggu Persetujuan') statusClass = 'bg-yellow-100 text-yellow-800';
        
        let actionButtons = '';
        const canEditDelete = (app.status_aplikasi === 'Menunggu Persetujuan');
        
        const editBtn = `<button data-id="${app.id_add_app}" class="btn-edit text-indigo-600 hover:text-indigo-900 ${!canEditDelete && userRole !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}" ${!canEditDelete && userRole !== 'Admin' ? 'disabled' : ''}>Edit</button>`;
        const deleteBtn = `<button data-id="${app.id_add_app}" class="btn-delete text-red-600 hover:text-red-900 ml-4 ${!canEditDelete && userRole !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}" ${!canEditDelete && userRole !== 'Admin' ? 'disabled' : ''}>Delete</button>`;
        const approveBtn = `<button data-id="${app.id_add_app}" class="btn-approve text-green-600 hover:text-green-900 ml-4">Approve</button>`;

        if (userRole === 'Admin') {
            actionButtons = editBtn + deleteBtn + approveBtn;
        } else {
            actionButtons = editBtn + deleteBtn;
        }

        // Logo Preview di Tabel
        const logoHtml = (app.logo && app.logo.startsWith('<svg')) 
            ? app.logo.replace('w-full h-full', 'w-8 h-8')
            : (app.logo ? `<img src="${app.logo}" class="w-8 h-8 object-contain">` : `<span class="text-lg font-bold text-accent">${app.nama.substring(0,2).toUpperCase()}</span>`)

            

        const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <!-- Klik nama/logo untuk VIEW details -->
                    <button class="btn-view flex items-center text-left w-full hover:opacity-75" data-id="${app.id_add_app}">
                        <div class="flex-shrink-0 h-10 w-10 bg-accent-light rounded-md flex items-center justify-center text-accent p-1">
                            ${logoHtml}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${app.nama}</div>
                            <div class="text-sm text-gray-500">${app.tahun_buat || 'N/A'}</div>
                        </div>
                    </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${app.kategori}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${app.developer}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${app.status_aplikasi}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${actionButtons}
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    setupPenambahanPagination(totalItems);
}

function setupPenambahanPagination(totalItems) {
    const paginationEl = document.getElementById('penambahan-pagination');
    if (!paginationEl) return;
    paginationEl.innerHTML = ''; 

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return;

    paginationEl.innerHTML += `<button class="page-btn" onclick="changePenambahanPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        paginationEl.innerHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePenambahanPage(${i})">${i}</button>`;
    }
    paginationEl.innerHTML += `<button class="page-btn" onclick="changePenambahanPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
}

window.changePenambahanPage = function(page) {
    currentPage = page;
    renderSubmissionTable();
    document.getElementById('penambahan-table-container')?.scrollIntoView({ behavior: 'smooth' });
}


function attachTabListeners() {
    document.getElementById('btn-tambah-aplikasi')?.addEventListener('click', () => {
        openAddEditModal(null); 
    });

    document.getElementById('penambahan-table-body')?.addEventListener('click', (e) => {
        const target = e.target;
        const button = target.closest('button[data-id]');
        if (!button) return;

        const appId = button.getAttribute('data-id');
        const appData = allSubmissions.find(app => app.id_add_app == appId);
        if (!appData) return;

        if (button.classList.contains('btn-view')) {
            openViewModal(appData);
        } else if (button.classList.contains('btn-edit')) {
            openAddEditModal(appData);
        } else if (button.classList.contains('btn-delete')) {
            openDeleteModal(appData);
        } else if (button.classList.contains('btn-approve')) {
            openApproveModal(appData);
        }
    });
    
    let searchTimeout;
    document.getElementById('penambahan-search')?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleFilterChange, 300);
    });
    document.getElementById('penambahan-filter-status')?.addEventListener('change', handleFilterChange);
    
    // Pasang listener untuk submit form modal
    document.getElementById('form-add-edit').addEventListener('submit', handleAddEditSubmit);
    document.getElementById('form-delete-confirm').addEventListener('submit', handleDeleteSubmit);
    document.getElementById('form-approve-admin').addEventListener('submit', handleApproveSubmit);
    
    // Listener untuk preview file upload
    document.getElementById('edit-logo-file').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await convertToBase64(file);
                const previewDiv = document.getElementById('edit-logo-preview');
                previewDiv.innerHTML = `<img src="${base64}" class="w-full h-full object-contain">`;
            } catch (err) {
                console.error("Gagal preview", err);
            }
        }
    });
}


// --- Fungsi Modal ---

function openViewModal(appData) {
    const modal = document.getElementById('modal-view-details');
    if (!modal) return;

    document.getElementById('view-nama').innerText = appData.nama || '-';
    document.getElementById('view-tahun').innerText = appData.tahun_buat || '-';
    document.getElementById('view-kategori').innerText = appData.kategori || '-';
    document.getElementById('view-developer').innerText = appData.developer || '-';
    document.getElementById('view-narahubung').innerText = appData.narahubung || '-';
    document.getElementById('view-penjelasan').innerText = appData.penjelasan || 'Tidak ada penjelasan.';
    
    const linkEl = document.getElementById('view-link');
    linkEl.href = appData.link || '#';
    linkEl.innerText = appData.link || '-';

    const logoContainer = document.getElementById('view-logo');
    const logoHtml = (appData.logo && appData.logo.startsWith('<svg')) 
        ? appData.logo 
        : (appData.logo ? `<img src="${appData.logo}" alt="${appData.nama}" class="w-full h-full object-contain">` : `<span>(Tidak ada logo)</span>`);
    logoContainer.innerHTML = logoHtml;

    if(typeof openModal === 'function') openModal('modal-view-details');
}

function openAddEditModal(appData) {
    const modal = document.getElementById('modal-add-edit');
    const form = document.getElementById('form-add-edit');
    const title = document.getElementById('modal-add-edit-title');
    if (!modal || !form || !title) return;
    
    form.reset();
    document.getElementById('modal-add-edit-error').style.display = 'none'; 
    
    // Helper untuk reset preview
    const previewDiv = document.getElementById('edit-logo-preview');
    const existingLogoInput = document.getElementById('edit-existing-logo');
    const fileInputContainer = document.getElementById('edit-logo-upload-container');
    
    // Reset Radio Buttons
    const radioDefault = document.querySelector('input[name="edit_logo_option"][value="default"]');
    const radioUpload = document.querySelector('input[name="edit_logo_option"][value="upload"]');

    if (appData) {
        // --- Mode EDIT ---
        title.innerText = "Edit Aplikasi";
        document.getElementById('edit-app-id').value = appData.id_add_app;
        document.getElementById('edit-nama').value = appData.nama;
        document.getElementById('edit-tahun').value = appData.tahun_buat;
        document.getElementById('edit-kategori').value = appData.kategori;
        document.getElementById('edit-penjelasan').value = appData.penjelasan;
        document.getElementById('edit-link').value = appData.link;
        document.getElementById('edit-developer').value = appData.developer;
        document.getElementById('edit-narahubung').value = appData.narahubung;
        
        // LOGIKA LOGO EDIT
        existingLogoInput.value = appData.logo || ''; // Simpan logo lama
        
        if (!appData.logo || appData.logo.includes('<svg')) {
            // Jika logo lama adalah SVG Default
            radioDefault.checked = true;
            toggleEditLogoInput('default');
        } else {
            // Jika logo lama adalah gambar/custom
            radioUpload.checked = true;
            toggleEditLogoInput('upload');
            // Tampilkan preview logo lama
            previewDiv.innerHTML = `<img src="${appData.logo}" class="w-full h-full object-contain">`;
        }
        
    } else {
        // --- Mode TAMBAH ---
        title.innerText = "Tambah Aplikasi Baru";
        document.getElementById('edit-app-id').value = '';
        existingLogoInput.value = '';
        // Default ke 'default logo'
        radioDefault.checked = true;
        toggleEditLogoInput('default');
    }
    
    if(typeof openModal === 'function') openModal('modal-add-edit');
}

function openDeleteModal(appData) {
    document.getElementById('delete-app-name').innerText = appData.nama;
    document.getElementById('delete-app-id').value = appData.id_add_app;
    if(typeof openModal === 'function') openModal('modal-delete-confirm');
}

function openApproveModal(appData) {
    document.getElementById('approve-app-name').innerText = appData.nama;
    document.getElementById('approve-status').value = appData.status_aplikasi;
    document.getElementById('approve-app-id').value = appData.id_add_app;
    if(typeof openModal === 'function') openModal('modal-approve-admin');
}

// --- Fungsi Submit Handler ---

async function handleAddEditSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('modal-add-edit-error');
    const form = document.getElementById('form-add-edit');
    
    // Siapkan data
    const data = {
        nama: document.getElementById('edit-nama').value,
        tahun_buat: document.getElementById('edit-tahun').value,
        kategori: document.getElementById('edit-kategori').value,
        penjelasan: document.getElementById('edit-penjelasan').value,
        link: document.getElementById('edit-link').value,
        developer: document.getElementById('edit-developer').value,
        narahubung: document.getElementById('edit-narahubung').value,
    };

    // LOGIKA LOGO PADA SUBMIT
    const logoOption = document.querySelector('input[name="edit_logo_option"]:checked').value;
    let finalLogo = DEFAULT_BPS_LOGO;

    if (logoOption === 'default') {
        finalLogo = DEFAULT_BPS_LOGO;
    } else {
        // Opsi Upload
        const fileInput = document.getElementById('edit-logo-file');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            // Validasi size
            if (file.size > 2 * 1024 * 1024) {
                errorEl.innerText = "Ukuran file terlalu besar (Maks 2MB)";
                errorEl.style.display = 'block';
                return;
            }
            try {
                finalLogo = await convertToBase64(file);
            } catch (err) {
                console.error("Gagal convert gambar", err);
                errorEl.innerText = "Gagal memproses gambar.";
                errorEl.style.display = 'block';
                return;
            }
        } else {
            // Tidak ada file baru dipilih -> Gunakan logo lama (jika ada)
            const existing = document.getElementById('edit-existing-logo').value;
            if (existing && !existing.includes('<svg')) {
                 finalLogo = existing;
            } else {
                 // Jika sebelumnya default, dan user pilih upload tapi tdk upload file -> Tetap default? atau error?
                 // Kita kembalikan ke default untuk keamanan
                 finalLogo = DEFAULT_BPS_LOGO; 
            }
        }
    }
    data.logo = finalLogo;


    let method = 'POST';
    let url = 'http://localhost:5000/api/submissions';
    
    const appId = document.getElementById('edit-app-id').value;
    if (appId) {
        method = 'PUT';
        url = `http://localhost:5000/api/submissions/${appId}`;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            if(typeof closeModal === 'function') closeModal('modal-add-edit');
            await loadSubmissionData(); 
        } else {
            throw new Error(result.message || 'Gagal menyimpan data.');
        }

    } catch (error) {
        console.error('Error saat submit add/edit:', error);
        if(errorEl) {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
        }
    }
}

async function handleDeleteSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('modal-delete-error');
    const appId = document.getElementById('delete-app-id').value;
    
    if (!appId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/submissions/${appId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();

        if (response.ok) {
            if(typeof closeModal === 'function') closeModal('modal-delete-confirm');
            await loadSubmissionData(); 
        } else {
            throw new Error(result.message || 'Gagal menghapus.');
        }

    } catch (error) {
        console.error('Error saat delete:', error);
        if(errorEl) {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
        }
    }
}

async function handleApproveSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('modal-approve-error');
    const appId = document.getElementById('approve-app-id').value;
    const status = document.getElementById('approve-status').value;
    
    if (!appId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/submissions/${appId}/approve`, {
            method: 'PATCH', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status_aplikasi: status })
        });

        const result = await response.json();

        if (response.ok) {
            if(typeof closeModal === 'function') closeModal('modal-approve-admin');
            await loadSubmissionData(); 
        } else {
            throw new Error(result.message || 'Gagal approval.');
        }
    } catch (error) {
        console.error('Error saat approve:', error);
        if(errorEl) {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
        }
    }
}