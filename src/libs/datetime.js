'use strict';

// import libs
import { isNumber } from './datatype.js';

// months
export const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];

export const monthNames_fr = ["janvier", "février", "mars", "avril", "mai", "juin",
"juillet", "août", "septembre", "octobre", "novembre", "décembre"];


export function ordinal_suffix(day){
    if (day === 1 || day === 21 || day === 31) return 'st';
    if (day === 2 || day === 22) return 'nd';
    if (day === 3 || day === 23) return 'rd';
    return 'th';
}


export function is_valid_day(value){
    if (!isNumber(value)) return false;
    if (+value < 0 || +value > 31) return false;    // we allow 0
    return true;
}

export function is_valid_month(value){
    if (!isNumber(value)) return false;
    if (+value < 0 || +value > 12) return false;    // we allow 0
    return true;
}

export function is_valid_year(value){
    if (!isNumber(value)) return false;
    const now_plus_5 = (new Date()).getFullYear() + 5;
    if (+value < 1900 || +value > now_plus_5) return false;    // we allow 0
    return true;
}


export function date_to_number(date_str) {

    // split
    const [ year, month, day ] = date_str.split('-');

    // convert
    const number = (+year) * 10000 + (+month) * 100 + (+day);

    return number;
}
                    

export function yyyy_mm_dd_TO_month_day(date_str) {

    // break apart
    const [yyyy, mm, dd] = date_str.split('-').map(d => { return +d });

    // convert mm to month
    const month = monthNames[mm - 1];

    // convert day to ordinal
    const day = `${dd}${ordinal_suffix(dd)}`;

    return `${month} ${day}`;
}


export function yyyy_m_d_TO_yyyy_mm_dd(date) {
    const [year, month, day] = date.split('-').map(d => +d);
    const year_str = year;
    const month_str = month < 10 ? `0${month}` : month;
    const day_str = day < 10 ? `0${day}` : day;
    const date_formatted = `${year_str}-${month_str}-${day_str}`;
    return date_formatted;
}
