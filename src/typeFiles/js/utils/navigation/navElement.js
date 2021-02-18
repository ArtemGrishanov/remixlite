class NavElement {
    element; // HTMLElement
    position; // Number
    cssName = '';
    navigate;
    _currentBlockIndex; // Number
    _isVisible = false; // Boolean

    constructor(name, containerElement, navigateCallback) {
        this.element = document.createElement('div');
        this.cssName = 'navigation-' + name;
        this.element.className = this.cssName;
        containerElement.appendChild(this.element);
        this.navigate = navigateCallback;
        this.#applyVisibility();
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
        const cssInvisibleClass = this.cssName + '--invisible';
        if (this._isVisible) {
            this.element.classList.remove(cssInvisibleClass);
            this.element.style.top = this.position + 'px';
        } else {
            this.element.classList.add(cssInvisibleClass);
        }
    }
}

export default NavElement;
