class BlocksNavigation {
    #blocks = [];
    #blockNavigationLabels = new Map();
    #navigationElements = {};
    #currentBlockIndexData = {
        internalValue: null,
        listener: val => {},
        set value(val) {
            console.log('currentBlockIndex setter', val, this.listener);
            this.internalValue = val;
            this.listener(val);
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
        topButton.textContent = 'EAT ME!';
        const bottomButton = document.createElement('div');
        bottomButton.className = 'navigation-bottom';
        const centerDots = document.createElement('div');
        centerDots.className = 'navigation-center';

        this.#navigationElements.topButton = topButton;
        this.#navigationElements.bottomButton = bottomButton;
        this.#navigationElements.centerDots = centerDots;

        containerElement.appendChild(topButton);
        containerElement.appendChild(bottomButton);
    }
    #updateNavigationPositions = (topPosition, bottomPosition, bottomOffset) => {
        const topButtonStyle = this.#navigationElements.topButton.style;
        const bottomButtonStyle = this.#navigationElements.bottomButton.style;
        const centerDotsStyle = this.#navigationElements.centerDots.style;

        if (this.#isInsideNavigationLimits(topPosition)) {
            topButtonStyle.display = 'block';
            topButtonStyle.top = topPosition + 100 + 'px';
        } else {
            topButtonStyle.display = 'none';
        }

        if (this.#isInsideNavigationLimits(bottomOffset)) {
            bottomButtonStyle.display = 'block';
            bottomButtonStyle.bottom = bottomPosition + 20 + 'px';
        } else {
            bottomButtonStyle.display = 'none';
        }
    }

    #updateCurrentBlock = (viewportTop) => {
        // Оптимизация быстродействия: перед тем, как запустить цикл поиска текущего блока - проверяем
        // не остались ли мы в пределах "текущей зоны"
        if () {

        }
        let currentBlockIndex = -1;
        if (this.#isInsideNavigationLimits(viewportTop)) {
            // находим блок, до которого верхняя граница экрана ещё не дошла
            const nextBlockIndex = this.#blocks.findIndex(block => block.offsetTop > viewportTop);
            if (nextBlockIndex !== undefined) {
                currentBlockIndex = nextBlockIndex - 1;
            } else {
                // находимся на последнем блоке
                currentBlockIndex = this.#blocks.length - 1;
            }
        }
        this.#currentBlockIndexData.value = currentBlockIndex;
    }

    #updateNavigationLabels = (currentBlockIndex) => {
        console.log('Current block changed to', currentBlockIndex);
        const {topButton, bottomButton} = this.#navigationElements;
        console.log('updateNavigationLabels', currentBlockIndex);
        if (currentBlockIndex === -1) {
            this.#setNavElementText(bottomButton, 0);
        } else {
            this.#setNavElementText(topButton, currentBlockIndex);
            if (currentBlockIndex < this.#blocks.length - 1) {
                this.#setNavElementText(bottomButton, currentBlockIndex + 1);
            }
        }
    }

    /**
     * Выставляет textContent для элемента навигации
     * @param {HTMLElement} navElement Элемент навигации (верхняя или нижняя кнопка)
     * @param {number} blockIndex
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

    #updateTopButton = {}
    #getNavigationActiveRange = () => {

    }
    #navigateTo = (blockElement) => {

    }
}

export default BlocksNavigation;
