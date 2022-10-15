<script>

    // import config
    import { 
        ENDPOINT_TEXTS, ENDPOINT_INCIDENTS, ENDPOINT_BASEMAPS, ENDPOINT_FRONTLINE, ENDPOINT_CITIES, ENDPOINT_BELLIGERENTS, ENDPOINT_BORDERS,
        CENTER_LAT, CENTER_LNG, RADIUS_COUNTRY,
        FIRST_DATE, LAST_DATE
    } from './config.js';

    // import libs
    import { onMount } from 'svelte';
    import { load_json, load_zipped_json } from './libs/dataloader.js';
    import { yyyy_m_d_TO_yyyy_mm_dd } from './libs/datetime.js';
    import { move_map_to_view_of_incident, move_map_to_view_of_country } from './script.js';
    import { tessellate_vectors } from './components/Map/scripts.js';
    import { EARTH_RADIUS_PX } from "./components/Map/config.js";

    // import components
    import Map from './components/Map/Map.svelte';
    import Timeline from './components/Timeline.svelte';
    import MiniMap from './components/MiniMap.svelte';
    import Main from './Main.svelte';

    // variables - DATA
    let texts = null;
    let incidents = null;
    let basemaps = null;
    let frontline = null;
    let belligerents = null;
    let borders = null;
    let cities = null;
    let cities_loaded = false;
    let frontline_loaded = false;
    let texts_loaded = false;
    let incidents_loaded = false;
    let basemaps_loaded = false;
    let borders_loaded = false;

    // variables - APP
    let sound_on = false;
    let date_displayed = '';

    // variables - MAP
    let vectors_by_day;
    let map_camera;
    let map_highlight_marker;
    let map_enabled = false;
    let map_ready = false;
    let map_show_zoomed_out_layers, map_hide_zoomed_out_layers;
    let map_draw_vector;

    // variables - MINIMAP
    let minimap_update_bbox;
    let minimap_draw_vector;

    // variables - TIMELINE
    let timeline_draw_markers;
    let timeline_highlight_marker;
    let timeline_show;
    let timeline_hide;

    // ------------------------------------------------------------------------------------------------
    // ---------------------------------------------- APP ---------------------------------------------
    // ------------------------------------------------------------------------------------------------
    
    function set_section_scroll_observer() {

        // intro
        const observer_in_view_first = new IntersectionObserver(function(entries) {
            if(entries[0].isIntersecting) animate_section('first');
        });
        observer_in_view_first.observe(document.querySelector(`section[data-id='first']`));

        // conclu
        const observer_in_view_last = new IntersectionObserver(function(entries) {
            if(entries[0].isIntersecting) animate_section('last');
        });
        observer_in_view_last.observe(document.querySelector(`section[data-id='last']`));


        // go through incident sections
        incidents.forEach(incident => {

            // destructure
            const incident_id = incident['properties']['ID'];
            
            // build name
            const query_str = `section[data-id='${incident_id}']`;

            // query for section
            const section = document.querySelector(query_str);

            // check
            if (section === undefined || section === null) return;

            // init observers for each section
            const observer_in_view_section = new IntersectionObserver(function(entries) {
                // isIntersecting is true when element and viewport are overlapping
                // isIntersecting is false when element and viewport don't overlap

                // if overlap, set as displayed section
                if(entries[0].isIntersecting) {
                    animate_section(incident_id);
                }

            }, { threshold: [0.0] });

            // set target
            observer_in_view_section.observe(section);
        });
    }


    function set_cover_scroll_observer(){

        // query for section
        const section = document.getElementById('title-page');

        // check
        if (section === undefined || section === null) return;

        // init observers for each section
        const observer = new IntersectionObserver(function(entries) {
            if(entries[0].isIntersecting) {
                timeline_hide();
            } else {
                timeline_show();
                if (sound_on) toggle_video_sound();
            }
        });

        // set target
        observer.observe(section);
    }


    function animate_section(incident_id) {
        if (incident_id === null || incident_id === undefined) return;

        // highlight markers
        timeline_highlight_marker(incident_id);

        // update map
        if (map_ready){

            // if first
            if (incident_id === 'first') {
                move_map_to_view_of_country(map_camera);
                return;
            }

            if (incident_id === 'last') {
                move_map_to_view_of_country(map_camera);
                return;
            }

            // highlight marker on map
            map_highlight_marker(incident_id);

            // move map
            move_map_to_view_of_incident(incident_id, incidents, map_camera)
        }
    }


    function get_section_info(section) {

        // destructure
        const id = section.dataset['id'];

        // get position top
        const { top, bottom } = section.getBoundingClientRect();

        // if first
        if (id === 'first') {
            return { id, top, bottom, date: FIRST_DATE }
        }

        // if last
        if (id === 'last') {
            return { id, top, bottom, date: LAST_DATE }
        }

        // date
        let date = '';

        const incident = incidents.filter(incident => {
            return +incident['properties']['ID'] === +id;
        })[0];

        if (incident !== undefined) {
            date = incident['properties']['DATE'];
        }

        return { id, date, top, bottom };
    }


    function set_frontline_animation(){

        // scroll function
        document.getElementById('story-container').addEventListener('scroll', function(){

            // get info about each section
            const sections = document.querySelectorAll('section');
            for (let i=0 ; i<sections.length-1 ; i++){
                
                // grab
                const section_0 = get_section_info(sections[i]);
                const section_1 = get_section_info(sections[i+1]);
                
                // check if we are in between these two sections
                const in_between = section_0['top'] < 0.0 && section_1['top'] > 0.0;

                // check
                if (!in_between) continue;

                // compute where in between
                const ratio = section_1['top'] / (section_1['top'] - section_0['top']);

                // compute date delta
                const [year_0, month_0, day_0] = section_0['date'].split('-').map(d => +d);
                const [year_1, month_1, day_1] = section_1['date'].split('-').map(d => +d);

                // create date
                const date_0 = new Date(year_0, month_0 - 1, day_0);
                const date_1 = new Date(year_1, month_1 - 1, day_1);

                // compute
                const new_date = new Date(date_0.getTime() + ((date_1.getTime() - date_0.getTime()) * (1.0 - ratio)));

                // parse
                const date_str = yyyy_m_d_TO_yyyy_mm_dd(`${new_date.getFullYear()}-${new_date.getMonth() + 1}-${new_date.getDate()}`);

                // if same date we dont do anything
                if (date_str === date_displayed) return;

                // update
                date_displayed = date_str;

                // select vector
                const vector = vectors_by_day[date_str];

                // draw
                minimap_draw_vector(date_str);
                map_draw_vector(vector);     
            }
        });

        // select first vector
        const vector = vectors_by_day['2022-02-24'];

        // draw
        minimap_draw_vector('2022-02-24');
        map_draw_vector(vector);     
    }


    async function load_texts(){

        // load
        const _texts = await load_json(ENDPOINT_TEXTS);

        // validate
        if (_texts === undefined || _texts === null) {
            console.error(`${ENDPOINT_TEXTS} could not be loaded`);
            return;
        }

        // set
        texts = _texts;

        // set ready flag
        texts_loaded = true;
    }

    async function load_incidents(){

        // load
        const _incidents = await load_json(ENDPOINT_INCIDENTS);

        // validate
        if (_incidents === undefined || _incidents === null) {
            console.error(`${ENDPOINT_INCIDENTS} could not be loaded`);
            return;
        }

        // set
        incidents = _incidents['features'];

        // set ready flag
        incidents_loaded = true;
    }

    async function load_basemaps(){

        // load
        const _basemaps = await load_json(ENDPOINT_BASEMAPS);

        // validate
        if (_basemaps === undefined || _basemaps === null || !Array.isArray(_basemaps)) {
            console.error(`${ENDPOINT_BASEMAPS} could not be loaded`);
            return;
        }

        // set
        basemaps = _basemaps;

        // set ready flag
        basemaps_loaded = true;
    }

    async function load_frontline(){

        // load
        const _frontline = await load_zipped_json(ENDPOINT_FRONTLINE);
        const _belligerents = await load_json(ENDPOINT_BELLIGERENTS);

        // validate
        if (_frontline === undefined || _frontline === null) {
            console.error(`${ENDPOINT_FRONTLINE} could not be loaded`);
            return;
        }
        if (_belligerents === undefined || _belligerents === null) {
            console.error(`${ENDPOINT_BELLIGERENTS} could not be loaded`);
            return;
        }

        // parse and sort
        const features = _frontline['features'].sort((a, b) => {
            // destructure
            const [a_year, a_month, a_day] = a['properties']['DATE'].split('-').map(d => +d);
            const [b_year, b_month, b_day] = b['properties']['DATE'].split('-').map(d => +d);
            const a_val = a_year * 1000 + a_month * 100 + a_day;
            const b_val = b_year * 1000 + b_month * 100 + b_day;
            return a_val - b_val;
        })

        // set
        frontline = features;
        belligerents = _belligerents['features'];

        // set ready flag
        frontline_loaded = true;
    }

    async function load_cities(){

        // load
        const _cities = await load_json(ENDPOINT_CITIES);

        // validate
        if (_cities === undefined || _cities === null || !Array.isArray(_cities)) {
            console.error(`${ENDPOINT_CITIES} could not be loaded`);
            return;
        }

        // set
        cities = _cities;

        // set ready flag
        cities_loaded = true;
    }

    async function load_borders(){

        // load
        const _borders = await load_json(ENDPOINT_BORDERS);

        // validate
        if (_borders === undefined || _borders === null) {
            console.error(`${ENDPOINT_BORDERS} could not be loaded`);
            return;
        }

        // set
        borders = _borders;

        // set ready flag
        borders_loaded = true;
    }


    function toggle_video_sound(){
        const video = document.getElementById("mvideo");
        video.muted = !video.muted;
        sound_on = !video.muted;
    }


    // ------------------------------------------------------------------------------------------------
    // ---------------------------------------- Event Listeners ---------------------------------------
    // ------------------------------------------------------------------------------------------------

    function orientation_change_listener(){
        window.addEventListener("orientationchange", function(){
            window.location.reload();
        });
    }

    async function load_map_assets(){

        await load_basemaps();
        if (!basemaps_loaded) return;

        await load_frontline();
        if (!frontline_loaded) return;

        await load_cities();
        if (!cities_loaded) return;

        await load_borders();
        if (!borders_loaded) return;

        // compute triangulated vectors
        vectors_by_day = tessellate_vectors( frontline, EARTH_RADIUS_PX + 0.01 );

        // set flag
        map_enabled = true;
    }

    // on UI loaded
    onMount(async () => {

        // if orientation is changed
        orientation_change_listener()

        // load data
        await load_texts();
        if (!texts_loaded) return;
        await load_incidents();
        if (!incidents_loaded) return;

        // draw markers on timeline
        timeline_draw_markers(incidents);

        // scroll listeners
        set_cover_scroll_observer();
        setTimeout(() => {
            set_section_scroll_observer();
        }, 300);    

        // if screen size big, we enable map
        if (+window.innerWidth >= 600) load_map_assets();
    });


    $: if(map_ready) {

        // set minimap hook
        map_camera.set_bbox_callback(minimap_update_bbox);

        // set frontline animation
        set_frontline_animation();

        // trigger animation
        animate_section('first');
    }

</script>


{#if map_enabled}

    <!-- 3D Map Background -->
    <Map
        init_position={{'latitude': CENTER_LAT, 'longitude': CENTER_LNG, 'radius': RADIUS_COUNTRY * 1.1 }}
        markers={incidents}
        basemaps={basemaps}
        belligerents={belligerents}
        cities={cities}
        borders={borders}
        bind:ready={map_ready}
        bind:highlight_marker={map_highlight_marker}
        bind:camera_helper={map_camera}
        bind:show_zoomed_out_layers={map_show_zoomed_out_layers}
        bind:hide_zoomed_out_layers={map_hide_zoomed_out_layers}
        bind:draw_vector={map_draw_vector}
    />

    <!-- Ukraine Mini-Map -->
    <MiniMap 
        featureCollection={borders} 
        vectors_by_day={vectors_by_day}
        bind:draw_vector={minimap_draw_vector}
        bind:update_bbox={minimap_update_bbox}
    />
{/if}


<!-- Timeline -->
<Timeline 
    min_date={new Date(2022, 1, 24)}
    max_date={new Date()}
    bind:draw_markers={timeline_draw_markers}
    bind:highlight_marker={timeline_highlight_marker}
    bind:show={timeline_show}
    bind:hide={timeline_hide}
/>


<!-- Story Container -->
<div id="story-container" style="z-index: 2;">

    <!-- Main Page -->
    <div id="title-page">

        <!-- Titles -->
        <div id="titles">
            <p class="title">Les cendres de la foudre</p>
            <p class="subtitle">L'assaut contre Kharkiv</p>
            <p class="author"><a target="_blank" href="mailto: jeanromainroy@protonmail.com">Jean-Romain Roy</a> et <a target="_blank" href="mailto: emmanuelroy@hotmail.ca">Emmanuel Roy</a></p>
            <p class="author">Octobre, 2022</p>
        </div>

        <!-- Intro Video -->
        <video id="mvideo" playsinline autoplay muted loop>
            <source src="video.mp4" type="video/mp4">
        </video>

        <!-- Sound toggling -->
        <button on:click={toggle_video_sound}>
            {#if sound_on}
                <img alt="toggle sound off" src="images/speaker-on.svg"/>
            {:else}
                <img alt="toggle sound on" src="images/speaker-off.svg"/>            
            {/if}
        </button>

    </div>

    <!-- Interactive Article -->
    <div id="article-container">

        <!-- Sections -->
        {#if texts_loaded && incidents_loaded}
            <Main bind:texts={texts} bind:incidents={incidents}/>
        {/if}
    </div>

</div>



<style>

    #story-container {
        position: absolute;
        top: 0px;
        left: 0px;
        bottom: 0px;
        right: 0px;
        width: 100vw;

        overflow-x: hidden;
        overflow-y: scroll;
    }

    #title-page {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #222;
        box-shadow: var(--box-shadow-dark);
    }

    #title-page button {
        position: absolute;
        bottom: 5vh;
        right: 5vh;
        border-radius: 50%;
        padding: 2vh;
        background-color: white;
        border: none;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9;
    }

    #title-page button:hover {
        filter: brightness(1.2);
    }

    #title-page button img {
        width: 6vh;
        height: 6vh;
    }


    #titles {
        position: absolute;
        bottom: 0px;
        left: 0px;
        padding: 4.5rem;
        z-index: 9;
        text-align: left;
        width: 100%;
        z-index: 1;
    }

    #titles p {
        color: white;
    }

    #titles a {
        color: white;
    }

    .title {
        font-family: var(--font-ebgaramond);
        font-size: var(--font-size-very-very-large);
        margin: 0px;
        padding: 0px;
        line-height: var(--text-line-height-very-large);
    }

    .subtitle {
        font-family: var(--font-ebgaramond);
        font-size: var(--font-size-larger);
        margin: 0px;
        padding: 0px;
        line-height: unset;
        margin-bottom: 1.5rem;
    }

    .author {
        font-family: var(--font-ebgaramond);
        font-size: var(--font-size-large);
        margin: 0px;
        padding: 0px;
        line-height: unset;
    }

    #article-container {
        position: absolute;
        margin-top: 64px;
        width: var(--content-width-with-map);
        margin: 0px;
        padding: 2rem;
        color: #333;
        text-align: left;
    }

    video {
        object-fit: cover;
        width: 100vw;
        height: 100vw;
    }

    :global(video) {
        filter: grayscale(1);
    }

    :global(img) {
        filter: grayscale(1);
    }

    /* on small screen */
    @media only screen and (max-width: 600px) {
        
        #title-page {
            align-items: flex-end;
        }

        #article-container {
            margin: 0px;
            padding: 0px;
            width: 100vw;
        }

        #titles {
            padding: 1.5rem;
            bottom: 0px;
            top: unset;
            background-color: #222;
            position: relative;
        }

        #title-page video {
            position: absolute;
            top: 0px;
            object-fit: contain;
            object-position: top;
        }

        .title {
            font-size: var(--font-size-very-large);
            line-height: var(--font-size-very-large);
        }

        .subtitle {
            font-size: var(--font-size-large);
        }

        .author {
            font-size: var(--font-size-normal);
        }
    }

    /* Global classes */
    :global(a) {
        color: var(--text-black-very-light);  
    }

    :global(.embeded-link-light a) {
        font-family: var(--font-ebgaramond);
        font-size: var(--font-size-small);
        line-height: var(--text-line-height);
        color: white;
    }

    :global(.embeded-link-dark a) {
        font-family: var(--font-ebgaramond);
        font-size: var(--font-size-small);
        line-height: var(--text-line-height);
        color: var(--text-black-very-light);  
    }

</style>
