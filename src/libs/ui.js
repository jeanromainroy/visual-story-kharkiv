'use strict';


export function computeResizeFactor(canvas_width, canvas_height, image_width, image_height) {

    // init
    let offsetLeft, offsetTop, width, height, resizeFactor;

    if (image_width < canvas_width && image_height < canvas_height) {
        // if smaller than canvas
        offsetLeft = Math.round((canvas_width - image_width) / 2.0)
        offsetTop = Math.round((canvas_height - image_height) / 2.0)
        width = image_width;
        height = image_height;
        resizeFactor = 1.0;

    } else {
        // if bigger than canvas
        resizeFactor = Math.min(canvas_width / (1.0 * image_width), canvas_height / (1.0 * image_height))
        width = Math.floor(image_width * resizeFactor)
        height = Math.floor(image_height * resizeFactor)
        offsetLeft = Math.round((canvas_width - width) / 2.0)
        offsetTop = Math.round((canvas_height - height) / 2.0)
    }

    return {
        'offsetLeft': offsetLeft,
        'offsetTop': offsetTop,
        'width': width,
        'height': height,
        'resizeFactor': resizeFactor
    }
}
