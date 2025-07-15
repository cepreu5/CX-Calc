let history = []; // масив от { entry: string, session: number }

function loadHistory() {
    const savedHistory = JSON.parse(localStorage.getItem('currencyConverterHistory'));
    //history = savedHistory || [];
    // Филтрираме старите записи, които може да нямат 'operation' или 'result'
    history = savedHistory ? savedHistory.filter(record => record.operation && record.result) : [];
}

function saveHistoryToStorage() {
    localStorage.setItem('currencyConverterHistory', JSON.stringify(history));
}

function addHistoryEntry(operation, levValue, eurValue) {
    const formattedLev = groupByThree(formatNumber(levValue));
    const formattedEur = groupByThree(formatNumber(eurValue));
    let entry = `${formattedLev} лв. = ${formattedEur} €`;
    if (`${groupByThree(formatNumber(levValue))}` == "" || `${groupByThree(formatNumber(eurValue))}` == "") {
        if (formattedLev === "") {
            entry = `${formattedEur}`;
        } else if (formattedEur === "") {
            entry = `${formattedLev}`;
        }         
    };
    history.unshift({ operation, result: entry });
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    saveHistoryToStorage();
}

function formatExpression(expression) {
    expression = expression.replace(/\s+/g, '');

    // Израз с две числа и оператор между тях
    const regex = /(\d+(?:[.,]\d+)?)[\s]*([+\-*/×÷])[\s]*(\d+(?:[.,]\d+)?)/;

    return expression.replace(regex, (_, raw1, operator, raw2) => {
        // Унифициране: ако има запетая – я заменяме с точка
        const n1 = parseFloat(raw1.replace(',', '.'));
        const n2 = parseFloat(raw2.replace(',', '.'));

        // Форматиране: 2 знака след десетичния знак
        const formatted1 = n1.toFixed(2).replace('.', ',');
        const formatted2 = n2.toFixed(2).replace('.', ',');

        return `${formatted1} ${operator} ${formatted2}`;
    });
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
        li.textContent = "";
        if (/[+\-*/×÷]/.test(record.operation)) {
            li.textContent = `${formatExpression(record.operation)} -> `;
        }
        li.textContent += `${record.result}`;
        // li.textContent = `${record.operation} = ${record.result}`;
        historyList.appendChild(li);
    });
}

function handleClearHistory() {
    history = [];
    //inputSessionId = Date.now(); // нова сесия
    saveHistoryToStorage();
    updateHistoryList();
    closeHistoryModalButton.click();
}

function historyOpen() {
    updateHistoryList();
    historyModal.style.display = 'flex';
    modalIsActive = true;
    //document.querySelector("#calculator").style.pointerEvents = "none";

};

// Clear History button
if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', handleClearHistory);
}

if (closeHistoryModalButton) {
    closeHistoryModalButton.addEventListener('click', (e) => { 
        historyModal.style.display = 'none';
        // Забавяне на изключването с 1 tick (0 ms timeout)
        setTimeout(() => {
            modalIsActive = false;
        }, 0);
        e.stopPropagation();
        e.preventDefault();
    });
}
