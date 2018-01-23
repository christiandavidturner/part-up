import { Dispatcher } from './Dispatcher';
import * as debug from './debug';

export const NotificationsDispatcher = new Dispatcher();

export function error({ title, content, error: err }: {title: string, content: string, error: any}) {
    // tslint:disable-next-line:no-console
    if (err) debug.error(err);
    NotificationsDispatcher.dispatch('error', { title, content, type: 'error' });
}

export function warn({ title, content, warning }: {title: string, content: string, warning: any}) {
    // tslint:disable-next-line:no-console
    if (warning) debug.warn(warning);
    NotificationsDispatcher.dispatch('warn', { title, content, type: 'warn' });
}

export function success({ title, content }: {title: string, content: string}) {
    NotificationsDispatcher.dispatch('success', { title, content, type: 'success' });
}
