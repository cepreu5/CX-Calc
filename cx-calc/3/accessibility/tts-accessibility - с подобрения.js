(function(){
  // cx TTS accessibility bundle: speech + overlay + auto-init

  function attachDisplayLongPress(ms = 600){ ['levInput','eurInput'].forEach(id => { const el = document.getElementById(id); if (!el) return; let timer = null; el.addEventListener('pointerdown', (e) => { e.preventDefault(); timer = setTimeout(() => { const text = (el.textContent || el.value || '').trim(); if (text) speak(text); }, ms); }); function clear(){ if (timer){ clearTimeout(timer); timer = null; } } el.addEventListener('pointerup', clear); el.addEventListener('pointercancel', clear); el.addEventListener('pointerleave', clear); }); }

  // Patching helpers (saved originals)
  let originalAppendNumber = null;

  function patchAppendNumber(){
    if (!window.appendNumber || originalAppendNumber) return false;
    originalAppendNumber = window.appendNumber;
    
    let initPromise = null;

    window.appendNumber = function(arg){
      if (!initPromise) {
          initPromise = initTtsAudioAndPreload();
          initPromise.catch(e => console.error("TTS Audio initialization failed:", e));
      }

      try{
        const toSpeak = normalizeLabel(arg);
        if (toSpeak) speak(toSpeak);
      }catch(e){ console.error('tts patch speak key error', e); }

      const res = originalAppendNumber.apply(this, arguments);

      if (arg === '=') {
        (async () => {
          try {
            await initPromise; // Wait for init to complete before speaking results
            if (levMode) var active = document.getElementById('levInput');
            else var active = document.getElementById('eurInput');
            var text = active ? (active.textContent || active.value || '').trim() : '';
            const cncy = levMode ? 'lv' : 'eur';
            if (text) await speakResult(text, cncy);

            if (!levMode) var active = document.getElementById('levInput');
            else var active = document.getElementById('eurInput');
            text = active ? (active.textContent || active.value || '').trim() : '';
            if (text) await speakResult(text, cncy === 'lv' ? 'eur' : 'lv');
          } catch(e) { console.error('tts patch speak result error', e); }
        })();
      }
      return res;
    };
    return true;
  }

  function initIntegration(){
    try{
      attachDisplayLongPress();
      patchAppendNumber();
      console.log('cx-tts: initialized overlays + patches');
    }catch(e){ console.error('cx-tts init error', e); }
  }

  // Auto-waiter: wait for keys and appendNumber to be available
  let waited = 0;
  const interval = setInterval(() => {
    if (window.appendNumber){
      clearInterval(interval); initIntegration();
    }
    waited += 200;
    if (waited > 10000){ clearInterval(interval); console.warn('cx-tts: timeout waiting for main script.'); }
  }, 200);

})();

let ttsAudioContext;
const audioBufferCache = {};

async function initTtsAudioAndPreload() {
    console.log("Initializing TTS AudioContext...");
    ttsAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (ttsAudioContext.state === 'suspended') {
        await ttsAudioContext.resume();
    }
    
    console.log("Preloading TTS sounds...");
    await preloadSoundsWebAudio();
    
    console.log("TTS Audio initialized and sounds preloaded.");
}

async function preloadSoundsWebAudio() {
    const soundNames = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'comma', 'plus', 'minus', 'mul', 'div', 'eq', 'clear', 'lv', 'eur'
    ];
    
    await Promise.all(soundNames.map(name => new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(`sounds/${name}.mp3`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            ttsAudioContext.decodeAudioData(arrayBuffer, (buffer) => {
                audioBufferCache[name] = buffer;
                resolve();
            }, (error) => {
                console.error(`Error decoding sound: ${name}`, error);
                reject(error);
            });
        } catch (error) {
            console.error(`Failed to fetch sound: ${name}`, error);
            reject(error);
        }
    })));
    console.log("All TTS sounds preloaded and decoded.");
}

function playSound(name) {
    const buffer = audioBufferCache[name];
    if (ttsAudioContext && ttsAudioContext.state === 'running' && buffer) {
        const source = ttsAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(ttsAudioContext.destination);
        source.start();
    } else {
        // This might be called before preloading is complete on the very first key press.
        // console.warn(`TTS Sound not ready or context not running: ${name}`);
    }
}

async function speakResult(text, currency) {
  const raw = String(text).trim();
  const cleaned = raw.replace(/[^\d,\.\-]/g, '');
  const [whole, fraction] = cleaned.replace('.', ',').split(',');
  let finalText = whole;
  if (fraction && fraction !== '00') {
    finalText += ',' + fraction;
  }
  await speak('eq');
  await speak(finalText);
  if (currency) {
    await speak(currency);
  }
}

function speak(text) {
  return new Promise(resolve => {
    const normalized = normalizeLabel(text);
    const tokens = normalized.split(/([\s,\.]+)/).filter(t => t.trim() !== '');

    let delay = 0;
    let previousToken = null;

    tokens.forEach(token => {
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
        delay += 1000; 
      } else if (token === 'eq') {
        setTimeout(() => playSound('eq'), delay);
        delay += 1000;
      } else {
        setTimeout(() => playSound(token), delay);
        delay += 600;
      }

      previousToken = token;
    });

    setTimeout(resolve, delay);
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
  map['L'] = !levMode ? 'lv' : 'eur';
  return map[val] || String(val);
}
