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

    function adjustFontSize(inputElement) {
        const maxFontSize = 48;
        const minFontSize = 14;
        const text = inputElement.value !== undefined ? inputElement.value : inputElement.textContent; // Обработва както input.value, така и div.textContent
        // Създаваме скрит div за измерване на ширина
        const measuringDiv = document.createElement("div");
        measuringDiv.style.position = "absolute";
        measuringDiv.style.visibility = "hidden";
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


    function resizeFont() {
        const height = display.clientHeight; // Взимаме височината на дисплея
        display.style.fontSize = displaylv.style.fontSize = (height * 0.99) + 'px'; // 8% от височината
    }

