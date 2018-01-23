declare module 'moment/locale/nl';

declare module 'marked';

declare module '*.json' {
    type jsonImport = {
        [key: string]: any
    }

    const value: jsonImport;

    export default value;
}

declare var Router: any;
