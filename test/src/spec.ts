import { assert } from 'chai';

import test3, { test2, test7 } from './functions';
import Comp2, { Comp1 } from './classes';

const cases = [
    function default_export_function_with_props() {
        assert.equal(test3({}), 3);
    },
    function export_function_with_props() {
        assert.equal(test2({}), 2);
    },
    function export_function_without_props() {
        assert.deepEqual(test7(), { type: 'div' });
    },
    function export_default_class() {
        assert.equal(new Comp2().render(), 2);
    },
    function export_class() {
        assert.equal(new Comp1().render(), 1);
    }
];

cases.forEach(test => {
    console.log('-', test.name);
});
