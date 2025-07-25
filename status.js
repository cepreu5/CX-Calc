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
                //status.textContent = "operation";
                setTimeout(() => {
                    updateMemoryStatusDisplay(targetSlot, false); // Връща оригиналния фон след х секунди
                }, 300);
                break;
            case "-":
                Mem[targetSlot] -= value;
                console.log(`M− в Mem[${targetSlot}] → −${value} = [${Mem}]`);
                updateMemoryStatusDisplay(targetSlot, true); // Променя фона на светлосин
                //status.textContent = "operation";
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
    //function updateStatus(message, sArea) {
        const statusId = typeof targetSlot === "number" ? `statusArea${targetSlot}` : targetSlot;
        const status = document.getElementById(statusId);
        if (!status) {
            //console.warn(`updateStatus: елемент с id '${statusId}' не е намерен.`);
            return;
        }
        //console.log(`✔️ updateStatus(${statusId}):`, message);
        status.textContent = "M" + targetSlot;
        status.style.opacity = "1";
    //}

    }

    // Действията за памет
    function executeMemoryAction(value, statusArea) {
        switch (statusArea) {
            case 1:
            switch (value) {
                case "1": memoryAdd(1, "+"); break;
                case "4": memoryAdd(1, "-"); break;
                case "7": memoryAdd(1, "0"); clearStatus(statusArea); break;
            }
            break;
            case 2:
            switch (value) {
                case "2": memoryAdd(2, "+"); break;
                case "5": memoryAdd(2, "-"); break;
                case "8": memoryAdd(2, "0"); clearStatus(statusArea); break;
            }
            break;
            case 3:
            switch (value) {
                case "3": memoryAdd(3, "+"); break;
                case "6": memoryAdd(3, "-"); break;
                case "9": memoryAdd(3, "0"); clearStatus(statusArea); break;
            }
            break;
        }
    }

    //memoryShow: Временно показва стойността от даден слот на паметтав горния дисплей, без да го променя
    function memoryShow(slot) {
        if (Mem[slot] === undefined) {
            console.warn(`ℹ️ Памет Mem[${slot}] е недефинирана.`);
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
        // Guard clause: не променяме, ако паметта е празна или ако потребителят вече е въвел число
        if (Mem[slot] === undefined || Mem[slot] === 0 || (userInput !== "" && !(/[+\-*/×÷]$/.test(userInput)))) {
            return;
        }
        const valueStr = Mem[slot].toString().replace('.', ',');
        userInput += valueStr; // Добавяме стойността от паметта към текущия вход
        const isExpression = /[+\-*/×÷(]/.test(userInput);
        // Определяме кой дисплей е първичен и кой вторичен, за да избегнем повторение на код
        const primaryDisplay = levMode ? displaylv : display;
        const secondaryDisplay = levMode ? display : displaylv;
        const conversionFunction = levMode ? convertFromLevToEur : convertFromEurToLev;
        if (isExpression) {
            // Ако е израз, показваме го в първичния дисплей и изчистваме вторичния
            primaryDisplay.textContent = userInput.replace(/\*/g, "×").replace(/\//g, "÷");
            secondaryDisplay.textContent = "";
        } else {
            // Ако е число, форматираме го и показваме конвертираната стойност
            primaryDisplay.textContent = groupByThree(userInput, true);
            secondaryDisplay.textContent = groupByThree(conversionFunction(userInput, true));
        }
        console.log(`📟 MR от Mem[${slot}] → "${valueStr}" → нов userInput: "${userInput}"`);
        adjustFontSize(displaylv, display);
        updateMemoryStatusDisplay(slot, false); // Връща оригиналния фон веднага при извикване
    }

    function clearStatus(sArea) {
    const statusId = typeof sArea === "number" ? `statusArea${sArea}` : sArea;
    const status = document.getElementById(statusId);
    if (!status) return;
    status.style.opacity = "0";
    }
