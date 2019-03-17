const { exec } = require('child_process');

const EXPECT = `
+  1 test2 {{DIR}}/src/functions.tsx function test2
+  1 test3 {{DIR}}/src/functions.tsx function test3
+  1 test4 {{DIR}}/src/functions.tsx function test4
+  1 notTest5 {{DIR}}/src/functions.tsx function notTest5
+  1 test6 {{DIR}}/src/functions.tsx function test6
+  0 Comp1 {{DIR}}/src/classes.tsx function class_1
+  0 Comp2 {{DIR}}/src/classes.tsx function Comp2
+  0 Comp3 {{DIR}}/src/classes.tsx function Comp3
+  0 NotComp4 {{DIR}}/src/classes.tsx function NotComp4
- default_export_function_with_props
- export_function_with_props
- export_function_without_props
- export_default_class
- export_class
`;

console.log(__dirname);

exec('node test/dist/test.js', (error, stdout, stderr) => {
    if (error) {
        console.error(stdout);
        process.exit(1);
    }
    const expect = EXPECT.replace(/{{DIR}}/g, __dirname);
    if (strip(expect) === strip(stdout)) console.log('PASS');
    else {
        console.error('--------------------');
        console.error(stdout.trim());
        console.error('--------------------');
        console.error('FAIL');
        process.exit(2);
    }
});

function strip(s) {
    return s.trim().split(/[\r\n]/g).map(s => s.trim()).join('\n');
}
