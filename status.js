    /*
    * updateMemoryStatusDisplay: Променя цвета на фона на статус зоната,
    * за да индикира дали съответният слот на паметта има стойност.
    * Приема:
    *   - slot: Номер на слота на паметта (1, 2, 3).
    *   - hasValue: Булева стойност (true, ако има стойност; false, ако е изчистена).
    */
    function updateMemoryStatusDisplay(slot, hasValue) {
        const statusElement = document.getElementById(`statusArea${slot}`);
        if (statusElement) {
            statusElement.style.backgroundColor = hasValue ? "rgb(225, 250, 4)" : "#565749"; // алтернативен или оригинален цвят
        }
    }

    // Проверка дали клавишът има допълнително поведение
    function isMemoryKey(value) {
        return /^[1-9]$/.test(value) || ["*", "/", "-"].includes(value);
    }

    function memoryAdd(targetSlot, operation = "+") {
        const rawText = (levMode ? displaylv : display).textContent.trim();
        const cleanText = rawText.replace(/\s/g, '').replace(',', '.');
        let value = parseFloat(cleanText);
        if (isNaN(value)) value = 0;
        if (Mem[targetSlot] === undefined) Mem[targetSlot] = 0;
        switch (operation) {
            case "+":
            Mem[targetSlot] += value;
                console.log(`M+ в Mem[${targetSlot}] → +${value} = [${Mem}]`);
                updateMemoryStatusDisplay(targetSlot, true); // Променя фона на светлосин
                setTimeout(() => {
                    updateMemoryStatusDisplay(targetSlot, false); // Връща оригиналния фон след х секунди
                }, 300);
                break;
            case "-":
                Mem[targetSlot] -= value;
                console.log(`M− в Mem[${targetSlot}] → −${value} = [${Mem}]`);
                updateMemoryStatusDisplay(targetSlot, true); // Променя фона на светлосин
                setTimeout(() => {
                    updateMemoryStatusDisplay(targetSlot, false); // Връща оригиналния фон след х секунди
                }, 300);
                break;
            case "0":
                Mem[targetSlot] = 0;
                console.log(`0 в Mem[${targetSlot}] → +${value} = [${Mem}]`);
            break;
            default:
                console.warn("❗ Непозната операция:", operation);
        }
        localStorage.setItem('CalcMem', JSON.stringify(Mem));
    }

    // Действията за памет
    function executeMemoryAction(value, statusArea) {
        switch (statusArea) {
            case 1:
            switch (value) {
                case "1": memoryAdd(1, "+"); updateStatus("M+", statusArea); break;
                case "4": memoryAdd(1, "-"); updateStatus("M−", statusArea); break;
                case "7": memoryAdd(1, "0"); updateStatus("MC", statusArea); clearStatus(statusArea); break;
            }
            break;
            case 2:
            switch (value) {
                case "2": memoryAdd(2, "+"); updateStatus("M+", statusArea); break;
                case "5": memoryAdd(2, "-"); updateStatus("M−", statusArea); break;
                case "8": memoryAdd(2, "0"); updateStatus("MC", statusArea); clearStatus(statusArea); break;
            }
            break;
            case 3:
            switch (value) {
                case "3": memoryAdd(3, "+"); updateStatus("M+", statusArea); break;
                case "6": memoryAdd(3, "-"); updateStatus("M−", statusArea); break;
                case "9": memoryAdd(3, "0"); updateStatus("MC", statusArea); clearStatus(statusArea); break;
            }
            break;
            /*case 4: break;
            switch (value) {
                case "-": memoryAdd(); updateStatus("M+", statusArea); break;
                case "/": memorySubtract(); updateStatus("M−", statusArea); break;
                case "*": memoryRecall(); updateStatus("MR", statusArea); clearStatus(statusArea); break;
            }
            break;*/
        }
    }

    //memoryShow: Временно показва стойността от даден слот на паметтав горния дисплей, без да го променя
    function memoryShow(slot) {
        if (Mem[slot] === undefined || Mem[slot] === 0) {
            console.warn(`ℹ️ Памет Mem[${slot}] е празна или нулева.`);
            return;
        }
        // const displaylv = document.getElementById('levInput'); // Това е input, така че value е ок
        //const display = document.getElementById('eurInput'); // Добавяме референция към eurInput div
        const originalValue = displaylv.textContent; // Запазваме оригиналната стойност на levInput
        const originalEurValue = display.textContent; // Запазваме оригиналната стойност на eurInput (div)
        const originalBgColor = displaylv.style.backgroundColor;
        const originalEurBgColor = display.style.backgroundColor; // Запазваме оригиналния фон на eurInput (div)
        // Форматираме и показваме стойността от паметта
        const memValueStr = groupByThree(formatNumber(Mem[slot]));
        // Показваме стойността в eurInput (div)
        display.textContent = memValueStr;
        adjustFontSize(displaylv, display);
        display.style.backgroundColor = 'rgba(255, 223, 186, 0.5)'; // Светло оранжево за индикация
        // Връщаме оригиналните стойности след 3 секунди
        setTimeout(() => {
            display.textContent = originalEurValue;
            display.style.backgroundColor = originalEurBgColor;
            // displayElement.value = originalValue; // Няма нужда да връщаме levInput, ако показваме в eurInput
            // displayElement.style.backgroundColor = originalBgColor;
        }, 1000);
    }

    function memoryRecall(slot) {
        let dspl;
        if (Mem[slot] === undefined || Mem[slot] === 0 || (userInput != "" && !(/[+\-*/×÷]$/.test(userInput)))) {
            return;
        }
        const valueStr = Mem[slot].toString().replace('.', ','); // 💬 замяна за визуализация, ако е нужно
        // if (/[+\-*/×÷]/.test(userInput) || userInput === "") userInput += valueStr;  // Добавяме стойността от паметта към текущия вход
        userInput += valueStr;  // Добавяме стойността от паметта към текущия вход
        dspl = userInput;
        if (levMode) {
            displaylv.textContent = /[+\-*/×÷]/.test(userInput)
            ? dspl = dspl.replace(/\*/g, "×").replace(/\//g, "÷")
            : groupByThree(userInput, true);
            display.textContent = /[+\-*/×÷]/.test(userInput)
            ? "" // Не конвертираме, ако има операция
            : groupByThree(convertFromLevToEur(userInput, true));
        } else {
            display.textContent = /[+\-*/×÷]/.test(userInput)
            ? dspl = dspl.replace(/\*/g, "×").replace(/\//g, "÷")
            : groupByThree(userInput, true);
            displaylv.textContent = /[+\-*/×÷]/.test(userInput)
            ? "" // Не конвертираме, ако има операция convertFromEurToLev(userInput, true)
            : groupByThree(convertFromEurToLev(userInput, true));
        }
        console.log(`📟 MR от Mem[${slot}] → "${valueStr}" → нов userInput: "${userInput}"`);
        adjustFontSize(displaylv, display);
        updateMemoryStatusDisplay(slot, false); // Връща оригиналния фон веднага при извикване
    }

    function updateStatus(message, sArea) {
        const statusId = typeof sArea === "number" ? `statusArea${sArea}` : sArea;
        const status = document.getElementById(statusId);
        if (!status) {
            console.warn(`updateStatus: елемент с id '${statusId}' не е намерен.`);
            return;
        }
        console.log(`✔️ updateStatus(${statusId}):`, message);
        status.textContent = message;
        status.style.opacity = "1";
    }


    function clearStatus(sArea) {
    const statusId = typeof sArea === "number" ? `statusArea${sArea}` : sArea;
    const status = document.getElementById(statusId);
    if (!status) return;
    status.style.opacity = "0";
    }
