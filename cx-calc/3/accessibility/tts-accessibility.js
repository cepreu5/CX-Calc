(function(){
  // TTS Toggle Checkbox Logic
  const ttsToggle = document.getElementById('tts-toggle');
  if (ttsToggle) {
      // Set initial state from localStorage (default to false if not set)
      const savedState = localStorage.getItem('CXCalc_tts_enabled');
      ttsToggle.checked = (savedState === 'true'); // Only true if explicitly true. Otherwise false.
      ttsToggle.addEventListener('change', () => {
          localStorage.setItem('CXCalc_tts_enabled', ttsToggle.checked);
      });
      if (!savedState) return; // If not set, do not auto-init TTS
  }

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
    return new Promise((resolve, reject) => {
        try{
          const live = document.getElementById('a11y-live');
          const enabledEl = document.getElementById('tts-toggle');
          const enabled = (enabledEl ? enabledEl.checked : (localStorage.getItem('cxcalc_tts_enabled') !== 'false'));
          if (!enabled){ 
            if (live) live.textContent = text; 
            return resolve();
          }
          if (!synth){ 
            if (live) live.textContent = text; 
            return reject('Speech synthesis not supported');
          }

          let textToSpeak = String(text);
          const isBulgarianVoice = voice && voice.lang.toLowerCase().startsWith('bg');

          if (opts.cncy) {
            let currencyWord = '';
            if (opts.cncy === 'eur') {
              currencyWord = isBulgarianVoice ? 'евро' : 'euros';
            } else if (opts.cncy === 'lv') {
              currencyWord = isBulgarianVoice ? 'лева' : 'leva';
            }
            if (currencyWord) {
              textToSpeak += ' ' + currencyWord;
            }
          }

          if (textToSpeak) {
            cancelSpeech();
          }
          
          const utt = new SpeechSynthesisUtterance(textToSpeak);
          
          utt.lang = opts.lang || (isBulgarianVoice ? 'bg-BG' : 'en-US');
          if (voice) utt.voice = voice;
          utt.rate = typeof opts.rate === 'number' ? opts.rate : 1;
          utt.pitch = typeof opts.pitch === 'number' ? opts.pitch : 1;
          currentUtterance = utt;
          if (live) live.textContent = text;
          
          utt.onend = () => {
            currentUtterance = null;
            resolve();
          };
          utt.onerror = (e) => {
            currentUtterance = null;
            if (e.error === 'interrupted') {
                resolve(); // An interruption is not a failure, so we resolve.
            } else {
                console.error('cxSpeech utterance error', e);
                reject(e); // For any other error, we reject.
            }
          };

          synth.speak(utt);
        }
        catch(err){ 
            console.error('cxSpeech.speak error', err);
            const live = document.getElementById('a11y-live'); 
            if (live) live.textContent = String(text);
            reject(err);
        }
    });
  }

  function normalizeLabel(val){
    const isBulgarianVoice = voice && voice.lang.toLowerCase().startsWith('bg');

    const mapBG = {
        ',': 'запетая',
        '=': 'равно',
        '+': 'плюс',
        '-': 'минус',
        '*': 'умножено по',
        '/': 'делено на',
        'CE': 'изстриване',
        'C': 'изстриване',
        'лв.': 'лева',
        '€': 'евро'
    };

    const mapEN = {
        ',': 'comma',
        '=': 'equals',
        '+': 'plus',
        '-': 'minus',
        '*': 'times',
        '/': 'divided by',
        'CE': 'clear',
        'C': 'clear',
        'лв.': 'lev',
        '€': 'euro'
    };

    const map = isBulgarianVoice ? mapBG : mapEN;
    return map[val] || String(val);
  }

  function formatNumberForSpeech(numStr) {
    const isBulgarianVoice = voice && voice.lang.toLowerCase().startsWith('bg');
    if (numStr.includes(',')) {
        const separator = isBulgarianVoice ? ' цяло и ' : ' point ';
        return numStr.replace(',', separator);
    }
    return numStr;
  }

  function attachDisplayLongPress(ms = 600){ ['levInput','eurInput'].forEach(id => { const el = document.getElementById(id); if (!el) return; let timer = null; el.addEventListener('pointerdown', (e) => { e.preventDefault(); timer = setTimeout(async () => { const text = (el.textContent || el.value || '').trim(); if (text) await speak(text); }, ms); }); function clear(){ if (timer){ clearTimeout(timer); timer = null; } } el.addEventListener('pointerup', clear); el.addEventListener('pointercancel', clear); el.addEventListener('pointerleave', clear); }); }

  // Patching helpers (saved originals)
  let originalAppendNumber = null;

  function patchAppendNumber(){
    if (!window.appendNumber || originalAppendNumber) return false;
    originalAppendNumber = window.appendNumber;

    let isPrimed = false;

    window.appendNumber = function(arg){ 
      const res = originalAppendNumber.apply(this, arguments);

      if (!isPrimed) {
        speak(''); 
        isPrimed = true;
      }

      if (arg === 'B') {
        const active = levMode ? document.getElementById('levInput') : document.getElementById('eurInput');
        let textToSpeak = (active.textContent || active.value || '').trim().replace(/\s/g, '');
        if (textToSpeak.endsWith(',00')) {
            textToSpeak = textToSpeak.slice(0, -3);
        }
        const isBulgarianVoice = voice && voice.lang.toLowerCase().startsWith('bg');
        speak(formatNumberForSpeech(textToSpeak) || (isBulgarianVoice ? 'празно' : 'empty'));
        return res;
      }

      if (arg === '€') {
        const isBulgarianVoice = voice && voice.lang.toLowerCase().startsWith('bg');
        const textToSpeak = isBulgarianVoice ? 'история' : 'history';
        speak(textToSpeak);
        return res;
      }

      try{ 
        if (arg !== 'L' && arg !== '=') {
            const toSpeak = normalizeLabel(arg);
            if (toSpeak) speak(toSpeak);
        }
      }catch(e){ console.error('tts patch speak key error', e); }
      
      if (arg === '=') {
        (async () => {
            try{
              await speak(normalizeLabel('='));

              let active = levMode ? document.getElementById('levInput') : document.getElementById('eurInput');
              let text = active ? (active.textContent || active.value || '').trim() : '';
              let textToSpeak1 = text.replace(/\s/g, '');
              if (textToSpeak1.endsWith(',00')) {
                textToSpeak1 = textToSpeak1.slice(0, -3);
              }
              const cncy1 = levMode ? 'lv' : 'eur';
              if (textToSpeak1) await speak(formatNumberForSpeech(textToSpeak1), {cncy: cncy1});

              let inactive = !levMode ? document.getElementById('levInput') : document.getElementById('eurInput');
              let text2 = inactive ? (inactive.textContent || inactive.value || '').trim() : '';
              let textToSpeak2 = text2.replace(/\s/g, '');
              if (textToSpeak2.endsWith(',00')) {
                textToSpeak2 = textToSpeak2.slice(0, -3);
              }
              const cncy2 = !levMode ? 'lv' : 'eur';
              if (textToSpeak2) await speak(formatNumberForSpeech(textToSpeak2), {cncy: cncy2});
            } catch(e) { 
                if (e && e.error !== 'interrupted') console.error('tts patch speak result error', e); 
            }
        })();
      }
      return res;
    };
    return true;
  }

  function initIntegration(){
    initSpeech('bg-BG');
    try{
      if (window.toggleDisplayMode) {
          const originalToggle = window.toggleDisplayMode;
          window.toggleDisplayMode = function() {
              originalToggle.apply(this, arguments);
              const currencyToSpeak = levMode ? normalizeLabel('лв.') : normalizeLabel('€');
              speak(currencyToSpeak);
          }
      } else {
        console.warn('TTS: window.toggleDisplayMode not found for patching.');
      }
      attachDisplayLongPress();
      patchAppendNumber();
      console.log('cx-tts: initialized patches');
    }catch(e){ console.error('cx-tts init error', e); }
  }

  let waited = 0;
  const interval = setInterval(() => {
    if (window.appendNumber && window.toggleDisplayMode){
      clearInterval(interval); 
      initIntegration();
    }
    waited += 200;
    if (waited > 10000){ 
      clearInterval(interval); 
      console.warn('cx-tts: timeout waiting for main script.'); 
    }
  }, 200);

  window.cxSpeech = window.cxSpeech || { init: initSpeech, speak: speak, cancel: cancelSpeech };
  window.cxTTS = window.cxTTS || { attachDisplayLongPress: attachDisplayLongPress, normalizeLabel: normalizeLabel };

})();