import * as React from 'react';
import * as ReactDOM from 'react-dom';

export interface ClickableProps {
  onClick: EventListener;
}

export class Clickable extends React.Component<ClickableProps, {}> {
  private domNode: Element;

  public componentDidMount() {
    const { children, onClick } = this.props;

    if (!React.Children.only(children)) {
      throw new Error('The clickable component must recieve only 1 react component as child');
    }

    this.domNode = ReactDOM.findDOMNode(this);
    this.domNode.addEventListener('click', onClick);

  }

  public componentWillUnmount() {
    this.domNode.removeEventListener('click', this.props.onClick);
  }

  public render() {
    return (
        React.Children.only(
          this.props.children,
        )
    );
  }
}

// // Attempt at a proper way of getting to the actual dom element.

// React.Children.map(this.props.children, (child) => {
//   if (React.isValidElement(child)) {
//     console.log('child', child);
//     return React.cloneElement(child as ReactElement<any>, {
//       ref: (node: any) => {
//         if (typeof(node) === typeof(Element)) {
//           this.domNode = node;
//         }
//       },
//     });
//   } else {
//     throw new Error('The clickable HOC requires a valid Element');
//   }
// })[0],
