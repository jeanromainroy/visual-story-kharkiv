'use strict';

// import map config
import { EARTH_RADIUS_PX } from "./components/Map/config.js";

// --- Endpoints ---
export const ENDPOINT_TEXTS = 'texts.json';
export const ENDPOINT_INCIDENTS = 'incidents.json';
export const ENDPOINT_BASEMAPS = 'map/basemaps.json';
export const ENDPOINT_FRONTLINE = 'map/frontline.json.zip';
export const ENDPOINT_BELLIGERENTS = 'map/belligerents.json';
export const ENDPOINT_BORDERS = 'map/ukraine.json';
export const ENDPOINT_CITIES = 'map/cities.json';

// --- Dev ---
export const EDITABLE_TEXT = true;

// --- Geo ---
export const RADIUS_COUNTRY = EARTH_RADIUS_PX * 1.06;
export const RADIUS_CITY = EARTH_RADIUS_PX * 1.02;
export const RADIUS_INCIDENT = EARTH_RADIUS_PX * 1.0006;
export const CENTER_LNG = 36.2327;
export const CENTER_LAT = 49.9930;


// --- Time ---
const TODAY = new Date();
export const FIRST_DATE = '2022-02-24';
export const LAST_DATE = `${TODAY.getFullYear()}-${TODAY.getMonth() + 1}-${TODAY.getDate()}`;
