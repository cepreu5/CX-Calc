// tips ------------------

    /**
     * @file tips.js
     * @description Manages the interactive pop-up help system.
     */

    // 1. Data structure for all available tips
    const allTips = [
        {
            id: 'tip-help',
            text: 'Показва подробна помощна информация за разширените функции на калкулатора. Задръжте го, за да се покажат помощни обозначения върху бутоните (на компютър: Ctrl+Клик).',
            target: 'statusArea4',
        },
        {
            id: 'tip-history-and-settings',
            text: 'История. Задръжте бутона за отваряне на Настройки (на компютър: Ctrl+Клик).',
            target: '€', // The value of the key to attach to
        },
        {
            id: 'tip-display-switch',
            text: 'Клик върху някой от дисплеите превключва активния дисплей (или натискане на бутона с две стрелки).',
            target: 'display', // A generic target for the display area
        },
        {
            id: 'tip-copy',
            text: 'Извлича от съдържанието на клипборда първото число (ако има такова).',
            target: '/', // A generic target for the display area
        },
        {
            id: 'tip-paste',
            text: 'Резултатът от пресмятанията се запомня автоматично в клипборда, така че можете лесно да го поставите навсякъде.',
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
     * @param {function} [onClose] Optional callback to execute when the tip is closed.
     */
    function createTipElement(tip, onClose) {
        const targetCoords = keyCoordinatesMap.get(tip.target);
        if (!targetCoords) {
            console.warn(`Could not find coordinates for tip target: ${tip.target}`);
            if (onClose) onClose(); // Продължаваме, за да не блокира обучението
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

        // Прихващаме всички кликове вътре в подсказката и спираме разпространението им.
        // Това е основната защита, която предпазва елементите под подсказката (напр. бутоните на калкулатора)
        // от случайно задействане при клик върху фона на подсказката, checkbox-а или бутона за затваряне.
        tipElement.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Централизирана функция за затваряне на подсказката и почистване
        const closeTip = (event) => {
            // Спираме разпространението на клика, за да не задейства бутони под подсказката.
            if (event) {
                event.stopPropagation();
            }
            // Почистваме 'click outside' listener-а, за да избегнем течове на памет
            document.removeEventListener('click', handleClickOutside, true);
            // Премахваме елемента от DOM, ако все още е там
            if (container.contains(tipElement)) {
                container.removeChild(tipElement);
            }
            // Изпълняваме callback-а за следващо действие (напр. показване на следваща подсказка)
            if (onClose) {
                onClose();
            }
        };

        // Handler, който затваря подсказката при клик извън нея
        const handleClickOutside = (event) => {
            if (!tipElement.contains(event.target)) {
                closeTip(event);
            }
        };

        // Добавяме listener-а със закъснение, за да не може същият клик, който е отворил подсказката, да я затвори веднага.
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside, true);
        }, 0);

        // Position the tip above the target element
        const targetCenterX = targetCoords.x + targetCoords.width / 2;
        const popupRect = tipElement.getBoundingClientRect();
        tipElement.style.left = `${targetCenterX - popupRect.width / 2}px`;
        tipElement.style.top = `${targetCoords.y - popupRect.height - 12}px`; // 12px for tail and gap

        // Event Listeners
        tipElement.querySelector('.tip-dont-show-again').addEventListener('change', (event) => {
            const tipToUpdate = tips.find(t => t.id === tip.id);
            if (tipToUpdate) {
                tipToUpdate.show = false;
                saveTipStates();
            }
            closeTip(event);
        });

        tipElement.querySelector('.tip-close-btn').addEventListener('click', (event) => {
            closeTip(event);
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
                let tipIndex = 0;
                const showNextTip = () => {
                    if (tipIndex < tips.length) {
                        const currentTip = tips[tipIndex];
                        tipIndex++;
                        // Подаваме showNextTip като callback, за да се покаже следващата подсказка
                        createTipElement(currentTip, showNextTip);
                    } else {
                        // Извиква се, след като последната подсказка е затворена
                        showNotification('Приятна работа с CX-Calc!', 'success');
                    }
                };
                showNextTip(); // Стартираме обучението
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
