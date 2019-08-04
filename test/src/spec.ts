import { assert } from 'chai';
import { hot } from 'react-hot-ts';

import test4, { test2, test7, test8 } from './cases/functions';
import Test2, { Test1, Test6 } from './cases/classes';
import Wrapped from './cases/Wrapped';

const cases: any[] = [
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
    function export_async_arrow_function() {
      return new Test6().asyncMethod().then(res => assert.equal(res, 1))

    },
    function export_class() {
        assert.equal(new Test1().render(), 1);
    },
    function wrapped_default_renamed() {
        assert.equal(Wrapped(2), 2);
    },
    function patch_react_for_development() {
        if (process.env.NODE_ENV !== 'production') {
            let acceptCalled = false;
            hot(module, () => acceptCalled = true)({});
            assert.isTrue(acceptCalled);
        }
    },
    function no_patch_react_for_production() {
        if (process.env.NODE_ENV === 'production') {
            // `react-hot-ts` should be replaced by the cold implementation for release
            let acceptCalled = false;
            hot(module, () => acceptCalled = true)({});
            assert.isFalse(acceptCalled);
        }
    }
];

cases.reduce((promise, test) => {
    return promise.then(() => {
        console.log('-', test.name);
        try {
            return Promise.resolve(test())
        } catch (err) {
            console.log('FAIL:', err.message);
            process.exit(1);
        }
    })
}, Promise.resolve())
