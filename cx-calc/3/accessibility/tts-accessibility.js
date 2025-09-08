(function(){
  // cx TTS accessibility bundle: speech + overlay + auto-init
  /*const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  let voice = null;
  let currentUtterance = null;*/

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

/*  async function initSpeech(preferredLang){
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
      
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.appendNumber) window.appendNumber(k.value);
      });

      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
      overlayRoot.appendChild(btn);
    });
  }*/

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
        if (arg === '=') {
          const active =
            document.querySelector('.active-display') ||
            document.getElementById('eurInput') ||
            document.getElementById('levInput');
          const text = active ? (active.textContent || active.value || '').trim() : '';
          if (text) speakResult(text);
        }
      }catch(e){ console.error('tts patch speak result error', e); }
      return res;
    };
    return true;
  }

  function initIntegration(){
    // initialize speech
    // initSpeech('bg');
    // try to create overlays and attach patches
    try{
      // if (window.keys && window.keys.length) createOverlayButtons(window.keys);
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
  //window.cxSpeech = window.cxSpeech || { init: initSpeech, speak: speak, cancel: cancelSpeech };
  //window.cxTTS = window.cxTTS || { createOverlayButtons: createOverlayButtons, attachDisplayLongPress: attachDisplayLongPress, normalizeLabel: normalizeLabel };
})();

function playSound(name) {
  const audio = new Audio(`sounds/${name}.mp3`);
  audio.play().catch(err => console.error(`Грешка при възпроизвеждане на ${name}:`, err));
}

// Изговаряне на число чрез цифри (напр. 573 → „5“ „7“ „3“)
function speakDigits(numberStr) {
  const digits = String(numberStr).replace(/\D/g, '').split('');
  digits.forEach((digit, i) => {
    setTimeout(() => playSound(digit), i * 500);
  });
}

// Изговаряне на сума (напр. „573,67 лв.“)
function speakAmount(amountStr, currency = 'лев') {
  const [whole, fraction] = String(amountStr).split(/[,\.]/);
  speakDigits(whole);
  if (fraction) {
    setTimeout(() => playSound('comma'), whole.length * 500);
    fraction.split('').forEach((digit, i) => {
      setTimeout(() => playSound(digit), (whole.length + 1 + i) * 500);
    });
  }
  setTimeout(() => playSound(currency), (whole.length + (fraction ? fraction.length + 1 : 0)) * 500);
}

function speakResult(text) {
  const raw = String(text).trim();

  // запази минуса, ако има
  const isNegative = raw.startsWith('-');
  
  const cleaned = raw.replace(/[^\d,\.\-]/g, '');

  // раздели на цяло и дробно
  const [whole, fraction] = cleaned.replace('.', ',').split(',');

  let finalText = whole;
  //let finalText = raw.startsWith('-') ? cleaned : cleaned.replace('-', '');

  // добави дробната част само ако не е "00"
  if (fraction && fraction !== '00') {
    finalText += ',' + fraction;
  }

  let currency = '';
  if (levMode) currency = 'lv';
  else currency = 'eur';

  // изговаря "равно"
  speak('eq');

  // изговаря числото след пауза
  setTimeout(() => {
    speak(finalText);
  }, 1000);

  // изчисли реалното времетраене на числото
  const digitCount = finalText.replace(/[^0-9]/g, '').length;
  const hasComma = finalText.includes(',');
  const hasMinus = finalText.startsWith('-');

  let totalDelay = 1500; // пауза след "eq"
  if (hasMinus) totalDelay += 700;
  totalDelay += digitCount * 500;
  if (hasComma) totalDelay += 1000; // запетая + допълнителна пауза

  // изговаря валутата след числото
  if (currency) {
    setTimeout(() => speak(currency), totalDelay);
  }
}


/*function speak(text) {
  console.log('Ще се изговаря:', text);
  const live = document.getElementById('a11y-live');
  if (live) live.textContent = text;

  const normalized = normalizeLabel(text);
  const tokens = normalized.split(/([\s,\.]+)/).filter(t => t.trim() !== '');

  let delay = 0;

  tokens.forEach(token => {
    // ако започва с минус
    if (/^-?\d+$/.test(token)) {
      if (token.startsWith('-')) {
        setTimeout(() => playSound('minus'), delay);
        delay += 600;
        token = token.slice(1); // премахни минуса за цифрите
      }
      token.split('').forEach(digit => {
        setTimeout(() => playSound(digit), delay);
        delay += 500;
      });
    } else if (token === ',' || token === '.') {
      setTimeout(() => playSound('comma'), delay);
      delay += 600;
    } else {
      setTimeout(() => playSound(token), delay);
      delay += 600;
    }
  });
}*/

function speak(text) {
  console.log('Ще се изговаря:', text);
  const live = document.getElementById('a11y-live');
  if (live) live.textContent = text;

  const normalized = normalizeLabel(text);
  const tokens = normalized.split(/([\s,\.]+)/).filter(t => t.trim() !== '');

  let delay = 0;
  let previousToken = null;

  tokens.forEach(token => {
    // ако започва с минус
    if (/^-?\d+$/.test(token)) {
      if (token.startsWith('-')) {
        setTimeout(() => playSound('minus'), delay);
        delay += 700;
        token = token.slice(1);
      }

      const isDecimal = previousToken === ',' || previousToken === '.';
      const digitPause = isDecimal ? 600 : 500;

      token.split('').forEach(digit => {
        setTimeout(() => playSound(digit), delay);
        delay += digitPause;
      });
    } else if (token === ',' || token === '.') {
      setTimeout(() => playSound('comma'), delay);
      delay += 800; // основна пауза за запетаята
      delay += 200; // допълнителна пауза преди десетичната част
    } else if (token === 'eq') {
      setTimeout(() => playSound('eq'), delay);
      delay += 1000; // по-дълга пауза след "равно"
    } else {
      setTimeout(() => playSound(token), delay);
      delay += 600;
    }

    previousToken = token;
  });
}

function normalizeLabel(val) {
  const map = {
    ',': 'comma',
    '+': 'plus',
    '-': 'minus',
    '*': 'mul',
    '/': 'div',
    '=': 'eq',
    'C': 'clear',
    'CE': 'clear',
    'лв.': 'lv',
    '€': 'eur'
  };
  // динамично задаване на 'L' според levMode
  map['L'] = !levMode ? 'lv' : 'eur';
  return map[val] || String(val);
}
