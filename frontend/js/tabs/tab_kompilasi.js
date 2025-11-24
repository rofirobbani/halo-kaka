// --- File: frontend/js/tabs/tab_kompilasi.js ---

let allApps = [];
let currentFilteredApps = [];
const kompToken = localStorage.getItem('haloKakaToken');
const kompRole = localStorage.getItem('haloKakaUserRole');

let kompPage = 1;
const kompPerPage = 10;

async function initTabKompilasi() {
    console.log("Logika tab_kompilasi.js dimuat");

    if (kompRole !== 'Admin') {
        document.getElementById('kompilasi-table-container').innerHTML = '<p class="text-red-500 p-4">Akses Ditolak.</p>';
        return;
    }

    await loadKompilasiData();
    attachKompilasiListeners();
}

async function loadKompilasiData() {
    const loading = document.getElementById('kompilasi-loading');
    const container = document.getElementById('kompilasi-table-container');
    const noData = document.getElementById('kompilasi-no-data');
    const errorEl = document.getElementById('kompilasi-error');
    
    loading.style.display = 'block';
    container.style.display = 'none';
    noData.style.display = 'none';
    errorEl.style.display = 'none';

    try {
        const res = await fetch('http://localhost:5000/api/kompilasi', {
            headers: { 'Authorization': `Bearer ${kompToken}` }
        });

        if (!res.ok) throw new Error('Gagal mengambil data aplikasi');
        
        allApps = await res.json();
        handleKompilasiFilter(); 
    } catch (err) {
        console.error(err);
        errorEl.innerText = `Gagal memuat data: ${err.message}`;
        errorEl.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function handleKompilasiFilter() {
    const query = document.getElementById('kompilasi-search').value.toLowerCase();
    const statusView = document.getElementById('kompilasi-filter-status').value; // 'active' | 'inactive'

    currentFilteredApps = allApps.filter(a => {
        const matchQuery = (a.nama && a.nama.toLowerCase().includes(query)) ||
                           (a.developer && a.developer.toLowerCase().includes(query)) ||
                           (a.kategori && a.kategori.toLowerCase().includes(query));
        
        let matchStatus = true;
        if (statusView === 'active') matchStatus = (a.flag_view === 1);
        if (statusView === 'inactive') matchStatus = (a.flag_view === 0);
        
        return matchQuery && matchStatus;
    });

    kompPage = 1;
    renderKompilasiTable();
}

function renderKompilasiTable() {
    const tbody = document.getElementById('kompilasi-table-body');
    const container = document.getElementById('kompilasi-table-container');
    const noData = document.getElementById('kompilasi-no-data');
    const pageInfo = document.getElementById('kompilasi-page-info');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (currentFilteredApps.length === 0) {
        container.style.display = 'none';
        noData.style.display = 'block';
        pageInfo.innerText = "Menampilkan 0 dari 0 aplikasi";
        setupKompilasiPagination(0);
        return;
    }

    container.style.display = 'block';
    noData.style.display = 'none';

    const start = (kompPage - 1) * kompPerPage;
    const end = start + kompPerPage;
    const items = currentFilteredApps.slice(start, end);

    pageInfo.innerText = `Menampilkan ${start + 1}-${Math.min(end, currentFilteredApps.length)} dari ${currentFilteredApps.length} aplikasi`;

    const fragment = document.createDocumentFragment();

    items.forEach(a => {
        const tr = document.createElement('tr');
        
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

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
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
                <button onclick="openKompilasiEdit('${a.id_app}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button onclick="openKompilasiDelete('${a.id_app}', '${a.nama.replace(/'/g, "\\'")}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    setupKompilasiPagination(currentFilteredApps.length);
}

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

window.changeKompilasiPage = function(p) {
    kompPage = p;
    renderKompilasiTable();
    document.getElementById('kompilasi-table-container')?.scrollIntoView({ behavior: 'smooth' });
}

// --- HANDLERS ---

window.toggleAppView = async function(id, isChecked) {
    try {
        const res = await fetch(`http://localhost:5000/api/kompilasi/${id}/toggle-view`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${kompToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ flag_view: isChecked ? 1 : 0 })
        });
        
        if (!res.ok) {
            // Revert checkbox if failed
            loadKompilasiData(); 
            alert('Gagal mengubah status view.');
        } else {
            // Update local data
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
    document.getElementById('edit-kompilasi-logo').value = a.logo;
    document.getElementById('edit-kompilasi-status').value = a.status_aplikasi;

    openModal('modal-kompilasi-edit');
}

window.openKompilasiDelete = function(id, nama) {
    document.getElementById('delete-kompilasi-id').value = id;
    document.getElementById('delete-kompilasi-name').innerText = nama;
    openModal('modal-kompilasi-delete');
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
    if(filterStatus) filterStatus.onchange = handleKompilasiFilter;

    // Submit Edit
    const formEdit = document.getElementById('form-kompilasi-edit');
    if(formEdit) {
        formEdit.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-kompilasi-id').value;
            
            const data = {
                nama: document.getElementById('edit-kompilasi-nama').value,
                tahun_buat: document.getElementById('edit-kompilasi-tahun').value,
                kategori: document.getElementById('edit-kompilasi-kategori').value,
                penjelasan: document.getElementById('edit-kompilasi-penjelasan').value,
                link: document.getElementById('edit-kompilasi-link').value,
                developer: document.getElementById('edit-kompilasi-developer').value,
                narahubung: document.getElementById('edit-kompilasi-narahubung').value,
                logo: document.getElementById('edit-kompilasi-logo').value,
                status_aplikasi: document.getElementById('edit-kompilasi-status').value
            };

            await sendKompilasiRequest(`http://localhost:5000/api/kompilasi/${id}`, 'PUT', data, 'modal-kompilasi-edit');
        };
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

async function sendKompilasiRequest(url, method, body, modalId) {
    try {
        const opts = {
            method: method,
            headers: { 
                'Authorization': `Bearer ${kompToken}`, 
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
    }
}