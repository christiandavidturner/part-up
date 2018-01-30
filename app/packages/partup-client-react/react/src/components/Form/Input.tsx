import './Input.css';

import * as React from 'react';
import * as c from 'classnames';
import { defer } from 'lodash';

export interface InputProps {
  className?: string;
  type: string;
  name: string;
  placeholder?: string;
  onFocus?: Function;
  onBlur?: Function;
  defaultValue?: string;
  autoFocus?: boolean;
}

export class Input extends React.Component<InputProps, {}> {

    private element: HTMLInputElement|null = null;

    public render() {
        const {
            type,
            name,
            placeholder,
            defaultValue,
            autoFocus,
        } = this.props;

        return (
            <input
                type={type}
                name={name}
                ref={el => this.element = el}
                placeholder={placeholder}
                className={this.getClassNames()}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
                defaultValue={defaultValue}
                autoFocus={autoFocus}
            />
        );
    }

    public clear() {
        if (this.element) this.element.value = '';
    }

    public focus() {
        if (this.element) {
            this.element.focus();
        }
    }

    private onFocus = (event: React.SyntheticEvent<any>) => {
        const { onFocus } = this.props;

        defer(() => {
            if (this.element && this.element.value) {
                const val = this.element.value;
                this.element.value = '';
                this.element.value = val;
            }
        });

        if (onFocus) onFocus(event);
    }

    private onBlur = (event: React.SyntheticEvent<any>) => {
        const { onBlur } = this.props;

        if (onBlur) onBlur(event);
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-Input', className, {

        });
    }
}
