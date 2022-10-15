<script>

    // properties
    export let asset_url;
    export let objects_url;
    export let animation_url;
    export let caption = '';

    // import scripts
    import { onMount } from 'svelte';
    import { load_incident, populate_incident_container, 
            animate, reset } from './scripts.js';

    // display
    export const display = async () => { await init(); };
    let _display = false;

    // variables
    let svg_elements, svg_infos, animation;

    // generate a unique container id
    const uid = Math.round(Math.random() * 100000.0);
    const container_id = `container-${uid}`;
    const container_asset_id = `container-asset-${uid}`;
    const container_svg_id = `container-svg-${uid}`;
    const container_bg_id = `container-bg-${uid}`;
    const container_mouse_id = `container-mouse-${uid}`;


    // timeouts
    let timeout_ids = [];
    function add_timeout_id(timer_id) {
        timeout_ids.push(timer_id);
    }
    function clear_all_timeouts(){
        timeout_ids.forEach(timeout_id => clearTimeout(timeout_id));
        timeout_ids = [];
    }


    async function init() {

        // check if flag already true
        if (_display) return;

        // set flag to true
        _display = true;

        // set event listener
        document.getElementById(container_mouse_id).addEventListener('mouseover', function() {
            document.getElementById(container_bg_id).style.opacity = '0';
        })
        document.getElementById(container_mouse_id).addEventListener('mouseout', function() {
            document.getElementById(container_bg_id).style.opacity = '0.6';
        })

        // load multimedia data
        const incident_data = await load_incident(asset_url, objects_url, animation_url);

        // destructure
        svg_elements = incident_data['objects']['svg_elements'];
        svg_infos = incident_data['objects']['svg_infos'];
        animation = incident_data['animation'];

        // if no animation
        if (animation === undefined || animation === null || !Array.isArray(animation) || animation.length === 0) {
            document.getElementById(container_bg_id).style.display = 'none';
        }

        // populate the container
        populate_incident_container(incident_data, container_id, container_asset_id, container_svg_id);
    }


    // on UI ready
    onMount(() => {

        // grab DOM elements
        const container_el = document.getElementById(container_id);

        // init observers
        const observer_in_view = new IntersectionObserver(async function(entries) {
            // isIntersecting is true when element and viewport are overlapping
            // isIntersecting is false when element and viewport don't overlap

            // if overlap, set as displayed section
            if(entries[0].isIntersecting){

                // init
                await display();

                // animate
                animate(svg_elements, svg_infos, animation, add_timeout_id);
            } else {

                // reset
                reset(svg_elements, clear_all_timeouts);
            }
        });

        // set target
        observer_in_view.observe(container_el);
    });

</script>



<!-- Before -->
<div id={container_id} class="incident-container">
    <div id={container_asset_id} class="asset-container"></div>
    <div id={container_bg_id} class="bg-container"></div>
    <svg id={container_svg_id} class="svg-container"></svg>
    <div id={container_mouse_id} class="mouse-container"></div>
    {#if caption !== undefined && caption !== null && caption.length > 0}
        {#if caption.includes('href')}
            <p class="canvas-caption embeded-link-light">{@html caption}</p>      
        {:else} 
            <p class="canvas-caption">{caption}</p>  
        {/if}
    {/if}
</div>  


<style>

    :global(.draw-path) {
        animation: dash 3s linear forwards;
    }

    @keyframes dash {
        to {
            stroke-dashoffset: 0;
        }
    }

    .incident-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1.5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .asset-container {
        z-index: 1;
        position: absolute;
        width: 66.67%;
        aspect-ratio: 1.3333;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .bg-container {
        z-index: 2;
        position: absolute;
        width: 66.67%;
        aspect-ratio: 1.3333;
        transition: opacity 0.5s ease-in-out;
        background-color: white;
        opacity: 0.6;
    }

    .svg-container {
        z-index: 3;
        position: absolute;
        overflow: visible;
        width: auto;
        height: auto;
        line-height: 0px;
    }

    .mouse-container {
        z-index: 4;
        position: absolute;
        width: 66.67%;
        aspect-ratio: 1.3333;
    }

    .canvas-caption {
        position: absolute;
        color: #000;
        bottom: calc(12.5% + 6px);
        left: calc(16.7% + 8px);
        color: white;
        z-index: 9;
        margin: 0px;
        padding: 0px;
    }

    
    /* on small screen */
    @media only screen and (max-width: 600px) {
        .canvas-caption {
            bottom: 4px;
        }
    }

</style>