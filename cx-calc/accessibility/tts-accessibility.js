(function(){
  // cx TTS accessibility bundle: speech + overlay + auto-init
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  let voice = null;
  let currentUtterance = null;

  function loadVoices(){
    return new Promise(resolve => {
      if (!synth) return resolve([]);
      let voices = synth.getVoices();
      if (voices && voices.length) return resolve(voices);
      const handler = () => { voices = synth.getVoices(); synth.removeEventListener('voiceschanged', handler); resolve(voices); };
      synth.addEventListener('voiceschanged', handler);
      setTimeout(() => resolve(synth.getVoices()), 1200);
    });
  }

  async function initSpeech(preferredLang){
    try{
      if (!synth) return;
      const voices = await loadVoices();
      if (!voices || voices.length === 0) return;
      if (preferredLang){
        const short = preferredLang.split('-')[0].toLowerCase();
        voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(short));
      }
      if (!voice) voice = voices[0];
      console.log('cxSpeech: selected voice', voice && voice.name, voice && voice.lang);
    }catch(e){ console.error('cxSpeech.init error', e); }
  }

  function cancelSpeech(){ if (!synth) return; try{ if (synth.speaking || synth.pending) { synth.cancel(); currentUtterance = null; } }catch(e){console.error(e);} }

  function speak(text, opts = {}){
    try{
      const live = document.getElementById('a11y-live');
      const enabledEl = document.getElementById('tts-toggle');
      const enabled = (enabledEl ? enabledEl.checked : (localStorage.getItem('cxcalc_tts_enabled') !== 'false'));
      if (!enabled){ if (live) live.textContent = text; return; }
      if (!synth){ if (live) live.textContent = text; return; }
      cancelSpeech();
      const utt = new SpeechSynthesisUtterance(String(text));
      utt.lang = opts.lang || 'bg-BG';
      if (voice) utt.voice = voice;
      utt.rate = typeof opts.rate === 'number' ? opts.rate : 1;
      utt.pitch = typeof opts.pitch === 'number' ? opts.pitch : 1;
      currentUtterance = utt;
      if (live) live.textContent = text;
      synth.speak(utt);
      utt.onend = () => { currentUtterance = null; };
      utt.onerror = (e) => { currentUtterance = null; console.error('cxSpeech utterance error', e); };
    }catch(err){ console.error('cxSpeech.speak error', err); const live = document.getElementById('a11y-live'); if (live) live.textContent = String(text); }
  }

  function normalizeLabel(val){
    if (val === '.') return 'точка';
    if (val === ',') return 'запетая';
    if (val === '=') return 'равно';
    if (val === '+') return 'плюс';
    if (val === '-') return 'минус';
    if (val === '*') return 'умножено';
    if (val === '/') return 'делено';
    if (val === 'CE' || val === 'C') return 'изчисти';
    return String(val);
  }

  function createOverlayButtons(keys, containerId = 'calculatorContainer', overlaysId = 'ctoverlay'){
    const container = document.getElementById(containerId) || document.body;
    if (!container) return;
    let overlayRoot = document.getElementById(overlaysId);
    if (!overlayRoot){ overlayRoot = document.createElement('div'); overlayRoot.id = overlaysId; overlayRoot.style.position = 'absolute'; overlayRoot.style.left = '0'; overlayRoot.style.top = '0'; overlayRoot.style.width = '100%'; overlayRoot.style.height = '100%'; overlayRoot.style.pointerEvents = 'none'; container.appendChild(overlayRoot); }
    overlayRoot.innerHTML = '';
    const containerRect = container.getBoundingClientRect();
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'a11y-overlay-btn';
      btn.style.position = 'absolute';
      btn.style.left = (k.x - containerRect.left) + 'px';
      btn.style.top = (k.y - containerRect.top) + 'px';
      const keyW = (k.width || (window.MainPoints && window.MainPoints.KeySize && window.MainPoints.KeySize.x) || 80);
      const keyH = (k.height || (window.MainPoints && window.MainPoints.KeySize && window.MainPoints.KeySize.y) || 60);
      btn.style.width = keyW + 'px'; btn.style.height = keyH + 'px';
      btn.style.opacity = '0'; btn.style.border = '0'; btn.style.padding = '0'; btn.style.margin = '0';
      btn.style.pointerEvents = 'auto';
      btn.setAttribute('aria-label', normalizeLabel(k.value));
      btn.dataset.keyValue = k.value;
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); const label = normalizeLabel(k.value); speak(label); if (originalAppendNumber) originalAppendNumber(k.value); });
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
      overlayRoot.appendChild(btn);
    });
  }

  function attachDisplayLongPress(ms = 600){ ['levInput','eurInput'].forEach(id => { const el = document.getElementById(id); if (!el) return; let timer = null; el.addEventListener('pointerdown', (e) => { e.preventDefault(); timer = setTimeout(() => { const text = (el.textContent || el.value || '').trim(); if (text) speak(text); }, ms); }); function clear(){ if (timer){ clearTimeout(timer); timer = null; } } el.addEventListener('pointerup', clear); el.addEventListener('pointercancel', clear); el.addEventListener('pointerleave', clear); }); }

  // Patching helpers (saved originals)
  let originalAppendNumber = null;

  function patchAppendNumber(){
    if (!window.appendNumber || originalAppendNumber) return false;
    originalAppendNumber = window.appendNumber;
    window.appendNumber = function(arg){ try{ const toSpeak = normalizeLabel(arg); // speak key press
        // speak only for non-empty arg
        if (toSpeak) speak(toSpeak);
      }catch(e){ console.error('tts patch speak key error', e); }
      // call original
      const res = originalAppendNumber.apply(this, arguments);
      try{
        if (arg === '='){
          // after evaluation, read active display
          const active = document.querySelector('.active-display') || document.getElementById('eurInput') || document.getElementById('levInput');
          const text = active ? (active.textContent || active.value || '').trim() : '';
          if (text) speak(text);
        }
      }catch(e){ console.error('tts patch speak result error', e); }
      return res;
    };
    return true;
  }

  function initIntegration(){
    // initialize speech
    initSpeech('bg');
    // try to create overlays and attach patches
    try{
      if (window.keys && window.keys.length) createOverlayButtons(window.keys);
      attachDisplayLongPress();
      patchAppendNumber();
      console.log('cx-tts: initialized overlays + patches');
    }catch(e){ console.error('cx-tts init error', e); }
  }

  // Auto-waiter: wait for keys and appendNumber to be available
  let waited = 0;
  const interval = setInterval(() => {
    if ((window.keys && window.keys.length) && window.appendNumber){
      clearInterval(interval); initIntegration();
    }
    waited += 200;
    if (waited > 10000){ clearInterval(interval); console.warn('cx-tts: timeout waiting for main script. You may need to include this script after mainAll.js'); }
  }, 200);

  // expose API
  window.cxSpeech = window.cxSpeech || { init: initSpeech, speak: speak, cancel: cancelSpeech };
  window.cxTTS = window.cxTTS || { createOverlayButtons: createOverlayButtons, attachDisplayLongPress: attachDisplayLongPress, normalizeLabel: normalizeLabel };
})();
