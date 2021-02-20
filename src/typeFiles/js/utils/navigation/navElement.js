class NavElement {
    element; // HTMLElement
    position; // Number
    cssClass = '';
    navigate;
    _currentBlockIndex; // Number
    _isVisible = false; // Boolean
    #cssInvisibleClass = '';

    constructor(name, containerElement, navigateCallback) {
        this.element = document.createElement('div');
        this.cssClass = 'navigation-' + name;
        this.#cssInvisibleClass = this.cssClass + '--invisible';
        this.element.classList.add(this.cssClass, this.#cssInvisibleClass);
        containerElement.appendChild(this.element);
        this.navigate = navigateCallback;
    }

    set isVisible(newValue) {
        this._isVisible = newValue;
        this.#applyVisibility();
    }
    get isVisible() {
        return this._isVisible;
    }

    set currentBlockIndex(newIndex) {
        this._currentBlockIndex = newIndex;
    }

    #applyVisibility = () => {
        if (this._isVisible) {
            console.log('visible');
            this.element.classList.remove(this.#cssInvisibleClass);
            this.element.style.top = this.position + 'px';
        } else {
            console.log('INvisible');
            this.element.classList.add(this.#cssInvisibleClass);
        }
    }
}

export default NavElement;
