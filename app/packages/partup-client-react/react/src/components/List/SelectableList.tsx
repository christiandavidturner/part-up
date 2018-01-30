import './SelectableList.css';

import * as React from 'react';
import * as c from 'classnames';
import * as Bacon from 'baconjs';
import { includes, noop } from 'lodash';
import { Key } from 'ts-keycode-enum';
import { List } from './List';
import { ListItem } from './ListItem';
import { Clickable } from 'HOComponents/Clickable/Clickable';

export type SelectableListProps<T> = {
  className?: string;
  eventSource?: Element;
  items: Array<T>;
  itemRenderer: (item: T) => any;
  onItemSelected: (item: T) => any;
  onItemHighlighted?: (item: T) => any;
};

type SelectableListState = {
  currentSelectionIndex: number;
};

const navigationKeyCodes = [
  Key.UpArrow,
  Key.DownArrow,
  Key.Enter,
  Key.Tab,
  Key.Escape,
];

export class SelectableList<T> extends React.Component<SelectableListProps<T>, SelectableListState> {
  private _keyEventStream: Bacon.EventStream<ErrorEvent, number>;
  private _unsubKeyEventStream: () => void;

  constructor(props: SelectableListProps<T>) {
    super(props);
    this.state = {
      currentSelectionIndex: -1,
    };
  }

  public componentWillMount() {
    const { eventSource = window } = this.props;

    this._keyEventStream =
      Bacon
        .fromEvent<ErrorEvent, JQueryEventObject>(eventSource, 'keydown')
        .filter(({ keyCode, which }) => includes(navigationKeyCodes, (keyCode || which)))
        .doAction('.preventDefault')
        .map(({ keyCode, which }) => (keyCode || which));

    this._unsubKeyEventStream =
      this._keyEventStream.subscribe((baconEvent) => {
        this.onKeyEvent(baconEvent.value());
      });
  }

  public componentWillUnmount() {
    this._unsubKeyEventStream();
  }

  public render() {
    const { itemRenderer } = this.props;
    const { currentSelectionIndex } = this.state;

    return (
      <List className={this.getClassNames()}>
        {this.props.items.map((item, index) => {
          const selectableItemClass = c({
            'pur-SelectableList__item': currentSelectionIndex !== index,
            'pur-SelectableList__item--highlight': currentSelectionIndex === index,
          });

          return (
            <Clickable key={index} onClick={() => this.select(index)}>
              <ListItem className={selectableItemClass}>
                {itemRenderer(item)}
              </ListItem>
            </Clickable>
          );
        })}
      </List>
    );
  }

  private select = (index: number) => {
    const { items, onItemSelected } = this.props;

    this.resetSelectionIndex(); // The onItemSelected may or may not cause a re-mount so reset has to be invoked first
    onItemSelected(items[index]);
  }

  private onKeyEvent = (keyCode: number) => {
    const { currentSelectionIndex } = this.state;

    /* tslint:disable ter-indent */
    switch (keyCode) {
      case Key.UpArrow:
        this.highlight(-1);
        break;
      case Key.DownArrow:
        this.highlight(+1);
        break;
      case Key.Enter:
        this.select(currentSelectionIndex);
        break;
      case Key.Tab:
        this.select(currentSelectionIndex);
        break;
      case Key.Escape:
        this.resetSelectionIndex();
        break;
      default:
        break;
    }
    /* tslint:enable ter-indent */
  }

  private highlight(num: number) {
    const { items, onItemHighlighted = noop } = this.props;
    const { currentSelectionIndex } = this.state;

    const newIndex = currentSelectionIndex + num;

    if (newIndex >= -1 && newIndex < items.length) {
      this.setState({
        currentSelectionIndex: newIndex,
      });
      onItemHighlighted(items[newIndex]);
    }
  }

  private resetSelectionIndex() {
    this.setState({
      currentSelectionIndex: -1,
    });
  }

  private getClassNames() {
    const { className } = this.props;
    return c(className, {
      'pur-SelectableList': true,
    });
  }
}
