import { assert } from 'chai';

import test4, { test2, test7, test8 } from './functions';
import Test2, { Test1 } from './classes';

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
    function export_class() {
        assert.equal(new Test1().render(), 1);
    }
];

cases.forEach(test => {
    console.log('-', test.name);
});
