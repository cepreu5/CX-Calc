/**
 * @file tips.js
 * @description Manages the interactive pop-up help system.
 */

// 1. Data structure for all available tips
const allTips = [
    {
        id: 'tip-history-and-settings',
        text: 'Кликнете тук за достъп до историята. Натиснете Ctrl+Клик (или задръжте) за достъп до настройките.',
        target: '€', // The value of the key to attach to
    },
    {
        id: 'tip-help',
        text: 'Кликнете тук за подробна помощна информация за всички функции.',
        target: 'statusArea4',
    },
    {
        id: 'tip-display-switch',
        text: 'Кликнете върху някой от дисплеите, за да го направите активен за въвеждане.',
        target: 'display', // A generic target for the display area
    }
];

// This will hold the final tip data with calculated coordinates and show states
let tips = [];
let keyCoordinatesMap = new Map();

/**
 * Initializes the tips system with coordinates from the main app.
 * @param {Map<string, {x: number, y: number, width: number, height: number}>} coordinatesMap A map of target IDs to their screen coordinates.
 */
function initTips(coordinatesMap) {
    keyCoordinatesMap = coordinatesMap;
    const savedStates = JSON.parse(localStorage.getItem('CXCalc_TipStates')) || {};
    tips = allTips.map(tip => ({
        ...tip,
        show: savedStates[tip.id] !== false // Default to true if not explicitly set to false
    }));
    console.log('Tips system initialized.');
}

/**
 * Saves the current 'show' state of all tips to localStorage.
 */
function saveTipStates() {
    const statesToSave = tips.reduce((acc, tip) => {
        acc[tip.id] = tip.show;
        return acc;
    }, {});
    localStorage.setItem('CXCalc_TipStates', JSON.stringify(statesToSave));
}

/**
 * Creates and displays a single tip pop-up on the screen.
 * @param {object} tip The tip object to display.
 */
function createTipElement(tip) {
    const targetCoords = keyCoordinatesMap.get(tip.target);
    if (!targetCoords) {
        console.warn(`Could not find coordinates for tip target: ${tip.target}`);
        return;
    }

    const container = document.body;
    const tipElement = document.createElement('div');
    tipElement.className = 'tip-popup';
    tipElement.id = `popup-${tip.id}`;

    tipElement.innerHTML = `
        <div class="tip-content">${tip.text}</div>
        <div class="tip-actions">
            <label>
                <input type="checkbox" class="tip-dont-show-again"> Не показвай повече
            </label>
            <button class="tip-close-btn">&times;</button>
        </div>
        <div class="tip-tail"></div>
    `;

    container.appendChild(tipElement);

    // Position the tip above the target element
    const targetCenterX = targetCoords.x + targetCoords.width / 2;
    const popupRect = tipElement.getBoundingClientRect();
    tipElement.style.left = `${targetCenterX - popupRect.width / 2}px`;
    tipElement.style.top = `${targetCoords.y - popupRect.height - 12}px`; // 12px for tail and gap

    // Event Listeners
    tipElement.querySelector('.tip-dont-show-again').addEventListener('change', () => {
        const tipToUpdate = tips.find(t => t.id === tip.id);
        if (tipToUpdate) {
            tipToUpdate.show = false;
            saveTipStates();
        }
        container.removeChild(tipElement);
    });

    tipElement.querySelector('.tip-close-btn').addEventListener('click', () => {
        container.removeChild(tipElement);
    });
}

/**
 * Main function to control the display of tips.
 * @param {'Single' | 'All' | 'newOnly' | 'Reset'} mode The mode of operation.
 */
function showTips(mode = 'Single') {
    document.querySelectorAll('.tip-popup').forEach(el => el.remove());

    switch (mode) {
        case 'Reset':
            tips.forEach(tip => tip.show = true);
            saveTipStates();
            showNotification('Всички подсказки са нулирани.', 'success');
            break;

        case 'All':
            tips.forEach(tip => createTipElement(tip));
            break;

        case 'newOnly':
            tips.filter(tip => tip.show).forEach(tip => createTipElement(tip));
            break;

        case 'Single':
        default:
            const firstTipToShow = tips.find(tip => tip.show);
            if (firstTipToShow) createTipElement(firstTipToShow);
            break;
    }
}