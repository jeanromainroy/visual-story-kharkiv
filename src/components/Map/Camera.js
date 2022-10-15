'use strict';

// import config
import { EARTH_RADIUS_PX, WIDTH_INCREASE_RATIO } from './config.js';

// import scripts
import { distance_between_points_3D, intersection_of_line_and_sphere, angle_between_two_points_3D } from './libs/geometry.js';
import { vertex, inv_vertex } from './libs/geospatial.js';


export class Camera {

    constructor(scene, camera, renderer, controls, fov, aspect) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.controls = controls;

        this.fov = fov;
        this.aspect = aspect;

        // current position
        this.bbox = null;
        this.bbox_callback = null;

        // animation
        this.being_animated = false;
        this.target_x = null;
        this.target_y= null;
        this.target_z = null;
        
        this.transit_1_x = null;
        this.transit_1_y= null;
        this.transit_1_z = null;
        this.transit_2_x = null;
        this.transit_2_y= null;
        this.transit_2_z = null;
        
        // other
        this.onanimate = null;
    }

    set_onanimate(func) {
        this.onanimate = func;
    }

    update_bbox() {

        // destructure current position
        const x = this.camera.position['x'];
        const y = this.camera.position['y'];
        const z = this.camera.position['z'];

        // position in lat lng
        const { latitude, longitude } = inv_vertex(x, y, z);

        // compute radius
        const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

        // compute distance from earth
        const distance_from_surface = radius - EARTH_RADIUS_PX;

        // compute the field of view
        const fov_rad_vert = this.fov * (Math.PI / 180.0);
        const fov_rad_horz = this.fov * (Math.PI / 180.0) * this.aspect;

        // compute half
        const fov_rad_vert_half = fov_rad_vert * 0.5;
        const fov_rad_horz_half = fov_rad_horz * 0.5;

        // compute dimensions
        const height = Math.tan(fov_rad_vert_half) * distance_from_surface;
        const width = Math.tan(fov_rad_horz_half) * distance_from_surface;
        const width_adjusted = width * ( 1 / WIDTH_INCREASE_RATIO );

        // convert to latitude longitude
        const height_geo = 360.0 * height / (2.0 * Math.PI * EARTH_RADIUS_PX) ;
        const width_geo = 180.0 * width / (2.0 * Math.PI * EARTH_RADIUS_PX) ;
        const width_adjusted_geo = 180.0 * width_adjusted / (2.0 * Math.PI * EARTH_RADIUS_PX) ;
        const offset_x = width_geo * (1 - ( 1 / WIDTH_INCREASE_RATIO ));

        // create points
        const bbox = [
            [ longitude - width_adjusted_geo - offset_x, latitude + height_geo ],
            [ longitude + width_adjusted_geo - offset_x, latitude + height_geo ],
            [ longitude + width_adjusted_geo - offset_x, latitude - height_geo ],
            [ longitude - width_adjusted_geo - offset_x, latitude - height_geo ]
        ]

        // set
        this.bbox = bbox

        // trigger callback
        if (typeof this.bbox_callback === 'function') {
            this.bbox_callback(this.bbox);
        }       
    }

    set_bbox_callback(func) {
        this.bbox_callback = func;
    }


    move_to_latlng(lat, lng, radius){

        // convert to px
        const { x, y, z } = vertex([lng, lat], radius);

        // position the camera right above
        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;

        // update control
        this.controls.update();

        // render
        this.renderer.render( this.scene, this.camera );

        // update position
        this.update_bbox();

        // on animate
        if (typeof(this.onanimate) === 'function') this.onanimate();
    }


    async animate_to_latlng(lat, lng, radius){

        // get current position
        const current_position = this.camera.position;
        const xi = current_position['x'];
        const yi = current_position['y'];
        const zi = current_position['z'];

        // get target position
        const target_position = vertex([lng, lat], radius);
        const xf = target_position['x'];
        const yf = target_position['y'];
        const zf = target_position['z'];

        // set
        this.target_x = xf;
        this.target_y = yf;
        this.target_z = zf;

        // get the angle between current position and target position
        const angle_deg = angle_between_two_points_3D(xi, yi, zi, xf, yf, zf)['deg']

        // set flag for transit
        const transit_required = angle_deg > 10.0;

        // we check if this point is inside the earth
        if (transit_required) {

            // log
            // console.log("WARNING: Transit point is required");

            // get the middle point
            const cx = (xf - xi) * 0.5 + xi;
            const cy = (yf - yi) * 0.5 + yi;
            const cz = (zf - zi) * 0.5 + zi;

            // build transit point far from the earth
            const transit_1 = intersection_of_line_and_sphere(cx, cy, cz, EARTH_RADIUS_PX * 1.7);

            // set 
            this.transit_1_x = transit_1['x'];
            this.transit_1_y = transit_1['y'];
            this.transit_1_z = transit_1['z'];

            // second transit point directly above the city
            const transit_2 = vertex([lng, lat], EARTH_RADIUS_PX * 1.7)

            // set 
            this.transit_2_x = transit_2['x'];
            this.transit_2_y = transit_2['y'];
            this.transit_2_z = transit_2['z'];
        }

        // if not already being animated
        if (!this.being_animated) {
            this.animate_to_xyz();
        }
    }


    async animate_to_xyz(){

        // set flag
        this.being_animated = true;

        // start animation
        await new Promise(resolve => {
            
            const animate = () => {

                // destructure current position
                const x0 = this.camera.position['x'];
                const y0 = this.camera.position['y'];
                const z0 = this.camera.position['z'];

                // compute step as a function of distance from origin
                const distance_from_earth_surface = Math.sqrt(Math.pow(x0, 2) + Math.pow(y0, 2) + Math.pow(z0, 2)) - EARTH_RADIUS_PX;
                const ratio = distance_from_earth_surface / (1.0 * EARTH_RADIUS_PX);
                const step = Math.cbrt(ratio) * 0.1;

                // set target
                let x1, y1, z1;
                if (this.transit_1_x !== null) {
                    x1 = this.transit_1_x;
                    y1 = this.transit_1_y;
                    z1 = this.transit_1_z;
                } else if (this.transit_2_x !== null) {
                    x1 = this.transit_2_x;
                    y1 = this.transit_2_y;
                    z1 = this.transit_2_z;
                } else {
                    x1 = this.target_x;
                    y1 = this.target_y;
                    z1 = this.target_z;
                }

                // make a step towards the destination
                const _x0 = (x1 - x0) * step + x0;
                const _y0 = (y1 - y0) * step + y0;
                const _z0 = (z1 - z0) * step + z0;

                // position the camera right above
                this.camera.position.x = _x0;
                this.camera.position.y = _y0;
                this.camera.position.z = _z0;

                // update control
                this.controls.update();

                // render
                this.renderer.render( this.scene, this.camera );

                // update position
                this.update_bbox();

                // on animate
                if (typeof(this.onanimate) === 'function') this.onanimate();

                // compute distance to destination
                const distance_difference = distance_between_points_3D(_x0, _y0, _z0, x1, y1, z1);

                // stop when distance difference
                if (this.transit_1_x !== null) {
                    if (distance_difference < 2) {
                        this.transit_1_x = null;
                        this.transit_1_y = null;
                        this.transit_1_z = null;
                    }
                } else if (this.transit_2_x !== null) {
                    if (distance_difference < 2) {
                        this.transit_2_x = null;
                        this.transit_2_y = null;
                        this.transit_2_z = null;
                    }
                }else {
                    if (distance_difference < 0.01) {
                        resolve();
                        return;                        
                    }
                }

                // animate
                requestAnimationFrame( animate );
            }

            animate();
        });

        // set flag
        this.being_animated = false;
    }
}
