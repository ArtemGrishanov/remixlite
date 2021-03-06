// Template
const template = `
    <div class="flip-card">
        <div class="flip-card__inner">
            <div class="flip-card__front" style="background-color:{{frontColor}};background-image:url({{frontSrc}})" >
                <div class="text-area-cnt">
                    <div class="text-area">
                        <p>{{frontText}}</p>
                    </div>
                </div>
                 <div class="hint">
                    <p>
                        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M34.3542 19.362C33.8923 19.8446 33.8923 20.627 34.3542 21.1096C34.8807 21.6596 35.6342 22.5 35.6342 24.0976C35.6342 24.5171 35.4425 25.1726 34.8758 25.9821C34.3206 26.7754 33.4577 27.6383 32.2694 28.451C29.9319 30.0497 26.4047 31.4053 21.7409 31.6577L23.5584 29.9623C24.0457 29.5078 24.088 28.7266 23.6529 28.2175C23.2178 27.7084 22.47 27.6641 21.9827 28.1187L17.8427 31.9805C17.5913 32.215 17.4476 32.5503 17.4476 32.9024C17.4476 33.2544 17.5913 33.5897 17.8427 33.8242L21.9827 37.686C22.47 38.1406 23.2178 38.0964 23.6529 37.5873C24.088 37.0781 24.0457 36.2969 23.5584 35.8424L21.7259 34.133C26.8254 33.8802 30.8143 32.4004 33.5652 30.5188C34.946 29.5744 36.033 28.516 36.7854 27.4411C37.5264 26.3825 38 25.2229 38 24.0976C38 21.4936 36.6835 20.0477 36.0271 19.362C35.5651 18.8793 34.8162 18.8793 34.3542 19.362ZM3.76598 19.509C4.15022 20.061 4.03341 20.8339 3.50507 21.2353C3.22959 21.4446 2.36576 22.4405 2.36576 24.0977C2.36576 25.1591 2.88518 26.5872 4.78033 27.9697C6.70403 29.3731 10.0021 30.6846 15.3724 31.367C16.0209 31.4494 16.4827 32.0654 16.4038 32.743C16.3249 33.4205 15.7353 33.9029 15.0868 33.8205C9.51545 33.1126 5.79013 31.7209 3.4259 29.9962C1.0331 28.2506 0 26.1258 0 24.0977C0 21.5532 1.30479 19.851 2.1136 19.2364C2.64194 18.835 3.38173 18.9571 3.76598 19.509Z" fill="white"/>
                        <path d="M30.0833 22.8703V5.62959C30.0833 4.27496 28.975 3.16663 27.6203 3.16663H10.3796C9.02496 3.16663 7.91663 4.27496 7.91663 5.62959V22.8703C7.91663 24.225 9.02496 25.3333 10.3796 25.3333H27.6203C28.975 25.3333 30.0833 24.225 30.0833 22.8703ZM14.6898 16.0972L17.7685 19.8039L22.0787 14.25L27.6203 21.6388H10.3796L14.6898 16.0972Z" fill="white"/>
                        </svg>
                    </p>
                    &nbsp
                    <p>Click to flip</p>
                </div>
            </div>
            <div class="flip-card__back" style="background-color:{{backColor}};background-image:url({{backSrc}})">
                <div class="text-area-cnt">
                    <div class="text-area">
                        <p>{{backText}}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`

export default function (cnt, {methods}) {
    let fi = null
    let container = null
    let imgPrp = ['3', '2']

    return {
        render: data => {
            container = methods.add(cnt, methods.parse(template, data), data.t)
            imgPrp = data.imageProportions.value.split('|')
            fi = container.querySelector('.flip-card__inner')
        },
        postRender: () => {
            const updateContainerHeight = () => {
                container.style.height = Math.round(container.getBoundingClientRect().width * (+imgPrp[1]) / (+imgPrp[0])) + 'px';
            }
            fi.addEventListener('click', () => fi.classList.toggle('__flipped'))
            updateContainerHeight();
            window.addEventListener('resize', () => {
                if (container) {
                    updateContainerHeight();
                }
            })
        }
    }
}
