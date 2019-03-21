import * as React from 'react';
import { render } from 'react-dom';
import { hot } from 'react-hmr-ts';
import App from './App';

const root = document.createElement('div');
document.body.appendChild(root);

hot(module)(
    render(<App/>, root)
);
