/**
 * Отправить событие в систему сбора статистики
 *
 * @param {string} trackerName например interactyTracker
 * @param {string} category например Videos
 * @param {string} action например Play
 * @param {string} [label] например 'Fall Campaign' название клипа
 * @param {number} [value] например 10 - длительность
 */

export function sendStatToGA(trackerName, { category, action, label, value }) {
    if (window.ga) {
        var statData = {
            hitType: 'event',
            eventCategory: category,
            eventAction: action,
        }
        if (label) {
            statData.eventLabel = label
        }
        if (value) {
            statData.eventValue = value
        }
        try {
            window.ga(trackerName + '.send', statData)
        } catch (err) {
            console.error(err);
        }
    }
}
