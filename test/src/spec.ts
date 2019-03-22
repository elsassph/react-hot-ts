import { assert } from 'chai';
import { hot } from 'react-hmr-ts';
import * as React from 'react';

import test4, { test2, test7, test8 } from './cases/functions';
import Test2, { Test1 } from './cases/classes';
import Wrapped from './cases/Wrapped';

const cases = [
    function default_export_function_with_props() {
        assert.equal(test4({}), 4);
    },
    function export_function_with_props() {
        assert.equal(test2({}), 2);
    },
    function export_multiple_arrow_functions() {
        assert.equal(test7({}), 7);
    },
    function export_function_without_props() {
        assert.deepEqual(test8(), { type: 'div' });
    },
    function export_default_class() {
        assert.equal(new Test2().render(), 2);
    },
    function export_arrow_function_forward() {
        assert.deepEqual(new Test2().on1(1, 2), [1, 2]);
        assert.deepEqual(new Test2().on2(1, 2, 3), [1, 2, 3]);
    },
    function export_class() {
        assert.equal(new Test1().render(), 1);
    },
    function wrapped_default_renamed() {
        assert.equal(Wrapped(2), 2);
    },
    function patch_react_for_development() {
        if (process.env.NODE_ENV !== 'production') {
            hot(module)({});
            assert.isDefined((React as any)._hmr_createElement);
        }
    },
    function no_patch_react_for_production() {
        if (process.env.NODE_ENV === 'production') {
            hot(module)({});
            assert.isUndefined((React as any)._hmr_createElement);
        }
    }
];

cases.forEach(test => {
    console.log('-', test.name);
    try {
        test();
    } catch (err) {
        console.log('FAIL:', err.message);
        process.exit(1);
    }
});
