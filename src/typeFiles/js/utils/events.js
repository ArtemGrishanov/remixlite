import log from "./log";
import {throttle} from "../../../loader/utils";

export const updateEventListeners = (domElement, handlers, additionalPayload = {}) => {
    if (domElement) {
        try {
            const handledElements = domElement.getElementsByClassName("is-handled");
            for (const el of handledElements) {
                for (const handle of el.dataset.handlers.split('|')) {
                    el.addEventListener(handle, evt => handlers[handle]({
                        initiator: el.dataset.initiator,
                        payload: {
                            ...el.dataset,
                            ...additionalPayload
                        }
                    }, evt))
                }
            }
        } catch (err) {
            log('error', '', data.id, null, err)
        }
    }
}

export const createResizeObserver = (handler, throttleWaitTime = 300) => {
    return new ResizeObserver(throttle(handler, throttleWaitTime))
}
