import * as React from 'react';

export function test1() {
    return 1;
}

export function test2(props) {
    return 2;
}

export function test3(props) {
    return 3;
}

const test4 = (props) => 4;

export const test5 = function notTest5(props) {
    return 5;
}

export const
    test6 = (props) => { return 6; };
export const test7 = (props) => 7;

export function test8() {
    return <div/>;
}

declare function test9(props): void;

export default test4;
