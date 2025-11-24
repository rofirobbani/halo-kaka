// --- File: frontend/js/tabs/tab_pengguna.js ---

// Variabel Global untuk Tab Ini
let allUsers = [];
let currentFilteredUsers = [];
let userPage = 1;
const userPerPage = 10;

// 1. Fungsi Utama Inisialisasi (DITEMPEL KE WINDOW AGAR TERBACA GLOBAL)
window.initTabPengguna = async function() {
    console.log("Fungsi initTabPengguna dimulai...");

    // Ambil Token & Role TERBARU setiap kali tab dibuka
    const currentRole = localStorage.getItem('haloKakaUserRole');

    // Security Check: Frontend Guard
    const container = document.getElementById('user-table-container');
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
    const searchInput = document.getElementById('user-search');
    const roleInput = document.getElementById('user-filter-role');
    
    if (searchInput) searchInput.value = '';
    if (roleInput) roleInput.value = '';
    userPage = 1;

    attachUserListeners(); 
    await loadUserData();  
}

// 2. Load Data dari API
async function loadUserData() {
    const loading = document.getElementById('user-loading');
    const container = document.getElementById('user-table-container');
    const noData = document.getElementById('user-no-data');
    const errorEl = document.getElementById('user-error');
    
    if(!loading || !container) return;

    loading.style.display = 'block';
    container.style.display = 'none';
    if(noData) noData.style.display = 'none';
    if(errorEl) errorEl.style.display = 'none';

    try {
        const token = localStorage.getItem('haloKakaToken');
        const res = await fetch('http://localhost:5000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Gagal mengambil data pengguna');
        
        allUsers = await res.json();
        // Urutkan user terbaru
        allUsers.sort((a, b) => b.id_user - a.id_user);

        handleUserFilter(); 
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
function handleUserFilter() {
    const searchInput = document.getElementById('user-search');
    const roleInput = document.getElementById('user-filter-role');

    if (!searchInput || !roleInput) return;

    const query = searchInput.value.toLowerCase();
    const roleFilter = roleInput.value;

    currentFilteredUsers = allUsers.filter(u => {
        const matchQuery = (u.nama && u.nama.toLowerCase().includes(query)) ||
                           (u.username && u.username.toLowerCase().includes(query)) ||
                           (u.email && u.email.toLowerCase().includes(query)) ||
                           (u.satker && u.satker.toLowerCase().includes(query));
        
        const matchRole = !roleFilter || u.role === roleFilter;
        return matchQuery && matchRole;
    });

    userPage = 1;
    renderUserTable();
}

// 4. Render Tabel
function renderUserTable() {
    const tbody = document.getElementById('user-table-body');
    const container = document.getElementById('user-table-container');
    const noData = document.getElementById('user-no-data');
    const pageInfo = document.getElementById('user-page-info');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (currentFilteredUsers.length === 0) {
        container.style.display = 'none';
        if(noData) noData.style.display = 'block';
        if(pageInfo) pageInfo.innerText = "0 data ditemukan";
        setupUserPagination(0);
        return;
    }

    container.style.display = 'block';
    if(noData) noData.style.display = 'none';

    const start = (userPage - 1) * userPerPage;
    const end = start + userPerPage;
    const items = currentFilteredUsers.slice(start, end);

    if(pageInfo) pageInfo.innerText = `Menampilkan ${start + 1}-${Math.min(end, currentFilteredUsers.length)} dari ${currentFilteredUsers.length} pengguna`;

    const fragment = document.createDocumentFragment();

    items.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors";
        
        const roleBadge = u.role === 'Admin' 
            ? '<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-semibold border border-purple-200">Admin</span>' 
            : '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold border border-blue-200">User</span>';
        
        const lastLogin = u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : '<span class="text-gray-400 italic">Belum pernah</span>';

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium text-gray-900">${u.nama}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                <div class="text-gray-700">${u.email}</div>
                <div class="text-xs text-gray-400 mt-0.5">${u.no_hp || '-'}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${u.satker || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium mb-1">${u.username}</div>
                ${roleBadge}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${lastLogin}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openUserEdit(${u.id_user})" class="text-accent hover:text-accent-dark mr-3 transition-colors">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="openUserDelete(${u.id_user}, '${u.nama.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-700 transition-colors">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    setupUserPagination(currentFilteredUsers.length);
}

// 5. Pagination Logic
function setupUserPagination(total) {
    const container = document.getElementById('user-pagination');
    if (!container) return;
    
    let html = '';
    const pages = Math.ceil(total / userPerPage);
    
    if (pages <= 1) {
        container.innerHTML = '';
        return;
    }

    html += `<button class="page-btn mx-1 px-3 py-1 rounded border ${userPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}" 
             onclick="changeUserPage(${userPage - 1})" ${userPage === 1 ? 'disabled' : ''}>Prev</button>`;

    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= userPage - 1 && i <= userPage + 1)) {
            const activeClass = i === userPage ? 'bg-accent text-white border-accent' : 'bg-white text-gray-700 hover:bg-gray-50';
            html += `<button class="page-btn mx-1 px-3 py-1 rounded border ${activeClass}" onclick="changeUserPage(${i})">${i}</button>`;
        } else if (i === userPage - 2 || i === userPage + 2) {
             html += `<span class="px-2 text-gray-400">...</span>`;
        }
    }

    html += `<button class="page-btn mx-1 px-3 py-1 rounded border ${userPage === pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}" 
             onclick="changeUserPage(${userPage + 1})" ${userPage === pages ? 'disabled' : ''}>Next</button>`;

    container.innerHTML = html;
}

// --- GLOBAL HELPERS ---

window.changeUserPage = function(p) {
    userPage = p;
    renderUserTable();
    const tableTop = document.getElementById('user-table-container');
    if(tableTop) tableTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.openUserAdd = function() {
    const form = document.getElementById('form-user-edit');
    if(!form) return;

    form.reset();
    document.getElementById('edit-user-id').value = ''; 
    document.getElementById('modal-user-title').innerText = 'Tambah Pengguna Baru';
    
    const passInput = document.getElementById('edit-user-password');
    if(passInput) {
        passInput.required = true; 
        passInput.placeholder = 'Masukkan password...';
    }
    
    if(typeof openModal === 'function') openModal('modal-user-edit');
}

window.openUserEdit = function(id) {
    const u = allUsers.find(x => x.id_user == id);
    if (!u) return;

    document.getElementById('edit-user-id').value = u.id_user;
    document.getElementById('edit-user-nama').value = u.nama;
    document.getElementById('edit-user-email').value = u.email;
    document.getElementById('edit-user-satker').value = u.satker;
    document.getElementById('edit-user-hp').value = u.no_hp;
    document.getElementById('edit-user-username').value = u.username;
    document.getElementById('edit-user-role').value = u.role;
    
    const passInput = document.getElementById('edit-user-password');
    if(passInput) {
        passInput.value = ''; 
        passInput.required = false; 
        passInput.placeholder = '(Biarkan kosong jika tidak diubah)';
    }

    document.getElementById('modal-user-title').innerText = 'Edit Data Pengguna';
    
    if(typeof openModal === 'function') openModal('modal-user-edit');
}

window.openUserDelete = function(id, nama) {
    document.getElementById('delete-user-id').value = id;
    document.getElementById('delete-user-name').innerText = nama;
    if(typeof openModal === 'function') openModal('modal-user-delete');
}

function attachUserListeners() {
    const btnTambah = document.getElementById('btn-tambah-user');
    if(btnTambah) {
        const newBtn = btnTambah.cloneNode(true);
        btnTambah.parentNode.replaceChild(newBtn, btnTambah);
        newBtn.addEventListener('click', window.openUserAdd);
    }

    const searchInput = document.getElementById('user-search');
    const roleInput = document.getElementById('user-filter-role');

    if(searchInput) {
        searchInput.oninput = function() {
             clearTimeout(this.delay);
             this.delay = setTimeout(handleUserFilter, 300);
        };
    }
    
    if(roleInput) {
        roleInput.onchange = handleUserFilter;
    }

    const formEdit = document.getElementById('form-user-edit');
    if(formEdit) {
        formEdit.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-user-id').value;
            
            const data = {
                nama: document.getElementById('edit-user-nama').value,
                email: document.getElementById('edit-user-email').value,
                satker: document.getElementById('edit-user-satker').value,
                no_hp: document.getElementById('edit-user-hp').value,
                username: document.getElementById('edit-user-username').value,
                role: document.getElementById('edit-user-role').value,
                password: document.getElementById('edit-user-password').value
            };

            let url = 'http://localhost:5000/api/users';
            let method = 'POST';
            
            if (id) { 
                url = `http://localhost:5000/api/users/${id}`;
                method = 'PUT';
            }

            await sendUserRequest(url, method, data, 'modal-user-edit');
        };
    }

    const formDelete = document.getElementById('form-user-delete');
    if(formDelete) {
        formDelete.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('delete-user-id').value;
            await sendUserRequest(`http://localhost:5000/api/users/${id}`, 'DELETE', {}, 'modal-user-delete');
        };
    }
}

async function sendUserRequest(url, method, body, modalId) {
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
            loadUserData();
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