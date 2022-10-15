<script>
    
    // properties
    export let min_date = new Date(2022, 1, 24);
    export let max_date = new Date();

    // import libs
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    import { isStringNonEmpty } from '../libs/datatype.js';

    // config
    const circle_radius = 6;
    const circle_opacity = 0.6;
    const TRACK_WIDTH_FRACTION = 0.85;
    const dark_red = '#ff0000';
    const light_red = '#ffcccb';

    // variables
    let g_dates;
    let scale;


    export const show = () => {
        document.getElementById('timeline').style.bottom = '0px';
    }

    export const hide = () => {
        document.getElementById('timeline').style.bottom = '-100px';
    }


    export const highlight_marker = (incident_id) => {

        // reset
        if (incident_id === undefined || incident_id === null) {
            g_dates.selectAll('circle').attr('fill', dark_red);
            return;
        }

        // update color
        g_dates.selectAll('circle').attr('fill', function(){
            return +this.dataset['id'] === +incident_id ? dark_red : light_red;
        });

        // raise to top
        g_dates.selectAll('circle').filter(function() {
            return +this.dataset['id'] === +incident_id;
        }).raise();
    }


    export async function draw_markers(incidents){

        // parse incidents
        const incidents_properties = incidents.map(feature => feature['properties']);
        const incidents_dates = incidents_properties.filter(incident => isStringNonEmpty(incident['DATE'])).map(incident => {
        
            // destructure
            const [year, month, day] = incident['DATE'].split('-');

            // format to date
            return {
                'ID': incident['ID'],
                'DATE': new Date(+year, (+month) - 1, +day)
            }
        });


        // draw the incidents 
        incidents_dates.forEach(incident => {

            // destructure 
            const { ID, DATE } = incident;

            // convert date to px
            const cx = scale(DATE) - circle_radius;

            g_dates.append('circle')
                .attr('data-id', ID)
                .attr('cx', cx)
                .attr('cy', 0)
                .attr('r', circle_radius)
                .attr('fill', dark_red)
                .attr('opacity', circle_opacity)
        });
    }


    onMount(() => {

        // grab track size
        const brect = document.getElementById('timeline').getBoundingClientRect();

        // timeline attributes
        const track_width = brect['width'] * TRACK_WIDTH_FRACTION;
        const track_height = brect['height'];
        
        // grab elements
        const track = d3.select("#track");

        // scales
        scale = d3.scaleTime().range([0, track_width]);
        const axis = d3.axisBottom(scale);
        
        // format text
        axis.tickFormat(d3.timeFormat('%b'));

        // we init the svg inside the track
        const trackSvg = track.select("svg")    // we grab the SVG object inside of the track html object
            .attr("width", track_width)       // set the width and height
            .attr("height", track_height);
        
        // Set the scale
        scale.domain([ min_date, max_date ]);

        // set the axis
        trackSvg.append("g")
            .attr("class", "axis")
            .call(axis); 

        // incidents group
        g_dates = trackSvg.append("g");
    })

</script>


<div id="timeline">
    <div id="track">
        <svg></svg>
    </div>
</div>


<style>

    /***** Time track & Sliders *****/
    #timeline {
        position: absolute;
        bottom: -100px;
        left: 0px;
        width: 100%;
        height: 30px;
        display: flex;
        justify-content: center;
        padding-top: 20px;
        background: white;
        border-top: var(--border);
        border-right: var(--border);
        z-index: 19;
        transition: bottom 1.5s ease-in-out;
    }
    

    /* on small screen */
    @media only screen and (max-width: 600px) {
        #timeline {
            width: 100vw;
        }
    }


    #track {
        position: relative;
        width: 100%; 
        color: black;
        text-transform: uppercase;
    }

    :global(#track .axis) {
        font-family: var(--font-noto);
        shape-rendering: crispEdges;
        font-size: 0.5rem;
        letter-spacing: 0.15rem;
        stroke-width: 0.2px;
    }

    svg {
        overflow: unset;
    }

</style>