// 1. 기초 데이터 및 실전 DB
const MORSE_KOR = {
    // 한글 기본 자모
    'ㄱ':'.-..','ㄴ':'..-.','ㄷ':'-...','ㄹ':'---','ㅁ':'--','ㅂ':'.--','ㅅ':'--.','ㅇ':'-.-','ㅈ':'.--.','ㅊ':'-.-.','ㅋ':'-..-','ㅌ':'--..','ㅍ':'---.','ㅎ':'.---',
    'ㅏ':'.','ㅑ':'..','ㅓ':'-','ㅕ':'...','ㅗ':'.-','ㅛ':'-.','ㅜ':'----','ㅠ':'.-.','ㅡ':'-..','ㅣ':'..-','ㅐ':'--.-','ㅔ':'-.--',
    
    // 숫자 (0~9)
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    
    // 주요 통신 기호 (Punctuation & Prosigns)
    '.': '.-.-.-',    // 마침표
    ',': '--..--',    // 쉼표
    '?': '..--..',    // 물음표 (질문, 재송신 요구)
    '/': '-..-.',     // 슬래시 (포터블 등 식별자 분리)
    '=': '-...-',     // 이중 대시 (BT, 문장 간 분리)
    '-': '-....-',    // 하이픈
    '+': '.-.-.',     // 더하기 (AR, 송신 종료)
    '@': '.--.-.'     // 골뱅이 기호
};

const kochSequence = ['ㅏ','ㅓ','ㄱ','ㄴ','ㅗ','ㅜ','ㄷ','ㄹ','ㅣ','ㅡ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','ㅑ','ㅕ','ㅛ','ㅠ','ㅐ','ㅔ'];
let WORDS_DB = ["무선", "전파"]; // 파일 로딩 실패 시 작동할 기본값
let SENTENCES_DB = ["여기는 인천광역시"]; 
// 외부 txt 파일에서 데이터를 읽어오는 함수
async function loadExternalData() {
    try {
        // words.txt 불러오기
        const wordResponse = await fetch('words.txt');
        if (wordResponse.ok) {
            const wordText = await wordResponse.text();
            // 엔터(\n) 기준으로 쪼개고, 양옆 공백을 없앤 뒤, 빈 줄을 걸러냅니다.
            WORDS_DB = wordText.split('\n').map(w => w.trim()).filter(w => w.length > 0);
        }
        // sentences.txt 불러오기
        const sentResponse = await fetch('sentences.txt');
        if (sentResponse.ok) {
            const sentText = await sentResponse.text();
            SENTENCES_DB = sentText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        }
        
        console.log("외부 텍스트 파일 DB 로드 완료!");
        console.log("단어 개수:", WORDS_DB.length, "문장 개수:", SENTENCES_DB.length);
        
        // 로드가 완료되면 버튼을 활성화하여 안전하게 시작하도록 처리
        document.getElementById('startBtn').innerText = "연습 시작";
        document.getElementById('startBtn').disabled = false;
    } catch (error) {
        console.error("파일 로드 중 오류 발생:", error);
        document.getElementById('statusText').innerText = "DB 로드 실패 (기본값 사용)";
        document.getElementById('startBtn').innerText = "연습 시작";
        document.getElementById('startBtn').disabled = false;
    }
}
// 페이지가 켜질 때 버튼을 잠시 끄고 데이터를 불러옵니다.
document.getElementById('startBtn').innerText = "DB 불러오는 중...";
document.getElementById('startBtn').disabled = true;
loadExternalData();
// 2. 한글 자모 분리기 (강력한 유니코드 수학 엔진)
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

// 모스부호 규정에 따른 겹자음/복모음 분해 매핑
const COMP_MAP = {'ㄲ':'ㄱㄱ','ㄸ':'ㄷㄷ','ㅃ':'ㅂㅂ','ㅆ':'ㅅㅅ','ㅉ':'ㅈㅈ','ㅒ':'ㅑㅣ','ㅖ':'ㅕㅣ','ㅘ':'ㅗㅏ','ㅙ':'ㅗㅐ','ㅚ':'ㅗㅣ','ㅝ':'ㅜㅓ','ㅞ':'ㅜㅔ','ㅟ':'ㅜㅣ','ㅢ':'ㅡㅣ', 'ㄳ':'ㄱㅅ', 'ㄵ':'ㄴㅈ', 'ㄶ':'ㄴㅎ', 'ㄺ':'ㄹㄱ', 'ㄻ':'ㄹㅁ', 'ㄼ':'ㄹㅂ', 'ㄽ':'ㄹㅅ', 'ㄾ':'ㄹㅌ', 'ㄿ':'ㄹㅍ', 'ㅀ':'ㄹㅎ', 'ㅄ':'ㅂㅅ'};
function splitKorean(text) {
    let result = "";
    for(let i=0; i<text.length; i++) {
        const code = text.charCodeAt(i);
        // 한글 가~힣 영역일 경우
        if(code >= 0xAC00 && code <= 0xD7A3) {
            const idx = code - 0xAC00;
            let c = CHO[Math.floor(idx / 588)];
            let u = JUNG[Math.floor((idx % 588) / 28)];
            let j = JONG[idx % 28];
            
            result += (COMP_MAP[c]||c) + (COMP_MAP[u]||u) + (COMP_MAP[j]||j);
        } else {
            result += text[i]; // 공백이나 기호는 그대로 유지
        }
    }
    return result;
}
// 3. UI 컨트롤 로직
const updateLabel = (id) => { document.getElementById(id + 'Label').innerText = document.getElementById(id + 'Input').value; };
['charWpm', 'effWpm', 'freq', 'vol'].forEach(id => {
    document.getElementById(id + 'Input').addEventListener('input', (e) => {
        updateLabel(id);
        if(id === 'charWpm' && parseInt(document.getElementById('effWpmInput').value) > parseInt(e.target.value)) {
            document.getElementById('effWpmInput').value = e.target.value; updateLabel('effWpm');
        }
    });
});
// 모드 변경 시 레슨 선택기 숨김/표시 처리
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        document.getElementById('lessonGroup').style.display = (e.target.value === 'koch') ? 'flex' : 'none';
    });
});
// 4. 오디오 엔진 (기존의 완벽한 파른스워스 엔진 유지)
let audioCtx;
function playSequence(text, charWpm, effWpm, freq, vol) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const charDot = 1.2 / charWpm, spaceDot = 1.2 / effWpm, edge = 0.005;
    let time = audioCtx.currentTime + 0.1;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    for (let char of text) {
        if (char === ' ') { time += spaceDot * 4; continue; }
        const morse = MORSE_KOR[char];
        if (!morse) continue;
        
        for (let k = 0; k < morse.length; k++) {
            const dur = (morse[k] === '.') ? charDot : charDot * 3;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(vol, time + edge);
            gain.gain.setValueAtTime(vol, time + dur - edge);
            gain.gain.linearRampToValueAtTime(0, time + dur);
            time += dur;
            if (k < morse.length - 1) time += charDot;
        }
        time += spaceDot * 3;
    }
    osc.start(audioCtx.currentTime); osc.stop(time);
    return (time - audioCtx.currentTime) * 1000;
}
// 5. 연습 시작
document.getElementById('startBtn').addEventListener('click', () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const wpm = parseInt(document.getElementById('charWpmInput').value);
    const eff = parseInt(document.getElementById('effWpmInput').value);
    const freq = parseInt(document.getElementById('freqInput').value);
    const vol = parseInt(document.getElementById('volInput').value) / 100;
    const amount = parseInt(document.getElementById('timeInput').value);
    
    const btn = document.getElementById('startBtn');
    const status = document.getElementById('statusText');
    const userInput = document.getElementById('userInput');
    
    btn.disabled = true; 
    userInput.disabled = false; // 듣는 즉시 입력할 수 있도록 활성화합니다.
    userInput.value = "";
    userInput.focus();
    
    let problemRawText = "";
    if (mode === 'koch') {
        const level = document.getElementById('lessonSelect').value;
        const allowedCount = parseInt(level) + 1; 
        const groups = eff * amount;
        let probArr = [];
        for(let i=0; i<groups; i++) {
            let g=""; for(let j=0; j<5; j++) g += kochSequence[Math.floor(Math.random() * allowedCount)];
            probArr.push(g);
        }
        problemRawText = probArr.join(" ");
        
        // 프리뷰 재생 (코흐 모드에만 적용)
        const newChars = level == 1 ? ['ㅏ', 'ㅓ'] : [kochSequence[level - 1]];
        status.innerText = `[프리뷰] 신규 글자 재생: ${newChars.join(', ')}`;
        const previewDur = playSequence(newChars.join(" ") + " " + newChars.join(" "), wpm, wpm, freq, vol);
        
        setTimeout(() => startPlayback(problemRawText), previewDur + 1000);
    } else if (mode === 'word') {
        let probArr = [];
        for(let i=0; i<amount * 5; i++) { // 분량에 비례해 단어 개수 조절
            probArr.push(WORDS_DB[Math.floor(Math.random() * WORDS_DB.length)]);
        }
        problemRawText = probArr.join(" ");
        startPlayback(problemRawText);
    } else if (mode === 'sentence') {
        let probArr = [];
        for(let i=0; i<amount; i++) { // 1분당 1문장씩 출제
            probArr.push(SENTENCES_DB[Math.floor(Math.random() * SENTENCES_DB.length)]);
        }
        problemRawText = probArr.join(" ");
        startPlayback(problemRawText);
    }
    function startPlayback(rawText) {
        // 원본 텍스트를 글로벌 변수에 저장 (채점 시 보여주기 위함)
        window.currentRawProblem = rawText;
        // 컴퓨터가 칠 수 있도록 자모로 완전히 쪼갠 텍스트 생성
        window.currentJamoProblem = splitKorean(rawText);
        
        console.log("출제 문제:", rawText);
        console.log("자모 분해:", window.currentJamoProblem);
        status.innerText = "연습 문제 재생 중...";
        const duration = playSequence(window.currentJamoProblem, wpm, eff, freq, vol);
        
        setTimeout(() => {
            status.innerText = "수신 완료. 답안을 제출하세요.";
            btn.disabled = false; 
            // userInput.disabled = false; <- 이미 활성화되어 있으므로 지워도 무방합니다.
            document.getElementById('checkBtn').disabled = false;
        }, duration);
    }
});
// 6. 지능형 채점 로직
document.getElementById('checkBtn').addEventListener('click', () => {
    const userInputText = document.getElementById('userInput').value;
    
    // 핵심: 사용자가 완성형 한글("무선")을 쳤든 자모("ㅁㅜㅅㅓㄴ")를 쳤든 모두 분해하여 공백 제거 후 비교
    const userJamo = splitKorean(userInputText).replace(/\s/g, "");
    const ansJamo = window.currentJamoProblem.replace(/\s/g, "");
    
    let correct = 0;
    for(let i=0; i<ansJamo.length; i++) {
        if(userJamo[i] === ansJamo[i]) correct++;
    }
    
    const acc = ansJamo.length > 0 ? Math.floor((correct/ansJamo.length)*100) : 0;
    document.getElementById('scoreText').innerText = `정답률: ${acc}%`;
    document.getElementById('statusText').innerText = "채점 완료";
    
    if(acc < 100) {
        alert(`[오답 확인]\n정답: ${window.currentRawProblem}\n입력: ${userInputText}`);
    }
    
    document.getElementById('userInput').disabled = true;
    document.getElementById('checkBtn').disabled = true;

    // 리더보드에 저장
    const currentModeElem = document.querySelector('input[name="mode"]:checked');
    let modeText = currentModeElem ? currentModeElem.parentElement.innerText.trim() : "알 수 없음";
    if(currentModeElem && currentModeElem.value === 'koch') {
        const lesson = document.getElementById('lessonSelect').value;
        modeText += ` (L${lesson})`;
    }
    saveToLeaderboard(modeText, acc);
});

// --- 리더보드 (Leaderboard) 시스템 ---
const leaderboardDialog = document.getElementById('leaderboardDialog');
const leaderboardOpen = document.getElementById('leaderboardopen');
const leaderboardClose = document.getElementById('leaderboardClose');
const leaderboardBody = document.getElementById('leaderboardBody');

const API_URL = 'lkmo.delzb.app'; // Cloudflare Pages will serve both frontend and API on the same domain

async function loadLeaderboard() {
    leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#666;">불러오는 중...</td></tr>';
    try {
        const response = await fetch(`${API_URL}/api/leaderboard`);
        const records = await response.json();
        
        if (!records || records.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#666;">기록이 없습니다. 연습을 완료해보세요!</td></tr>';
            return;
        }
        
        leaderboardBody.innerHTML = '';
        records.forEach(record => {
            const tr = document.createElement('tr');
            
            const dateObj = new Date(record.date);
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
            
            tr.innerHTML = `
                <td><strong>${record.name}</strong></td>
                <td>${dateStr}</td>
                <td>${record.mode}</td>
                <td><strong>${record.acc}%</strong></td>
            `;
            leaderboardBody.appendChild(tr);
        });
    } catch (e) {
        leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:red;">리더보드를 불러올 수 없습니다. 서버가 실행 중인지 확인하세요.</td></tr>';
    }
}

async function saveToLeaderboard(mode, acc) {
    let name = prompt("리더보드에 등록할 이름을 입력하세요 (취소 시 Anonymous로 저장됩니다):");
    if (!name) name = "Anonymous";
    
    try {
        await fetch(`${API_URL}/api/leaderboard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, mode, acc })
        });
    } catch (e) {
        console.error("리더보드 저장 실패:", e);
    }
}

leaderboardOpen.addEventListener('click', () => {
    loadLeaderboard();
    leaderboardDialog.showModal();
});

leaderboardClose.addEventListener('click', () => {
    leaderboardDialog.close();
});

// 다이얼로그 외부 클릭 시 닫기
leaderboardDialog.addEventListener('click', (e) => {
    const rect = leaderboardDialog.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
        leaderboardDialog.close();
    }
});