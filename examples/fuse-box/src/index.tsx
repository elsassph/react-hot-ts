import * as React from 'react';
import { render } from 'react-dom';
import { hot } from './hmr';
import App from './app';

let root = document.getElementById('root') || document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

hot(module)(
    render(<App/>, root)
);
