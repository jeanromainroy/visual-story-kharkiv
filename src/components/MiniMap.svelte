<script>

    // import libs
    import { onMount } from "svelte";

    // properties
    export let featureCollection;
    export let vectors_by_day;

    // variables
    let max_x = 0;
    let max_y = 0;
    let min_x = Infinity;
    let min_y = Infinity;
    let scale = 0.0;
    let ready = false;
    let date_str = '';

    // config
    const target_width = 200;
    const min_bbox_width = 1;



    export const prerender = () => {

        // grab
        const svg = document.getElementById('minimap-svg');

        Object.keys(vectors_by_day).forEach(date => {

            // destructure
            const vector = vectors_by_day[date];
            const { triangles_2d } = vector;
            const { holes, polygons } = triangles_2d;

            // init group
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.id = `g-${date}`;
            g.style.transform = `translate(-${min_x * scale}px, -${min_y * scale}px) scale(${scale})`;
            g.style.visibility = 'hidden';

            // go through polygons
            polygons.forEach(d => {

                // init a polygon
                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                polygon.classList.add('minimap-polygon');

                // init
                let points = '';

                // go through
                d.forEach(([lng, lat]) => {
                    points += `${lng}, ${90.0 - lat} `;
                })
                
                // set
                polygon.setAttribute('points', points);

                // add
                g.appendChild(polygon);
            })

            // go through holes
            holes.forEach(d => {

                // init a polygon
                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                polygon.classList.add('minimap-hole');

                // init
                let points = '';

                // go through
                d.forEach(([lng, lat]) => {
                    points += `${lng}, ${90.0 - lat} `;
                })
                
                // set
                polygon.setAttribute('points', points);

                // add
                g.appendChild(polygon);
            })

            // add to DOM
            svg.appendChild(g);
        })  
    }


    export const draw_vector = (date) => {

        // set date
        date_str = date;

        // grab
        const el = document.getElementById(`g-${date}`);
        
        // check
        if (el === undefined || el === null) return;

        // set all to hidden
        const elements = document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "g");
        for (const element of elements) {
            if (element.id.substring(0, 2) === 'g-') element.style.visibility = 'hidden';
        }

        // set to visible
        document.getElementById(`g-${date}`).style.visibility = 'visible';
    }



    export const update_bbox = (bbox) => {
        if (!ready) return;

        // reverse y to work on map
        const bbox_rev = bbox.map(([lng, lat]) => {
            return [lng, 90 - lat]
        })

        // destructure
        const pt1 = bbox_rev[0];
        const pt2 = bbox_rev[2];
        const x = pt1[0];
        const y = pt1[1];
        const width = Math.abs(pt2[0] - pt1[0]);
        const height = Math.abs(pt2[1] - pt1[1]);

        // destructure
        const aspect = height / (1.0 * width );

        // min size
        if (width < min_bbox_width) {

            const cx = x + width / 2.0;
            const cy = y + height / 2.0;

            const new_x = cx - min_bbox_width / 2.0;
            const new_y = cy - ( aspect * min_bbox_width ) / 2.0;

            document.getElementById('viewfinder').setAttribute('x', `${new_x}px`)
            document.getElementById('viewfinder').setAttribute('y', `${new_y}px`)
            document.getElementById('viewfinder').setAttribute('width', `${min_bbox_width}px`)
            document.getElementById('viewfinder').setAttribute('height', `${( aspect * min_bbox_width )}px`)
        } else {
            document.getElementById('viewfinder').setAttribute('x', `${x}px`)
            document.getElementById('viewfinder').setAttribute('y', `${y}px`)
            document.getElementById('viewfinder').setAttribute('width', `${width}px`)
            document.getElementById('viewfinder').setAttribute('height', `${height}px`)
        }
    }


    function parse(featureCollection) {

        // init
        let lines = [];

        // go through features
        featureCollection['features'].forEach(feature => {

            // destructure
            const { type, coordinates } = feature['geometry'];

            // check
            if (type === 'MultiPolygon') {
                coordinates.forEach(_coordinates => {
                    
                    // init
                    let line = [];

                    _coordinates[0].forEach(([lng, lat]) => {
                        line.push([lng, 90 - lat])
                    });

                    // push
                    lines.push(line);
                });
            }

            // verify
            if (type === 'Polygon') {
                coordinates.forEach(_coordinates => {

                    // init
                    let line = [];

                    _coordinates.forEach(([lng, lat]) => {
                        line.push([lng, 90 - lat])
                    });

                    // push
                    lines.push(line);
                });
            }            
        })

        return lines;
    }


    onMount(() => {

        // grab DOM elements
        const svg = document.getElementById('minimap-svg');

        // parse
        const lines = parse(featureCollection);

        // add
        lines.forEach(line => {

            // init a polyline
            const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            polyline.classList.add('minimap-polyline');
            
            line.forEach(([x, y]) => {

                // create point
                const point = svg.createSVGPoint();
                point.x = x
                point.y = y

                // update min/max
                if (x < min_x) min_x = x;
                if (y < min_y) min_y = y;
                if (x > max_x) max_x = x;
                if (y > max_y) max_y = y;

                // append
                polyline.points.appendItem(point);
            })

            // append
            svg.appendChild(polyline);
        })

        // compute scale
        scale = target_width / (max_x - min_x);

        // apply
        const polylines = document.querySelectorAll('#minimap-svg polyline');
        for (const polyline of polylines) {
            polyline.style.transform = `translate(-${min_x * scale}px, -${min_y * scale}px) scale(${scale})`;
        }

        // add rect
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.id = 'viewfinder'
        rect.classList.add('minimap-rect');
        rect.style.transform = `translate(-${min_x * scale}px, -${min_y * scale}px) scale(${scale})`;
        svg.appendChild(rect);

        // resize svg
        let _min_y = Infinity;
        let _max_y = 0;
        for (const polyline of polylines) {
            const { top, bottom } = polyline.getBoundingClientRect();
            if (top < _min_y) _min_y = top;
            if (bottom > _max_y) _max_y = bottom;
        }
        svg.setAttribute('height', `${_max_y - _min_y}px`);

        // prerender vectors
        prerender();

        // set flag
        ready = true;
    })

</script>


<div id="minimap">
    <svg id="minimap-svg"></svg>
    <p id="date-container">{date_str}</p>
</div>



<style>

    #minimap {
        position: absolute;
        top: 0px;
        right: 0px;
        padding: 1.5rem;
        width: 200px;
        overflow: visible;
    }

    #minimap-svg {
        width: 100%;
        overflow: visible;
        filter: drop-shadow(0px 0px 3px #999);
    }

    #date-container {
        font-family: var(--font-noto);
        font-size: var(--font-size-small);
        color: black;
        /* opacity: 0; */
        /* transition: opacity 1.5s ease-in-out; */
        letter-spacing: .15rem;
    }

    :global(.minimap-polyline) {
        fill: white;
        stroke: #333;
        stroke-width: 0.02;
    }

    :global(.minimap-polygon) {
        fill: #cc3333;
        opacity: 0.2;
        stroke: none;
        stroke-width: none;
    }

    :global(.minimap-hole) {
        fill: white;
        opacity: 1.0;
        stroke: none;
        stroke-width: none;
    }

    :global(.minimap-rect) {
        fill: transparent;
        stroke: #555;
        stroke-width: 0.15;
    }
    
</style>