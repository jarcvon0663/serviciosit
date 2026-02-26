// ============================================================
// Servicios IT — Agente IA con Cerebras API
// Incluir en index.html antes de </body>:
//   <script src="js/chat.js"></script>
// ============================================================

(function () {
  const API_KEY  = "csk-e9pfrxvrfdyk53h8pf2ynwefn8nfkx3p4d63m45kvtmm523h";
  const ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";
  const MODEL    = "llama3.1-8b"; // ✅ Modelo correcto de Cerebras

  const SYSTEM_PROMPT = `Eres el asistente virtual de Servicios IT, empresa tecnológica ubicada en Bogotá, Colombia.
Tu nombre es "SIT Assistant". Eres amable, profesional y conciso.

INFORMACIÓN DE CONTACTO DE LA EMPRESA:
- Sitio web: www.serviciosit.online
- Teléfono: 601 227 6691 (Bogotá)
- Redes: LinkedIn, Instagram y Facebook como @serviciosit / serviciositonline

SERVICIOS QUE OFRECE LA EMPRESA:
- Desarrollo de Web Apps (aplicaciones web responsivas y adaptadas a móvil)
- Diseño Web UX/UI (investigación de usuario, interfaces funcionales y amigables)
- Agentes de IA y Automatización (bots, automatización de procesos repetitivos)
- Soporte IT / Help Desk (soporte técnico para continuidad del negocio)
- Hosting y Servicios Cloud (hospedaje web, correo corporativo, servidores dedicados)
- Bodyshopping / Outsourcing IT (talento humano tecnológico para tu empresa)

PROYECTOS REALIZADOS:
- Panadería Olímpica (2022): Menú digital QR + automatización de órdenes
- Videojuegos Retro (2023): E-commerce con pasarela de pagos

INSTRUCCIONES:
1. Responde siempre en español.
2. Sé breve: máximo 2-3 oraciones por respuesta, salvo que se pida más detalle.
3. Si el usuario necesita contactar a alguien, proporciona el teléfono 601 227 6691 o invítalo a escribir en el formulario del sitio.
4. Si la pregunta no tiene relación con tecnología o la empresa, redirige amablemente.
5. Nunca inventes servicios, precios o datos que no estén en este prompt.`;

  // Historial completo — se envían los últimos 3 pares (6 mensajes)
  const MAX_HISTORY_PAIRS = 3;
  let conversationHistory = [];
  let isOpen    = false;
  let isLoading = false;

  // ── Estilos ──────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #sit-chat-btn {
      position: fixed; bottom: 28px; right: 28px;
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(180deg, #F7CE90 0%, #F4BD76 100%);
      border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.28);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    #sit-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 22px rgba(0,0,0,0.35); }
    #sit-chat-btn svg { width: 28px; height: 28px; }
    #sit-chat-btn .icon-close { display: none; }
    #sit-chat-btn.open .icon-chat  { display: none; }
    #sit-chat-btn.open .icon-close { display: block; }

    #sit-chat-badge {
      position: absolute; top: -4px; right: -4px;
      width: 14px; height: 14px;
      background: #e53e3e; border-radius: 50%; border: 2px solid #fff;
      display: none;
    }
    #sit-chat-badge.visible { display: block; }

    #sit-chat-window {
      position: fixed; bottom: 100px; right: 28px;
      width: 360px; max-width: calc(100vw - 40px);
      height: 520px; max-height: calc(100vh - 130px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
      display: flex; flex-direction: column;
      z-index: 9998; overflow: hidden;
      transform: translateY(20px) scale(0.95);
      opacity: 0; pointer-events: none;
      transition: opacity .25s ease, transform .25s ease;
    }
    #sit-chat-window.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

    #sit-chat-header {
      background: linear-gradient(135deg, #30353B 0%, #1A1B1F 100%);
      padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    #sit-chat-avatar {
      width: 38px; height: 38px;
      background: linear-gradient(180deg, #F7CE90 0%, #F4BD76 100%);
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 18px; flex-shrink: 0;
    }
    #sit-chat-header-info h4 { color: #fff; font-size: 14px; font-weight: 700; margin: 0; line-height: 1.3; }
    #sit-chat-header-info p  { color: #F4BD76; font-size: 11px; margin: 0; display: flex; align-items: center; gap: 4px; }
    #sit-chat-header-info p::before {
      content: ''; width: 6px; height: 6px;
      background: #48bb78; border-radius: 50%; display: inline-block;
    }

    #sit-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px; background: #f8f8f8;
    }
    #sit-chat-messages::-webkit-scrollbar { width: 4px; }
    #sit-chat-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

    .sit-msg { display: flex; gap: 8px; animation: sitIn .2s ease; }
    .sit-msg.user { flex-direction: row-reverse; }
    @keyframes sitIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

    .sit-msg-bubble {
      max-width: 80%; padding: 9px 13px; border-radius: 14px;
      font-size: 13.5px; line-height: 1.55; font-family: 'Roboto', sans-serif;
    }
    .sit-msg.bot  .sit-msg-bubble { background:#fff; color:#1A1B1F; border-radius:4px 14px 14px 14px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .sit-msg.user .sit-msg-bubble { background:linear-gradient(180deg,#F7CE90 0%,#F4BD76 100%); color:#1A1B1F; border-radius:14px 4px 14px 14px; font-weight:500; }

    .sit-msg-icon {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(180deg, #F7CE90 0%, #F4BD76 100%);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0; align-self: flex-end;
    }
    .sit-msg.user .sit-msg-icon { background: linear-gradient(180deg,#30353B 0%,#1A1B1F 100%); }

    .sit-typing { display:flex; gap:5px; align-items:center; padding:12px 14px; }
    .sit-typing span { width:7px; height:7px; background:#ccc; border-radius:50%; animation:sitDot 1.2s infinite ease-in-out; }
    .sit-typing span:nth-child(2) { animation-delay:.2s; }
    .sit-typing span:nth-child(3) { animation-delay:.4s; }
    @keyframes sitDot {
      0%,60%,100% { transform:translateY(0); background:#ccc; }
      30%          { transform:translateY(-5px); background:#F4BD76; }
    }

    #sit-chat-footer {
      background: #fff; padding: 12px; border-top: 1px solid #eee;
      display: flex; gap: 8px; align-items: center; flex-shrink: 0;
    }
    #sit-chat-input {
      flex: 1; border: 1.5px solid #e0e0e0; border-radius: 22px;
      padding: 9px 14px; font-size: 13.5px; font-family: 'Roboto', sans-serif;
      outline: none; resize: none; transition: border-color .2s;
      max-height: 80px; overflow-y: auto;
    }
    #sit-chat-input:focus { border-color: #F4BD76; }
    #sit-chat-input::placeholder { color: #bbb; }
    #sit-chat-input:disabled { opacity: .6; }

    #sit-chat-send {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(180deg, #F7CE90 0%, #F4BD76 100%);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: transform .15s, opacity .15s;
    }
    #sit-chat-send:hover:not(:disabled) { transform: scale(1.1); }
    #sit-chat-send:disabled { opacity: .45; cursor: not-allowed; }
    #sit-chat-send svg { width: 18px; height: 18px; }

    #sit-chat-powered {
      text-align: center; font-size: 10px; color: #bbb;
      padding: 4px 0 8px; background: #fff; font-family: 'Roboto', sans-serif;
    }

    .sit-error-bubble {
      background: #fff5f5 !important;
      border: 1px solid #fed7d7 !important;
      color: #c53030 !important;
    }

    @media (max-width:500px) {
      #sit-chat-window { right:12px; bottom:90px; width:calc(100vw - 24px); }
      #sit-chat-btn    { right:16px; bottom:20px; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────
  const btn = document.createElement("button");
  btn.id = "sit-chat-btn";
  btn.setAttribute("aria-label", "Abrir chat de soporte");
  btn.innerHTML = `
    <span id="sit-chat-badge"></span>
    <svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke="#1A1B1F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="#1A1B1F" stroke-width="2.5" stroke-linecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;

  const win = document.createElement("div");
  win.id = "sit-chat-window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "Chat de soporte Servicios IT");
  win.innerHTML = `
    <div id="sit-chat-header">
      <div id="sit-chat-avatar">🤖</div>
      <div id="sit-chat-header-info">
        <h4>SIT Assistant</h4>
        <p>En línea ahora</p>
      </div>
    </div>
    <div id="sit-chat-messages"></div>
    <div id="sit-chat-footer">
      <textarea id="sit-chat-input" rows="1" placeholder="Escribe tu pregunta..." maxlength="600"></textarea>
      <button id="sit-chat-send" aria-label="Enviar">
        <svg viewBox="0 0 24 24" fill="none" stroke="#1A1B1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <div id="sit-chat-powered">✦ Powered by Cerebras AI</div>`;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  const messagesEl = document.getElementById("sit-chat-messages");
  const inputEl    = document.getElementById("sit-chat-input");
  const sendBtn    = document.getElementById("sit-chat-send");
  const badge      = document.getElementById("sit-chat-badge");

  // ── Utilidades ───────────────────────────────────────────
  function escHtml(t) {
    return t
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }

  function appendMessage(role, text, isError) {
    const div = document.createElement("div");
    div.className = `sit-msg ${role}`;
    div.innerHTML = `
      <div class="sit-msg-icon">${role === "bot" ? "🤖" : "👤"}</div>
      <div class="sit-msg-bubble${isError ? " sit-error-bubble" : ""}">${escHtml(text)}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "sit-msg bot";
    div.id = "sit-typing";
    div.innerHTML = `<div class="sit-msg-icon">🤖</div><div class="sit-msg-bubble sit-typing"><span></span><span></span><span></span></div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() { document.getElementById("sit-typing")?.remove(); }

  function setLoading(v) {
    isLoading        = v;
    sendBtn.disabled = v;
    inputEl.disabled = v;
  }

  // ✅ Últimos 3 pares de mensajes (user + assistant = 6 mensajes máximo)
  function getContextMessages() {
    return conversationHistory.slice(-(MAX_HISTORY_PAIRS * 2));
  }

  // ── Toggle ───────────────────────────────────────────────
  function toggleChat() {
    isOpen = !isOpen;
    btn.classList.toggle("open", isOpen);
    win.classList.toggle("open", isOpen);
    if (isOpen) {
      badge.classList.remove("visible");
      if (conversationHistory.length === 0) {
        appendMessage("bot", "¡Hola! 👋 Soy SIT Assistant, el asistente virtual de Servicios IT.\n\n¿En qué puedo ayudarte? Puedo contarte sobre nuestros servicios, proyectos o ponerte en contacto con nuestro equipo al 📞 601 227 6691.");
      }
      setTimeout(() => inputEl.focus(), 280);
    }
  }

  // ── Llamada a Cerebras ───────────────────────────────────
  async function sendMessage(userText) {
    if (!userText.trim() || isLoading) return;

    appendMessage("user", userText);
    conversationHistory.push({ role: "user", content: userText });

    setLoading(true);
    showTyping();

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 350,
          temperature: 0.65,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...getContextMessages(), // ✅ Solo últimos 3 pares
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || `Error del servidor (${response.status})`;
        console.error("Cerebras error:", data);
        throw new Error(msg);
      }

      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error("Respuesta vacía del modelo");

      conversationHistory.push({ role: "assistant", content: reply });

      hideTyping();
      appendMessage("bot", reply);

    } catch (err) {
      hideTyping();
      console.error("SIT Chat:", err.message);
      appendMessage(
        "bot",
        `Lo siento, tuve un problema al responder. 😔\n\nPuedes contactarnos directamente:\n📞 601 227 6691\n🌐 www.serviciosit.online`,
        true
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Eventos ──────────────────────────────────────────────
  btn.addEventListener("click", toggleChat);

  sendBtn.addEventListener("click", () => {
    const t = inputEl.value.trim();
    if (t) { inputEl.value = ""; inputEl.style.height = "auto"; sendMessage(t); }
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const t = inputEl.value.trim();
      if (t) { inputEl.value = ""; inputEl.style.height = "auto"; sendMessage(t); }
    }
  });

  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + "px";
  });

  // Punto rojo después de 6 segundos si el chat no fue abierto
  setTimeout(() => { if (!isOpen) badge.classList.add("visible"); }, 6000);

})();
