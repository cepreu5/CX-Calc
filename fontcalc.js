    function getTextWidth(text, inputElement) {
        const span = document.createElement("span");
        span.style.visibility = "hidden";
        span.style.position = "absolute";
        span.style.whiteSpace = "pre"; // запазва интервалите
        span.style.fontSize = getComputedStyle(inputElement).fontSize;
        span.style.fontFamily = getComputedStyle(inputElement).fontFamily;
        span.style.fontWeight = getComputedStyle(inputElement).fontWeight;
        span.textContent = text;
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);
        return width;
    }

    /*function adjustFontSize(inputElement) {
        const maxFontSize = 48;
        const minFontSize = 14;
        const text = inputElement.value !== undefined ? inputElement.value : inputElement.textContent; // Обработва както input.value, така и div.textContent
        // Създаваме скрит div за измерване на ширина
        const measuringDiv = document.createElement("div");
        measuringDiv.style.position = "absolute";
        measuringDiv.style.visibility = "hidden";
        //measuringDiv.style.zIndex = "2000";
        //measuringDiv.style.top = "30px";
        measuringDiv.style.height = "auto";
        measuringDiv.style.width = "auto";
        measuringDiv.style.whiteSpace = "pre";
        measuringDiv.style.fontFamily = getComputedStyle(inputElement).fontFamily;
        measuringDiv.style.fontWeight = getComputedStyle(inputElement).fontWeight;
        measuringDiv.style.letterSpacing = getComputedStyle(inputElement).letterSpacing;
        measuringDiv.style.padding = "0";
        measuringDiv.style.border = "0";
        measuringDiv.style.boxSizing = "content-box";
        document.body.appendChild(measuringDiv);
        let fontSize = maxFontSize;
        // Намаляваме размера на шрифта, докато текстът се побере
        while (fontSize >= minFontSize) {
            measuringDiv.style.fontSize = fontSize + "px";
            measuringDiv.textContent = text;
            const measuredWidth = measuringDiv.offsetWidth;
            if (measuredWidth <= inputElement.clientWidth) {
            break;
            }
            fontSize--;
        }
        fontSize-=7; // Намаляваме с 7px, за да сме сигурни, че текстът не прелива
        if (fontSize < minFontSize) {
            fontSize = minFontSize; // Не допускаме да отидем под минималния размер
        }
        // Прилагаме подходящия размер върху input-а
        inputElement.style.fontSize = fontSize + "px";
        // Почистваме
        document.body.removeChild(measuringDiv);
    } 

function adjustFontSize(inputElement) {
    const maxFontSize = 48;
    const minFontSize = 14;
    const text = inputElement.value !== undefined ? inputElement.value : inputElement.textContent || "0";

    // Създаваме скрит div за измерване
    const measuringDiv = document.createElement("div");
    measuringDiv.style.position = "absolute";
    measuringDiv.style.visibility = "hidden";
    measuringDiv.style.height = "auto";
    measuringDiv.style.width = inputElement.clientWidth + "px";
    measuringDiv.style.whiteSpace = "pre";
    const cs = getComputedStyle(inputElement);
    measuringDiv.style.fontFamily = cs.fontFamily;
    measuringDiv.style.fontWeight = cs.fontWeight;
    measuringDiv.style.letterSpacing = cs.letterSpacing;
    measuringDiv.style.padding = cs.padding;
    measuringDiv.style.border = cs.border;
    measuringDiv.style.boxSizing = cs.boxSizing;
    document.body.appendChild(measuringDiv);

    let fontSize = maxFontSize;
    while (fontSize >= minFontSize) {
        measuringDiv.style.fontSize = fontSize + "px";
        measuringDiv.textContent = text;
        // Проверка и по ширина, и по височина
        if (
            measuringDiv.scrollWidth <= inputElement.clientWidth &&
            measuringDiv.scrollHeight <= inputElement.clientHeight
        ) {
            break;
        }
        fontSize--;
    }
    if (fontSize < minFontSize) fontSize = minFontSize;
    inputElement.style.fontSize = fontSize + "px";
    document.body.removeChild(measuringDiv);
}*/

function adjustFontSize(element1, element2) {
    const maxFontSize = 48;
    const minFontSize = 14;

    // Вземаме текстовете
    const text1 = element1.value !== undefined ? element1.value : element1.textContent || "0";
    const text2 = element2.value !== undefined ? element2.value : element2.textContent || "0";

    // Избираме по-дългия текст (по брой символи)
    const longerText = text1.length >= text2.length ? text1 : text2;

    // Използваме ширината и височината на по-малкия елемент (за по-сигурно)
    const width = element1.clientWidth; // Math.min(element1.clientWidth, element2.clientWidth);
    const height = element1.clientHeight; // Math.min(element1.clientHeight, element2.clientHeight);

    // Създаваме скрит div за измерване
    const measuringDiv = document.createElement("div");
    measuringDiv.style.position = "absolute";
    measuringDiv.style.visibility = "hidden";
    measuringDiv.style.height = "auto";
    measuringDiv.style.width = width + "px";
    measuringDiv.style.whiteSpace = "pre";
    const cs = getComputedStyle(element1); // Приемаме, че стиловете са еднакви
    measuringDiv.style.fontFamily = cs.fontFamily;
    measuringDiv.style.fontWeight = cs.fontWeight;
    measuringDiv.style.letterSpacing = cs.letterSpacing;
    measuringDiv.style.padding = cs.padding;
    measuringDiv.style.border = cs.border;
    measuringDiv.style.boxSizing = cs.boxSizing;
    document.body.appendChild(measuringDiv);

    let fontSize = maxFontSize;
    while (fontSize >= minFontSize) {
        measuringDiv.style.fontSize = fontSize + "px";
        measuringDiv.textContent = longerText;
        if (
            measuringDiv.scrollWidth <= width &&
            measuringDiv.scrollHeight <= height
        ) {
            break;
        }
        fontSize--;
    }
    if (fontSize < minFontSize) fontSize = minFontSize;

    // Прилагаме еднакъв размер и на двата елемента
    element1.style.fontSize = fontSize + "px";
    element2.style.fontSize = fontSize + "px";
    document.body.removeChild(measuringDiv);
}

    function resizeFont() {return;
        const height = display.clientHeight; // Взимаме височината на дисплея
        display.style.fontSize = displaylv.style.fontSize = (height * 0.99) + 'px'; // 8% от височината
    }

