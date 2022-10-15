'use strict';


export function pairs(values){
    let mpairs = [];
    _pairs(values, function(a, b) {
        mpairs.push(a, b)
    });
    return mpairs;
}


export function _pairs(values, pairof = pair) {
    const pairs = [];
    let previous;
    let first = false;
    for (const value of values) {
        if (first) pairs.push(pairof(previous, value));
        previous = value;
        first = true;
    }
    return pairs;
}


export function pair(a, b) {
    return [a, b];
}
