const { exec } = require('child_process');
const printDiff = require('print-diff');

const ANON_CLASS = process.argv.length > 1 && process.argv[2] == 'es6' ? 'Component' : 'class_1';

const EXPECT = `
+ test1 {{DIR}}/src/functions.tsx function test1
+ test2 {{DIR}}/src/functions.tsx function test2
+ test3 {{DIR}}/src/functions.tsx function test3
+ test8 {{DIR}}/src/functions.tsx function test8
+ test5 {{DIR}}/src/functions.tsx function notTest5
+ test6 {{DIR}}/src/functions.tsx function
+ test7 {{DIR}}/src/functions.tsx function
+ test4 {{DIR}}/src/functions.tsx function test4
+ Test1 {{DIR}}/src/classes.tsx function ${ANON_CLASS}
+ Test2 {{DIR}}/src/classes.tsx function Test2
+ Test4 {{DIR}}/src/classes.tsx function NotTest4
- default_export_function_with_props
- export_function_with_props
- export_multiple_arrow_functions
- export_function_without_props
- export_default_class
- export_arrow_function_forward
- export_class
`;

exec('node test/dist/test.js', (error, stdout, stderr) => {
    if (error) {
        console.error(stdout);
        process.exit(1);
    }
    const expected = strip(EXPECT.replace(/{{DIR}}/g, __dirname));
    const outcome = strip(stdout);
    if (expected === outcome) console.log('PASS');
    else {
        printDiff(expected, outcome);
        console.error('FAIL');
        process.exit(2);
    }
});

function strip(s) {
    return s.trim().split(/[\r\n]/g).map(s => s.trim()).join('\n');
}
