// Template
const template = `
    <div class="then-now">
        <div class="then-now__left_img" style="background-image:url({{leftSrc}})"></div>
        <div class="then-now__right_img">
            <div style="left:50%">
                <div style="left:-50%">
                    <div style="background-image:url({{rightSrc}})"></div>
                </div>
            </div>
        </div>
        <div class="then-now__delimiter" style="left:50%;opacity:1">
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
    let rightParentDiv = null
    let rightDiv = null
    let delimiterSvg = null
    let delimiterDiv = null
    let imgPrp = ['3', '2']

    return {
        render: data => {
            container = methods.add(cnt, methods.parse(template, data), data.t);
            const rightImgDiv = container.querySelector('.then-now__right_img');
            rightParentDiv = rightImgDiv.querySelector('div');
            rightDiv = rightParentDiv.querySelector('div');
            delimiterDiv = container.querySelector('.then-now__delimiter');
            delimiterSvg = delimiterDiv.querySelector('svg');
            imgPrp = data.imageProportions.value.split('|')
        },
        postRender: () => {
            const setDelimiterLeft = newLeft => {
                delimiterDiv.style.left = newLeft + 'px';
                rightParentDiv.style.left = newLeft + 'px';
                rightDiv.style.left = '-' + newLeft + 'px';
            }

            container.style.height = Math.round(container.getBoundingClientRect().width * (+imgPrp[1]) / (+imgPrp[0])) + 'px';
            window.addEventListener('resize', () => {
                if (container) {
                    container.style.height = Math.round(container.getBoundingClientRect().width * (+imgPrp[1]) / (+imgPrp[0])) + 'px';
                    setDelimiterLeft(Math.round(container.getBoundingClientRect().width / 2));
                }
            })

            delimiterSvg.addEventListener('mousedown', event => {
                event.preventDefault();
                delimiterDiv.style.opacity = 0.7;

                const onMouseMove = mmEvent => {
                    let newLeft = mmEvent.clientX - container.getBoundingClientRect().left;
                    const width = container.getBoundingClientRect().width;
                    if (newLeft < 0) {
                        newLeft = 0
                    } else if (newLeft > width) {
                        newLeft = width
                    }
                    setDelimiterLeft(newLeft)
                }

                const onMouseUp = () => {
                    delimiterDiv.style.opacity = 1;
                    document.removeEventListener('mouseup', onMouseUp);
                    document.removeEventListener('mousemove', onMouseMove);
                }

                document.addEventListener('mouseup', onMouseUp)
                document.addEventListener('mousemove', onMouseMove)
            })
        }
    }
}
