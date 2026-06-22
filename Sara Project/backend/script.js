const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');

// Event listener untuk messageInput & sendButton
if (messageInput && sendButton) {
    sendButton.addEventListener('click', handleSend);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

let chatCount = 0;

// ==================== LOAD ANNOUNCEMENTS ====================
async function loadAnnouncements() {
    try {
        const res = await fetch('/api/pengumuman');
        const data = await res.json();

        if(data.length > 0) {
            const latest = data[0];
            const banner = document.getElementById('announcementBanner');
            const text = document.getElementById('announcementText');

            const icon = latest.tipe === 'warning' ? '⚠️' : latest.tipe === 'success' ? '✅' : '📢';
            text.innerHTML = `${icon} <strong>${latest.judul}:</strong> ${latest.isi}`;
            banner.style.display = 'block';
        }
    } catch(e) {
        console.log('No announcements');
    }
}

function closeAnnouncement() {
    document.getElementById('announcementBanner').style.display = 'none';
}

// ==================== FITUR RIWAYAT CHAT (HISTORY) ====================
async function loadChatHistory() {
    try {
        // Mengambil log obrolan dari database (terbuka untuk publik/halaman utama)
        const response = await fetch('/api/chat-logs');
        if (!response.ok) return;
        
        const logs = await response.json();
        if (logs && logs.length > 0) {
            // Urutkan dari yang paling lama ke paling baru agar urutannya pas di layar
            logs.reverse().forEach(log => {
                renderUserMessageSilently(log.user_message);
                renderBotMessageSilently(log.bot_response);
            });
            // Gulung otomatis ke paling bawah setelah semua riwayat dimuat
            scrollToBottom();
        }
    } catch (error) {
        console.error('Gagal memuat riwayat chat:', error);
    }
}

// Fungsi pembantu render riwayat tanpa memicu efek scroll berlebih di awal
function renderUserMessageSilently(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper user';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatMessage(text);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
}

function renderBotMessageSilently(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.textContent = '🤖';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatMessage(text);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
}

// ==================== HANDLE SEND MESSAGE ====================
async function handleSend() {
    const message = messageInput.value.trim();
    if (message === '') {
        messageInput.focus();
        return;
    }

    displayUserMessage(message);
    messageInput.value = '';
    messageInput.focus();

    const loadingBubble = showLoadingBubble();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        removeLoadingBubble(loadingBubble);

        if (response.ok && data.reply) {
            if (data.type === 'location') {
                displayLocationMessage(data);
            } else {
                displayBotMessage(data.reply);
            }
        } else {
            displayBotMessage(`❌ ${data.error || 'Error tidak diketahui'}`);
        }

    } catch (error) {
        removeLoadingBubble(loadingBubble);
        displayBotMessage(`❌ Koneksi error: ${error.message}`);
    }

    // Hitung percakapan untuk memicu modal survey setelah 5 pesan
    chatCount++;
    if(chatCount === 5) {
        setTimeout(() => openSaraModal('modalSurvey'), 2000);
    }
}

function displayUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper user';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatMessage(text);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function displayBotMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.textContent = '🤖';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatMessage(text);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function displayLocationMessage(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.textContent = '🤖';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble location-bubble';
    bubble.innerHTML = `
        <p style="font-weight: bold; margin-bottom: 8px;">${escapeHtml(data.reply)}</p>
        <p style="font-size: 13px; color: #666; margin-bottom: 8px;">${escapeHtml(data.address)}</p>
        <div style="margin: 10px 0; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; font-size: 12px;">
            ${escapeHtml(data.details)}
        </div>
        <a href="${data.maps_url}" target="_blank" rel="noopener noreferrer" class="maps-button">
            📍 Buka di Google Maps
        </a>
    `;
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function showLoadingBubble() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    wrapper.id = 'loading-bubble';
    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.textContent = '🤖';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'typing-indicator';
    loadingDiv.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
    wrapper.appendChild(avatar);
    wrapper.appendChild(loadingDiv);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
}

function removeLoadingBubble(loadingBubble) {
    if (loadingBubble && loadingBubble.parentNode) {
        loadingBubble.remove();
    }
}

// Perbaikan fungsi scroll dengan set memberi jeda render DOM browser
function scrollToBottom() {
    setTimeout(() => {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 50);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMessage(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

// Tutup modal ketika mengklik area luar content
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('sara-modal')) {
        e.target.classList.remove('show');
    }
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
        color: white; padding: 16px 24px; border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 2001; animation: slideIn 0.3s ease;
        font-size: 14px; font-weight: 500;
        font-family: 'Poppins', sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ SUBMIT CUTI ============
async function submitCuti() {
    try {
        const nama = document.getElementById('cutiNama').value.trim();
        const nip = document.getElementById('cutiNip').value.trim();
        const jenis = document.getElementById('cutiJenis').value;
        const tanggal_mulai = document.getElementById('cutiMulai').value;
        const tanggal_selesai = document.getElementById('cutiSelesai').value;
        const alasan = document.getElementById('cutiAlasan').value.trim();

        if (!nama || !nip || !jenis || !tanggal_mulai || !tanggal_selesai) {
            showToast('⚠️ Semua field wajib diisi!', 'error');
            return;
        }

        if (new Date(tanggal_mulai) > new Date(tanggal_selesai)) {
            showToast('⚠️ Tanggal mulai harus sebelum tanggal selesai!', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('nama', nama);
        formData.append('nip', nip);
        formData.append('jenis', jenis);
        formData.append('tanggal_mulai', tanggal_mulai);
        formData.append('tanggal_selesai', tanggal_selesai);
        formData.append('alasan', alasan);

        const file = document.getElementById('cutiLampiran').files[0];
        if(file) {
            if(file.size > 5 * 1024 * 1024) {
                showToast('❌ Ukuran file terlalu besar (max 5MB)', 'error');
                return;
            }
            formData.append('lampiran', file);
        }

        const btn = document.getElementById('cutiSubmitBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Mengirim...';

        const res = await fetch('/api/submissions', {
            method: 'POST',
            body: formData
        });

        const result = await res.json();
        
        if (res.ok && result.success) {
            showToast('✅ ' + result.message, 'success');
            
            document.getElementById('cutiNama').value = '';
            document.getElementById('cutiNip').value = '';
            document.getElementById('cutiJenis').value = 'tahunan';
            document.getElementById('cutiMulai').value = '';
            document.getElementById('cutiSelesai').value = '';
            document.getElementById('cutiAlasan').value = '';
            document.getElementById('cutiLampiran').value = '';
            
            closeModal('modalCuti');
        } else {
            showToast('❌ ' + (result.message || result.error || 'Gagal mengirim pengajuan'), 'error');
        }

        btn.disabled = false;
        btn.textContent = '📤 Kirim Pengajuan';
    } catch(e) {
        console.error('❌ Exception:', e);
        showToast('❌ Terjadi kesalahan: ' + e.message, 'error');
        const btn = document.getElementById('cutiSubmitBtn');
        btn.disabled = false;
        btn.textContent = '📤 Kirim Pengajuan';
    }
}

// ============ SURVEY RATING ============
let currentRating = 5;
function setRating(n) {
    currentRating = n;
    document.getElementById('surveyRating').value = n;
    const stars = document.querySelectorAll('#starContainer span');
    stars.forEach((s, i) => {
        s.style.opacity = i < n ? '1' : '0.3';
        s.style.filter = i < n ? 'grayscale(0)' : 'grayscale(1)';
    });
}

async function submitSurvey() {
    try {
        const data = {
            nama: document.getElementById('surveyNama').value || 'Anonim',
            rating: currentRating,
            saran: document.getElementById('surveySaran').value
        };

        const btn = document.getElementById('surveySubmitBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Mengirim...';

        const res = await fetch('/api/survey', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await res.json();
        
        if (res.ok) {
            showToast('✅ ' + result.message, 'success');
            document.getElementById('surveyNama').value = '';
            document.getElementById('surveySaran').value = '';
            setRating(5);
            closeModal('modalSurvey');
        } else {
            showToast('❌ ' + (result.message || result.error || 'Gagal mengirim survey'), 'error');
        }

        btn.disabled = false;
        btn.textContent = '✅ Kirim Feedback';
    } catch(e) {
        console.error('❌ Exception:', e);
        showToast('❌ Terjadi kesalahan: ' + e.message, 'error');
        const btn = document.getElementById('surveySubmitBtn');
        btn.disabled = false;
        btn.textContent = '✅ Kirim Feedback';
    }
}

// ==================== ENGINE MODAL MODEREN SARA ====================
function openSaraModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.add('show');
        
        if(modalId === 'modalStatusCuti') {
            document.getElementById('formCutiSection').style.display = 'block';
            document.getElementById('resultCutiSection').style.display = 'none';
            document.getElementById('inputNipCuti').value = '';
        }
        if(modalId === 'modalBalasanHR') {
            document.getElementById('formBalasanSection').style.display = 'block';
            document.getElementById('resultBalasanSection').style.display = 'none';
            document.getElementById('inputNamaBalasan').value = '';
        }
    }
}

function closeSaraModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('show');
}

function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// ==================== OPERASI FETCH DATA KE MODAL ====================

async function submitCekCuti() {
    const nip = document.getElementById('inputNipCuti').value.trim();
    if (!nip) {
        showToast('NIP tidak boleh kosong!', 'error');
        return;
    }

    const resultSection = document.getElementById('resultCutiSection');
    const formSection = document.getElementById('formCutiSection');

    try {
        const response = await fetch(`/api/check-status/${nip}`);
        const result = await response.json();

        formSection.style.display = 'none';
        resultSection.style.display = 'block';

        if (!result.success || !result.data || result.data.length === 0) {
            resultSection.innerHTML = `
                <div style="text-align:center; padding:20px; color:#666;">
                    ❌ Data pengajuan cuti untuk NIP <b>${escapeHtml(nip)}</b> tidak ditemukan.
                </div>
                <button class="modal-btn-submit" style="margin-top:15px; background:#718096;" onclick="openSaraModal('modalStatusCuti')">Kembali</button>`;
            return;
        }

        let htmlContent = '<h4 style="margin-bottom:12px; color:#333; font-size:14px;">Riwayat Pengajuan Cuti:</h4>';
        result.data.forEach(item => {
            let badgeClass = item.status === 'approved' ? 'status-approved' : (item.status === 'rejected' ? 'status-rejected' : 'status-pending');
            let statusIcon = item.status === 'approved' ? '✅' : (item.status === 'rejected' ? '❌' : '⏳');
            
            htmlContent += `
                <div class="data-card-item">
                    <div class="data-card-title">${escapeHtml(item.jenis)}</div>
                    <div class="data-card-desc">
                        📅 Periode: ${escapeHtml(item.tanggal_mulai)} s/d ${escapeHtml(item.tanggal_selesai)}<br>
                        <span class="status-badge ${badgeClass}">${statusIcon} ${escapeHtml(item.status)}</span>
                    </div>
                </div>`;
        });
        
        htmlContent += `<button class="modal-btn-submit" style="margin-top:15px; background:#718096;" onclick="openSaraModal('modalStatusCuti')">Cari NIP Lain</button>`;
        resultSection.innerHTML = htmlContent;

    } catch(err) {
        console.error(err);
        showToast('Gagal memuat data cuti', 'error');
    }
}

async function submitCekBalasan() {
    const nama = document.getElementById('inputNamaBalasan').value.trim();
    if (!nama) {
        showToast('Nama tidak boleh kosong!', 'error');
        return;
    }

    const resultSection = document.getElementById('resultBalasanSection');
    const formSection = document.getElementById('formBalasanSection');

    try {
        const response = await fetch(`/api/hr-reply/${encodeURIComponent(nama)}`);
        const data = await response.json();

        formSection.style.display = 'none';
        resultSection.style.display = 'block';

        const filteredData = data.filter(item => item.reply);

        if (filteredData.length === 0) {
            resultSection.innerHTML = `
                <div style="text-align:center; padding:20px; color:#666;">
                    ✉️ Belum ada balasan dari tim HR untuk nama <b>${escapeHtml(nama)}</b>.
                </div>
                <button class="modal-btn-submit" style="margin-top:15px; background:#718096;" onclick="openSaraModal('modalBalasanHR')">Kembali</button>`;
            return;
        }

        let htmlContent = '<h4 style="margin-bottom:12px; color:#333; font-size:14px;">Balasan dari HRD:</h4>';
        filteredData.forEach(item => {
            htmlContent += `
                <div class="data-card-item" style="border-left-color: #667eea;">
                    <div class="data-card-title">❓ Pertanyaan Anda:</div>
                    <div class="data-card-desc" style="font-style: italic; margin-bottom: 8px; color: #555;">"${escapeHtml(item.message)}"</div>
                    <div class="data-card-title" style="color: #667eea;">💬 Jawaban HR:</div>
                    <div class="data-card-desc" style="font-weight: 500; color: #1e293b;">${escapeHtml(item.reply)}</div>
                </div>`;
        });

        htmlContent += `<button class="modal-btn-submit" style="margin-top:15px; background:#718096;" onclick="openSaraModal('modalBalasanHR')">Kembali</button>`;
        resultSection.innerHTML = htmlContent;

    } catch(err) {
        console.error(err);
        showToast('Gagal memuat balasan HR', 'error');
    }
}

async function submitKirimHR() {
    const nama = document.getElementById('inputNamaHR').value.trim();
    const pesan = document.getElementById('inputPesanHR').value.trim();

    if (!nama || !pesan) {
        showToast('Nama dan Pesan wajib diisi!', 'error');
        return;
    }

    try {
        const response = await fetch('/api/escalate-to-hr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: nama, message: pesan })
        });

        const data = await response.json();
        
        if (response.ok) {
            closeSaraModal('modalKirimHR');
            displayBotMessage('✅ Pertanyaan Anda berhasil diteruskan ke HR melalui sistem terpadu SARA.');
            showToast('Pesan berhasil terkirim ke HR!', 'success');
        } else {
            showToast(`Gagal: ${data.error || 'Terjadi kesalahan'}`, 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Koneksi bermasalah', 'error');
    }
}

function cekStatus() { openSaraModal('modalStatusCuti'); }
function cekBalasanHR() { openSaraModal('modalBalasanHR'); }
function hubungiHR() {
    openSaraModal('modalKirimHR');
    document.getElementById('inputNamaHR').value = '';
    document.getElementById('inputPesanHR').value = '';
}

// ==================== INITIALIZATION ====================
window.addEventListener('load', async () => {
    // 1. Memuat Pengumuman Banner Atas
    loadAnnouncements();

    // 2. Memuat Seluruh Riwayat Chat yang Ada di SQLite Database
    await loadChatHistory();

    // 3. Cek apakah area chat kosong? Jika kosong (belum ada history), munculkan sapaan otomatis SARA
    if (chatMessages && chatMessages.children.length === 0) {
        setTimeout(() => {
            displayBotMessage('Halo! 👋 Saya SARA, asisten digital untuk PT Samaratu Daya Teknik. Ada yang bisa saya bantu?');
        }, 500);
    }

    // 4. Tes Konektivitas Sistem Backend
    fetch('/api/test')
        .then(res => res.json())
        .then(data => console.log('✅ Server SARA OK:', data))
        .catch(err => console.error('❌ Server error:', err));
});