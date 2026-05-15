let allData = [];     // 存放 8000生詞.json
let currentList = []; // 當前選中單元的生詞
let currentIndex = 0; // 目前讀到第幾張卡片

// 1. 單純載入生詞檔案
fetch('8000生詞.json')
    .then(res => res.json())
    .then(data => {
        allData = data;
        showLevelsMenu(); // 初始化等級選單
    })
    .catch(err => {
        document.getElementById('menu-content').innerText = "生詞檔案載入失敗，請確認 8000生詞.json 是否正確上傳。";
    });

// 2. 顯示等級主選單
function showLevelsMenu() {
    document.getElementById('menu-area').style.display = "block";
    document.getElementById('card-area').style.display = "none";
    document.getElementById('menu-title').innerText = "請選擇學習等級";

    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    let html = levels.map(lv => `<button class="btn-level" onclick="showUnitsMenu('${lv}')">${lv} 等級</button>`).join('');
    document.getElementById('menu-content').innerHTML = html;
}

// 3. 顯示單元選單
function showUnitsMenu(lv) {
    document.getElementById('menu-title').innerText = lv + " 單元選擇";
    
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    const units = [...new Set(filtered.map(item => item.領域))];
    
    let html = `<button class="back-btn" onclick="showLevelsMenu()">← 返回</button><br><br>`;
    html += units.map(u => `<button class="btn-unit" onclick="startLearning('${lv}', '${u}')">${u}</button>`).join('');
    document.getElementById('menu-content').innerHTML = html;
}

// 4. 進入生詞卡片模式 (切換顯示區塊)
function startLearning(lv, u) {
    currentList = allData.filter(item => item.序號編碼.startsWith(lv) && item.領域 === u);
    currentIndex = 0;

    if (currentList.length === 0) {
        alert("此單元沒有找到任何生詞！");
        return;
    }

    // 切換隱藏/顯示區塊
    document.getElementById('menu-area').style.display = "none";
    document.getElementById('card-area').style.display = "block";

    updateCardContent(); // 填入第一筆字卡內容
}

// 5. 核心快打功能：只更換文字內容，不重新製造網頁按鈕，保證 0 延遲
function updateCardContent() {
    const item = currentList[currentIndex];

    // 直接改內文，速度極快
    document.getElementById('word-display').textContent = item.生詞;
    document.getElementById('pinyin-display').textContent = item.拼音;
    document.getElementById('def-display').textContent = item.定義;
    document.getElementById('counter-display').textContent = `${currentIndex + 1} / ${currentList.length}`;

    // 綁定發音按鈕點擊事件
    document.getElementById('speak-btn').onclick = function() {
        speakChinese(item.生詞);
    };
}

// 6. 下一個生詞
function nextCard() {
    currentIndex = (currentIndex + 1) % currentList.length;
    updateCardContent();
}

// 7. 從卡片返回選單
function goBackMenu() {
    showLevelsMenu();
}

// ⚡ 8. 精簡版 0 延遲語音播放器
function speakChinese(text) {
    if ('speechSynthesis' in window) {
        // 第一時間先中斷所有正在排隊的聲音
        window.speechSynthesis.cancel();

        // 如果生詞有斜線 (如你/妳)，直接快切只抓前面，不浪費效能
        let cleanText = text.includes('/') ? text.split('/')[0] : text;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8; // 老師指定的穩定語速

        window.speechSynthesis.speak(utterance);
    }
}
