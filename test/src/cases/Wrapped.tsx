
export function Wrapped(a){
    return a;
}
function wrap(c) { return c; }

// this default can't be named from a wariable
// so will be called using the filename
// but renaned with _1 to avoid conflict with other export
export default wrap(Wrapped);
