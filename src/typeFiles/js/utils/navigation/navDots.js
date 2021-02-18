import NavElement from "./navElement";

class NavDots extends NavElement {
    #dots = [];
    #dotCssClassName = this.cssName + '__dot';
    #activeDotCssClassName = this.#dotCssClassName + '--current';

    constructor(name, containerElement, messageSender, blocksCount) {
        super(name, containerElement, messageSender);
        for (let i = 0; i < blocksCount; i++) {
            const dot = document.createElement('div');
            dot.className = this.#dotCssClassName;
            dot.onclick = () => {
                this.navigate(i);
            };
            this.#dots.push(dot);
            this.element.appendChild(dot);
        }
    }

    set currentBlockIndex(newIndex) {
        if (Number.isInteger(newIndex)) {
            this.#dots.forEach((dot) => {
                dot.classList.remove(this.#activeDotCssClassName);
            })
            this.#dots[newIndex].classList.add(this.#activeDotCssClassName);
        }
    }
}

export default NavDots;
