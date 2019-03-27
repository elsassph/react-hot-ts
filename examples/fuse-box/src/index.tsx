import * as React from 'react';
import { render } from 'react-dom';
import { hot } from 'react-hot-ts';
import App from './app';

// In dev HMR mode, `index.tsx` is re-executed on each change
let root = document.getElementById('root') || document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Ensures components deep re-render
hot()(
    render(<App/>, root)
);
