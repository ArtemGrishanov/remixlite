import {throttle} from "../../../loader/utils";
import invertColor from "../utils/invertColor";
import {getTranslation} from "../i18n";
import {createResizeObserver, updateEventListeners} from "../utils/events";

const templates = {
    wrapper: `
        <div class="wrapper" id="{{id}}">
            <div class="cards-wrapper__screen-{{id}}"></div>
        </div>
    `,
    cards: `
        <div class="cards-block-area" style="background-color: {{colorTheme}}; background-image: url({{backgroundImage}})">
            {{#cards}}
                <div class="cards-block-area__card is-handled" data-handlers="click" data-initiator="openCardDetail" data-cardid="{{id}}" >
                    <img class="cards-block-area__card-cover-image" src="{{coverImage}}" alt="{{disclaimer}}">
                    <div class="cards-block-area__card-disclaimer" style="color: {{textColor}};">{{disclaimer}}</div>
               </div>
           {{/cards}}
        </div>
    `,
    cardDetail: `
        <div class="card-detail {{_classes}}" id="{{card.id}}" style="background-image: url({{card.illustrationImage}}); ">
            <div class="card-detail__box">
                <div class="card-detail__header">{{card.header}}</div>
                <div class="card-detail__description">{{card.description}}</div>
                <div class="card-detail__btn-wrap">
                    {{#callToActionLink}}
                        <div class="link-block">
                            <button class="is-handled" data-handlers="click" data-initiator="callToAction" style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{callToActionText}}</button>
                        </div>
                    {{/callToActionLink}}
                    <div class="button-block">
                        <button class="is-handled" data-handlers="click" data-initiator="restart" style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{restartButtonText}}</button>
                    </div>
                </div>
            </div>
        </div>
    `,
}


export default function (container, {M, methods, sendMessage, getTranslation}) {
    let _initialData = {}
    let _screenElement = null
    let _activeScreen = null
    // Pre-parse (for high speed loading)
    for (const template of Object.values(templates)) {
        M.parse(template)
    }

    function renderStartPage() {
        const cards = _initialData.struct.cards

        _screenElement.innerHTML = M.render(templates.cards, {
            cards: cards,
            colorTheme: _initialData.colorTheme,
            backgroundImage: _initialData.backgroundImage,
            textColor:  invertColor(_initialData.colorTheme, true),
        });
        updateEventListeners(_screenElement, handlers)
    }

    function renderCardDetail(cardId) {
        let cards = _initialData.struct.cards;
        let card = cards.find(card => card.id === cardId);
        _screenElement.innerHTML = M.render(templates.cardDetail, {
            card: card,
            colorTheme: _initialData.colorTheme,
            buttonColor: invertColor(_initialData.colorTheme, true),
            callToActionLink: _initialData.callToActionLink,
            callToActionText: _initialData.callToActionText,
            _classes: !card.illustrationImage ? 'no-image' : '',
            restartButtonText: getTranslation('Restart'),
        });
        updateEventListeners(_screenElement, handlers)
    }

    const handlers = {
        click: ({initiator, payload}, evt) => {
            if (evt) evt.preventDefault()

            switch (initiator) {
                case 'start': {
                    renderStartPage();
                    _activeScreen = initiator
                    break;
                }
                case 'openCardDetail': {
                    const cardId = evt.currentTarget.dataset.cardid
                    renderCardDetail(cardId);
                    _activeScreen = initiator
                    break;
                }
                case 'callToAction': {
                    window.open(_initialData.callToActionLink, '_blank');
                    break;
                }
                case 'restart': {
                    renderStartPage()
                    let top = _screenElement.getBoundingClientRect().top
                    sendMessage('scrollParent', {top: top})
                    break;
                }
                default:
                    break;
            }
        },
    }


    return {
        render: data => {
            _initialData = data
            const wrapperId = `cards_${data.id}`
            const wrapper = M.render(templates.wrapper, {id: wrapperId})

            methods.add(container, wrapper, data.t)

            const [screenElement] = document.getElementById(wrapperId).children
            _screenElement = screenElement
            handlers.click({initiator: 'start'})
        },

        postRender: null
    }
}

