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

    function adjustFontSize(element1, element2) {
        const maxFontSize = 48;
        const minFontSize = 14;
        // Вземаме текстовете
        const text1 = element1.innerText !== undefined ? element1.innerText : element1.textContent || "0";
        const text2 = element2.innerText !== undefined ? element2.innerText : element2.textContent || "0";
        console.log("text1: " + text1);
        console.log("text2: " + text2);
        // Използваме ширината и височината на по-малкия елемент (за по-сигурно)
        // Използваме getBoundingClientRect() за по-голяма точност (връща дробни стойности)
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        const width = Math.min(rect1.width, rect2.width);
        const height = Math.min(rect1.height, rect2.height);
        // Създаваме скрит div за измерване
        const measuringDiv = document.createElement("div");
        measuringDiv.style.position = "absolute";
        measuringDiv.style.visibility = "hidden";
        measuringDiv.style.height = "auto";
        measuringDiv.style.width = "auto"; // Позволяваме на елемента да се разшири свободно
        measuringDiv.style.whiteSpace = "nowrap"; // Предотвратяваме пренасянето на нов ред
        const cs = getComputedStyle(element1);
        measuringDiv.style.fontFamily = cs.fontFamily;
        measuringDiv.style.fontWeight = cs.fontWeight;
        measuringDiv.style.letterSpacing = cs.letterSpacing;
        // Без padding/border, за да мерим само съдържанието
        measuringDiv.style.padding = "0";
        measuringDiv.style.border = "none";
        measuringDiv.style.boxSizing = "border-box";
        document.body.appendChild(measuringDiv);
        // Определяме кой от двата текста е визуално по-широк, за да го използваме за измерване
        measuringDiv.style.fontSize = maxFontSize + "px"; // Измерваме с максималния шрифт
        measuringDiv.textContent = text1;
        const width1 = measuringDiv.scrollWidth;
        measuringDiv.textContent = text2;
        const width2 = measuringDiv.scrollWidth;
        const widerText = width1 >= width2 ? text1 : text2;
        let fontSize = maxFontSize;
        while (fontSize >= minFontSize) {
            measuringDiv.style.fontSize = fontSize + "px";
            measuringDiv.textContent = widerText;
            if (measuringDiv.scrollWidth <= width && measuringDiv.scrollHeight <= height) {
                break;
            }
            fontSize--;
        }
        if (fontSize < minFontSize) fontSize = minFontSize;
        // Прилагаме еднакъв размер и на двата елемента
        fontSize--;
        element1.style.fontSize = fontSize + "px";
        element2.style.fontSize = fontSize + "px";
        document.body.removeChild(measuringDiv);
    }

    function resizeFont() {
        const height = display.clientHeight; // Взимаме височината на дисплея
        display.style.fontSize = displaylv.style.fontSize = (height * 0.99) + 'px'; // % от височината
    }
