'use strict';


export function bbox_center_point(bbox){
        
    // set 
    const [ max_lng, min_lng ] = [bbox[0], bbox[2]].sort((a, b) => { return b - a });
    const [ max_lat, min_lat ]= [bbox[1], bbox[3]].sort((a, b) => { return b - a });

    // compute middle coordinates
    const mid_lat = min_lat + Math.abs(max_lat - min_lat) / 2.0;
    const mid_lng = min_lng + Math.abs(max_lng - min_lng) / 2.0;

    // round
    const mid_lat_rounded = mid_lat.toFixed(4);
    const mid_lng_rounded = mid_lng.toFixed(4)

    return { 'lat': mid_lat_rounded, 'lng': mid_lng_rounded };
}


export function bbox_to_gmap_link(bbox){

    // compute lat lng
    const { lat, lng } = bbox_center_point(bbox);

    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}


export function lat_lng_to_gmap_link(lat, lng){
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}


function toDegreesMinutesAndSeconds(coordinate) {
    var absolute = Math.abs(coordinate);
    var degrees = Math.floor(absolute);
    var minutesNotTruncated = (absolute - degrees) * 60;
    var minutes = Math.floor(minutesNotTruncated);
    var seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    return degrees + "°" + minutes + "'" + seconds;
}


export function convertDMS(lat, lng) {
    var latitude = toDegreesMinutesAndSeconds(lat);
    var latitudeCardinal = lat >= 0 ? "N" : "S";

    var longitude = toDegreesMinutesAndSeconds(lng);
    var longitudeCardinal = lng >= 0 ? "E" : "W";

    return latitude + " " + latitudeCardinal + "&nbsp;&nbsp;&nbsp;" + longitude + " " + longitudeCardinal;
}
