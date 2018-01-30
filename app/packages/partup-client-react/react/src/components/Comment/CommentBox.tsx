import './CommentBox.css';

import * as React from 'react';
import * as c from 'classnames';
import { Input } from 'components/Form/Input';
import { Button } from 'components/Button/Button';
import { Form } from 'components/Form/Form';
import { translate } from 'utils/translate';
import { MentionsInput } from 'components/MentionsInput/MentionsInput';
import { encode } from 'utils/mentions';

const inputProps = {
  className: 'pur-CommentBox__input',
  type: 'text',
  name: 'comment',
  placeholder: translate('pur-dashboard-comment_box-comment_placeholder'),
};

interface Props {
  update: any;
  className?: string;
  onSubmit: (e: any, fields: any) => void;
  defaultValue?: string;
  avatar?: JSX.Element;
  onBlur?: Function;
  autoFocus?: boolean;
}

interface State {
    showSendButton: boolean;
}

export class CommentBox extends React.Component<Props, State> {
  private inputElement: Input;

  private getMentions: any;

  public state: State = {
    showSendButton: false,
  };

  constructor(props: Props) {
    super(props);
  }

    public render() {
      const self = this;
      const { defaultValue = '', avatar, autoFocus, update } = this.props;

      return (
          <Form
              className={this.getClassNames()}
              onSubmit={this.onSubmit}
              onBlur={this.onBlur}>
              { avatar && (
                  <div className={`pur-CommentBox__avatar`}>
                      { avatar }
                  </div>
              ) }
              <MentionsInput
                partupId={update.partup_id}
                getMentions={(getMentions) => this.getMentions = getMentions}
                ref={(component) => {
                  if (component) {
                    this.inputElement = component.input;
                  }
                }}
                inputProps={{
                  defaultValue,
                  autoFocus,
                  onFocus: self.showSendButton,
                  ...inputProps,
                }}
              />
              {this.state.showSendButton && (
                  <Button type={`submit`} className={`pur-CommentBox__submit-button`}>
                      {translate('pur-dashboard-comment_box-comment_comment')}
                  </Button>
              )}
          </Form>
      );
    }

    public focus() {
      if (this.inputElement) this.inputElement.focus();

      this.showSendButton();
    }

    private onSubmit = (event: React.SyntheticEvent<any>, fields: { comment: string }) => {
        const { onSubmit } = this.props;
        this.inputElement.clear();

        const encodedMentions = {
          comment: encode(fields.comment, this.getMentions()),
        };

        if (onSubmit) onSubmit(event, encodedMentions);
    }

    private onBlur = (event: React.FocusEvent<any>) => {
        const { onBlur } = this.props;

        if (event.relatedTarget) return;

        if (onBlur) onBlur(event);
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-CommentBox', {
            // 'pur-CommentBox--modifier-class': boolean,
        }, className);
    }

    private showSendButton = () => {
        this.setState({
            showSendButton: true,
        });
    }
}
