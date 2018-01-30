import './Comment.css';

import * as React from 'react';
import * as c from 'classnames';
import { get } from 'lodash';
import * as moment from 'moment';

import { UpdateCommentSubDocument as CommentType } from 'collections/Updates';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { CommentText } from 'components/TextRenderer/CommentText';
import { CommentBox } from 'components/Comment/CommentBox';
import { Users } from 'collections/Users';
import { Fragment } from 'react';
import { translate } from 'utils/translate';

interface Props {
    update?: any;
    comment: CommentType;
    className?: string;
    prefix?: string;
    onClick?: Function;
    onSubmit?: Function;
    onBlur?: Function;
    onRemove?: Function;
}

interface State {
    editing: boolean;
}

export class Comment extends React.Component<Props, State> {

    public state: State = {
        editing: false,
    };

    public render() {
        const { comment, prefix, update } = this.props;
        const { editing } = this.state;

        return (
            <div className={this.getClassNames()}>
                <UserAvatar
                    userAvatarImageId={get(comment, 'creator.image')}
                    className={`pur-Comment__avatar`}
                    small
                    square
                />
                { !editing && (
                    <div
                        className={`pur-Comment__content`}
                        onClick={this.onClick}
                        >
                        <p>
                            <strong
                                data-hovercontainer="HoverContainer_upper"
                                data-hovercontainer-context={comment.creator._id}>
                                {comment.creator.name}
                            </strong>
                            { prefix && (
                                <span>{` `}{prefix}</span>
                            ) }
                            {` `}
                            <CommentText
                                text={comment.content} />
                        </p>
                        { this.renderFooter() }
                    </div>
                ) }
                { editing && (
                    <div className={`pur-Comment__content`}>
                        <CommentBox
                            update={update}
                            autoFocus
                            onSubmit={this.onSubmit}
                            onBlur={this.onBlur}
                            defaultValue={comment.content}
                            />
                    </div>
                ) }
            </div>
        );
    }

    private commentIsLiggedInUserComment = () => {
        const { comment } = this.props;
        const user = Users.findLoggedInUser();

        return !!(user && comment.creator._id === user._id);
    }

    private renderFooter = () => {
        const { comment } = this.props;

        return (
            <time className={`pur-Comment__postedAt`}>
                { moment(comment.created_at).format(`ddd, MMMM [${translate('pur-dashboard-comment-at_time_marker')}] h:mm`) }
                { this.commentIsLiggedInUserComment() && (
                    <Fragment>
                        {` - `}
                        <span
                            className={`pur-Comment__postedAt__remove`}
                            onClick={this.onRemove}>
                            {translate('pur-dashboard-comment-remove')}
                        </span>
                    </Fragment>
                 ) }
            </time>
        );
    }

    private onClick = (event: React.SyntheticEvent<any>): void => {
        const { onClick } = this.props;
        const { editing } = this.state;

        if (this.commentIsLiggedInUserComment()) {
            this.setState({
                editing: !editing,
            });
        }

        if (onClick) onClick(event);
    }

    private onSubmit = (event: React.SyntheticEvent<any>, fields: { message: string }) => {
        const { onSubmit, comment } = this.props;

        this.setState({
            editing: false,
        });

        if (onSubmit) onSubmit(event, { commentId: comment._id, ...fields });
    }

    private onBlur = (event: React.SyntheticEvent<any>) => {
        const { onBlur } = this.props;

        this.setState({
            editing: false,
        });

        if (onBlur) onBlur(event);
    }

    private onRemove = (event: React.SyntheticEvent<any>) => {
        event.preventDefault();
        event.stopPropagation();

        const { onRemove, comment } = this.props;

        if (onRemove) onRemove(event, { commentId: comment._id });
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-Comment', className, {

        });
    }
}
