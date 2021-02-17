class BlocksNavigation {
    #blocks = [];
    #navDots = [];
    #blockNavigationLabels = new Map();
    #navigationElements = {
        topButton: null,
        centerDots: null,
        bottomButton: null,
    };
    #navigationElementsPositions = {
        topButton: null,
        centerDots: null,
        bottomButton: null,
    };
    #navigationElementsVisibility = {
        topButton: false,
        centerDots: false,
        bottomButton: false,
    };
    #navigationButtonsCurrentBlockIndex = {
        topButton: null,
        centerDots: null,
        bottomButton: null,
    }
    #navigationButtonsOffset = 20; // Расстояние по вертикали от краев экрана до кнопок, px
    #lastBlock;
    #sendMessage;

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
            this.#createWindowMessageListener();
        }
    }

    #createWindowMessageListener = () => {
        window.addEventListener("message", ({data = {}}) => {
            const { method, payload = {} } = data
            if (method === 'iframePosition') {
                // Позиция ВЕРХНЕЙ границы iframe относительно ВЕРХНЕЙ границы viewport
                const iframeViewportTopOffset = -payload.data.top;
                // Позиция ВЕРХНЕЙ границы iframe до НИЖНЕЙ границы viewport
                const iframeViewportBottomOffset = -payload.data.windowBottom;

                this.#updateNavigationPositions(iframeViewportTopOffset, iframeViewportBottomOffset);
                this.#updateNavCurrentBlocks();
                this.#updateNavLabels();
            }
        }, false);
    }

    #createNavigationElements = (containerElement) => {
        const topButton = document.createElement('div');
        topButton.className = 'navigation-top';
        topButton.onclick = this.#bottomButtonNavigation;

        const bottomButton = document.createElement('div');
        bottomButton.className = 'navigation-bottom';
        bottomButton.onclick = this.#topButtonNavigation;

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
            centerDots,
            bottomButton,
        }
        containerElement.appendChild(topButton);
        containerElement.appendChild(centerDots);
        containerElement.appendChild(bottomButton);
    }

    #updateNavigationPositions = (topOffset, bottomOffset) => {
        const {topButton, centerDots, bottomButton} = this.#navigationElements;

        this.#navigationElementsPositions.topButton = topOffset + this.#navigationButtonsOffset;
        this.#navigationElementsPositions.centerDots = (bottomOffset + topOffset) / 2;
        this.#navigationElementsPositions.bottomButton = bottomOffset - bottomButton.offsetHeight - this.#navigationButtonsOffset;

        this.#navigationElementsVisibility.topButton = this.#isInsideNavigationLimits(this.#navigationElementsPositions.topButton);
        this.#navigationElementsVisibility.centerDots = this.#isInsideNavigationLimits(this.#navigationElementsPositions.centerDots);
        this.#navigationElementsVisibility.bottomButton =
            this.#isInsideNavigationLimits(this.#navigationElementsPositions.bottomButton)
            && (this.#navigationElementsPositions.bottomButton < this.#blocks[this.#blocks.length - 1].offsetTop);

        this.#updateNavElementVisibility(
            topButton,
            this.#navigationElementsPositions.topButton,
            this.#navigationElementsVisibility.topButton
        );
        this.#updateNavElementVisibility(
            centerDots,
            this.#navigationElementsPositions.centerDots,
            this.#navigationElementsVisibility.centerDots
        );
        this.#updateNavElementVisibility(
            bottomButton,
            this.#navigationElementsPositions.bottomButton,
            this.#navigationElementsVisibility.bottomButton
        );
    }

    #updateNavElementVisibility = (navElement, positionOffset, isVisible) => {
        if (isVisible) {
            navElement.classList.remove('navigation-top--invisible');
            navElement.style.top = positionOffset + 'px';
        } else {
            navElement.classList.add('navigation-top--invisible');
        }
    }

    #updateNavCurrentBlocks = () => {
        const { topButton, centerDots, bottomButton } = this.#navigationElementsVisibility;
        if (topButton || centerDots || bottomButton) {
            let topBlock = null;
            let centerBlock = null;
            let bottomBlock = null;

            this.#blocks.forEach((block, index) => {
                if (topButton && block.offsetTop < this.#navigationElementsPositions.topButton) {
                    topBlock = index;
                }
                if (centerDots && block.offsetTop < this.#navigationElementsPositions.centerDots) {
                    centerBlock = index;
                }
                if (bottomButton && block.offsetTop < this.#navigationElementsPositions.bottomButton) {
                    bottomBlock = index;
                }
            })

            this.#navigationButtonsCurrentBlockIndex.topButton = topBlock;
            this.#navigationButtonsCurrentBlockIndex.centerDots = centerBlock;
            this.#navigationButtonsCurrentBlockIndex.bottomButton = bottomBlock + 1;
        }
    }

    #updateNavLabels = () => {
        const { topButton, centerDots, bottomButton } = this.#navigationButtonsCurrentBlockIndex;
        if (Number.isInteger(topButton)) {
            this.#setNavElementText(this.#navigationElements.topButton, topButton);
        }
        if (Number.isInteger(centerDots)) {
            const activeDotClass = 'navigation-center__dot--current';
            this.#navDots.forEach((dot) => {
                dot.classList.remove(activeDotClass);
            })
            this.#navDots[centerDots].classList.add(activeDotClass);
        }
        if (Number.isInteger(bottomButton)) {
            this.#setNavElementText(this.#navigationElements.bottomButton, bottomButton);
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
        // console.log(`NAVIGATING TO [${blockIndex}] ${this.#blocks[blockIndex].offsetTop}`);
        // const diff_1 = 400;
        const viewportOffsetCenterCorrection = this.#navigationElementsPositions.centerDots - this.#navigationElementsPositions.topButton;
        // console.log({
        //     diff: this.#navigationElementsPositions.centerDots - this.#navigationElementsPositions.topButton,
        // });
        this.#sendMessage('scrollParent', {
            top: this.#blocks[blockIndex].offsetTop - viewportOffsetCenterCorrection + 50
        })
    }

    #bottomButtonNavigation = () => {
        this.#navigateTo(this.#navigationButtonsCurrentBlockIndex.topButton);
    }

    #topButtonNavigation = () => {
        this.#navigateTo(this.#navigationButtonsCurrentBlockIndex.bottomButton);
    }
}

export default BlocksNavigation;
