<script>

    // properties
    export let canvas;
    export let camera_helper;
    export let camera, renderer, scene, controls;
    export let ready = false;
    export let init_position;
    export let markers;
    export let basemaps;
    export let borders;
    export let belligerents;
    export let cities;

    // import libs
    import { onMount } from "svelte";
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

    // import scripts
    import { Camera } from "./Camera.js";
    import { coordinates_to_sphere_parameters } from './libs/geospatial.js';
    import { build_earth, build_borders, build_belligerents, build_markers, build_cities, load_font } from "./scripts.js";

    // import config
    import { fov, near, far, 
            WIDTH_INCREASE_RATIO,
            EARTH_RADIUS_PX,
            MARKER_COLOR_LOWLIGHTED, MARKER_COLOR_HIGHLIGHTED, MARKER_COLOR_DEFAULT, 
            MATERIAL_COLOR_CITIES, MATERIAL_OPACITY_CITIES, MATERIAL_COLOR_VECTORS, MATERIAL_OPACITY_VECTORS, MATERIAL_OPACITY_TRANSITION, MATERIAL_COLOR_BELLIGERENTS, MATERIAL_OPACITY_BELLIGERENTS, MATERIAL_OPACITY_MARKERS_HIGH, MATERIAL_OPACITY_MARKERS_LOW,
            ENDPOINT_EARTH_TEXTURE,
            ANIMATION_SPEED_MARKERS
    } from './config.js';

    // app config
    import { RADIUS_COUNTRY, RADIUS_CITY } from '../../config.js';

    // set config
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0);

    // objects
    let object_markers;
    let object_cities;
    let object_vectors = new THREE.Object3D();
    let incident_id;

    // materials
    const material_vectors = new THREE.MeshBasicMaterial( { color: MATERIAL_COLOR_VECTORS, transparent: true, opacity: MATERIAL_OPACITY_VECTORS } );
    const material_belligerents = new THREE.MeshBasicMaterial( { color: MATERIAL_COLOR_BELLIGERENTS, transparent: true, opacity: MATERIAL_OPACITY_BELLIGERENTS } );
    const material_cities = new THREE.MeshBasicMaterial( { color: MATERIAL_COLOR_CITIES, transparent: true, opacity: MATERIAL_OPACITY_CITIES, alphaTest: 0.1 } );
    const material_lines = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 });


    export const update_cities_opacity = () => {

        // camera position
        const { x, y, z } = camera.position;

        // compute params
        const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

        // compute scale
        let scale = (radius - RADIUS_CITY) / (RADIUS_COUNTRY - RADIUS_CITY);

        // bound
        if (scale > 1.0) scale = 1.0;
        if (scale < 0.0) scale = 0.0;

        // update opacity
        material_cities.opacity = MATERIAL_OPACITY_CITIES * scale;

        // render
        renderer.render( scene, camera );
    }


    onMount(async () => {

        // grab canvas
        canvas = document.querySelector('#bg');

        // compute camera parameters
        const aspect = WIDTH_INCREASE_RATIO * (window.innerWidth / window.innerHeight);

        // init elements
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
        renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas, antialias: true });

        // set renderer attributes
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth * WIDTH_INCREASE_RATIO, window.innerHeight );

        // create control
        controls = new OrbitControls( camera, renderer.domElement );

        // disable user controls
        controls.enabled = false;

        // load font
        const font = await load_font();

        // build earth
        const object_earth = build_earth(ENDPOINT_EARTH_TEXTURE, EARTH_RADIUS_PX - 2);

        // build borders
        const object_borders = build_borders(borders['features'], EARTH_RADIUS_PX + 0.01, material_lines);

        // build cities
        object_cities = build_cities(cities, material_cities, font, EARTH_RADIUS_PX + 0.01);

        // build belligerents
        const object_belligerents = build_belligerents(belligerents, EARTH_RADIUS_PX + 0.01, material_belligerents);

        // build markers
        object_markers = build_markers(markers, EARTH_RADIUS_PX + 0.0005);

        // add earth to scene
        scene.add(object_earth);
        scene.add(object_borders);
        scene.add(object_belligerents);
        scene.add(object_vectors);
        scene.add(object_cities);
        scene.add(object_markers);

        // init camera helper
        camera_helper = new Camera(scene, camera, renderer, controls, fov, aspect);

        // set on animate
        camera_helper.set_onanimate(update_cities_opacity)

        // if init position is provided
        if (init_position !== undefined && init_position !== null) {
            camera_helper.move_to_latlng(init_position['latitude'], init_position['longitude'], init_position['radius']);
        }
        
        // draw basemaps
        if (basemaps !== undefined && basemaps !== null) {
            for (const basemap of basemaps) {

                // destructure
                const { filepath, bbox, radius_offset, opacity } = basemap;

                // convert bbox to coordinates
                const coordinates = [ [bbox[0], bbox[1]], [bbox[0], bbox[3]], [bbox[2], bbox[3]], [bbox[2], bbox[1]], [bbox[0], bbox[1]] ];

                // load
                if (opacity === undefined || opacity === null) {
                    await load_image(filepath, radius_offset, coordinates );
                } else {
                    await load_image(filepath, radius_offset, coordinates, true, opacity );
                }
            }
        }

        // set opacity
        setTimeout(() => {

            // update control
            controls.update();

            // render
            renderer.render( scene, camera );

            // fade in
            document.getElementById('bg').style.opacity = '1';

            // set flag ready
            ready = true;

            // animate
            setTimeout(() => {

                // launch incident animation
                animate_markers();

            }, 500);
        }, 500);
    })



    function animate_markers() {

        let delta = 1;

        setInterval(() => {

            // check
            if (incident_id === undefined || incident_id === null) return;

            // select the markers to change
            const children = object_markers.children.filter(marker => +marker['properties']['ID'] === +incident_id);

            // check
            if (children.length === 0) return;
            
            // update opacity
            children.forEach(child => {
                child.material.opacity += delta * MATERIAL_OPACITY_TRANSITION;
            });

            // update delta
            const current_opacity = children[0].material.opacity;
            if (current_opacity < MATERIAL_OPACITY_MARKERS_LOW || current_opacity >  MATERIAL_OPACITY_MARKERS_HIGH) {
                delta = -delta;
            }

            // render
            renderer.render( scene, camera );

        }, ANIMATION_SPEED_MARKERS)
    }


    export const draw_vector = (vector) => {

        // check
        if (vector === undefined || vector === null) return;

        // destructure
        const { geometry } = vector;

        // build geometry
        const object = new THREE.Mesh( geometry, material_vectors);

        // clear scene
        object_vectors.clear();

        // add to scene
        object_vectors.add(object);

        // update control
        controls.update();

        // render
        renderer.render( scene, camera );
    }

    
    export const load_image = async (url, radius_offset = 0.0, coordinates, transparent = false, opacity = 1.0, alphaTest = 0.0 ) => {

        // init
        let texture;
        const loader = new THREE.TextureLoader();

        // load image as texture
        await new Promise((resolve) => {
            loader.load( url, function(_texture) {
                texture = _texture;
                resolve();
            });
        });

        // convert coordinates to sphere parameters
        const { phiStart, phiLength, thetaStart, thetaLength } = coordinates_to_sphere_parameters(coordinates);

        // use the texture for material creation
        let material = null;
        if (transparent) {
            material = new THREE.MeshBasicMaterial( { map: texture, transparent: true, opacity: opacity, alphaTest: alphaTest } );
        } else {
            material = new THREE.MeshBasicMaterial( { map: texture } );
        }

        // adjust radius
        const radius = EARTH_RADIUS_PX + radius_offset;

        // create object
        const geometry = new THREE.SphereGeometry( radius, 128, 128, phiStart, phiLength, thetaStart, thetaLength );
        const object = new THREE.Mesh( geometry, material );

        // rotate to start at north pole and london
        object.rotation.x = Math.PI / 2.0;
        object.rotation.y = Math.PI;

        // add to scene
        scene.add( object );

        // update control
        controls.update();

        // render
        renderer.render( scene, camera );
    }


    export const highlight_marker = (_incident_id) => {

        // set
        incident_id = _incident_id;

        // IF NO INCIDENT ID, set all to default
        if (incident_id === undefined || incident_id === null) {
            object_markers.children.forEach(marker => {
                marker.material.color.setHex( MARKER_COLOR_DEFAULT );
            })
            return;
        }

        // go through
        object_markers.children.forEach(marker => {

            // lowlight all markers
            marker.material.color.setHex( MARKER_COLOR_LOWLIGHTED );
            marker.material.opacity = MATERIAL_OPACITY_MARKERS_HIGH;

            // highlight the input marker
            if (+marker['properties']['ID'] === +incident_id) {
                marker.material.color.setHex( MARKER_COLOR_HIGHLIGHTED )
            }
        })
    }

</script>

<canvas id="bg"></canvas>


<style>

    canvas {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        background-color: #eee;
        opacity: 0;
        transition: opacity 3s ease-in-out;
    }

</style>
