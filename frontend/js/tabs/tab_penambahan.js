// --- File: frontend/js/tabs/tab_penambahan.js ---
// File ini berisi semua logika JavaScript KHUSUS untuk tab 'Penambahan'.
// File ini akan dimuat secara dinamis oleh dashboard.html

// --- Variabel Global untuk Tab Ini ---
let allSubmissions = []; // Cache untuk menyimpan data dari API
let currentFilteredSubmissions = []; // Data setelah difilter
const token = localStorage.getItem('haloKakaToken');
const userRole = localStorage.getItem('haloKakaUserRole');

// --- State untuk Pagination ---
let currentPage = 1;
const itemsPerPage = 10; // Hanya 10 baris per halaman

/**
 * Fungsi ini akan dipanggil oleh dashboard.html SETELAH file ini
 * dan file tab_penambahan.html selesai dimuat.
 */
async function initTabPenambahan() {
    console.log("Logika tab_penambahan.js berhasil dimuat!");

    // Ambil elemen dari DOM
    const loadingEl = document.getElementById('penambahan-loading');
    const errorEl = document.getElementById('penambahan-error');
    
    // 1. Cek Token
    if (!token) {
        if(loadingEl) loadingEl.style.display = 'none';
        if(errorEl) {
            errorEl.innerText = 'Autentikasi gagal. Silakan login kembali.';
            errorEl.style.display = 'block';
        }
        return;
    }

    // 2. Muat Data
    await loadSubmissionData();

    // 3. Pasang Event Listener
    attachTabListeners();
}

/**
 * Mengambil data dari API dan memanggil renderTable
 */
async function loadSubmissionData() {
    // Tampilkan loading setiap kali data dimuat ulang
    const loadingEl = document.getElementById('penambahan-loading');
    const noDataEl = document.getElementById('penambahan-no-data');
    const errorEl = document.getElementById('penambahan-error');
    const tableContainer = document.getElementById('penambahan-table-container');

    if(loadingEl) loadingEl.style.display = 'none';
    if(noDataEl) noDataEl.style.display = 'none';
    if(errorEl) errorEl.style.display = 'none';
    if(tableContainer) tableContainer.style.display = 'none';

    try {
        const response = await fetch('http://localhost:5000/api/submissions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Coba baca error JSON
            try {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengambil data.');
            } catch (jsonError) {
                // Jika GAGAL baca JSON (respons-nya HTML/teks)
                throw new Error(`Server error (${response.status}). Pastikan backend berjalan.`);
            }
        }

        const data = await response.json();
        allSubmissions = data; // Simpan di cache
        
        // Panggil filter (yang juga akan merender)
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

/**
 * Fungsi untuk memfilter dan me-render ulang
 */
function handleFilterChange() {
    const queryEl = document.getElementById('penambahan-search');
    const statusEl = document.getElementById('penambahan-filter-status');
    
    // Jaga-jaga jika elemen filter belum dimuat
    const query = queryEl ? queryEl.value.toLowerCase() : '';
    const status = statusEl ? statusEl.value : '';

    // Filter dari data master 'allSubmissions'
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

    currentPage = 1; // Reset ke halaman 1
    renderSubmissionTable(); // Render ulang tabel dengan data yang sudah difilter
}


/**
 * Merender data ke dalam tabel (DIPERBARUI untuk pagination)
 * Fungsi ini sekarang membaca dari 'currentFilteredSubmissions'
 */
function renderSubmissionTable() {
    const tableBody = document.getElementById('penambahan-table-body');
    const tableContainer = document.getElementById('penambahan-table-container');
    const noDataEl = document.getElementById('penambahan-no-data');
    const pageInfoEl = document.getElementById('penambahan-page-info');

    if (!tableBody || !tableContainer || !noDataEl || !pageInfoEl) {
        console.error("Satu atau lebih elemen DOM tab penambahan tidak ditemukan.");
        return;
    }

    // 1. Ambil data dari cache YANG SUDAH DIFILTER
    const data = currentFilteredSubmissions;
    const totalItems = data.length;
    
    tableBody.innerHTML = ''; // Kosongkan tabel

    // 2. Cek jika data kosong
    if (totalItems === 0) {
        noDataEl.style.display = 'block';
        tableContainer.style.display = 'none';
        pageInfoEl.innerText = "Menampilkan 0 dari 0 aplikasi"; // Update info
        setupPenambahanPagination(0); // Sembunyikan tombol
        return;
    }

    noDataEl.style.display = 'none';
    tableContainer.style.display = 'block';

    // 3. Potong (slice) data untuk halaman saat ini
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToRender = data.slice(startIndex, endIndex);

    // Update info halaman
    const endInfo = Math.min(endIndex, totalItems);
    pageInfoEl.innerText = `Menampilkan ${startIndex + 1}-${endInfo} dari ${totalItems} aplikasi`;

    // 4. Render hanya item untuk halaman ini
    itemsToRender.forEach(app => {
        // Tentukan style untuk status
        let statusClass = 'bg-gray-100 text-gray-800';
        if (app.status_aplikasi === 'Disetujui') {
            statusClass = 'bg-green-100 text-green-800';
        } else if (app.status_aplikasi === 'Ditolak') {
            statusClass = 'bg-red-100 text-red-800';
        } else if (app.status_aplikasi === 'Menunggu Persetujuan') {
            statusClass = 'bg-yellow-100 text-yellow-800';
        }
        
        // --- Logika Tombol Aksi ---
        let actionButtons = '';
        
        if (userRole === 'Admin') {
            // ADMIN: Selalu bisa Edit, Delete, dan Approve
            const editBtn = `<button data-id="${app.id_add_app}" class="btn-edit text-indigo-600 hover:text-indigo-900">Edit</button>`;
            const deleteBtn = `<button data-id="${app.id_add_app}" class="btn-delete text-red-600 hover:text-red-900 ml-4">Delete</button>`;
            const approveBtn = `<button data-id="${app.id_add_app}" class="btn-approve text-green-600 hover:text-green-900 ml-4">Approve</button>`;
            actionButtons = editBtn + deleteBtn + approveBtn;
        } else {
            // USER: Hanya bisa Edit/Delete jika status "Menunggu Persetujuan"
            const canUserEditDelete = (app.status_aplikasi === 'Menunggu Persetujuan');
            const editBtn = `<button data-id="${app.id_add_app}" class="btn-edit text-indigo-600 hover:text-indigo-900 ${!canUserEditDelete ? 'opacity-50 cursor-not-allowed' : ''}" ${!canUserEditDelete ? 'disabled' : ''}>Edit</button>`;
            const deleteBtn = `<button data-id="${app.id_add_app}" class="btn-delete text-red-600 hover:text-red-900 ml-4 ${!canUserEditDelete ? 'opacity-50 cursor-not-allowed' : ''}" ${!canUserEditDelete ? 'disabled' : ''}>Delete</button>`;
            actionButtons = editBtn + deleteBtn;
        }

        // --- PERUBAHAN: Kolom Aplikasi sekarang menjadi tombol 'btn-view' ---
        const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <!-- Tombol ini memicu modal-view-details -->
                    <button class="btn-view flex items-center text-left hover:opacity-75 transition-opacity" data-id="${app.id_add_app}">
                        <div class="flex-shrink-0 h-10 w-10 bg-accent-light rounded-md flex items-center justify-center text-accent">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6l.01.01"></path></svg>
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

    // 5. Panggil fungsi untuk membuat tombol pagination
    setupPenambahanPagination(totalItems);
}

/**
 * Membuat tombol-tombol pagination
 * @param {number} totalItems - Jumlah total item (setelah difilter)
 */
function setupPenambahanPagination(totalItems) {
    const paginationEl = document.getElementById('penambahan-pagination');
    if (!paginationEl) return;
    paginationEl.innerHTML = ''; // Kosongkan

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return; // Sembunyikan jika hanya 1 halaman

    // Tambahkan styling (kita ambil dari kolam-aplikasi.html)
    const styleId = 'pagination-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .page-btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; transition: all 0.2s ease; border: 1px solid #D1D5DB; }
            .page-btn.active { background-color: #3486d9; color: white; border-color: #3486d9; }
            .page-btn:not(.active):not(:disabled) { background-color: white; color: #3F3F46; }
            .page-btn:not(.active):not(:disabled):hover { background-color: #F9FAFB; }
            .page-btn:disabled { background-color: #F3F4F6; color: #9CA3AF; cursor: not-allowed; }
        `;
        document.head.appendChild(style);
    }

    // Tombol "Previous"
    paginationEl.innerHTML += `
        <button class="page-btn" onclick="changePenambahanPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            &laquo; Prev
        </button>`;

    // Tombol Halaman (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
        paginationEl.innerHTML += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePenambahanPage(${i})">
                ${i}
            </button>`;
    }

    // Tombol "Next"
    paginationEl.innerHTML += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePenambahanPage(${currentPage + 1})">
            Next &raquo;
        </button>`;
}

/**
 * Pindah halaman (dibuat global agar bisa diakses onclick)
 * @param {number} page - Nomor halaman yang dituju
 */
window.changePenambahanPage = function(page) {
    currentPage = page;
    renderSubmissionTable(); // Panggil render ulang dengan data yang sudah difilter
    // Scroll ke atas tabel
    document.getElementById('penambahan-table-container')?.scrollIntoView({ behavior: 'smooth' });
}


/**
 * Memasang semua event listener untuk tab ini
 */
function attachTabListeners() {
    // Listener untuk tombol "Tambah Aplikasi"
    document.getElementById('btn-tambah-aplikasi')?.addEventListener('click', () => {
        openAddEditModal(null); // Panggil dengan null untuk mode "Tambah"
    });

    // Event Delegation untuk tombol di dalam tabel
    document.getElementById('penambahan-table-body')?.addEventListener('click', (e) => {
        const target = e.target;
        // Cari tombol terdekat yang memiliki 'data-id'
        const button = target.closest('button[data-id]');
        if (!button) return;

        const appId = button.getAttribute('data-id');
        // Temukan data aplikasi lengkap dari cache
        const appData = allSubmissions.find(app => app.id_add_app == appId);
        if (!appData) return;

        // PERUBAHAN: Tambahkan cek untuk 'btn-view'
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
    
    // Pasang listener untuk filter
    let searchTimeout;
    document.getElementById('penambahan-search')?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        // Debounce: Tunda 300ms agar tidak memfilter di setiap ketukan
        searchTimeout = setTimeout(handleFilterChange, 300);
    });
    document.getElementById('penambahan-filter-status')?.addEventListener('change', handleFilterChange);
    
    // Pasang listener untuk submit form modal
    document.getElementById('form-add-edit').addEventListener('submit', handleAddEditSubmit);
    document.getElementById('form-delete-confirm').addEventListener('submit', handleDeleteSubmit);
    document.getElementById('form-approve-admin').addEventListener('submit', handleApproveSubmit);
}


// --- Fungsi Modal (Spesifik untuk tab ini) ---

/**
 * BARU: Membuka modal read-only untuk melihat detail
 */
function openViewModal(appData) {
    const modal = document.getElementById('modal-view-details');
    if (!modal) return;

    // Isi field read-only
    document.getElementById('view-nama').innerText = appData.nama || '-';
    document.getElementById('view-tahun').innerText = appData.tahun_buat || '-';
    document.getElementById('view-kategori').innerText = appData.kategori || '-';
    document.getElementById('view-developer').innerText = appData.developer || '-';
    document.getElementById('view-narahubung').innerText = appData.narahubung || '-';
    document.getElementById('view-penjelasan').innerText = appData.penjelasan || 'Tidak ada penjelasan.';
    
    // Untuk link, buat dia bisa diklik
    const linkEl = document.getElementById('view-link');
    linkEl.href = appData.link || '#';
    linkEl.innerText = appData.link || '-';

    // Untuk logo
    const logoContainer = document.getElementById('view-logo');
    const logoHtml = (appData.logo && appData.logo.startsWith('<svg')) 
        ? appData.logo 
        : (appData.logo ? `<img src="${appData.logo}" alt="${appData.nama}" class="w-full h-full object-cover">` : `<span>(Tidak ada logo)</span>`);
    logoContainer.innerHTML = logoHtml;

    openModal('modal-view-details'); // Panggil fungsi global
}


/**
 * Membuka modal untuk Tambah (data=null) atau Edit (data=app)
 */
function openAddEditModal(appData) {
    const modal = document.getElementById('modal-add-edit');
    const form = document.getElementById('form-add-edit');
    const title = document.getElementById('modal-add-edit-title');
    if (!modal || !form || !title) return;
    
    form.reset(); // Selalu reset form
    document.getElementById('modal-add-edit-error').style.display = 'none'; // Sembunyikan error lama
    
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
        document.getElementById('edit-logo').value = appData.logo;
    } else {
        // --- Mode TAMBAH ---
        title.innerText = "Tambah Aplikasi Baru";
        document.getElementById('edit-app-id').value = ''; // Pastikan ID kosong
    }
    
    openModal('modal-add-edit'); // openModal() adalah fungsi global dari main.js
}

/**
 * Membuka modal konfirmasi penghapusan
 */
function openDeleteModal(appData) {
    const modal = document.getElementById('modal-delete-confirm');
    if (!modal) return;
    
    document.getElementById('modal-delete-error').style.display = 'none'; // Sembunyikan error lama
    
    // Isi nama aplikasi yang akan dihapus
    document.getElementById('delete-app-name').innerText = appData.nama;
    // Simpan ID di form
    document.getElementById('delete-app-id').value = appData.id_add_app;
    
    openModal('modal-delete-confirm');
}

/**
 * Membuka modal approval (khusus Admin)
 */
function openApproveModal(appData) {
    const modal = document.getElementById('modal-approve-admin');
    if (!modal) return;
    
    document.getElementById('modal-approve-error').style.display = 'none'; // Sembunyikan error lama
    
    // Isi nama dan status aplikasi saat ini
    document.getElementById('approve-app-name').innerText = appData.nama;
    document.getElementById('approve-status').value = appData.status_aplikasi;
    // Simpan ID di form
    document.getElementById('approve-app-id').value = appData.id_add_app;
    
    openModal('modal-approve-admin');
}

// --- Fungsi Submit Handler ---

/**
 * Menangani submit dari modal Tambah/Edit
 */
async function handleAddEditSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const errorEl = document.getElementById('modal-add-edit-error');
    
    let method = 'POST';
    let url = 'http://localhost:5000/api/submissions';
    
    // Cek apakah ini mode EDIT (ada ID di input tersembunyi)
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
            closeModal('modal-add-edit');
            await loadSubmissionData(); // Muat ulang data tabel
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

/**
 * Menangani submit dari modal Delete
 */
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
            closeModal('modal-delete-confirm');
            await loadSubmissionData(); // Muat ulang data
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

/**
 * Menangani submit dari modal Approve (Admin)
 */
async function handleApproveSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('modal-approve-error');
    const appId = document.getElementById('approve-app-id').value;
    const status = document.getElementById('approve-status').value;
    
    if (!appId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/submissions/${appId}/approve`, {
            method: 'PATCH', // Menggunakan PATCH karena hanya update 1 field
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status_aplikasi: status })
        });

        const result = await response.json();

        if (response.ok) {
            closeModal('modal-approve-admin');
            await loadSubmissionData(); // Muat ulang data
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