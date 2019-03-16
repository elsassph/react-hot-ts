
namespace React {

    export namespace JSX {
        export interface Element {}
    }

    export function createElement(type, props, ...children) {
        return { type };
    }

    export class Component {
        render(): JSX.Element | null | false {
            return null;
        }
    }
}

export = React;
