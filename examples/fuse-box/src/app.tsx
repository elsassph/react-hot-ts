import * as React from 'react';
import Counter from './counter';

export default class App extends React.Component {
    render() {
        return <div>
            <h1>HMR demo FuseBox app</h1>
            <Counter/>
        </div>
    }
}
