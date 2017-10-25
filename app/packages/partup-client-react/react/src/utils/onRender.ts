export default function onRender(cb: Function) {
    requestAnimationFrame(() => {
        // tslint:disable-next-line:no-console
        console.log('checking render');
        const element = document.querySelector('[data-react]');
        if (!element) {
            onRender(cb);
        } else {
            cb();
        }
    });
}
