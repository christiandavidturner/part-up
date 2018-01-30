// import './AbsolutelyPositioned.css';

// import * as React from 'react';
// // import * as ReactDOM from 'react-dom';
// // import * as c from 'classnames';

// /*
//   requiremends:
//   - Must be positionable relative to the 'target' component
//   - What can it recieve? (need it for a list)
//   - In case of a list, the following options must be present
//     - itemHeight?;
//     - maxItems?;
//     - scrollable = true;
//   - must provide a handler to close
//   - popover?
// */
// enum componentAlignment {
//   auto = 'auto',
//   left = 'left',
//   center = 'center',
//   right = 'right',
// }

// enum componentDirection {
//   auto = 'auto',
//   left = 'left',
//   top = 'top',
//   right = 'right',
//   bottom = 'bottom',
// }

// enum componentGrow {
//   auto = 'auto',
//   left = 'left',
//   top = 'top',
//   right = 'right',
//   bottom = 'bottom',
// }

// export type absoluteComponentPosition = {
//   direction?: componentDirection;
//   alignment?: componentAlignment;
//   grow?: componentGrow;
// };

// export type AbsolutelyPositionedProps<P, S> = {
//   target: JSX.Element | string;
//   rules?: absoluteComponentPosition;
//   WrappedComponentProps: P;
//   WrappedComponentState: S;
// }

// export function AbsolutelyPositioned<P, S>(WrappedComponent: React.Component<P, S>) {
//   return class AbsolutelyPositioned extends React.Component<AbsolutelyPositionedProps<P, S>, {}> {
//   //   // private top: number;

//     public componentWillMount() {
//       // const { target } = this.props;
//       // const rect = target.getBoundingClientRect();

//       // this.top = rect.height;
//       // // const targetWidth = rect.width;
//       // // const targetHeight = rect.height;

//       // console.log(rect);
//     }

//     public componentDidMount() {
//       // const thisEl = ReactDOM.findDOMNode(this);
//       // console.log(thisEl);
//     }

//     render() {
//       return (
//         <React.Fragment>
//           {React.Children.only(this.props.children)}
//         </React.Fragment>
//       );
//     }

//     // private getClassNames() {
//     //   return c({
//     //     'pur-absolute': true
//     //   })
//     // }
//   }
// }


//   /*
//               direction:alignment:grow
//   direction: 'auto:right:top' | 'bottom:auto:left' | etc
//   stretch?
//   */


