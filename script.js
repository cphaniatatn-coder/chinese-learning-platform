let allData = [];
let currentList = [];
let isHintEnabled = false;

// 1. 載入 8000 詞資料
fetch('8000生詞.json')
    .then(res => res.json())
    .then(data => {
        allData = data;
        showLevels();
    })
    .catch(err => {
        document.getElementById('content').innerText = "資料載入失敗，請檢查 8000生詞.json 檔名。";
    });

// 2. 顯示等級介面
function showLevels() {
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    document.getElementById('title').innerText = "請選擇等級";
    let html = levels.map(lv => `<button class="btn" onclick="showUnits('${lv}')">${lv} 等級</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 3. 顯示單元介面
function showUnits(lv) {
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    const units = [...new Set(filtered.map(item => item.領域))];
    document.getElementById('title').innerText = lv + " 選擇單元";
    let html = `<button class="btn back-btn" onclick="showLevels()">← 返回等級</button>`;
    html += units.map(u => `<button class="btn btn-unit" onclick="startUnit('${lv}', '${u}')">${u}</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 4. 開始單元
function startUnit(lv, u) {
    currentList = allData.filter(item => item.序號編碼.startsWith(lv) && item.領域 === u);
    document.getElementById('title').innerText = u;
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showUnits('${lv}')">← 返回單元</button>
        <button class="btn" onclick="studyMode()">📖 生詞複習</button>
        <button class="btn" onclick="quizMode()">📝 華語測驗</button>
    `;
}

// 5. 生詞複習模式
function studyMode() {
    let index = 0;
    const updateCard = () => {
        const item = currentList[index];
        document.getElementById('content').innerHTML = `
            <button class="btn back-btn" onclick="showLevels()">結束複習</button>
            <div class="card" onmouseover="showTooltip(event, '${item.生詞.split('/')[0]}')" onmouseout="hideTooltip()">
                <div class="word">${item.生詞}</div>
                <div class="pinyin">${item.拼音}</div>
                <button class="btn btn-audio" onclick="speak('${item.生詞}')">📢 播放語音</button>
                <hr>
                <div class="def">${item.定義}</div>
            </div>
            <button class="btn" onclick="next()">下一個 (${index + 1}/${currentList.length})</button>
        `;
    };
    window.next = () => { index = (index + 1) % currentList.length; updateCard(); };
    updateCard();
}

// 6. 測驗模式 (等待您上傳 Excel 題目後再擴充)
function quizMode() {
    const item = currentList[Math.floor(Math.random() * currentList.length)];
    document.getElementById('title').innerText = "測驗：這是什麼意思？";
    document.getElementById('content').innerHTML = `
        <div class="card" onmouseover="showTooltip(event, '${item.生詞.split('/')[0]}')" onmouseout="hideTooltip()">
            <div class="word">${item.生詞}</div>
            <button class="btn btn-audio" onclick="speak('${item.生詞}')">📢 聽發音</button>
        </div>
        <button class="btn" onclick="alert('答案是：'+'${item.定義}')">顯示答案</button>
        <button class="btn back-btn" onclick="showLevels()">結束測驗</button>
    `;
}

// 7. 語音功能 (已優化：過濾斜線 + 0.6x 語速)
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const msg = new SpeechSynthesisUtterance();
        msg.text = text.split('/')[0]; // 只唸斜線前面的字
        msg.lang = 'zh-TW';
        msg.rate = 0.6; // 慢速
        window.speechSynthesis.speak(msg);
    }
}

// 8. 提示開關功能
function toggleHint() {
    isHintEnabled = !isHintEnabled;
    const btn = document.getElementById('hint-toggle');
    btn.innerText = isHintEnabled ? "💡 提示：啟動中" : "💡 提示：關閉中";
    btn.style.background = isHintEnabled ? "#4caf50" : "#ff9800";
}

// 9. 懸浮卡片邏輯
function showTooltip(event, wordText) {
    if (!isHintEnabled) return;
    const item = allData.find(d => d.生詞.includes(wordText));
    if (item) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `
            <div style="font-weight:bold; color:#4a90e2; font-size:18px;">${item.生詞}</div>
            <div style="color:#e67e22;">${item.拼音}</div>
            <div style="font-size:12px;">詞性：${item.詞性 || 'N/A'}</div>
            <hr style="margin:5px 0; border:0; border-top:1px solid #eee;">
            <div style="font-size:14px;">${item.定義}</div>
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY + 15) + 'px';
    }
}

function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}
