import * as React from './react';
import { Component } from './react';

interface IFoo {}

export const Comp1 = class extends Component {
    render() {
        return 1;
    }
}

export default class Comp2 extends React.Component {
    render() {
        return 2;
    }
}

class Comp3 extends React.Component implements IFoo {
    render() {
        return 3;
    }
}

const Comp4 = class NotComp4 extends Component {
    render() {
        return 4;
    }
}
