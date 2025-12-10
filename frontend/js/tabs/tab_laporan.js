// --- File: frontend/js/tabs/tab_laporan.js ---
// Logika khusus untuk Tab Laporan

// Variabel Global untuk Tab Ini
let allReports = [];
let currentFilteredReports = [];
const laporanToken = localStorage.getItem('haloKakaToken');
const laporanRole = localStorage.getItem('haloKakaUserRole');

// State Pagination
let laporanPage = 1;
const laporanPerPage = 10;

/**
 * Fungsi Inisialisasi (Dipanggil oleh dashboard.html)
 */
async function initTabLaporan() {
    console.log("Logika tab_laporan.js dimuat");

    const loadingEl = document.getElementById('laporan-loading');
    const errorEl = document.getElementById('laporan-error');
    const container = document.getElementById('laporan-table-container');
    const noData = document.getElementById('laporan-no-data');

    // Reset tampilan
    if(loadingEl) loadingEl.style.display = 'block';
    if(container) container.style.display = 'none';
    if(noData) noData.style.display = 'none';
    if(errorEl) errorEl.style.display = 'none';

    if (!laporanToken) {
        if(loadingEl) loadingEl.style.display = 'none';
        if(errorEl) {
            errorEl.innerText = "Sesi habis. Silakan login kembali.";
            errorEl.style.display = 'block';
        }
        return;
    }

    // Muat data dan pasang listener
    await loadLaporanData();
    attachLaporanListeners();
}

/**
 * Mengambil data laporan dari API
 */
async function loadLaporanData() {
    const loading = document.getElementById('laporan-loading');
    const errorEl = document.getElementById('laporan-error');
    const noData = document.getElementById('laporan-no-data');
    const container = document.getElementById('laporan-table-container');

    try {
        const res = await fetch('http://localhost:5000/api/laporan', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${laporanToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            let errMsg = 'Gagal mengambil data.';
            try {
                const errJson = await res.json();
                errMsg = errJson.message || errMsg;
            } catch (e) {
                errMsg = `Server Error (${res.status}). Pastikan backend berjalan.`;
            }
            throw new Error(errMsg);
        }
        
        const data = await res.json();
        allReports = data;
        currentFilteredReports = data; // Reset filter saat data baru dimuat

        if(loading) loading.style.display = 'none';

        if (data.length === 0) {
            if(noData) noData.style.display = 'block';
        } else {
            // Render data (Panggil fungsi filter untuk render awal)
            handleLaporanFilter(); 
        }

    } catch (err) {
        console.error("Error load laporan:", err);
        if(loading) loading.style.display = 'none';
        if(errorEl) {
            errorEl.innerText = `Gagal Memuat Data: ${err.message}`;
            errorEl.style.display = 'block';
        }
    }
}

/**
 * Filter Data Laporan
 */
function handleLaporanFilter() {
    const queryEl = document.getElementById('laporan-search');
    const statusEl = document.getElementById('laporan-filter-status');

    // Guard clause jika elemen belum ada
    if (!queryEl || !statusEl) return;

    const query = queryEl.value.toLowerCase();
    const status = statusEl.value;

    currentFilteredReports = allReports.filter(r => {
        const matchQuery = (r.nama_aplikasi && r.nama_aplikasi.toLowerCase().includes(query)) ||
                           (r.jenis_laporan && r.jenis_laporan.toLowerCase().includes(query)) ||
                           (r.keterangan && r.keterangan.toLowerCase().includes(query)) ||
                           (r.nama_pelapor && r.nama_pelapor.toLowerCase().includes(query));
        
        const matchStatus = !status || r.status_laporan === status;
        
        return matchQuery && matchStatus;
    });

    laporanPage = 1; // Reset ke halaman 1
    renderLaporanTable();
}

/**
 * Render Tabel dengan Pagination
 */
function renderLaporanTable() {
    const tbody = document.getElementById('laporan-table-body');
    const container = document.getElementById('laporan-table-container');
    const noData = document.getElementById('laporan-no-data');
    const pageInfo = document.getElementById('laporan-page-info');

    if (!tbody) return;

    tbody.innerHTML = '';

    // Cek data kosong setelah filter
    if (currentFilteredReports.length === 0) {
        if(container) container.style.display = 'none';
        if(noData) noData.style.display = 'block';
        if(pageInfo) pageInfo.innerText = "Menampilkan 0 dari 0 laporan";
        setupLaporanPagination(0);
        return;
    }

    if(container) container.style.display = 'block';
    if(noData) noData.style.display = 'none';

    // Logika Pagination
    const start = (laporanPage - 1) * laporanPerPage;
    const end = start + laporanPerPage;
    const items = currentFilteredReports.slice(start, end);

    if(pageInfo) pageInfo.innerText = `Menampilkan ${start + 1}-${Math.min(end, currentFilteredReports.length)} dari ${currentFilteredReports.length} laporan`;

    items.forEach(item => {
        let statusClass = 'bg-gray-100 text-gray-800';
        if (item.status_laporan === 'Selesai') statusClass = 'bg-green-100 text-green-800';
        else if (item.status_laporan === 'Ditolak') statusClass = 'bg-red-100 text-red-800';
        else if (item.status_laporan === 'Sedang Diperbaiki') statusClass = 'bg-yellow-100 text-yellow-800';

        // --- UPDATE: Logika Tombol dengan Ikon SVG ---
        let actionButtons = '';
        
        // Cek apakah user bisa mengedit/hapus (hanya jika status 'Baru')
        const isLocked = (item.status_laporan === 'Selesai' || item.status_laporan === 'Sedang Diperbaiki');
        const disabledClass = (isLocked && laporanRole !== 'Admin') ? 'opacity-50 cursor-not-allowed' : '';
        const disabledAttr = (isLocked && laporanRole !== 'Admin') ? 'disabled' : '';

        // Tombol Edit
        const editBtn = `
            <button data-id="${item.id_report_app}" class="btn-laporan-edit text-accent hover:text-accent-dark mr-3 transition-colors ${disabledClass}" ${disabledAttr} title="Edit">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>`;
        
        // Tombol Delete
        const deleteBtn = `
            <button data-id="${item.id_report_app}" class="btn-laporan-delete text-red-500 hover:text-red-700 transition-colors ${disabledClass}" ${disabledAttr} title="Delete">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>`;

        // Tombol Status (Admin Only) - Menggunakan ikon Check Circle
        let statusBtn = '';
        if (laporanRole === 'Admin') {
            statusBtn = `
                <button data-id="${item.id_report_app}" class="btn-laporan-status text-green-600 hover:text-green-800 ml-3 transition-colors" title="Ubah Status">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>`;
        }

        if (laporanRole === 'Admin') {
            actionButtons = editBtn + deleteBtn + statusBtn;
        } else {
            actionButtons = editBtn + deleteBtn;
        }

        const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${item.nama_aplikasi || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${item.jenis_laporan}</td>
                <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title="${item.keterangan}">${item.keterangan}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${item.nama_pelapor}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 py-1 text-xs rounded-full ${statusClass}">${item.status_laporan}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionButtons}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    setupLaporanPagination(currentFilteredReports.length);
}

/**
 * Membuat tombol Pagination
 */
function setupLaporanPagination(total) {
    const container = document.getElementById('laporan-pagination');
    if (!container) return;
    container.innerHTML = '';
    
    const pages = Math.ceil(total / laporanPerPage);
    if (pages <= 1) return;

    container.innerHTML += `<button class="page-btn" onclick="changeLaporanPage(${laporanPage - 1})" ${laporanPage === 1 ? 'disabled' : ''}>Prev</button>`;
    for (let i = 1; i <= pages; i++) {
        container.innerHTML += `<button class="page-btn ${i === laporanPage ? 'active' : ''}" onclick="changeLaporanPage(${i})">${i}</button>`;
    }
    container.innerHTML += `<button class="page-btn" onclick="changeLaporanPage(${laporanPage + 1})" ${laporanPage === pages ? 'disabled' : ''}>Next</button>`;
}

// Fungsi global untuk onclick pagination
window.changeLaporanPage = function(p) {
    laporanPage = p;
    renderLaporanTable();
    document.getElementById('laporan-table-container')?.scrollIntoView({ behavior: 'smooth' });
}

// --- MODAL HANDLERS ---

window.openLaporanEdit = function(id) {
    const item = allReports.find(r => r.id_report_app == id);
    if (!item) return;
    document.getElementById('edit-laporan-id').value = id;
    document.getElementById('edit-laporan-app').value = item.nama_aplikasi;

    // Set checkboxes (jika ada banyak jenis)
    const types = item.jenis_laporan ? item.jenis_laporan.split(',').map(s => s.trim()) : [];
    const checkboxes = document.querySelectorAll('input[name="edit-kategori-laporan"]');
    checkboxes.forEach(cb => {
        cb.checked = types.includes(cb.value);
    });

    document.getElementById('edit-laporan-ket').value = item.keterangan;
    openModal('modal-laporan-edit');
}

window.openLaporanDelete = function(id) {
    document.getElementById('delete-laporan-id').value = id;
    openModal('modal-laporan-delete');
}

window.openLaporanStatus = function(id, currentStatus) {
    document.getElementById('status-laporan-id').value = id;
    document.getElementById('status-laporan-select').value = currentStatus;
    openModal('modal-laporan-status');
}

/**
 * Pasang Event Listeners
 */
function attachLaporanListeners() {
    // Filter
    let searchTimeout;
    document.getElementById('laporan-search')?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleLaporanFilter, 300);
    });
    document.getElementById('laporan-filter-status')?.addEventListener('change', handleLaporanFilter);

    // Event Delegation untuk tombol di tabel
    document.getElementById('laporan-table-body')?.addEventListener('click', (e) => {
        const target = e.target;
        const btn = target.closest('button');
        if (!btn) return;
        
        const id = btn.getAttribute('data-id');
        if (!id) return;
        
        const reportData = allReports.find(r => r.id_report_app == id);
        if (!reportData) return;

        if (btn.classList.contains('btn-laporan-edit')) {
            openLaporanEdit(reportData.id_report_app);
        } else if (btn.classList.contains('btn-laporan-delete')) {
            openLaporanDelete(reportData.id_report_app);
        } else if (btn.classList.contains('btn-laporan-status')) {
            openLaporanStatus(reportData.id_report_app, reportData.status_laporan);
        }
    });

    // Submit Edit
    document.getElementById('form-laporan-edit')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-laporan-id').value;
        
        // Ambil value checkbox
        const checkedKategori = [];
        document.querySelectorAll('input[name="edit-kategori-laporan"]:checked').forEach(cb => {
            checkedKategori.push(cb.value);
        });

        const data = {
            jenis_laporan: checkedKategori.join(', '),
            keterangan: document.getElementById('edit-laporan-ket').value
        };
        await sendLaporanRequest(`http://localhost:5000/api/laporan/${id}`, 'PUT', data, 'modal-laporan-edit');
    });

    // Submit Delete
    document.getElementById('form-laporan-delete')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('delete-laporan-id').value;
        await sendLaporanRequest(`http://localhost:5000/api/laporan/${id}`, 'DELETE', {}, 'modal-laporan-delete');
    });

    // Submit Status (Admin)
    document.getElementById('form-laporan-status')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('status-laporan-id').value;
        const status = document.getElementById('status-laporan-select').value;
        await sendLaporanRequest(`http://localhost:5000/api/laporan/${id}/status`, 'PATCH', { status_laporan: status }, 'modal-laporan-status');
    });
}

/**
 * Helper untuk kirim request ke API
 */
async function sendLaporanRequest(url, method, body, modalId) {
    try {
        const opts = {
            method: method,
            headers: { 
                'Authorization': `Bearer ${laporanToken}`, 
                'Content-Type': 'application/json' 
            }
        };
        if (method !== 'DELETE') opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);
        const resData = await res.json();

        if (res.ok) {
            closeModal(modalId);
            loadLaporanData(); // Reload tabel
            alert('Berhasil!');
        } else {
            alert(`Gagal: ${resData.message || 'Terjadi kesalahan'}`);
        }
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan koneksi ke server.');
    }
}