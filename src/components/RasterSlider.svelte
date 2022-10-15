<script>

    // import libs
    import { onMount } from "svelte";

    // properties
    export let incident;
    export let title = '';

    // vector layer
    let before_asset_url;
    let after_asset_url;
    let before_title = '';
    let after_title = '';
    let geometry = null;
    let min_lat, min_lng, max_lat, max_lng;
    let drawn = false;

    // display
    let visible = false;

    // variables
    const uid = Math.round(Math.random() * 100000.0);
    const container_id = `raster-container-${uid}`;
    const slider_id = `raster-slider-${uid}`;
    const cropper_id = `raster-cropper-${uid}`;
    const container_svg_id = `container-svg-${uid}`;
    let slider_x_pos = 0;


    // listener: mouse move
    function mouse_track(e){

        // get relative mouse position
        const { layerX } = e;

        // filter invalid values
        if (layerX <= 1) return; 
        
        // set pos
        slider_x_pos = Math.round(layerX);

        // update position of slider
        document.getElementById(slider_id).style.left = `${slider_x_pos}px`;

        // update position of cropper
        document.getElementById(cropper_id).style.width = `${slider_x_pos}px`;
    }
    

    // listener: mouse out
    function mouse_reset(){

        // update position of slider
        document.getElementById(slider_id).style.left = `10%`;

        // update position of cropper
        document.getElementById(cropper_id).style.width = `10%`;
    }


    // function to launch the image box
    export function draw_vector(){

        // check flag
        if (drawn) return;

        // set flag
        drawn = true;

        // reset
        mouse_reset()

        // grab DOM element
        const svg = document.getElementById(container_svg_id);

        // destructure
        const { type, coordinates } = geometry;

        // compute scale based on image width and geo bbox
        const scale_lng = svg.getBoundingClientRect()['width'] / Math.abs(max_lng - min_lng);
        const scale_lat = svg.getBoundingClientRect()['height'] / Math.abs((90.0 - max_lat) - (90.0 - min_lat));

        // helper func
        function lng_to_px(lng) {
            return (lng - min_lng) * scale_lng;
        }
        function lat_to_px(lat) {
            return ((90.0 - lat) - (90 - max_lat)) * scale_lat;
        }

        // check type
        if (type === 'Point') {
            return;
        }

        if (type === 'Polygon') {

            // unnest
            const d = coordinates[0];

            // stringify coordinates
            const points_str = d.map(([lng, lat]) => `${lng_to_px(lng)}, ${lat_to_px(lat)}`).join(' ');

            // init a polygon
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.classList.add('rasterslider-polygon');

            // set points
            polygon.setAttribute('points', points_str);

            // append
            svg.appendChild(polygon);
        }

        if (type === 'MultiPolygon') {

            coordinates.forEach(datum => {

                // unnest
                const d = datum[0];

                // stringify coordinates
                const points_str = d.map(([lng, lat]) => `${lng_to_px(lng)}, ${lat_to_px(lat)}`).join(' ');

                // init a polygon
                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                polygon.classList.add('rasterslider-polygon');

                // set points
                polygon.setAttribute('points', points_str);

                // append
                svg.appendChild(polygon);
            });
        }
    }


    onMount(async () => {

        // set
        before_asset_url = incident['properties']['SATELLITE']['before']['asset'];
        after_asset_url = incident['properties']['SATELLITE']['after']['asset'];
        before_title = incident['properties']['SATELLITE']['before']['date'];
        after_title = incident['properties']['SATELLITE']['before']['date'];
        geometry = incident['geometry'];
        const bbox = incident['properties']['SATELLITE']['bbox'];

        // verify
        if (bbox === undefined) return;

        // set 
        [ max_lng, min_lng ] = [bbox[0], bbox[2]].sort((a, b) => { return b - a });
        [ max_lat, min_lat ]= [bbox[1], bbox[3]].sort((a, b) => { return b - a });

        // grab DOM elements
        const container_el = document.getElementById(container_id);

        // init observers
        const observer_in_view = new IntersectionObserver(async function(entries) {
            // isIntersecting is true when element and viewport are overlapping
            // isIntersecting is false when element and viewport don't overlap

            // if overlap, set as displayed section
            if(entries[0].isIntersecting) visible = true;

        }, { threshold: [0.0] });

        // set target
        observer_in_view.observe(container_el);
    })

</script>


<div class="raster-main-container">
<div id={container_id} class="top-container">
    {#if visible}
        <div class="bottom-container no-select" on:mousemove={mouse_track} on:mouseleave={mouse_reset}>
            
            <!-- After -->
            <img class="back-image" src={after_asset_url} on:load={draw_vector} alt="after" draggable="false"/>

            <!-- Vector -->
            <svg id={container_svg_id} class="svg-container pulsating"></svg>

            <!-- Before -->
            <div id={cropper_id} class="cropper">
                <img class="top-image" src={before_asset_url} alt="before" draggable="false"/>
            </div>

            <!-- Slider -->
            <div class="slider" id={slider_id}>
                <div class="beer-handle"></div>
            </div>

            <!-- Attribution -->
            <p class="attribution">Imagery provided by Planet Labs PBC</p>
        </div>
        {#if before_title.length > 0}
            <p class="raster-title before-title">{before_title}</p>
        {/if}
        {#if after_title.length > 0}
            <p class="raster-title after-title">{after_title}</p>
        {/if}
        {#if title.length > 0}
            <p class="raster-title bottom-title">{@html title}</p>
        {/if}
    {/if}
</div>
</div>


<style>

    :global(.rasterslider-polygon) {
        fill: #FF0000;
        stroke: none;
        /* stroke-width: 3;         */
    }

    .raster-main-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1.5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .top-container {
        position: absolute;
        width: 66.67%;
        aspect-ratio: 1.3333;
        display: flex;
        justify-content: center;
        align-items: center;
    }


    .svg-container {
        position: absolute;
        overflow: hidden;
        width: 100%;
        aspect-ratio: 1.3333;
        line-height: 0px;
    }

    /* on small screen */
    @media only screen and (max-width: 600px) {
        .top-container {
            max-width: 100%; 
        }
    }

    #slider-img-container {
        z-index: 9;
    }

    .attribution {
        position: absolute;
        bottom: 0px;
        right: 0px;
        padding: 2px 8px;
        font-size: var(--font-size-very-small);
        color: black;
        background-color: #ffffffc0;
        font-family: var(--font-noto);
    }


    .bottom-container {
        position: relative;
        display: flex;
    }

    .cropper {
        position: absolute;
        overflow: hidden;
        top: 0px;
        left: 0px;
        width: 50%;
        height: 100%;
    }

    .slider {
        position: absolute;
        height: 100%;
        width: 1px;
        left: 50%;
        background-color: white;
        opacity: 0.8;
    }
     
    img {
        position: relative;
        height: auto;
        filter: grayscale(1) brightness(1.5) contrast(1.2);
    }

    .back-image {
        width: 100%;
        aspect-ratio: 1.3333;
    }

    .top-image {
        width: none;
        height: 100%;
        aspect-ratio: 1.3333;
    }

    .beer-handle {
        background: rgba(255,255,255,0.9);
        border-radius: 50%;
        color: #555;
        height: 36px;
        width: 36px;
        left: 50%;
        pointer-events: none;
        position: absolute;
        top: 50%;
        transform: translate3d(-50%, -50%, 0);
    }

    .beer-handle:before {
        border-left: 2px solid;
        border-top: 2px solid;
        content: "";
        height: 6px;
        width: 6px;
        position: absolute;
        top: 50%;
        transform-origin: 0 0;
        transform: rotate(-45deg);
        left: 8px;
    }

    .beer-handle:after {
        border-left: 2px solid;
        border-top: 2px solid;
        content: "";
        height: 6px;
        width: 6px;
        position: absolute;
        top: 50%;
        transform-origin: 0 0;
        transform: rotate(135deg);
        right: 0px;
    }

    .raster-title {
        position: absolute;
        font-size: var(--font-size-small);
        color: #333;
        font-family: var(--font-noto);
        margin: 0px;
        padding: 0px;
        line-height: 24px;
    }

    .before-title {
        left: 0px;
        transform-origin: 50% 50%;
        transform: rotate(270deg) translateY(-150%) translateY(calc(-4px + -1.0*var(--font-size-small)));
    }


    .after-title {
        right: 0px;
        transform-origin: 50% 50%;
        transform: rotate(90deg) translateY(-150%) translateY(calc(-4px + -1.0*var(--font-size-small)));
    }


    .bottom-title {
        bottom: 0px;
        transform: translateY(100%);
    }


    /* Transitions */
    .pulsating {
        animation: pulsate 3s linear infinite;
    }

    @keyframes pulsate {
        from { opacity: 0.4; }
        50% { opacity: 0.1; }
        to { opacity: 0.4; }
    }

</style>