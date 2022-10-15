'use strict';

// import libs
import * as THREE from 'three';
import { Earcut } from 'three/src/extras/Earcut.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { pairs } from './libs/datamanipulation.js';
import { vertex, bbox_area } from './libs/geospatial.js';
import { yyyy_m_d_TO_yyyy_mm_dd } from '../../libs/datetime.js';


// import config
import { EARTH_RADIUS_PX, MARKER_SIZE, MARKER_COLOR_DEFAULT, MATERIAL_OPACITY_MARKERS_LOW } from './config.js';


export async function load_font( front_url = 'fonts/noto-sans-regular.json' ){

    // init
    let font = null;

    // instantiate loader
    const loader = new FontLoader();

    // load font
    await new Promise((resolve) => {
        loader.load( front_url, function(_font) {
            font = _font;
            resolve();
        }) 
    }) ;
    
    return font;
}


export function build_earth( texture_url = 'map/earth-texture.jpg', radius = EARTH_RADIUS_PX ){

    // load image as texture
    const texture = new THREE.TextureLoader().load( texture_url );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 12, 12 );
    const material = new THREE.MeshBasicMaterial( {  map: texture } );

    // build sphere geometry, slightly smaller radius for stuff above to be visible
    const geometry = new THREE.SphereGeometry( radius, 96, 96);

    // build object
    const object = new THREE.Mesh( geometry, material );

    return object;
}


export function build_belligerents(features, radius = EARTH_RADIUS_PX, material) {

    // init ensemble object
    let object = new THREE.Object3D();

    // go through
    features.forEach(feature => {
        const triangles = vector_to_3d_geometry( feature, radius);
        const geometry = new THREE.BufferGeometry().setFromPoints(triangles);
        const polygon = new THREE.Mesh( geometry, material ); 
        object.add(polygon);
    })

    return object;
}


export function build_borders(features, radius = EARTH_RADIUS_PX, material_lines ){

    // init ensemble object
    let object = new THREE.Object3D();

    // go through features
    features.forEach(feature => {

        // destructure
        const { geometry } = feature;

        // go through lines
        geometry['coordinates'].forEach(line => {

            // init
            let actual_coordinates = line;

            // check type
            if (geometry['type'] === 'MultiPolygon') {
                actual_coordinates = line[0];
            }

            // format as geojson feature
            const feature = { 'type': 'LineString', 'geometry': { 'coordinates': actual_coordinates } };

            // build line object
            const object_line = build_LineString(feature, material_lines, radius);

            // add
            object.add(object_line);
        });      
    });

    return object;
}


export function build_cities(cities, material, font, radius = EARTH_RADIUS_PX + 1 ){

    // init ensemble object
    let object = new THREE.Object3D();
 
    cities.forEach(city => {

        // destructure
        const { name, latitude, longitude } = city;

        // project lat/lng
        const point = vertex([longitude, latitude], radius);
        const point_offset = vertex([longitude + 0.03, latitude + 0.015], radius);

        // create sphere
        const geometry_sphere = new THREE.SphereGeometry(0.05, 12, 12);
        const sphere = new THREE.Mesh( geometry_sphere, material );

        // create text
        const geometry_text = new TextGeometry( name, {
            font: font,
            size: 0.2,
            height: 0.001,
            curveSegments: 12
        } );    
        const text = new THREE.Mesh( geometry_text, material );

        // set position
        sphere.position.set(point['x'], point['y'], point['z']);
        text.position.set(point_offset['x'], point_offset['y'], point_offset['z']);

        // rotate
        face_camera(text, longitude, latitude)

        // add
        object.add(sphere);
        object.add(text);
    })

    return object;
}


export function build_markers(features, radius = EARTH_RADIUS_PX) {
    
    // init ensemble object
    let object = new THREE.Object3D();
    
    // go through features
    features.forEach(feature => {

        // destructure
        const { geometry } = feature;

        // check
        if (geometry === undefined || geometry === null) return;

        if ( geometry['type'] === 'Point' ) {
            object.add(build_Point(feature, radius));
        }

        if ( geometry['type'] === 'MultiPoint' ) {
            build_MultiPoint(feature, radius).forEach(object_point => {
                object.add(object_point);
            })            
        }
        
        if ( geometry['type'] === 'Polygon' ) {

            // create material
            const material = new THREE.MeshBasicMaterial( { color: MARKER_COLOR_DEFAULT, transparent: true, opacity: MATERIAL_OPACITY_MARKERS_LOW, depthWrite: false } );   
            
            // convert to triangles
            const triangles = vector_to_3d_geometry(feature, radius);
            const geometry = new THREE.BufferGeometry().setFromPoints(triangles);
            const polygon = new THREE.Mesh( geometry, material ); 

            // set properties
            polygon['properties'] = feature['properties'];

            // add
            object.add(polygon)
        }
        
        if ( geometry['type'] === 'MultiPolygon' ) {

            // create material
            const material = new THREE.MeshBasicMaterial( { color: 0xFFFF00, transparent: true, opacity: 1.0 } );    

            // convert to triangles
            const triangles = vector_to_3d_geometry(feature, radius);
            const geometry = new THREE.BufferGeometry().setFromPoints(triangles);
            const polygon = new THREE.Mesh( geometry, material ); 

            // set properties
            polygon['properties'] = feature['properties'];

            // add
            object.add(polygon);
        }
    });

    return object;
}


export function build_LineString(feature, material_lines, radius = EARTH_RADIUS_PX) {

    // extract coordinates
    const points = feature['geometry']['coordinates'];

    // project each point
    const points_projected = points.map(point => vertex(point, radius));

    // pair points to create lines
    const lines = pairs(points_projected)

    // create geometry
    const geometry = new THREE.BufferGeometry().setFromPoints( lines );

    // build object
    const object_line = new THREE.LineSegments(geometry, material_lines )
    
    // set properties
    object_line['properties'] = feature['properties'];

    return object_line;
}


export function build_Point(feature, radius = EARTH_RADIUS_PX, size = MARKER_SIZE) {

    // destructure
    const [lng, lat] = feature['geometry']['coordinates'];

    // project lat/lng
    const { x, y, z } = vertex([lng, lat], radius);

    // create sphere
    const geometry = new THREE.SphereGeometry(size, 12, 12);
    const material = new THREE.MeshBasicMaterial( { color: MARKER_COLOR_DEFAULT, transparent: true, opacity: MATERIAL_OPACITY_MARKERS_LOW });
    const sphere = new THREE.Mesh( geometry, material );

    // set position
    sphere.position.set(x, y, z);

    // set properties
    sphere['properties'] = feature['properties'];
    
    return sphere;
}


export function build_Polygon(feature, material, radius = EARTH_RADIUS_PX) {
    return build_LineString(feature, material, radius);    
}


export function build_MultiPolygon(feature, radius = EARTH_RADIUS_PX){

    // init ensemble object
    let arr = []

    // create material
    const material = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 });

    // go through lines
    feature['geometry']['coordinates'].forEach(polygon => {

        // format as geojson feature
        const _feature = { 'type': 'Polygon', 'geometry': { 'coordinates': polygon[0] }, 'properties': feature['properties'] };

        // build object
        const object_polygon = build_Polygon(_feature, material, radius);

        // add
        arr.push(object_polygon);
    });  

    return arr;
}


export function build_MultiPoint(feature, radius = EARTH_RADIUS_PX) {

    // init ensemble object
    let arr = []

    // go through lines
    feature['geometry']['coordinates'].forEach(point => {

        // format as geojson feature
        const _feature = { 'type': 'Point', 'geometry': { 'coordinates': point }, 'properties': feature['properties'] };

        // build line object
        const object_point = build_Point(_feature, radius);

        // add
        arr.push(object_point);
    });  

    return arr;
}


export function vector_to_3d_geometry(vector, radius = EARTH_RADIUS_PX) {

    // destructure
    const { geometry } = vector;

    // init
    let triangles = [];

    // build object
    geometry['coordinates'].forEach(MultiPolygon => {

        // check type
        if (geometry['type'] === 'Polygon') {
            MultiPolygon = [MultiPolygon]
        }

        // init
        let data = [];
        let points = [];
        let holes_indices = MultiPolygon.length > 1 ? [] : null;

        // sort by bounding box area (decreasing order)
        MultiPolygon.sort((a, b) => {
            return bbox_area(b) - bbox_area(a)
        });

        // flatten the array
        MultiPolygon.forEach((Polygon, i) => {

            // is a hole
            if (i > 0) holes_indices.push(data.length / 3.0);

            // close
            // if (Math.abs(Polygon[0][0] - Polygon[Polygon.length-1][0]) > 0.01){
            //     Polygon = [...Polygon, Polygon[0]]
            // }

            Polygon.forEach(([lng, lat]) => {
                const point = vertex([lng, lat], radius);
                const { x, y, z } = point;
                data.push(x);
                data.push(y);
                data.push(z);
                points.push(point);
            });
        });

        // run triangulation
        const indices = Earcut.triangulate(data, holes_indices, 3);

        // format triangles as (x1, y1, z1, x2, y2, z2, ...)
        indices.map(index => points[index]).forEach(triangle => triangles.push(triangle));
    });

    // return geometry
    return triangles;
}


export function vector_to_2d_geometry(vector) {

    // destructure
    const { geometry } = vector;

    // init
    let polygons = [];
    let holes = [];

    // build object
    geometry['coordinates'].forEach(MultiPolygon => {

        // check type
        if (geometry['type'] === 'Polygon') {
            MultiPolygon = [MultiPolygon]
        }

        // sort by bounding box area (decreasing order)
        MultiPolygon.sort((a, b) => {
            return bbox_area(b) - bbox_area(a)
        });

        // flatten the array
        MultiPolygon.forEach((Polygon, i) => {

            // is a hole
            if (i > 0) {
                holes.push(Polygon);
            } else {
                polygons.push(Polygon);
            }
        });
    });

    // return geometry
    return { polygons, holes };
}


export function tessellate_vectors(vectors, radius = EARTH_RADIUS_PX){

    // check
    if (vectors === undefined || vectors === null || !Array.isArray(vectors) || vectors.length === 0) return [];

    // init
    let df = {};

    for (const vector of vectors) {

        // destructure
        const { properties } = vector;

        // date
        const date = yyyy_m_d_TO_yyyy_mm_dd(properties['DATE']);

        // compute
        const triangles_2d = vector_to_2d_geometry(vector);
        const triangles_3d = vector_to_3d_geometry(vector, radius);
        const geometry_3d = new THREE.BufferGeometry().setFromPoints(triangles_3d)

        // init
        df[date] = {
            'geometry': geometry_3d,
            'triangles_2d': triangles_2d
        }
    }

    return df;
}


export function get_object_screen_position(object, camera){

    // get north pole marker
    const { x, y, z } = object.position;

    // copy to vector
    var vector = new THREE.Vector3();
    vector.set( x, y, z );

    // map to normalized device coordinate (NDC) space
    vector.project( camera );

    // map to 2D screen space
    const _x = vector.x + 1;
    const _y = - vector.y + 1;

    return {
        'x': _x,
        'y': _y
    };
}


export function rotate_on_own_axis(object, angle_rad) {

    // instantiate transformation matrix
    const matrix = new THREE.Matrix4();

    // rotation matrix
    matrix.makeRotationAxis( new THREE.Vector3(object.position['x'], object.position['y'], object.position['z']), angle_rad )

    // apply
    object.applyMatrix4(matrix);
}


function face_camera(object, longitude, latitude) {

    // compute axis vector
    const { x, y, z } = vertex([longitude, latitude], EARTH_RADIUS_PX * 1.5);

    // rotate
    object.lookAt(x, y, z);
}