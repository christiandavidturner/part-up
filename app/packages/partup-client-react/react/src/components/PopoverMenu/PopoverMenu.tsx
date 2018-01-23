import './PopoverMenu.css';

import * as React from 'react';
import * as c from 'classnames';
import { Portal } from 'components/PortalManager/Portal';

interface Props {
    className?: string;
    items: (JSX.Element|string)[];
}

interface State {
    shown: boolean;
    leftPosition: number;
    topPosition: number;
}

export class PopoverMenu extends React.Component<Props, State> {

    public state: State = {
        shown: false,
        leftPosition: 0,
        topPosition: 0,
    };

    public render() {
        const {
            children,
            items,
        } = this.props;

        const { shown,
            leftPosition,
            topPosition,
        } = this.state;

        return (
            <div className={this.getClassNames()}>
                <button onClick={this.handleOnClick} className={`pur-PopoverMenu__button`}>
                    {children}
                </button>
                {shown && (
                    <Portal onClick={this.closePopover}>
                        <div className={`pur-PopoverMenu__container`} style={{ top: `${topPosition}px`, left: `${leftPosition}px` }}>
                        {items}
                        </div>
                    </Portal>
                )}
            </div>
        );
    }

    private handleOnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const bcr = event.currentTarget.getBoundingClientRect();

        this.setState((state: State) => ({
            shown: !state.shown,
            leftPosition: bcr.left - 130 + bcr.width,
            topPosition: bcr.top + bcr.height,
        }));
    }

    private closePopover = () => {
        this.setState({
            shown: false,
        });
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-PopoverMenu', {
            // 'pur-PopoverMenu--modifier-class': boolean,
        }, className);
    }
}
