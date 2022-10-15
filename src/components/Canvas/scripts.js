'use strict';

// import libs
import { load_image, load_video, load_json, load_svg_elements } from '../../libs/dataloader.js';


function style_element(svg_element, svg_info) {

    // destructure info
    const { id, type, opacity, fill, stroke } = svg_info;

    // for ref blocks, fade in (big green filled polygon)
    if (id === 'i-4' || id === 'i-1') {
        svg_element.classList.add('fadein-15-05');
        return;
    }

    // animate
    if (fill === undefined || fill === null || fill === false || fill === 'none') {

        // get path info
        const path_length = svg_element.getTotalLength();

        // set
        svg_element.style['stroke-dasharray'] = path_length;
        svg_element.style['stroke-dashoffset'] = path_length;

        // animate
        svg_element.classList.add('draw-path');

        // stop here
        return;
    }

    // set animation class
    if (+opacity === 1.0) {
        svg_element.classList.add('fadein-15-10');
    } else if (+opacity === 0.7) {
        svg_element.classList.add('fadein-15-07');
    } else if (+opacity === 0.5) {
        svg_element.classList.add('fadein-15-05');
    } else if (+opacity === 0.4) {
        svg_element.classList.add('fadein-15-04');
    } else if (+opacity === 0.3) {
        svg_element.classList.add('fadein-15-03');
    }
}


export function reset(svg_elements, clear_all_timeouts) {

    // ensure we have our svg elements
    if (!Array.isArray(svg_elements)) return;

    // clear timeouts
    clear_all_timeouts();

    // reset svg elements
    svg_elements.forEach(svg_element => { 
        
        // hide
        svg_element.style.display = 'none'; 

        // set animation flag
        svg_element.dataset['animation_queued'] = false;
        svg_element.dataset['animation_completed'] = false;
    });
}


export function animate(svg_elements, svg_infos, animation, add_timeout_id, speed = 0.3){

    // ensure we have our svg elements
    if (!Array.isArray(svg_elements)) return;

    // init
    let animation_length_in_ms = 0.0;

    // compute the full length of the animation
    animation.forEach(({ START_TIME_IN_MS }) => {
        if (START_TIME_IN_MS > animation_length_in_ms) {
            animation_length_in_ms = START_TIME_IN_MS;
        }
    });

    // adjust speed
    animation_length_in_ms = animation_length_in_ms * speed;

    // do not animate, if animation is already in process
    for (const svg_element of svg_elements) {
        if (svg_element.dataset['animation_queued'] === 'true') {
            return;
        }
    }

    // set flags
    svg_elements.forEach(svg_element => {
        svg_element.dataset['animation_queued'] = true;
    })

    // go through animation
    animation.forEach(step => {

        // destructure
        const { ID, START_TIME_IN_MS, SVG_ELEMENTS } = step;

        // animate
        const timeout_id = setTimeout(() => {

            // clean
            const _SVG_ELEMENTS = SVG_ELEMENTS.map(d => d.toLowerCase().trim());

            // go through
            svg_elements.forEach((svg_element, i) => {

                // destructure info
                const { id } = svg_infos[i];

                // clean id
                const _id = id.toLowerCase().trim();

                // filter, must be part of this group
                if(!_SVG_ELEMENTS.includes(_id)) return;

                // filter, must not have been animated already
                if (svg_element.dataset['animation_completed'] === 'true') return;

                // filter, must have animation started flag true
                if (svg_element.dataset['animation_queued'] !== 'true') return;

                // display
                svg_element.style.display = 'inline';

                // style
                style_element(svg_element, svg_infos[i]);

                // set completion flag
                svg_element.dataset['animation_completed'] = true;
                svg_element.dataset['animation_queued'] = false;
            });
        }, START_TIME_IN_MS * speed);

        // push id to stack
        add_timeout_id(timeout_id);
    })
}


export function populate_incident_container(datum, container_id, container_asset_id, container_svg_id) {

    // destructure
    const asset = datum['asset'];
    const svg_elements = datum['objects']['svg_elements'];
    const svg_infos = datum['objects']['svg_infos'];
    const svg_viewbox = datum['objects']['svg_viewbox'];
    const animation = datum['animation'];
    const is_video = datum['is_video'];
    
    // grab DOM elements
    const container = document.getElementById(container_id);
    const asset_container = document.getElementById(container_asset_id);
    const svg_container = document.getElementById(container_svg_id);

    // clear containers
    // svg_container.innerHTML = '';
    // asset_container.innerHTML = '';

    // set attributes of asset
    asset.style.width = `100%`;
    asset.style.height = `100%`;
    asset.style.objectFit = 'cover';
    asset.style.objectPosition = 'center';
    
    // append video
    asset_container.prepend(asset);

    // set viewbox
    if (svg_viewbox === undefined || svg_viewbox === null) {
        svg_container.setAttribute('viewBox', `0 0 ${asset.width} ${asset.height}`);        
    } else {
        svg_container.setAttribute('viewBox', svg_viewbox);
    }

    // draw svg elements
    if (Array.isArray(svg_elements)) {

        svg_elements.forEach((svg_element, i) => {

            // destructure processed element
            const { id, type, data, style, fill, stroke } = svg_infos[i];

            // set styling
            style.forEach(styling => {

                // destructure
                const [ name, value ] = styling;

                // update
                svg_element.style[name] = value;
            })

            // hide
            svg_element.style.display = 'none';

            // init flags
            svg_element.dataset['animation_queued'] = false;
            svg_element.dataset['animation_completed'] = false;

            // append raw element
            svg_container.appendChild(svg_element);
        })

        // append to container
        container.appendChild(svg_container);
    }

    // play
    if (is_video) asset.play();
}


// function to launch the image box
export async function load_incident(asset_url, objects_url, animation_url){

    // init variables
    let is_asset_video = null;
    let datum = {
        'asset': null,
        'objects': {
            'svg_elements': null,
            'svg_infos': null,
            'svg_viewbox': null
        },
        'animation': null,
        'is_video': null
    }

    
    // grab extensions of assets
    const asset_extension = asset_url.split('.').at(-1);

    // check asset type
    if (['png', 'jpg', 'jpeg'].includes(asset_extension)) {
        is_asset_video = false;
    } else if (['mp4', 'webm'].includes(asset_extension)) {
        is_asset_video = true;
    } else {
        return datum;
    }

    // set
    datum['is_video'] = is_asset_video;

    // load assets
    const asset = is_asset_video === true ? await load_video(asset_url) : await load_image(asset_url);
    if (asset === undefined || asset === null) return datum;

    // set
    datum['asset'] = asset;

    // load svg objects asset
    const svg_results = objects_url === undefined || objects_url === null ? null : await load_svg_elements(objects_url);
    if (svg_results === undefined || svg_results === null) return datum;
    const [svg_elements, svg_infos, svg_viewbox] = svg_results;
    if (svg_elements === undefined || svg_elements === null || 
        svg_infos === undefined || svg_infos === null) return datum;

    // set
    datum['objects'] = {
        'svg_elements': svg_elements,
        'svg_infos': svg_infos,
        'svg_viewbox': svg_viewbox
    };

    // load animation asset
    const animation = animation_url === undefined || animation_url === null ? null : await load_json(animation_url);
    if (animation === undefined || animation === null) return datum;

    // set
    datum['animation'] = animation

    return datum;
}
