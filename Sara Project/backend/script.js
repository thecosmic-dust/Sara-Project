// ============ AUTO-LOAD ANNOUNCEMENTS ============
async function loadAnnouncements() {
    try {
        const res = await fetch('/api/pengumuman');
        const announcements = await res.json();
        
        if (announcements.length > 0) {
            const latest = announcements[0];
            document.getElementById('announcementText').textContent = `📢 ${latest.judul}`;
            document.getElementById('announcementBanner').style.display = 'flex';
        }
    } catch (e) {
        console.error('Error loading announcements:', e);
    }
}

function closeAnnouncement() {
    document.getElementById('announcementBanner').style.display = 'none';
}

// ============ CHAT FUNCTIONALITY ============
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

async function handleSend() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Display user message
    displayUserMessage(message);
    messageInput.value = '';
    sendBtn.disabled = true;

    // Show loading
    const loadingBubble = showLoadingBubble();

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        
        removeLoadingBubble(loadingBubble);

        if (data.type === 'location') {
            displayLocationMessage(data);
        } else {
            displayBotMessage(data.reply);
        }
    } catch (e) {
        removeLoadingBubble(loadingBubble);
        displayBotMessage('Maaf, terjadi kesalahan. Coba lagi nanti.');
    } finally {
        sendBtn.disabled = false;
        scrollToBottom();
    }
}

function displayUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper user';
    wrapper.innerHTML = `
        <div class="message-bubble">
            <p>${formatMessage(text)}</p>
        </div>
    `;
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function displayBotMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    wrapper.innerHTML = `
        <div class="bot-avatar">🤖</div>
        <div class="message-bubble">
            <p>${formatMessage(text)}</p>
        </div>
    `;
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function displayLocationMessage(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    wrapper.innerHTML = `
        <div class="bot-avatar">🤖</div>
        <div class="message-bubble location-bubble">
            <p>${formatMessage(data.reply)}</p>
            <p><strong>📍 ${data.address}</strong></p>
            <p>${data.details}</p>
            <a href="${data.maps_url}" target="_blank" class="maps-button">🗺️ Buka di Google Maps</a>
        </div>
    `;
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function showLoadingBubble() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    wrapper.innerHTML = `
        <div class="bot-avatar">🤖</div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
}

function removeLoadingBubble(bubble) {
    bubble.remove();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMessage(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

// ============ MODAL FUNCTIONS ============
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ SUBMIT CUTI ============
async function submitCuti() {
    const nama = document.getElementById('cuti-nama').value.trim();
    const nip = document.getElementById('cuti-nip').value.trim();
    const jenis = document.getElementById('cuti-jenis').value;
    const mulai = document.getElementById('cuti-mulai').value;
    const selesai = document.getElementById('cuti-selesai').value;
    const alasan = document.getElementById('cuti-alasan').value.trim();

    if (!nama || !nip || !jenis || !mulai || !selesai) {
        showToast('Semua field wajib diisi', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('nama', nama);
    formData.append('nip', nip);
    formData.append('jenis', jenis);
    formData.append('tanggal_mulai', mulai);
    formData.append('tanggal_selesai', selesai);
    formData.append('alasan', alasan);

    try {
        const res = await fetch('/api/submissions', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            showToast('Pengajuan cuti berhasil dikirim!');
            closeModal('cutiModal');
            document.getElementById('cuti-nama').value = '';
            document.getElementById('cuti-nip').value = '';
            document.getElementById('cuti-alasan').value = '';
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Gagal mengajukan cuti', 'error');
    }
}

function setRating(n) {
    document.querySelectorAll('.star-rating span').forEach((star, i) => {
        star.textContent = i < n ? '⭐' : '☆';
    });
    document.getElementById('rating-value').value = n;
}

// ============ SUBMIT SURVEY ============
async function submitSurvey() {
    const rating = document.getElementById('rating-value').value;
    const nama = document.getElementById('survey-nama').value.trim() || 'Anonim';
    const saran = document.getElementById('survey-saran').value.trim();

    if (!rating) {
        showToast('Pilih rating terlebih dahulu', 'error');
        return;
    }

    try {
        const res = await fetch('/api/survey', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: parseInt(rating), nama, saran })
        });
        const data = await res.json();
        showToast('Terima kasih atas feedback Anda!');
        closeModal('surveyModal');
        document.getElementById('survey-nama').value = '';
        document.getElementById('survey-saran').value = '';
        setRating(0);
    } catch (e) {
        console.error(e);
        showToast('Gagal mengirim survey', 'error');
    }
}

// ============ CEK STATUS ============
async function cekStatus() {
    const nip = document.getElementById('status-nip').value.trim();
    if (!nip) {
        showToast('NIP wajib diisi', 'error');
        return;
    }

    try {
        const res = await fetch(`/api/check-status/${nip}`);
        const data = await res.json();
        
        if (data.success) {
            const statusDiv = document.getElementById('status-result');
            statusDiv.innerHTML = data.data.map(item => `
                <div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 8px;">
                    <p><strong>${item.jenis}</strong> - ${item.tanggal_mulai} s/d ${item.tanggal_selesai}</p>
                    <p>Status: <span class="badge badge-${item.status}">${item.status}</span></p>
                </div>
            `).join('');
        } else {
            document.getElementById('status-result').innerHTML = '<p style="color: #999;">Data tidak ditemukan</p>';
        }
    } catch (e) {
        console.error(e);
        showToast('Gagal mengecek status', 'error');
    }
}

// ============ HUBUNGI HR ============
async function hubungiHR() {
    const nama = document.getElementById('hr-nama').value.trim();
    const message = document.getElementById('hr-message').value.trim();

    if (!nama || !message) {
        showToast('Nama dan pesan wajib diisi', 'error');
        return;
    }

    try {
        const res = await fetch('/api/escalate-to-hr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama, message })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Pesan Anda telah dikirim ke HR!');
            closeModal('hrModal');
            document.getElementById('hr-nama').value = '';
            document.getElementById('hr-message').value = '';
        } else {
            showToast(data.error, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Gagal mengirim pesan', 'error');
    }
}

async function cekBalasanHR() {
    const nama = document.getElementById('hr-cek-nama').value.trim();
    if (!nama) {
        showToast('Nama wajib diisi', 'error');
        return;
    }

    try {
        const res = await fetch(`/api/hr-reply/${encodeURIComponent(nama)}`);
        const data = await res.json();
        
        if (data.length > 0) {
            const balasan = data.find(item => item.reply);
            if (balasan) {
                document.getElementById('hr-reply-result').innerHTML = `
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 3px solid #4caf50;">
                        <p><strong>✅ Balasan HR:</strong></p>
                        <p>${balasan.reply}</p>
                        <p style="font-size: 12px; color: #666; margin-top: 10px;">Dibalas pada: ${new Date(balasan.replied_at).toLocaleString('id-ID')}</p>
                    </div>
                `;
            } else {
                document.getElementById('hr-reply-result').innerHTML = '<p style="color: #ff9800;">⏳ Pesan Anda masih dalam proses</p>';
            }
        } else {
            document.getElementById('hr-reply-result').innerHTML = '<p style="color: #999;">Belum ada pesan dari Anda</p>';
        }
    } catch (e) {
        console.error(e);
        showToast('Gagal mengecek balasan', 'error');
    }
}

// ============ EVENT LISTENERS ============
if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

// Load announcements on startup
loadAnnouncements();
