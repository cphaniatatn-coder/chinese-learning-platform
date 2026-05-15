let allData = [];     // 存放 8000生詞.json
let currentList = []; // 當前選中單元的生詞
let currentIndex = 0; // 目前讀到第幾張卡片
let currentSpeed = 0.7; // 🌟 Default kecepatan lebih lambat (Anti-Gugup) untuk Band A

// 1. 單純載入生詞檔案
fetch('8000生詞.json')
    .then(res => res.json())
    .then(data => {
        allData = data;
        showLevelsMenu(); 
    })
    .catch(err => {
        // Menggunakan selector container utama dari index.html Anda
        document.getElementById('content').innerText = "生詞檔案載入失敗，請確認 8000生詞.json 是否正確上傳。";
    });

// 2. 顯示等級主選單
function showLevelsMenu() {
    // Memastikan judul diperbarui di dalam <h1 id="title">
    document.getElementById('title').innerText = "華語學習等級";
    
    // Memilah level (A0, A1, A2) berdasarkan kode urut
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    
    let html = `<div id="menu-area">`;
    html += levels.map(lv => `<button class="btn" onclick="showUnitsMenu('${lv}')">${lv} 等級</button>`).join('');
    html += `</div>`;
    
    document.getElementById('content').innerHTML = html;
}

// 3. 顯示單元選單
function showUnitsMenu(lv) {
    document.getElementById('title').innerText = lv + " 單元選擇";
    
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    const units = [...new Set(filtered.map(item => item.領域))];
    
    let html = `<button class="btn back-btn" onclick="showLevelsMenu()">← 返回</button><br><br>`;
    html += `<div id="menu-area">`;
    html += units.map(u => `<button class="btn btn-unit" onclick="startLearning('${lv}', '${u}')">${u}</button>`).join('');
    html += `</div>`;
    
    document.getElementById('content').innerHTML = html;
}

// 4. 进入学习模式 (Menerapkan Alur Konsep Anda)
function startLearning(lv, u) {
    currentList = allData.filter(item => item.序號編碼.startsWith(lv) && item.領域 === u);
    currentIndex = 0;

    if (currentList.length === 0) {
        alert("此單元沒有找到任何生詞！");
        return;
    }

    // Mengganti isi <div id="content"> menjadi layout Flashcard + Audio Speed Controller
    generateFlashcardLayout();
    updateCardContent(); 
}

// Fitur Baru: Membuat Layout yang mendukung Fitur Khusus Anda tanpa merusak index.html asli
function generateFlashcardLayout() {
    let html = `
        <!-- Audio Speed Controller (Fitur Anti-Gugup) -->
        <div style="text-align:center; margin-bottom: 15px;">
            <span style="font-size:14px; color:#7f8c8d;">音速 Control: </span>
            <button class="btn back-btn" onclick="changeSpeed(0.6)" id="speed-0.6">0.6x 慢速</button>
            <button class="btn back-btn" onclick="changeSpeed(0.8)" id="speed-0.8" style="background:#4caf50;">0.8x 標準</button>
            <button class="btn back-btn" onclick="changeSpeed(1.0)" id="speed-1.0">1.0x 考試</button>
        </div>

        <!-- Flashcard Base Layout -->
        <div class="flashcard" onclick="toggleCardFlip()">
            <div id="word-display" class="word">載入中...</div>
            <div id="card-back-info" style="display:none; width:100%;">
                <div id="pinyin-display" class="pinyin"></div>
                <div id="def-display" class="def"></div>
            </div>
            <div id="counter-display" class="flashcard-hint">0 / 0</div>
        </div>

        <button id="speak-btn" class="btn" style="background:#ff9800;">🔊 發音</button>
        <button class="btn" onclick="nextCard()">下一個生詞 →</button>
        <button class="btn back-btn" onclick="showLevelsMenu()">← 返回選單</button>
    `;
    document.getElementById('content').innerHTML = html;
}

// 5. Mengubah Konten Kartu (Sisi Depan Dulu)
function updateCardContent() {
    const item = currentList[currentIndex];

    // Reset kartu ke sisi depan setiap kali berganti kata (Prinsip Segmentasi)
    document.getElementById('card-back-info').style.display = "none";
    
    document.getElementById('word-display').textContent = item.生詞;
    document.getElementById('pinyin-display').textContent = item.拼音;
    document.getElementById('def-display').textContent = item.定義;
    document.getElementById('counter-display').textContent = `${currentIndex + 1} / ${currentList.length}`;

    // Otomatis putar audio pelafalan saat kartu ganti (Prinsip Modalitas)
    speakChinese(item.生詞);

    document.getElementById('speak-btn').onclick = function(e) {
        e.stopPropagation(); // Mencegah kartu nge-flip saat menekan tombol audio
        speakChinese(item.生詞);
    };
}

// Fitur Baru: Simulasi Flip Card Sederhana namun Efektif
function toggleCardFlip() {
    const backInfo = document.getElementById('card-back-info');
    if (backInfo.style.display === "none") {
        backInfo.style.display = "block"; // Munculkan Pinyin dan Arti (Prinsip Kontiguitas Spasial)
    } else {
        backInfo.style.display = "none";
    }
}

// Fitur Baru: Mengubah Kecepatan Audio secara Dinamis
function changeSpeed(speed) {
    currentSpeed = speed;
    // Mengubah highlight warna tombol aktif
    [0.6, 0.8, 1.0].forEach(s => {
        document.getElementById(`speed-${s}`).style.background = (s === speed) ? "#4caf50" : "#78909c";
    });
}

function nextCard() {
    currentIndex = (currentIndex + 1) % currentList.length;
    updateCardContent();
}

// ⚡ 8. Pengontrol Suara dengan Aksara Tradisional Taiwan (zh-TW)
function speakChinese(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Menghentikan antrean suara sebelumnya (Zero Delay)

        let cleanText = text.includes('/') ? text.split('/')[0] : text;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-TW'; // 🌟 DIUBAH KE TAIWAN: Sangat penting untuk akurasi TOCFL Band A
        utterance.rate = currentSpeed; // 🌟 DINAMIS: Mengikuti kontrol kenyamanan siswa

        window.speechSynthesis.speak(utterance);
    }
}
