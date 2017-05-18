import { browserHistory } from 'react-router';
import * as React from 'react';

export const goToUrl = (url: string, event?: any) => {
    if (!event) {
        return (event: any) => {
            event.preventDefault();
            browserHistory.push(url)
        }
    }

    event.preventDefault();
    browserHistory.push(url);
    return null;

};

export function showOrHide(p: boolean) {
    if (p) {
        return '';
    }
    return 'hidden';
}

export function newObject(...objs: any[]): any {
    let result: any = {};
    objs.forEach(o => Object.assign(result, o));
    return result;
}

export function dateToHumanReadable(d: Date): string {
    return ("00" + (d.getMonth() + 1)).slice(-2) + "/" +
        ("00" + d.getDate()).slice(-2) + "/" +
        d.getFullYear() + " " +
        ("00" + d.getHours()).slice(-2) + ":" +
        ("00" + d.getMinutes()).slice(-2) + ":" +
        ("00" + d.getSeconds()).slice(-2);
}
