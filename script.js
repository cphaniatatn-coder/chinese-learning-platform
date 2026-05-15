let allData = [];
let quizData = [];
let currentList = [];
let isHintEnabled = false;

// 1. 載入資料
Promise.all([
    fetch('8000生詞.json').then(res => res.json()),
    fetch('output.json').then(res => res.json())
]).then(([data1, data2]) => {
    allData = data1;
    quizData = data2;
    showLevels();
}).catch(err => { console.error("載入失敗"); });

// 2. 等級選單
function showLevels() {
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    document.getElementById('title').innerText = "請選擇學習等級";
    let html = levels.map(lv => `<button class="btn" onclick="showUnits('${lv}')">${lv} 等級</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 3. 單元選單
function showUnits(lv) {
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    const units = [...new Set(filtered.map(item => item.領域))];
    document.getElementById('title').innerText = lv + " 單元選擇";
    let html = `<button class="btn back-btn" onclick="showLevels()">← 返回等級</button>`;
    html += units.map(u => `<button class="btn btn-unit" onclick="showMenu('${lv}', '${u}')">${u}</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 4. 四大模組主選單
function showMenu(lv, u) {
    currentList = allData.filter(item => item.序號編碼.startsWith(lv) && item.領域 === u);
    document.getElementById('title').innerText = u;
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showUnits('${lv}')">← 返回單元</button>
        <button class="btn" style="background:#4a90e2" onclick="showText()">📖 課文內容</button>
        <button class="btn" style="background:#e67e22" onclick="studyMode()">🗂️ 生詞閃卡 (Flashcard)</button>
        <button class="btn" style="background:#4a90e2" onclick="showGrammar()">💡 語法教學</button>
        <button class="btn" style="background:#5c6bc0" onclick="quizMode()">📝 能力測驗</button>
    `;
}

// 5. 課文閱讀模式
function showText() {
    const itemWithText = currentList.find(i => i.課文) || currentList[0];
    const text = itemWithText.課文 || "目前此單元尚未輸入課文資料。";
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showMenu()">← 返回選單</button>
        <div class="card" style="text-align:left; line-height:1.8; font-size:20px; padding:20px; border:2px solid #eee;">
            <div onmousemove="smartSearchHint(event, this.innerText)" onmouseout="hideTooltip()">
                ${text.replace(/\n/g, '<br>')}
            </div>
        </div>
        <button class="btn" style="background:#4caf50" onclick="speak('${text.replace(/\n/g, ' ')}')">📢 朗讀全課</button>
    `;
}

// 🚀 6. 模組二：生詞閃卡 (Flashcard 智慧翻牌版)
function studyMode() {
    let index = 0;
    let isFlipped = false; // 記錄目前字卡是正面還是反面

    const updateCard = () => {
        const item = currentList[index];
        isFlipped = false; // 換下一張卡時，預設回到正面(蓋牌狀態)

        document.getElementById('content').innerHTML = `
            <button class="btn back-btn" onclick="showMenu()">← 返回選單</button>
            
            <div class="flashcard" id="card-body" onclick="flipCard()">
                <div class="word">${item.生詞}</div>
                <div id="card-back" style="display: none; width: 100%; text-align: center;">
                    <div class="pinyin">${item.拼音}</div>
                    <div class="def">${item.定義}</div>
                </div>
                <div class="flashcard-hint" id="card-tip">👆 點擊卡片翻面看答案</div>
            </div>

            <button class="btn" style="background:#4caf50; margin-bottom: 20px;" onclick="speak('${item.生詞}'); event.stopPropagation();">📢 聽發音</button>
            <button class="btn" onclick="next()">下一個 (${index + 1}/${currentList.length})</button>
        `;
    };

    // 翻牌的邏輯
    window.flipCard = () => {
        isFlipped = !isFlipped;
        const cardBack = document.getElementById('card-back');
        const cardTip = document.getElementById('card-tip');
        const cardBody = document.getElementById('card-body');

        if (isFlipped) {
            cardBack.style.display = "block"; // 顯示拼音和定義
            cardTip.innerText = "✨ 已翻面";
            cardBody.style.background = "#fffdf7"; // 翻面後換個柔和的底色
        } else {
            cardBack.style.display = "none";  // 隱藏
            cardTip.innerText = "👆 點擊卡片翻面看答案";
            cardBody.style.background = "#ffffff";
        }
    };

    window.next = () => { index = (index + 1) % currentList.length; updateCard(); };
    updateCard();
}

// 7. 語法教學模式
function showGrammar() {
    const itemWithGrammar = currentList.find(i => i.語法) || currentList[0];
    const grammar = itemWithGrammar.語法 || "目前此單元尚未輸入語法重點。";
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showMenu()">← 返回選單</button>
        <div class="card" style="text-align:left; border-left:8px solid #ff9800; padding:20px; background:#fffcf7;">
            <h3 style="color:#ff9800; margin-top:0;">💡 本課語法重點</h3>
            <p style="font-size:18px; line-height:1.6;">${grammar.replace(/\n/g, '<br>')}</p>
        </div>
    `;
}

// 8. 測驗模式 (對接您的 output.json)
function quizMode() {
    const q = quizData[Math.floor(Math.random() * quizData.length)];
    document.getElementById('content').innerHTML = `
        <div class="card" style="padding:20px; border:2px solid #eee; margin-bottom:15px;">
            <div class="word" style="font-size:24px;" onmousemove="smartSearchHint(event, this.innerText)" onmouseout="hideTooltip()">
                ${q.問題}
            </div>
            <button class="btn" style="background:#4caf50; width:auto; margin-top:15px;" onclick="speak('${q.問題}')">📢 聽題目</button>
        </div>
        <div id="options">
            <button class="btn btn-unit" onclick="quizMode()">下一題</button>
        </div>
        <button class="btn back-btn" onclick="showMenu()">結束測驗</button>
    `;
}

// 9. 工具功能
function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'zh-CN';
    msg.rate = 0.8;
    window.speechSynthesis.speak(msg);
}

function toggleHint() {
    isHintEnabled = !isHintEnabled;
    const btn = document.getElementById('hint-toggle');
    if(btn) btn.innerText = isHintEnabled ? "💡 提示：啟動中" : "💡 提示：關閉中";
}

function smartSearchHint(event, text) {
    if (!isHintEnabled) return;
    const cleanText = text.replace(/[？?。，,！!]/g, "");
    const found = allData.find(d => cleanText.includes(d.生詞.split('/')[0]));
    if (found) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `<b>${found.生詞}</b><br>${found.拼音}<br>${found.定義}`;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY + 10) + 'px';
    }
}

function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }
