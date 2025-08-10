const themeSwitcher = document.getElementById('theme-switcher');
const docElement = document.documentElement; // Променяме атрибута на <html>

// --- Логика за настройки на цветовете ---
const settingsTrigger = document.getElementById('settings-trigger');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsButton = document.getElementById('close-settings-button');
const resetColorsButton = document.getElementById('reset-colors-button');
const colorPickers = document.querySelectorAll('.color-setting input[type="color"]');
const settingsJsonTextarea = document.getElementById('settings-json');
const importSettingsButton = document.getElementById('import-settings-button');
const exportSettingsButton = document.getElementById('export-settings-button');
const copySettingsButton = document.getElementById('copy-settings-button');

function getContrastColor(hex) {
    if (!hex) return '#111111';
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Формула за яркост (luminance)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111111' : '#f1f1f1';
}

function applyModalContrast() {
    const modalContent = document.querySelector('.modal-content');
    const modalButtons = modalContent.querySelectorAll('.modal-buttons button');
    const modalButtonContainer = modalContent.querySelector('.modal-buttons');
    const settingsIoSection = modalContent.querySelector('.settings-io-section');

    // Вземаме цвета на фона на панела, който е същият като на модала
    const panelBgColor = getComputedStyle(docElement).getPropertyValue('--panel-bg-color').trim();
    const contrastColor = getContrastColor(panelBgColor);
    const borderColor = getContrastColor(contrastColor) === '#111111' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';

    // Прилагаме контрастния цвят на текста
    modalContent.style.color = contrastColor;
    // Заглавието и основният текст вече се управляват от CSS променливи,
    // но за елементите вътре в модала, които не ги ползват, задаваме цвета директно.

    // Прилагаме контрастен цвят на бутоните и рамките
    modalButtons.forEach(btn => {
        btn.style.color = contrastColor;
        btn.style.borderColor = borderColor;
    });

    modalButtonContainer.style.borderTopColor = contrastColor;
    if (settingsIoSection) settingsIoSection.style.borderTopColor = contrastColor;
}

function populateSettingsTextarea() {
    const currentTheme = docElement.dataset.theme;
    const savedColors = localStorage.getItem(`customColors_${currentTheme}`);
    const formattedJson = savedColors ? JSON.stringify(JSON.parse(savedColors), null, 2) : '{}';
    settingsJsonTextarea.value = formattedJson;
}

exportSettingsButton.addEventListener('click', populateSettingsTextarea);

importSettingsButton.addEventListener('click', () => {
    const jsonString = settingsJsonTextarea.value;
    if (!jsonString.trim()) {
        alert('Полето е празно. Поставете настройките, които искате да приложите.');
        return;
    }
    try {
        const parsedSettings = JSON.parse(jsonString);
        if (typeof parsedSettings !== 'object' || parsedSettings === null || Array.isArray(parsedSettings)) {
            throw new Error('Невалиден формат. Настройките трябва да са JSON обект.');
        }

        const currentTheme = docElement.dataset.theme;
        localStorage.setItem(`customColors_${currentTheme}`, JSON.stringify(parsedSettings));

        loadCustomColors(currentTheme);
        applyModalContrast();
        alert('Настройките са приложени успешно!');
    } catch (error) {
        alert(`Грешка при прилагане на настройките:\n${error.message}\n\nМоля, проверете съдържанието на полето.`);
    }
});

copySettingsButton.addEventListener('click', () => {
    const jsonString = settingsJsonTextarea.value;
    if (!jsonString.trim()) {
        alert('Полето е празно. Няма какво да се копира.');
        return;
    }
    navigator.clipboard.writeText(jsonString).then(() => {
        alert('Настройките са копирани в клипборда!');
    }).catch(err => {
        console.error('Грешка при копиране: ', err);
        alert('Неуспешно копиране. Моля, копирайте текста ръчно.');
    });
});

// Отваряне/затваряне на модала
settingsTrigger.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    applyModalContrast();
    populateSettingsTextarea();
});
closeSettingsButton.addEventListener('click', () => settingsModal.style.display = 'none');
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
});

const loadCustomColors = (theme) => {
    // Първо нулираме всички inline стилове, за да се върнем към тези от CSS
    colorPickers.forEach(picker => {
        docElement.style.removeProperty(picker.dataset.cssVar);
    });

    const savedColors = JSON.parse(localStorage.getItem(`customColors_${theme}`)) || {};
    colorPickers.forEach(picker => {
        const cssVar = picker.dataset.cssVar;
        const savedColor = savedColors[cssVar];

        if (savedColor) {
            docElement.style.setProperty(cssVar, savedColor);
            picker.value = savedColor;
        } else {
            const defaultColor = getComputedStyle(docElement).getPropertyValue(cssVar).trim();
            picker.value = defaultColor;
        }
        // Синхронизираме и текстовото поле
        const textInput = picker.closest('.color-input-group').querySelector('.hex-input');
        if (textInput) {
            textInput.value = picker.value.toUpperCase();
        }
    });
};

colorPickers.forEach(picker => {
    picker.addEventListener('input', (e) => {
        const cssVar = e.target.dataset.cssVar;
        const newColor = e.target.value;
        docElement.style.setProperty(cssVar, newColor);

        // Синхронизираме текстовото поле
        const textInput = e.target.closest('.color-input-group').querySelector('.hex-input');
        if (textInput) {
            textInput.value = newColor.toUpperCase();
        }

        // Ако променяме фона на панела, веднага обновяваме контраста на модала
        if (cssVar === '--panel-bg-color') {
            applyModalContrast();
        }

        const currentTheme = docElement.dataset.theme;
        const savedColors = JSON.parse(localStorage.getItem(`customColors_${currentTheme}`)) || {};
        savedColors[cssVar] = newColor;
        localStorage.setItem(`customColors_${currentTheme}`, JSON.stringify(savedColors));
    });
});

resetColorsButton.addEventListener('click', () => {
    const currentTheme = docElement.dataset.theme;
    localStorage.removeItem(`customColors_${currentTheme}`);
    loadCustomColors(currentTheme);
    applyModalContrast(); // Прилагаме контраста след нулиране
});

// --- Логика за синхронизация на HEX полетата ---
const hexInputs = document.querySelectorAll('.hex-input');
hexInputs.forEach(textInput => {
    // При промяна на текстовото поле
    textInput.addEventListener('change', (e) => {
        let value = e.target.value.trim().toUpperCase();
        if (value.length > 0 && !value.startsWith('#')) {
            value = '#' + value;
        }

        // Валидация на HEX кода
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            const colorInput = e.target.closest('.color-input-group').querySelector('input[type="color"]');
            if (colorInput) {
                colorInput.value = value.toLowerCase();
                // Задействаме ръчно 'input' събитието на цветния елемент, за да се изпълни неговата логика
                colorInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else {
            // Ако кодът е невалиден, връщаме старата стойност от цветния елемент
            const colorInput = e.target.closest('.color-input-group').querySelector('input[type="color"]');
            e.target.value = colorInput.value.toUpperCase();
        }
    });
    // Удобство: селектираме целия текст при фокус
    textInput.addEventListener('focus', (e) => e.target.select());
});

// --- Логика за смяна на темата (модифицирана) ---
const setTheme = (theme) => {
  docElement.dataset.theme = theme;
  themeSwitcher.textContent = theme === 'dark' ? '☀️' : '🌙';

  const modalIcon = document.getElementById('modal-theme-icon');
  if (modalIcon) modalIcon.textContent = theme === 'dark' ? '🌙' : '☀️';

  localStorage.setItem('theme', theme);
  loadCustomColors(theme);
  // Изчакваме CSS да се приложи преди да изчислим контраста
  setTimeout(() => {
    applyModalContrast();
    populateSettingsTextarea();
  }, 50);
};

// Проверяваме за запазена тема или предпочитания на системата
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

setTheme(initialTheme);

themeSwitcher.addEventListener('click', () => {
  const currentTheme = docElement.dataset.theme;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
});

document.getElementById('modal-theme-icon').addEventListener('click', () => {
    const currentTheme = docElement.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});
