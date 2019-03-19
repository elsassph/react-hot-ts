import * as React from './react';

export function test1() {
    return 1;
}

export function test2(props) {
    return 2;
}

export default function test3(props) {
    return 3;
}

const test4 = (props) => 4;

const test5 = function notTest5(props) {
    return 5;
}

const test6 = (props) => {
    return 6;
}

export function test7() {
    return <div/>;
}

declare function test8(props): void;
