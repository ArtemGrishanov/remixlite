export default function(cnt, { methods }) {
    return {
        render: data => {
            const wrapperProps = {
                styles: {
                    backgroundColor: data.wP_bg,
                },
                className: 'timeline-block',
            }

            const {markTitle, markSubtitle, imageUrl, imageDescription} = data;

            const templates = {
                markTitle: markTitle ? '<h2 class="timeline-block__mark-title">{{markTitle}}</h2>' : '',
                markSubtitle: markSubtitle ? '<h3 class="timeline-block__mark-subtitle">{{markSubtitle}}</h3>' : '',
                imageDescription: imageDescription ? '<div class="timeline-block__image-description">{{imageDescription}}</div>' : '',
            };
            templates.image = imageUrl ?
                `<div class="timeline-block__image-with-description">
                    <div class="timeline-block__image-container">
                        <img class="timeline-block__image" src={{imageUrl}} alt="" />
                    </div>
                    ${templates.imageDescription}
                </div>` : '';

            const template =
                // wrapper class - "timeline-block"
                `<div class="timeline-block__mark">
                    ${templates.markTitle}
                    ${templates.markSubtitle}
                </div>
                <div class="timeline-block__content">
                    ${templates.image}
                    <div class="timeline-block__text">
                        <p>{{text}}</p>
                    </div>
                </div>`;

            methods.add(cnt, methods.parse(template, data), data.t, null, wrapperProps)
            methods.useFont(data.text)
        }
    }
}

