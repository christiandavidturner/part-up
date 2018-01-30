import * as React from 'react';
import * as Bacon from 'baconjs';
import { noop, toLower } from 'lodash';
import { translate } from 'utils/translate';
import { Input } from 'components/Form/Input';
import { withSuggestions, WithSuggestionsProps } from 'HOComponents/withSuggestions/withSuggestions';
import { Meteor } from 'utils/Meteor';
import { decodeForInput } from 'utils/mentions';

const mentionsRegex =
  /(?:^|[\s])@(([\w\'\,\.\u00C0-\u017F\u2E00-\u2E7F]{1,}[\s]?[\w\'\,\.\u00C0-\u017F\u2E00-\u2E7F]*)([\s]?[\w\'\,\.\u00C0-\u017F\u2E00-\u2E7F]*))$/i;

export interface UserSuggestion {
  _id: string;
  name: string;
}

export interface GroupSuggestion {
  name: string;
  users: Array<string>;
}

export type MentionSuggestion = UserSuggestion | GroupSuggestion;

function inputStreamMapper(event: JQueryEventObject) {
  const target = (event.target as HTMLInputElement);
  const substr = target.value.substr(0, target.selectionStart);
  const match = substr.match(mentionsRegex);

  if (match) {
    if (match[3] === ' ') {
      return '';
    }
    return match[1] || '';
  }
  return '';
}

function queryResolver(partupId: string) {
  return function<MentionSuggestion>(query: string) {
    return Bacon.fromPromise<ErrorEvent, Array<MentionSuggestion>>(
      new Promise((resolve, reject) => {
        query = toLower(query);
        if (query.length === 0) {
          resolve([]);
        } else if (query.length < 2) {
          resolve([{
            name: (translate('pur-suggestions-noresult') as string) || '',
          }]);
        } else {
          let group;
          if ('supporters'.indexOf(query) > -1) {
            group = 'supporters';
          } else if ('partners'.indexOf(query) > -1) {
            group = 'partners';
          }

          Meteor.call('users.autocomplete', query, group, partupId, (error: any, result: any) => {
            if (error) {
              reject(error);
            } else {
              const suggestions = result.map((suggestion: any) => {
                if (suggestion.type) {
                  return {
                    name: suggestion.name,
                    users: suggestion.users,
                  };
                } else {
                  // usersuggestion
                  return {
                    _id: suggestion._id,
                    name: suggestion.profile.name,
                  };
                }
              });

              resolve(suggestions);
            }
          });
        }
      }),
    );
  };
}

function onSuggestionSelected(input: HTMLInputElement, item: UserSuggestion) {
  const { value = '' } = input;

  const substr = value.substr(0, input.selectionStart);
  const match = substr.match(mentionsRegex);

  if (match) {
    const pre = value.substring(0, (substr.length - match[1].length));

    let post = value.substring(input.selectionStart, value.length);
    if (post.length < 1) {
      post = `${post} `;
    }
    if (!post.startsWith(' ')) {
      post = ` ${post}`;
    }

    input.value = `${pre}${item.name}${post}`;
    input.selectionStart = input.selectionEnd = (pre + item.name).length + 1;
    input.focus();
  }
}

interface MentionsInputProps<T> extends WithSuggestionsProps<T> {
  partupId: string;
  getMentions?: (arg: () => any) => any;
}

export class MentionsInput<T extends MentionSuggestion> extends React.Component<MentionsInputProps<T>, {}> {
  private InputComponent: any;

  public input: Input;
  public mentions: Array<T> = new Array<T>();

  constructor(props: MentionsInputProps<T>) {
    super(props);
    const { partupId, getMentions } = props;

    // https://stackoverflow.com/questions/38394015/how-to-pass-data-from-child-component-to-its-parent-in-reactjs
    if (getMentions) {
      getMentions(this.getMentions);
    }

    if (props.inputProps.defaultValue) {
      props.inputProps.defaultValue = decodeForInput(this.mentions, props.inputProps.defaultValue);
    }

    this.InputComponent = withSuggestions<MentionSuggestion>({
      suggesterOptions: {
        inputStreamMapper,
        queryResolver: queryResolver(partupId),
      },
      suggestionRenderer(suggestion: MentionSuggestion) {
        return suggestion.name;
      },
      suggestionSelected: onSuggestionSelected,
    })(Input);
  }

  public render() {
    const { InputComponent, onSuggestionSelected } = this;
    const { inputProps } = this.props;

    return (
      <InputComponent
        ref={(el: any) => {
          if (el) {
            this.input = el.input;
          }
        }}
        suggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
        />
    );
  }

  private onSuggestionSelected = (suggestion: T) => {
    const { suggestionSelected = noop } = this.props;
    suggestionSelected(suggestion); // This must be called! since we are adding to the method passed in via props;
    this.mentions.push(suggestion);
  }

  private getMentions = () => {
    return this.mentions;
  }
}
