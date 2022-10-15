'use strict';


export function distance_between_points_3D(x0, y0, z0, x1, y1, z1){
    return Math.sqrt( Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2) + Math.pow(z1 - z0, 2) );
}


export function angle_between_two_points_3D(x1, y1, z1, x2, y2, z2) {
    // spherical coordinates, with sphere centered at (0, 0, 0)

    // get norm
    const norm_1 = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2) + Math.pow(z1, 2));
    const norm_2 = Math.sqrt(Math.pow(x2, 2) + Math.pow(y2, 2) + Math.pow(z2, 2));

    // dot product
    const dot_product = x1 * x2 + y1 * y2 + z1 * z2;

    // compute 
    const value = dot_product / ( norm_1 * norm_2);

    // get the angle between current position and target position
    const angle_rad = Math.acos(value);
    const angle_deg = (angle_rad / (2.0 * Math.PI)) * 360.0

    return { rad: angle_rad, deg: angle_deg }
}



/**
 * Two objects. A sphere offset from the origin. A line starting from the origin and crossing the sphere's center. 
 * This function returns the furthest point where the two intersect. 
 */
export function intersection_of_line_and_sphere(cx, cy, cz, radius) {

    // init
    let t_final = 0.0;
    let last_diff = Infinity;
    const step = 0.0001;

    // brute force find intersection
    for (let t=1.0 ; t<2.0 ; t+=step) {

        // increment line position
        const line_x = cx * t;
        const line_y = cy * t;
        const line_z = cz * t;

        // should =0 if the point lies on the sphere
        const diff = Math.abs(Math.pow(line_x - cx, 2) + Math.pow(line_y - cy, 2) + Math.pow(line_z - cz, 2) - Math.pow(radius, 2));

        // if diff increases, we stop
        if (diff < last_diff) {
            last_diff = diff;
            t_final = t;
        }
    }

    return {
        'x': cx * t_final,
        'y': cy * t_final,
        'z': cz * t_final
    }
}


/**
 * Computes the plane equation based on 3 non collinear points
 */
// export function compute_trajectory_plane(pt1, pt2, pt3) {

//     // destructure
//     const x1 = pt1['x'];
//     const y1 = pt1['y'];
//     const z1 = pt1['z'];
    
//     const x2 = pt2['x'];
//     const y2 = pt2['y'];
//     const z2 = pt2['z'];

//     const x3 = pt3['x'];
//     const y3 = pt3['y'];
//     const z3 = pt3['z'];

//     // solve:
//     // a * x0 + b * y0 + c * z0 + d = 0;
//     // a * x1 + b * y1 + c * z1 + d = 0;
//     // a * x2 + b * y2 + c * z2 + d = 0;
//     const a1 = x2 - x1;
//     const b1 = y2 - y1;
//     const c1 = z2 - z1;
//     const a2 = x3 - x1;
//     const b2 = y3 - y1;
//     const c2 = z3 - z1;
//     const a = b1 * c2 - b2 * c1;
//     const b = a2 * c1 - a1 * c2;
//     const c = a1 * b2 - b1 * a2;
//     const d = (-a * x1 - b * y1 - c * z1);

//     // instantiate a THREE js plane
//     const plane = new THREE.Plane((new THREE.Vector3(a, b, c)).normalize(), d);

//     // check 
//     if (!plane.isPlane) return null;

//     // return
//     return plane;
// }


// export function compute_perpendicular_vectors(w) {

//     // destructure
//     const wx = w['x'];
//     const wy = w['y'];
//     const wz = w['z'];

//     // dot product = 0 
//     // (wx * ux) + (wy * uy) + (wz * uz) = 0;
//     // uz = - ((wx * ux) + (wy * uy)) / (wz)
//     // ux = 0, uy = 1
//     // uz = - wy / wz
//     const u = (new THREE.Vector3(0, 1, - (wy / (1.0 * wz)))).normalize();

//     // build 
//     const v = new THREE.Vector3(wx, wy, wz);
//     v.cross(u).normalize();

//     return [u, v];
// }
