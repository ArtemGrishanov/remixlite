import {DEFAULT_IMAGE_BG_WIDE_URL} from "../utils/constants";

export default function (cnt, {methods}) {
    const
        bc = '__blur',
        cr = `<div class="cur">
                    <svg viewBox="0 0 94.2691 104.3058" width="100%" height="100%">
                    <path fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF" d="M27.7876,72.8258C15.1172,67.6919,6.1761,55.276,6.1761,40.7637 c0-19.1026,15.4857-34.5882,34.5882-34.5882s34.5882,15.4856,34.5882,34.5882c0,1.0043-0.0519,1.9975-0.1359,2.9795 c-0.5868,0.0828-1.1674,0.2075-1.7282,0.4138l-0.3434,0.1272c-0.5176,0.1915-1.0092,0.4299-1.47,0.7103 c-0.0939-0.0939-0.1952-0.1766-0.2915-0.2656c0.168-1.2995,0.2631-2.6213,0.2631-3.9653c0-17.0285-13.8538-30.8824-30.8824-30.8824 S9.882,23.7352,9.882,40.7637c0,12.5308,7.5056,23.3335,18.2527,28.1709c-0.2471,0.5979-0.4361,1.2217-0.4978,1.8838 C27.5726,71.504,27.6455,72.1735,27.7876,72.8258z M40.7643,18.5284c-12.2801,0-22.2353,9.9552-22.2353,22.2353 c0,12.2591,9.9207,22.197,22.1723,22.2316l-1.4169-3.7763c-9.5266-0.7585-17.0495-8.7372-17.0495-18.4553 c0-10.2171,8.3123-18.5294,18.5294-18.5294s18.5294,8.3123,18.5294,18.5294c0,1.8258-0.2755,3.5873-0.7696,5.2562 c0.0581,0.0124,0.1198,0.0173,0.1791,0.0309c0.9536-1.3069,2.2717-2.3075,3.8294-2.8819l0.3385-0.1248 c0.0049-0.0025,0.0087-0.0025,0.0136-0.0037c0.0753-0.7486,0.1149-1.5083,0.1149-2.2766 C62.9996,28.4837,53.0456,18.5284,40.7643,18.5284z M86.5814,66.0551c4.6077,12.2875-1.7368,25.9708-14.1738,30.5636 c-9.3116,3.4391-19.3978,0.8066-25.8127-5.8924l-0.0037-0.0037c-0.7029-0.735-1.3564-1.5231-1.9654-2.352L31.9715,73.2359 c-1.0105-1.2069-0.8363-2.9993,0.3879-4.0036c3.5836-2.9338,8.8867-2.4459,11.8428,1.0908l5.8121,6.951L37.0239,42.6377 c-0.882-2.3495,0.3323-4.9671,2.7102-5.8442l0.3409-0.126c2.3779-0.8783,5.0215,0.3138,5.9022,2.6633l6.1752,16.4652 c-0.8808-2.3483,0.3323-4.9659,2.7115-5.8442l0.3397-0.126c2.3779-0.8783,5.0215,0.315,5.9022,2.6645 c-0.8808-2.3495,0.3323-4.9671,2.7102-5.8454l0.3409-0.126c2.3779-0.8783,5.0215,0.315,5.9022,2.6645l1.659,4.4224 c-0.882-2.3495,0.3323-4.9671,2.7102-5.8454l0.3409-0.1248c2.3779-0.8795,5.0202,0.3138,5.9022,2.6633L86.5814,66.0551z"></path>
                    </svg>
                  </div>`
    let d, icnt, tt;

    return {
        render: data => {
            tt = `<div class="icnt ${data.blur ? '__blur' : ''}"><img src="{{url}}">${data.blur ? cr : ''}</div>`
            d = methods.add(cnt, methods.parse(tt, {
                ...data,
                url: data.url ? data.url : DEFAULT_IMAGE_BG_WIDE_URL
            }), data.t)
            if (data.blur) {
                icnt = d.querySelector('.' + bc)
            }
        },
        postRender: () => {
            if (icnt) d.addEventListener('click', () => icnt.classList.toggle(bc))
        }
    }
}