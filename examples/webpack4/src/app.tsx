import React from 'react';
import Counter from './counter';

type AppState = { counter: number };

export default class App extends React.PureComponent<{}, AppState> {

    constructor(props: {}) {
        super(props);
        this.state = { counter: 0 };
    }

    onClick = () => {
        // HMR updates arrow functions, try changing the increment
        const { counter } = this.state;
        this.setState({ counter: counter + 1 });
    }

    render() {
        return <div onClick={this.onClick}>
            <h1>HMR demo Webpack app { this.state.counter }</h1>
            <Counter/>
        </div>
    }
}
