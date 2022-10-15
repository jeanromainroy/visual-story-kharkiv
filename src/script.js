'use strict';

// import Map config
import { CENTER_LNG, CENTER_LAT, RADIUS_COUNTRY, RADIUS_CITY, RADIUS_INCIDENT } from './config.js';


export function move_map_to_view_of_city(map_camera) {
    map_camera.animate_to_latlng(CENTER_LAT, CENTER_LNG, RADIUS_CITY);
}

export function move_map_to_view_of_country(map_camera) {
    map_camera.animate_to_latlng(CENTER_LAT, CENTER_LNG, RADIUS_COUNTRY);
}

export async function move_map_to_view_of_incident(incident_id, incidents, map_camera) {
    if (incident_id === undefined || incident_id === null) return;

    // move to incident
    const [lat, lng] = get_incident_coordinates(incidents, incident_id);

    // move to incident
    map_camera.animate_to_latlng(lat, lng, RADIUS_INCIDENT);
}


function get_incident_coordinates(incidents, incident_id) {

    // select incident
    const incident = incidents.filter(incident => +incident['properties']['ID'] === incident_id)[0];

    // destructure
    const geometry_type = incident['geometry']['type'];
    const coordinates = incident['geometry']['coordinates'];

    // init
    let lng, lat;

    // set
    if (geometry_type === 'Point') {
        lng = coordinates[0];
        lat = coordinates[1];
    }
    
    if (geometry_type === 'Polygon') {

        // init
        let lngs = [], lats = [];

        // push all the coordinates
        coordinates.forEach(_coordinates => {
            _coordinates.forEach(([lng, lat]) => {
                lngs.push(lng);
                lats.push(lat);
            })
        });

        // average
        lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        lat = lats.reduce((a, b) => a + b, 0) / lats.length;
    }

    if (geometry_type === 'MultiPolygon') {

        // init
        let lngs = [], lats = [];

        // push all the coordinates
        coordinates.forEach(_coordinates => {
            _coordinates.forEach(__coordinates => {
                __coordinates.forEach(([lng, lat]) => {
                    lngs.push(lng);
                    lats.push(lat);
                })
            })
        });

        // average
        lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        lat = lats.reduce((a, b) => a + b, 0) / lats.length;
    }
    
    // move to animation
    return [lat, lng]
}
