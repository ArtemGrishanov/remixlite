class BlocksNavigation {
    #blocks = [];
    #navDots = [];
    #blockNavigationLabels = new Map();
    #navigationElements = {};
    #currentBlockIndexData = {
        internalValue: null,
        listener: val => {},
        set value(val) {
            this.listener(val, this.internalValue);
            this.internalValue = val;
        },
        get value() {
            return this.internalValue;
        },
        onValueChange: function(listener) {
            console.log('currentBlockIndex register onChange', listener);
            this.listener = listener;
        }
    }
    #lastBlock;
    #sendMessage;

    // TODO Верхняя кнопка
    // ПОЯВЛЯЕТСЯ, как только верхняя граница экрана пересекает Верхнюю границу Первого блока;
    // СОДЕРЖИТ текст блока, Верхняя граница которого скрыта за экраном;
    // ИСЧЕЗАЕТ, когда Нижняя граница Последнего блока скрывается за экраном;
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //


    constructor(messageSender) {
        this.#sendMessage = messageSender;
    }

    addBlock = (blockName, blockElement) => {
        this.#blocks.push(blockElement);
        this.#blockNavigationLabels.set(blockElement, blockName);
    }

    start = (containerElement) => {
        if (this.#blocks.length) {
            this.#lastBlock = this.#blocks[this.#blocks.length - 1];

            this.#createNavigationElements(containerElement);

            this.#currentBlockIndexData.onValueChange(this.#updateNavigationLabels);
            this.#currentBlockIndexData.value = -1;

            this.#createWindowMessageListener();
        }
    }

    #createWindowMessageListener = () => {
        window.addEventListener("message", ({data = {}}) => {
            const { method, payload = {} } = data
            switch (method) {
                case 'iframePosition': {
                    // Расстояние от ВЕРХНЕЙ границы iframe о верхней границы viewport
                    const iframeViewportTopOffset = -payload.data.top;
                    // Расстояние от НИЖНЕЙ границы iframe о верхней границы viewport
                    const iframeViewportBottomOffset = -payload.data.windowBottom;
                    console.log({
                        top: iframeViewportTopOffset,
                        bottom: iframeViewportBottomOffset,
                    });
                    // console.log('top:', iframeViewportTopOffset);
                    // console.log('bottom:', iframeViewportBottomOffset);
                    this.#updateNavigationPositions(iframeViewportTopOffset, iframeViewportBottomOffset);
                    this.#updateCurrentBlock(iframeViewportTopOffset, iframeViewportBottomOffset);
                    break;
                }
                default:
                    break;
            }
        }, false);
    }
    #createNavigationElements = (containerElement) => {
        const topButton = document.createElement('div');
        topButton.className = 'navigation-top';
        topButton.onclick = this.#navigateToCurrent;

        const bottomButton = document.createElement('div');
        bottomButton.className = 'navigation-bottom';
        bottomButton.onclick = this.#navigateToNext;

        const centerDots = document.createElement('div');
        centerDots.className = 'navigation-center';
        this.#blocks.forEach((block, index) => {
            const dot = document.createElement('div');
            dot.className = 'navigation-center__dot';
            dot.onclick = () => {
                this.#navigateTo(index);
            };

            this.#navDots.push(dot);
            centerDots.appendChild(dot);
        })

        this.#navigationElements = {
            topButton,
            bottomButton,
            centerDots,
        }
        containerElement.appendChild(topButton);
        containerElement.appendChild(bottomButton);
        containerElement.appendChild(centerDots);
    }
    #updateNavigationPositions = (topPosition, bottomPosition) => {
        const {topButton, bottomButton, centerDots} = this.#navigationElements;

        if (this.#isInsideNavigationLimits(topPosition)) {
            // TODO Оптимизация, проверка на класс
            // TODO Вынести в отдельный метод, который будет знать мапы нав-элементов на их классы
            topButton.classList.remove('navigation-top--invisible');
            centerDots.classList.remove('navigation-top--invisible');
            topButton.style.top = topPosition + 100 + 'px';
            centerDots.style.top = topPosition + (bottomPosition - topPosition) / 2 + 'px';
        } else {
            topButton.classList.add('navigation-top--invisible');
            centerDots.classList.add('navigation-top--invisible');
        }

        if (this.#isInsideNavigationLimits(bottomPosition) && this.#currentBlockIndexData.value !== (this.#blocks.length - 1)) {
            bottomButton.classList.remove('navigation-top--invisible');
            bottomButton.style.top = bottomPosition - 100 + 'px';
        } else {
            bottomButton.classList.add('navigation-top--invisible');
        }
    }

    #updateCurrentBlock = (viewportTop) => {
        let newBlockIndex = -1;
        if (this.#isInsideNavigationLimits(viewportTop)) {
            // находим блок, до которого верхняя граница экрана ещё не дошла
            const nextBlockIndex = this.#blocks.findIndex(block => {
                return block.offsetTop > viewportTop;
            });
            if (nextBlockIndex !== - 1) {
                // находимся между блоками
                newBlockIndex = nextBlockIndex - 1;
            } else {
                // находимся на последнем блоке
                newBlockIndex = this.#blocks.length - 1;
            }
        }
        if (newBlockIndex !== this.#currentBlockIndexData.value) {
            this.#currentBlockIndexData.value = newBlockIndex;
        }
    }

    #updateNavigationLabels = (currentBlockIndex, prevBlockIndex) => {
        console.log('navDots', this.#navDots);
        console.log('indexes', currentBlockIndex, prevBlockIndex);

        const {topButton, bottomButton} = this.#navigationElements;
        const currentDotClass = 'navigation-center__dot--current';

        if (prevBlockIndex !== null && prevBlockIndex > -1) {
            this.#navDots[prevBlockIndex].classList.remove(currentDotClass);
        }

        if (currentBlockIndex === -1) {
            this.#setNavElementText(bottomButton, 0);
        } else {
            this.#navDots[currentBlockIndex].classList.add(currentDotClass);
            this.#setNavElementText(topButton, currentBlockIndex);
            if (currentBlockIndex < this.#blocks.length - 1) {
                this.#setNavElementText(bottomButton, currentBlockIndex + 1);
            }
        }
    }

    /**
     * Выставляет textContent для элемента навигации
     * @param {HTMLElement} navElement Элемент навигации (верхняя или нижняя кнопка)
     * @param {number} blockIndex Блок навигации, из которого будет взят label
     */
    #setNavElementText = (navElement, blockIndex) => {
        navElement.textContent = this.#getBlockNavigationLabel(this.#blocks[blockIndex]);
    }

    // #updateNavigationLabels = (topPosition, bottomOffset) => {
    //     if (topPosition > 0) {
    //         const nextBlockIndex = this.#blocks.findIndex(block => block.offsetTop > topPosition);
    //         if (nextBlockIndex !== undefined) {
    //             this.#navigationElements.bottomButton.textContent = this.#getBlockNavigationLabel(this.#blocks[nextBlockIndex]);
    //             if (nextBlockIndex > 0) {
    //                 this.#navigationElements.topButton.textContent = this.#getBlockNavigationLabel(this.#blocks[nextBlockIndex-1]);
    //             }
    //         }
    //     } else {
    //         this.#navigationElements.bottomButton.textContent = this.#getBlockNavigationLabel(this.#blocks[0]);
    //     }
    // }

    /**
     * Вычисляет зону для отображения навигации. От верхней границы первого блока, до нижней границы последнего блока.
     * @param {number} position Расстояние от верхней границы iframe о верхней границы viewport (iframeViewportTopOffset)
     * @returns {boolean}
     */
    #isInsideNavigationLimits = (position) => {
        return position > this.#blocks[0].offsetTop
            && position < (this.#lastBlock.offsetTop + this.#lastBlock.offsetHeight);
    }

    #getBlockNavigationLabel = block => {
        return this.#blockNavigationLabels.get(block);
    }

    #navigateTo = (blockIndex) => {
        console.log('NAVIGATING TO ' + this.#blocks[blockIndex].offsetTop);
        this.#sendMessage('scrollParent', {
            top: this.#blocks[blockIndex].offsetTop - 20 // 20 = top offset
        })
    }

    #navigateToCurrent = () => {
        this.#navigateTo(this.#currentBlockIndexData.value);
    }

    #navigateToNext = () => {
        this.#navigateTo(this.#currentBlockIndexData.value + 1);
    }

}

export default BlocksNavigation;
