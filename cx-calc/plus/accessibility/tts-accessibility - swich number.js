(function(){
  // TTS Toggle Checkbox Logic
  const ttsToggle = document.getElementById('tts-toggle');
  if (ttsToggle) {
      const savedState = localStorage.getItem('CXCalc_tts_enabled');
      ttsToggle.checked = (savedState === 'true');

      const soundCheckbox = document.getElementById('soundEffectsCheckbox');

      function handleSoundAndTTS() {
          const isTtsEnabled = ttsToggle.checked;
          if (!soundCheckbox) return;

          if (isTtsEnabled) {
              soundCheckbox.disabled = true;
              if (soundCheckbox.checked) {
                  soundCheckbox.checked = false;
                  const appSettings = JSON.parse(localStorage.getItem('CXCalc_appSettings')) || {};
                  appSettings.soundEffectsEnabled = false;
                  localStorage.setItem('CXCalc_appSettings', JSON.stringify(appSettings));
                  // Also update the global variable from mainAll.js to stop sounds in the current session
                  if (typeof window.soundEffectsEnabled !== 'undefined') {
                      window.soundEffectsEnabled = false;
                  }
              }
          } else {
              soundCheckbox.disabled = false;
          }
      }

      // Run on page load
      handleSoundAndTTS();

      // Run on every change of the TTS toggle
      ttsToggle.addEventListener('change', () => {
          localStorage.setItem('CXCalc_tts_enabled', ttsToggle.checked);
          handleSoundAndTTS();
          // Reload is required for the accessibility script itself to be fully enabled/disabled
          window.location.reload();
      });

      if (savedState !== 'true') return;
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

  // Patching helpers (saved originals)
  let originalAppendNumber = null;
  let originalSwitchNumber = null;
  let originalPasteNumber = null;
  let isSwitchingNumber = false;

  function patchSwitchNumber() {
    if (!window.switchNumber || originalSwitchNumber) return false;
    originalSwitchNumber = window.switchNumber;
    window.switchNumber = function() {
        isSwitchingNumber = true;
        originalSwitchNumber.apply(this, arguments);
    }
    return true;
  }

  function patchPasteNumber() {
      if (!window.pasteNumber || originalPasteNumber) return false;
      originalPasteNumber = window.pasteNumber;
      window.pasteNumber = async function() {
          try {
              await originalPasteNumber.apply(this, arguments);
          } finally {
              isSwitchingNumber = false;
          }
      }
      return true;
  }

  function patchAppendNumber(){
    if (!window.appendNumber || originalAppendNumber) return false;
    originalAppendNumber = window.appendNumber;

    let isPrimed = false;

    window.appendNumber = function(arg){
      const enabledEl = document.getElementById('tts-toggle');
      const isSpeechEnabled = (enabledEl ? enabledEl.checked : (localStorage.getItem('cxcalc_tts_enabled') !== 'false'));

      // New handler for '€' when speech is ON
      if (arg === '€' && isSpeechEnabled) {
        const active = levMode ? document.getElementById('levInput') : document.getElementById('eurInput');
        let textToSpeak = (active.textContent || active.value || '').trim().replace(/\s/g, '');
        if (textToSpeak.endsWith(',00')) {
            textToSpeak = textToSpeak.slice(0, -3);
        }
        const isBulgarianVoice = voice && voice.lang.toLowerCase().startsWith('bg');
        speak(formatNumberForSpeech(textToSpeak) || (isBulgarianVoice ? 'празно' : 'empty'));
        return; // PREVENT original historyOpen() from being called
      }

      const res = originalAppendNumber.apply(this, arguments);

      if (!isSpeechEnabled) {
        return res;
      }

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

      try{
        // 'L' and '€' are handled specially. Do not speak their labels.
        // Also, do not speak anything if we are in the middle of a switchNumber operation.
        if (arg !== 'L' && arg !== '€' && arg !== '=' && !isSwitchingNumber) {
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
      patchSwitchNumber();
      patchPasteNumber();
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
  window.cxTTS = window.cxTTS || { normalizeLabel: normalizeLabel };

})();