import NavButton from "./navButton";
import NavDots from "./navDots";

class BlocksNavigation {
    #blocks = []; // Блоки, участвующие в навигации
    #blockNavigationLabels = new Map(); // Мапа лэйблов блоков для отображения на кнопках навигации
    #topNavButton; // NavButton
    #centerNavDots; // NavDots
    #bottomNavButton; // NavButton

    #navigationButtonsOffset = 20; // Расстояние по вертикали от краев экрана до кнопок, px
    #sendMessage;
    #lastBlock; // Для оптимизации. Часто используется в вычислениях


    constructor(messageSender) {
        this.#sendMessage = messageSender;
    }

    /**
     * Регистрирует блок для участия в навигации
     * @param {String} blockName - Текст для отображения на кнопках навигации
     * @param {HTMLElement} blockElement - Элемент блока
     */
    addBlock = (blockName, blockElement) => {
        this.#blocks.push(blockElement);
        this.#blockNavigationLabels.set(blockElement, blockName);
    }

    /**
     * Инициирует навигацию
     * @param {HTMLElement} containerElement - Элемент для инъекции элементов навигации
     */
    start = (containerElement) => {
        if (this.#blocks.length) {
            this.#lastBlock = this.#blocks[this.#blocks.length - 1];

            this.#createNavigationElements(containerElement);
            this.#createWindowMessageListener();
        }
    }

    /**
     * Создает элементы управления навигацией
     * @param {HTMLElement} containerElement
     */
    #createNavigationElements = (containerElement) => {
        this.#topNavButton = new NavButton('top', containerElement, this.#navigateTo);
        this.#bottomNavButton = new NavButton('bottom', containerElement, this.#navigateTo);
        this.#centerNavDots = new NavDots('center', containerElement, this.#navigateTo, this.#blocks.length);
    }

    /**
     * Регистрирует EventListener для прослушки событий снаружи iframe
     */
    #createWindowMessageListener = () => {
        window.addEventListener("message", ({data = {}}) => {
            const { method, payload = {} } = data
            if (method === 'iframePosition') {
                // Позиция верхней границы iframe относительно ВЕРХНЕЙ границы viewport
                const iframeViewportTopOffset = -payload.data.top;
                // Позиция верхней границы iframe относительно НИЖНЕЙ границы viewport
                const iframeViewportBottomOffset = -payload.data.windowBottom;

                this.#updateNavigationPositions(iframeViewportTopOffset, iframeViewportBottomOffset);
                this.#updateNavCurrentBlocks();
            }
        }, false);
    }

    /**
     * Регистрирует новые координаты и признак видимости для каждого элемента управления
     * @param {number} topOffset Позиция верхней границы iframe относительно ВЕРХНЕЙ границы viewport
     * @param {number} bottomOffset Позиция верхней границы iframe относительно НИЖНЕЙ границы viewport
     */
    #updateNavigationPositions = (topOffset, bottomOffset) => {
        this.#topNavButton.position = topOffset + this.#navigationButtonsOffset;
        this.#bottomNavButton.position = bottomOffset - this.#bottomNavButton.element.offsetHeight - this.#navigationButtonsOffset;
        this.#centerNavDots.position = (bottomOffset + topOffset) / 2;

        this.#topNavButton.isVisible = this.#isInsideNavigationLimits(this.#topNavButton.position);
        this.#bottomNavButton.isVisible =
            this.#isInsideNavigationLimits(this.#bottomNavButton.position)
            && (this.#bottomNavButton.position < this.#blocks[this.#blocks.length - 1].offsetTop);
        this.#centerNavDots.isVisible = this.#isInsideNavigationLimits(this.#centerNavDots.position);
    }

    /**
     * Обновляет "текущие" блоки для каждого элемента управления
     */
    #updateNavCurrentBlocks = () => {
        const isTopButtonVisible = this.#topNavButton.isVisible;
        const isCenterDotsVisible = this.#centerNavDots.isVisible;
        const isBottomButtonVisible = this.#bottomNavButton.isVisible;

        if (isTopButtonVisible || isCenterDotsVisible || isBottomButtonVisible) {
            let topBlock = null;
            let centerBlock = null;
            let bottomBlock = null;

            // Находим "свой" блок для каждого видимого элемента управления
            this.#blocks.forEach((block, index) => {
                if (isTopButtonVisible && block.offsetTop < this.#topNavButton.position) {
                    topBlock = index;
                }
                if (isCenterDotsVisible && block.offsetTop < this.#centerNavDots.position) {
                    centerBlock = index;
                }
                if (isBottomButtonVisible && block.offsetTop < this.#bottomNavButton.position) {
                    bottomBlock = index + 1;
                }
            })

            this.#topNavButton.currentBlockIndex = topBlock;
            this.#centerNavDots.currentBlockIndex = centerBlock;
            this.#bottomNavButton.currentBlockIndex = bottomBlock;

            // Обновляем текст на кнопках
            if (Number.isInteger(topBlock)) {
                this.#topNavButton.element.textContent = this.#getBlockNavigationLabel(topBlock);
            }
            if (Number.isInteger(bottomBlock)) {
                this.#bottomNavButton.element.textContent = this.#getBlockNavigationLabel(bottomBlock);
            }
        }
    }

    /**
     * Возвращает признак вхождения элемента управления в зону для отображения навигации
     * (от верхней границы первого блока, до нижней границы последнего блока)
     * @param {number} position Расстояние от верхней границы iframe о верхней границы viewport (iframeViewportTopOffset)
     * @returns {boolean}
     */
    #isInsideNavigationLimits = (position) => {
        return position > this.#blocks[0].offsetTop
            && position < (this.#lastBlock.offsetTop + this.#lastBlock.offsetHeight);
    }

    /**
     * Возвращает текст для кнопки навигации
     * @param {Number} blockIndex
     * @returns {String}
     */
    #getBlockNavigationLabel = blockIndex => {
        return this.#blockNavigationLabels.get(this.#blocks[blockIndex]);
    }

    /**
     * Перемещает экран пользователя к определенному блоку
     * @param {Number} blockIndex
     */
    #navigateTo = (blockIndex) => {
        // Коррекция для навигации к центру экрана
        const viewportOffsetCenterCorrection = this.#centerNavDots.position - this.#topNavButton.position;
        this.#sendMessage('scrollParent', {
            top: this.#blocks[blockIndex].offsetTop - viewportOffsetCenterCorrection + 50
        })
    }
}

export default BlocksNavigation;
