import * as React from './react';
import { Component } from './react';

interface IFoo {}

export const Test1 = class extends Component {
    render() {
        return 1;
    }
}

export default class Test2 extends React.Component {
    render() {
        return 2;
    }
}

class Test3 extends React.Component implements IFoo {
    render() {
        return 3;
    }
}

export const Test4 = class NotTest4 extends Component {
    render() {
        return 4;
    }
}
