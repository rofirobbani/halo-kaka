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

        // Logika Tombol Aksi
        let btns = '';
        
        if (laporanRole === 'Admin') {
            // Admin: Semua akses
            btns += `<button data-id="${item.id_report_app}" class="btn-laporan-edit text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>`;
            btns += `<button data-id="${item.id_report_app}" class="btn-laporan-delete text-red-600 hover:text-red-900 mr-3">Delete</button>`;
            btns += `<button data-id="${item.id_report_app}" class="btn-laporan-status text-green-600 hover:text-green-900">Status</button>`;
        } else {
            // User: Cek status (hanya bisa edit jika Belum diproses)
            const isLocked = (item.status_laporan === 'Selesai' || item.status_laporan === 'Sedang Diperbaiki');
            const disabledClass = isLocked ? 'opacity-50 cursor-not-allowed' : '';
            const disabledAttr = isLocked ? 'disabled' : '';
            
            btns += `<button data-id="${item.id_report_app}" class="btn-laporan-edit text-indigo-600 hover:text-indigo-900 mr-3 ${disabledClass}" ${disabledAttr}>Edit</button>`;
            btns += `<button data-id="${item.id_report_app}" class="btn-laporan-delete text-red-600 hover:text-red-900 ${disabledClass}" ${disabledAttr}>Delete</button>`;
        }

        const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${item.nama_aplikasi || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${item.jenis_laporan}</td>
                <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title="${item.keterangan}">${item.keterangan}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${item.nama_pelapor}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 py-1 text-xs rounded-full ${statusClass}">${item.status_laporan}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${btns}</td>
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

// --- MODAL HANDLERS (Global Scope agar bisa dipanggil onclick jika perlu, tapi di sini kita pakai Event Delegation) ---

window.openLaporanEdit = function(id) {
    const item = allReports.find(r => r.id_report_app == id);
    if (!item) return;
    
    document.getElementById('edit-laporan-id').value = id;
    document.getElementById('edit-laporan-app').value = item.nama_aplikasi;
    
    // UPDATE: Set checkboxes berdasarkan string jenis_laporan
    // (Misal: "Error, Inactive" -> checkbox 'Error' dan 'Inactive' dicentang)
    const checkboxes = document.querySelectorAll('input[name="edit-kategori-laporan"]');
    checkboxes.forEach(cb => cb.checked = false); // Reset dulu

    if (item.jenis_laporan) {
        const types = item.jenis_laporan.split(',').map(s => s.trim());
        checkboxes.forEach(cb => {
            if (types.includes(cb.value)) {
                cb.checked = true;
            }
        });
    }

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
        
        // UPDATE: Kumpulkan value dari checkbox
        const checkedKategori = [];
        document.querySelectorAll('input[name="edit-kategori-laporan"]:checked').forEach(cb => {
            checkedKategori.push(cb.value);
        });

        const data = {
            jenis_laporan: checkedKategori.join(', '), // Gabung jadi string
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
        } else {
            alert(`Gagal: ${resData.message || 'Terjadi kesalahan'}`);
        }
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan koneksi ke server.');
    }
}