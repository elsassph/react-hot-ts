import React from 'react';
import { useState } from 'react';

export default () => {
    const [counter, setCounter] = useState(0);
    return (
        <div onClick={() => setCounter(counter + 1)}>
            Counting clicks: {counter} (click me)
        </div>
    )
};
