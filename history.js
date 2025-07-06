    function loadHistory() {
        const savedHistory = JSON.parse(localStorage.getItem('currencyConverterHistory'));
        history = savedHistory || [];
    }

    function saveHistoryToStorage() {
        localStorage.setItem('currencyConverterHistory', JSON.stringify(history));
    }

    let history = []; // масив от { entry: string, session: number }
    let inputSessionId = Date.now();

    function addHistoryEntry(levValue, eurValue) {
        const entry = `${groupByThree(formatNumber(levValue))} лв. = ${groupByThree(formatNumber(eurValue))} €`;
        history.unshift({ entry, session: inputSessionId }); // Записваме със сесия
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        saveHistoryToStorage();
    }

    function clearCurrentSessionHistory() {
        history = history.filter(record => record.session !== inputSessionId);
    }

    function updateHistoryList() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Няма запазена история.';
            historyList.appendChild(li);
            return;
        }
        history.forEach(record => {
            const li = document.createElement('li');
            li.textContent = record.entry; // достъпваме текста от обекта
            historyList.appendChild(li);
        });
    }

    function handleClearHistory() {
        history = [];
        inputSessionId = Date.now(); // нова сесия
        saveHistoryToStorage();
        updateHistoryList();
    }

    function historyOpen() {
        updateHistoryList();
        //hModalOverlay.style.display = 'flex';  
        historyModal.style.display = 'flex';
    };

    // Clear History button
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', handleClearHistory);
    }

    if (closeHistoryModalButton) {
        closeHistoryModalButton.addEventListener('click', (e) => {historyModal.style.display = 'none'; e.stopPropagation();});
    }
