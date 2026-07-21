// Initialize API Key safely for both Local (Vite) and GitHub Pages
let envApiKey = null;
try {
  if (import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }
} catch (e) {
  console.log("Not running in Vite environment");
}

const SYSTEM_PROMPT = `คุณคือพนักงานเซเว่น (7-Eleven) ที่มีคาแรคเตอร์เป็น 'แร็ปเปอร์' (Rapper) ใต้ดิน
กฎการสนทนา:
1. ทักทายและตอบกลับแบบเท่ๆ ใช้คำว่า โย่ว, พี่ชาย, เจ้านาย, โบร, ซิส
2. ต้องพูดจามีสัมผัสคล้องจองกันเหมือนกำลังแร็ป
3. ทุกครั้งที่จบประโยค ต้องมีการ 'เสนอขายสินค้าพ่วง' เสมอ เช่น ขนมจีบ ซาลาเปา, กาแฟ All Cafe, สแลชชี่, ไส้กรอก
4. ควรถามเรื่อง All Member หรือแสตมป์บ้าง
5. ห้ามหลุดคาแรคเตอร์เด็ดขาด คุณคือพนักงานเซเว่นที่แร็ปเก่งที่สุด! ตอบให้สั้นกระชับ ไม่เยิ่นเย้อจนเกินไป`;

// เก็บประวัติแชท
let chatHistory = [];

// DOM Elements
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const apiKeyInput = document.getElementById('apiKeyInput');

// Auto-fill API Key if running locally with Vite
if (envApiKey && envApiKey !== 'your_api_key_here') {
  apiKeyInput.value = envApiKey;
}

// Send Message Function
async function sendMessage() {
  const currentApiKey = apiKeyInput.value.trim();
  
  if (!currentApiKey) {
    addMessageToUI('⚠️ กรุณาใส่ API Key ในช่องด้านบนก่อนส่งข้อความนะฮะ~', 'bot');
    return;
  }

  const text = userInput.value.trim();
  if (!text) return;

  // Add User Message to UI & History
  addMessageToUI(text, 'user');
  chatHistory.push({ role: "user", parts: [{ text: text }] });
  
  userInput.value = '';
  userInput.disabled = true;
  sendBtn.disabled = true;

  // Add Loading Indicator
  const loadingId = 'loading-' + Date.now();
  const loadingEl = document.createElement('div');
  loadingEl.id = loadingId;
  loadingEl.className = 'loading';
  loadingEl.textContent = 'พนักงานกำลังคิดบีท...';
  chatBox.appendChild(loadingEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${currentApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: { parts: { text: SYSTEM_PROMPT } },
        contents: chatHistory
      })
    });

    const data = await response.json();

    document.getElementById(loadingId).remove();

    if (!response.ok) {
      console.error("API Error Response:", data);
      throw new Error(data.error?.message || `HTTP Status ${response.status}`);
    }

    const botReply = data.candidates[0].content.parts[0].text;
    
    // Add bot response to history and UI
    chatHistory.push({ role: "model", parts: [{ text: botReply }] });
    addMessageToUI(botReply, 'bot');

  } catch (error) {
    console.error("Full Error:", error);
    if (document.getElementById(loadingId)) {
        document.getElementById(loadingId).remove();
    }
    
    let errorMsg = 'ขออภัยครับโบร ระบบขัดข้อง! <br>Error: ' + error.message;
    if (error.message.includes('API key not valid') || error.message.includes('HTTP Status 400')) {
       errorMsg += '<br><br>⚠️ <b>API Key น่าจะผิด หรือไม่ได้โหลดครับ!</b><br>รบกวนเช็คไฟล์ .env ให้แน่ใจว่าไม่มีช่องว่างแปลกๆ และกด Save แล้ว จากนั้น <b>ปิด npm run dev แล้วรันใหม่ครับ</b>';
    }
    
    addMessageToUI(errorMsg, 'bot');
    
    // Remove the last user message from history so they can retry
    chatHistory.pop();
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

function addMessageToUI(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  
  if (sender === 'bot') {
    msgDiv.innerHTML = `
      <div class="avatar">
        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Bot" />
      </div>
      <div class="bubble">${text.replace(/\n/g, '<br>')}</div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div class="bubble">${text.replace(/\n/g, '<br>')}</div>
    `;
  }
  
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
