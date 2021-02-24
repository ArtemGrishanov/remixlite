import NavElement from "./navElement";

class NavButton extends NavElement {
    constructor(name, containerElement, messageSender) {
        super(name, containerElement, messageSender);
        this.element.onclick = () => {
            this.navigate(this._currentBlockIndex);
        }
    }
}

export default NavButton;
