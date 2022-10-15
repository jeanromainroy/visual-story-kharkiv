'use strict';

// --- Camera ---
// fov — Camera frustum vertical field of view.
export const fov = 50;

// near — Camera frustum near plane.
export const near = 0.1;

// far — Camera frustum far plane.
export const far = 1000;


// --- Shift the camera to the right if >1 ---
export const WIDTH_INCREASE_RATIO = 1.66;


// --- Objects Properties ---
export const EARTH_RADIUS_PX = 228;
export const MARKER_SIZE = 0.001;


// --- Vectors Properties ---
export const MATERIAL_COLOR_BELLIGERENTS = 0xcc3333;
export const MATERIAL_COLOR_VECTORS = 0xcc3333;
export const MATERIAL_COLOR_CITIES = 0x555555;
export const MATERIAL_OPACITY_BELLIGERENTS = 0.4;
export const MATERIAL_OPACITY_VECTORS = 0.2;
export const MATERIAL_OPACITY_CITIES = 0.8;
export const MATERIAL_OPACITY_MARKERS_HIGH = 0.4;
export const MATERIAL_OPACITY_MARKERS_LOW = 0.1;
export const MATERIAL_OPACITY_TRANSITION = 0.01;

// --- Animation ---
export const ANIMATION_SPEED_VECTORS = 30;
export const ANIMATION_SPEED_MARKERS = 3000 * MATERIAL_OPACITY_TRANSITION / ((MATERIAL_OPACITY_MARKERS_HIGH - MATERIAL_OPACITY_MARKERS_LOW) * 2.0);


// --- Colors ---
export const MARKER_COLOR_HIGHLIGHTED = 0xFF0000;
export const MARKER_COLOR_LOWLIGHTED = 0xFFCCCB;
export const MARKER_COLOR_DEFAULT = 0xFF0000;


// --- Endpoints ---
export const ENDPOINT_EARTH_TEXTURE = 'map/earth-texture.jpg';
