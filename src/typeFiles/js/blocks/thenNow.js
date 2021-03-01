//Image placeholder
const placeholderSVG = `<svg width="800" height="340" viewBox="0 0 800 340" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="800" height="340" fill="#EEEEEE"/>
<rect x="262" y="66" width="276" height="209" rx="4" fill="#EEEEEE"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M388.93 143.169C388.93 153.756 380.464 162.338 370.021 162.338C359.578 162.338 351.111 153.756 351.111 143.169C351.111 132.582 359.578 124 370.021 124C380.464 124 388.93 132.582 388.93 143.169ZM332.202 210.261L364.675 186.461L386.843 195.635L425.536 158.504L466.459 210.261H383.667H332.202Z" fill="#D8D8D8"/>
</svg>`

// Template
const template = `
    <div class="then-now-block">
        <div class="then-now-block__img"></div>
        <div class="then-now-block__img-container">
            <div class="then-now-block__img-inner-container" style="left:50%; overflow: hidden">
                <div class="then-now-block__img-inner-container" style="left:-50%">
                    <div class="then-now-block__img"></div>
                </div>
            </div>
        </div>
        <div class="then-now-block__delimiter" style="left:50%">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="black" fill-opacity="0.4"/>
                <path d="M42 24L34.5 15.3397L34.5 32.6603L42 24Z" fill="#FFFFFF"/>
                <rect x="20" y="6" width="8" height="36" rx="1" fill="#FFFFFF"/>
                <path d="M6 24L13.5 15.3397L13.5 32.6603L6 24Z" fill="#FFFFFF"/>
            </svg>
        </div>
    </div>`

export default function(cnt, { methods }) {
    let container = null
    let imgParentDiv = null
    let imgInnerDiv = null
    let delimiterSvg = null
    let delimiterDiv = null
    let imgPrp = ['3', '2']

    return {
        render: data => {
            container = methods.add(cnt, methods.parse(template, data), data.t);
            const imgContainer = container.querySelector('.then-now-block__img-container');
            imgParentDiv = imgContainer.querySelector('div');
            imgInnerDiv = imgParentDiv.querySelector('div');
            delimiterDiv = container.querySelector('.then-now-block__delimiter');
            delimiterSvg = delimiterDiv.querySelector('svg');
            imgPrp = data.imageProportions.value.split('|');

            const images = container.querySelectorAll('.then-now-block__img');
            const SVG64 = window.btoa(placeholderSVG);
            images[0].style.backgroundImage = `url(${data.leftSrc ? data.leftSrc : `'data:image/svg+xml;base64,${SVG64}'`})`;
            if (data.rightSrc) {
                imgParentDiv.style.backgroundColor = '#FFF';
                images[1].style.backgroundImage = `url(${data.rightSrc})`;
            } else {
                imgParentDiv.style.backgroundColor = '#000';
                images[1].style.backgroundImage = `url('data:image/svg+xml;base64,${SVG64}')`;
                images[1].style.opacity = '0.9';
            }
        },
        postRender: () => {
            const updateContainerHeight = () => {
                container.style.height = Math.round(container.getBoundingClientRect().width * (+imgPrp[1]) / (+imgPrp[0])) + 'px';
            }
            const setDelimiterPosition = position => {
                if (position < 0) position = 0;
                else if (position > 100) position = 100;
                delimiterDiv.style.left = position + '%';
                imgParentDiv.style.left = position + '%';
                imgInnerDiv.style.left = '-' + position + '%';
            }

            updateContainerHeight();
            window.addEventListener('resize', () => {
                if (container) {
                    updateContainerHeight();
                    setDelimiterPosition(50);
                }
            })

            const mouseDownEventHandler = event => {
                const isTouch = !!event.touches;
                const clientX = isTouch ? event.touches[0].clientX : event.clientX;
                const position = Math.round((clientX - container.getBoundingClientRect().left) / container.getBoundingClientRect().width * 100);
                setDelimiterPosition(position);
                delimiterDiv.style.opacity = '0.7';
                delimiterSvg.style.opacity = '0.7';

                const onMove = moveEvent => {
                    if (!isTouch) moveEvent.preventDefault();
                    const clientX = isTouch ? moveEvent.touches[0].clientX : moveEvent.clientX;
                    const position = Math.round((clientX - container.getBoundingClientRect().left) / container.getBoundingClientRect().width * 100);
                    setDelimiterPosition(position);
                }

                const onUp = () => {
                    delimiterDiv.style.opacity = '1';
                    delimiterSvg.style.opacity = '1';
                    document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
                    document.removeEventListener(isTouch ? 'touchend' : 'mouseup', onUp);

                }

                document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
                document.addEventListener(isTouch ? 'touchend' : 'mouseup', onUp);
            }

            container.onmousedown = mouseDownEventHandler;
            container.ontouchstart = mouseDownEventHandler;
        }
    }
}
