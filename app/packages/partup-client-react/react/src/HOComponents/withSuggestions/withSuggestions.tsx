import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { get, noop } from 'lodash';
import { Input, InputProps } from 'components/Form/Input';
import { Suggester, SuggesterOptions } from 'lib/suggester/Suggester';
import { SelectableList } from 'components/List/SelectableList';

export interface WithSuggestionsProps<T> {
  inputProps: InputProps;
  suggestionSelected?: (suggestion: T) => void;
}

type WithSuggestionsState<T> = {
  currentSuggestions: Array<T>,
};

export type WithSuggestionsOptions<T> = {
  /**
   * Suggester options
   *
   * @type {SuggesterOptions<T>}
   */
  suggesterOptions: SuggesterOptions<T>;
  /**
   * A function that is invoked for rendering a suggestion
   *
   * @argument {T} suggestion
   * @returns {any}
   */
  suggestionRenderer: (suggestion: T) => any;
  /**
   * Invoked when a suggestion is selected
   * Mutate the element that triggered the suggestion
   *
   * @argument {HTMLInputElement|HTMLTextAreaElement} el
   * @returns {void}
   */
  suggestionSelected: (el: HTMLInputElement | HTMLTextAreaElement, arg: T) => void;
};

/**
 * A higher order function that returns a higher order component to give suggestions for any input or text area element
 *
 * @export
 * @template T Suggestion type
 * @param {WithSuggestionsOptions<T>} options
 * @returns Higher order component that renders the given input component
 */
export function withSuggestions<T>(options: WithSuggestionsOptions<T>) {
  return (WrappedComponent: typeof Input) => {
    return class extends React.Component<WithSuggestionsProps<T>, WithSuggestionsState<T>> {

      private _inputElement: HTMLInputElement | HTMLTextAreaElement;
      private _suggester: Suggester<T>;
      private _unsubscribeSuggestions: () => void;

      public input: Input;

      constructor(props: WithSuggestionsProps<T>) {
        super(props);
        this.state = {
          currentSuggestions: new Array<T>(),
        };
      }

      public componentDidMount() {
        const { inputStreamMapper, queryResolver } = options.suggesterOptions;

        this._suggester = new Suggester<T>(this._inputElement, {
          inputStreamMapper,
          queryResolver,
        });

        this._unsubscribeSuggestions =
          this._suggester
            .suggestionStream
            .subscribe((baconEvent) => {
              this.setState({
                currentSuggestions: baconEvent.value() || [],
              });
            });
      }

      public componentWillUnmount() {
        this._unsubscribeSuggestions();
        this._suggester.dispose();
      }

      public render() {
        const { inputProps } = this.props;
        const { currentSuggestions } = this.state;

        return (
          <React.Fragment>
            <WrappedComponent
              ref={(component) => {
                if (component) {
                  this.input = component;

                  const domEl = ReactDOM.findDOMNode(component);
                  this._inputElement = ((domEl as HTMLInputElement) || (domEl as HTMLTextAreaElement));
                }
              }}
              {...inputProps}
            />
            {get(currentSuggestions, 'length') && (
              <SelectableList
                eventSource={this._inputElement}
                items={currentSuggestions}
                itemRenderer={options.suggestionRenderer}
                onItemSelected={this.onItemSelected}
                // onItemHighlighted={this.suggester.prefill}
              />
            ) || ''}
          </React.Fragment>
        );
      }

      private onItemSelected = (suggestion: T) => {
        const { suggestionSelected = noop } = this.props;

        options.suggestionSelected(this._inputElement, suggestion);
        suggestionSelected(suggestion);

        this.setState({
          currentSuggestions: new Array<T>(),
        });
      }
    };
  };
}
