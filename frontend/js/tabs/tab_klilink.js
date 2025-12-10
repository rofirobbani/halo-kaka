// --- File: frontend/js/tabs/tab_klilink.js ---

let allKlilinks = [];
let currentFilteredKlilinks = [];
const klilinkToken = localStorage.getItem('haloKakaToken');
const klilinkRole = localStorage.getItem('haloKakaUserRole');
const klilinkUser = localStorage.getItem('haloKakaUserName');

let klilinkPage = 1;
const klilinkPerPage = 10;

// --- INIT ---
window.initTabKlilink = async function() {
    console.log("Init Tab Klilink...");
    const container = document.getElementById('klilink-table-container');
    
    if (!klilinkToken) {
        if(container) container.innerHTML = '<p class="text-red-500 p-4">Sesi habis. Silakan login.</p>';
        return;
    }

    // Setup listener
    attachKlilinkListeners();
    await loadKlilinkData();
}

// --- LOAD DATA ---
async function loadKlilinkData() {
    const loading = document.getElementById('klilink-loading');
    const container = document.getElementById('klilink-table-container');
    const noData = document.getElementById('klilink-no-data');
    
    if(loading) loading.style.display = 'block';
    if(container) container.style.display = 'none';
    if(noData) noData.style.display = 'none';

    try {
        const res = await fetch('http://localhost:5000/api/klilink', {
            headers: { 'Authorization': `Bearer ${klilinkToken}` }
        });

        if (!res.ok) throw new Error('Gagal mengambil data');
        
        const data = await res.json();
        
        if (klilinkRole === 'Admin') {
            allKlilinks = data;
        } else {
            allKlilinks = data.filter(item => item.pembuat === klilinkUser);
        }

        // Urutkan ID terbaru
        allKlilinks.sort((a, b) => b.id_link - a.id_link);

        populateKlilinkKategori(allKlilinks);
        handleKlilinkFilter();

    } catch (err) {
        console.error(err);
        const errEl = document.getElementById('klilink-error');
        if(errEl) {
            errEl.innerText = "Gagal memuat data: " + err.message;
            errEl.style.display = 'block';
        }
    } finally {
        if(loading) loading.style.display = 'none';
    }
}

// --- FILTER & RENDER ---
function handleKlilinkFilter() {
    const query = document.getElementById('klilink-search').value.toLowerCase();
    const kategori = document.getElementById('klilink-filter-kategori').value;

    currentFilteredKlilinks = allKlilinks.filter(item => {
        const matchQuery = (item.nama && item.nama.toLowerCase().includes(query)) ||
                           (item.keterangan && item.keterangan.toLowerCase().includes(query));
        const matchCat = !kategori || item.kategori === kategori;
        return matchQuery && matchCat;
    });

    klilinkPage = 1;
    renderKlilinkTable();
}

function renderKlilinkTable() {
    const tbody = document.getElementById('klilink-table-body');
    const container = document.getElementById('klilink-table-container');
    const noData = document.getElementById('klilink-no-data');
    const pageInfo = document.getElementById('klilink-page-info');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (currentFilteredKlilinks.length === 0) {
        container.style.display = 'none';
        noData.style.display = 'block';
        pageInfo.innerText = "0 link ditemukan";
        setupKlilinkPagination(0);
        return;
    }

    container.style.display = 'block';
    noData.style.display = 'none';

    const start = (klilinkPage - 1) * klilinkPerPage;
    const end = start + klilinkPerPage;
    const items = currentFilteredKlilinks.slice(start, end);

    pageInfo.innerText = `Menampilkan ${start + 1}-${Math.min(end, currentFilteredKlilinks.length)} dari ${currentFilteredKlilinks.length} link`;

    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50";

        const passDisplay = item.password 
            ? `<span class="font-mono bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs border border-yellow-200">${item.password}</span>` 
            : '<span class="text-gray-400 text-xs">-</span>';

        // Toggle Switch untuk Tampil?
        const isChecked = item.flagview === 1 ? 'checked' : '';
        const toggleSwitch = `
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" ${isChecked} onchange="toggleKlilinkView('${item.id_link}', this.checked)">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
        `;

        // --- UPDATE: Tombol Aksi menggunakan Ikon SVG ---
        const editBtn = `
            <button onclick="openKlilinkEdit(${item.id_link})" class="text-accent hover:text-accent-dark mr-3 transition-colors" title="Edit">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>`;
        
        const deleteBtn = `
            <button onclick="openKlilinkDelete(${item.id_link}, '${item.nama.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>`;

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-normal break-words max-w-xs font-medium text-gray-900">
                ${item.nama}
            </td>
            <td class="px-6 py-4 text-sm text-accent truncate max-w-xs">
                <a href="${item.link}" target="_blank" class="hover:underline" title="${item.link}">${item.link}</a>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${item.kategori || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${item.pembuat}</td>
            <td class="px-6 py-4 text-sm">${passDisplay}</td>
            <td class="px-6 py-4 text-center whitespace-nowrap">
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
    setupKlilinkPagination(currentFilteredKlilinks.length);
}

function setupKlilinkPagination(total) {
    const container = document.getElementById('klilink-pagination');
    if (!container) return;
    container.innerHTML = '';
    const pages = Math.ceil(total / klilinkPerPage);
    if (pages <= 1) return;

    container.innerHTML += `<button class="page-btn" onclick="changeKlilinkPage(${klilinkPage - 1})" ${klilinkPage === 1 ? 'disabled' : ''}>Prev</button>`;
    for(let i=1; i<=pages; i++){
        container.innerHTML += `<button class="page-btn ${i===klilinkPage?'active':''}" onclick="changeKlilinkPage(${i})">${i}</button>`;
    }
    container.innerHTML += `<button class="page-btn" onclick="changeKlilinkPage(${klilinkPage + 1})" ${klilinkPage === pages ? 'disabled' : ''}>Next</button>`;
}

function populateKlilinkKategori(data) {
    const setKat = new Set(data.map(i => i.kategori).filter(Boolean));
    const sel = document.getElementById('klilink-filter-kategori');
    if(sel) {
        sel.innerHTML = '<option value="">Semua Kategori</option>';
        setKat.forEach(k => sel.innerHTML += `<option value="${k}">${k}</option>`);
    }
}

// --- HELPERS GLOBAL ---

window.changeKlilinkPage = function(p) {
    klilinkPage = p;
    renderKlilinkTable();
}

// Handler Toggle View
window.toggleKlilinkView = async function(id, isChecked) {
    try {
        const res = await fetch(`http://localhost:5000/api/klilink/${id}/toggle`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${klilinkToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ flagview: isChecked ? 1 : 0 })
        });
        
        if (!res.ok) {
            loadKlilinkData(); // Revert checkbox if failed
            alert('Gagal mengubah status view.');
        } else {
            // Update local data tanpa reload penuh
            const item = allKlilinks.find(i => i.id_link == id);
            if (item) item.flagview = isChecked ? 1 : 0;
        }
    } catch (err) {
        console.error(err);
        loadKlilinkData(); // Revert
    }
}

window.toggleKlilinkPassword = function(checked) {
    const div = document.getElementById('edit-klilink-pass-container');
    const input = document.getElementById('edit-klilink-password');
    if(checked) {
        div.classList.remove('hidden');
    } else {
        div.classList.add('hidden');
        input.value = ''; // Clear password if unchecked
    }
}

window.openKlilinkEdit = function(id) {
    const item = allKlilinks.find(i => i.id_link == id);
    if(!item) return;

    document.getElementById('edit-klilink-id').value = item.id_link;
    document.getElementById('edit-klilink-nama').value = item.nama;
    document.getElementById('edit-klilink-kategori').value = item.kategori;
    document.getElementById('edit-klilink-keterangan').value = item.keterangan;
    document.getElementById('edit-klilink-url').value = item.link;

    const hasPass = !!item.password;
    document.getElementById('edit-klilink-toggle-pass').checked = hasPass;
    toggleKlilinkPassword(hasPass);
    if(hasPass) document.getElementById('edit-klilink-password').value = item.password;

    document.getElementById('modal-klilink-title').innerText = "Edit Link";
    
    if(typeof openModal === 'function') openModal('modal-klilink-edit');
}

window.openKlilinkDelete = function(id, nama) {
    document.getElementById('delete-klilink-id').value = id;
    document.getElementById('delete-klilink-name').innerText = nama;
    if(typeof openModal === 'function') openModal('modal-klilink-delete');
}

// --- LISTENERS ---
function attachKlilinkListeners() {
    // Tambah Baru (Reset Form)
    document.getElementById('btn-tambah-klilink')?.addEventListener('click', () => {
        document.getElementById('form-klilink-edit').reset();
        document.getElementById('edit-klilink-id').value = '';
        document.getElementById('modal-klilink-title').innerText = "Tambah Link";
        toggleKlilinkPassword(false);
        if(typeof openModal === 'function') openModal('modal-klilink-edit');
    });

    // Filter
    document.getElementById('klilink-search')?.addEventListener('input', () => setTimeout(handleKlilinkFilter, 300));
    document.getElementById('klilink-filter-kategori')?.addEventListener('change', handleKlilinkFilter);

    // Submit Edit/Add
    document.getElementById('form-klilink-edit')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-klilink-id').value;
        const data = {
            nama: document.getElementById('edit-klilink-nama').value,
            kategori: document.getElementById('edit-klilink-kategori').value,
            keterangan: document.getElementById('edit-klilink-keterangan').value,
            link: document.getElementById('edit-klilink-url').value,
            password: document.getElementById('edit-klilink-password').value
        };

        let url = 'http://localhost:5000/api/klilink';
        let method = 'POST';
        if(id) {
            url += `/${id}`;
            method = 'PUT';
        }

        await sendKlilinkRequest(url, method, data, 'modal-klilink-edit');
    });

    // Submit Delete
    document.getElementById('form-klilink-delete')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('delete-klilink-id').value;
        await sendKlilinkRequest(`http://localhost:5000/api/klilink/${id}`, 'DELETE', {}, 'modal-klilink-delete');
    });
}

async function sendKlilinkRequest(url, method, body, modalId) {
    try {
        const opts = {
            method: method,
            headers: {
                'Authorization': `Bearer ${klilinkToken}`,
                'Content-Type': 'application/json'
            }
        };
        if(method !== 'DELETE') opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);
        const json = await res.json();

        if(res.ok) {
            if(typeof closeModal === 'function') closeModal(modalId);
            loadKlilinkData();
            alert('Berhasil disimpan!');
        } else {
            alert('Gagal: ' + json.message);
        }
    } catch(e) {
        console.error(e);
        alert('Error koneksi.');
    }
}