let allData = [];      // 8000生詞
let quizData = [];     // 測驗題目 (output.json)
let currentList = [];
let isHintEnabled = false;

// 1. 同時載入兩個資料檔
Promise.all([
    fetch('8000生詞.json').then(res => res.json()),
    fetch('output.json').then(res => res.json())
]).then(([data1, data2]) => {
    allData = data1;
    quizData = data2;
    showLevels();
}).catch(err => {
    console.error("資料載入失敗:", err);
    document.getElementById('content').innerText = "載入失敗，請檢查 JSON 檔案。";
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
        <button class="btn" onclick="quizMode()">📝 華語測驗 (TOCFL)</button>
    `;
}

// 5. 生詞複習模式 (原本沒問題的功能)
function studyMode() {
    let index = 0;
    const updateCard = () => {
        const item = currentList[index];
        document.getElementById('content').innerHTML = `
            <button class="btn back-btn" onclick="showLevels()">結束複習</button>
            <div class="card" onmouseover="showTooltip(event, '${item.生詞}')" onmouseout="hideTooltip()">
                <div class="word">${item.生詞}</div>
                <div class="pinyin">${item.拼音}</div>
                <button class="btn" style="background:#4caf50" onclick="speak('${item.生詞}')">📢 播放語音</button>
                <hr>
                <div class="def">${item.定義}</div>
            </div>
            <button class="btn" onclick="next()">下一個 (${index + 1}/${currentList.length})</button>
        `;
    };
    window.next = () => { index = (index + 1) % currentList.length; updateCard(); };
    updateCard();
}

// 6. 華語測驗模式 (對接您的 output.json)
function quizMode() {
    // 隨機選一個題目
    const q = quizData[Math.floor(Math.random() * quizData.length)];
    document.getElementById('title').innerText = "TOCFL 模擬練習";
    document.getElementById('content').innerHTML = `
        <div class="card">
            <div style="font-size: 14px; color: #666;">題號：${q.編號}</div>
            <div class="word" style="font-size: 28px; margin: 20px 0;">${q.問題}</div>
            <button class="btn" style="background:#4caf50" onclick="speak('${q.問題}')">📢 聽問題</button>
        </div>
        <button class="btn" onclick="quizMode()">下一題</button>
        <button class="btn back-btn" onclick="showLevels()">返回首頁</button>
    `;
}

// 7. 語音功能 (鎖定 zh-CN)
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = 'zh-CN'; 
        msg.rate = 0.8;
        window.speechSynthesis.speak(msg);
    }
}

// 8. 提示開關功能
function toggleHint() {
    isHintEnabled = !isHintEnabled;
    const btn = document.getElementById('hint-toggle');
    if(btn) btn.innerText = isHintEnabled ? "💡 提示：啟動中" : "💡 提示：關閉中";
}

// 9. 懸浮提示邏輯 (讓學生在測驗中也能查 8000 詞)
function showTooltip(event, wordText) {
    if (!isHintEnabled) return;
    // 尋找 8000 詞庫裡的資料
    const item = allData.find(d => d.生詞 === wordText);
    if (item) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `<b>${item.生詞}</b><br>${item.拼音}<br>${item.定義}`;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY + 15) + 'px';
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if(tooltip) tooltip.style.display = 'none';
}
