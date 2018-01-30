import './UpdateTileComments.css';

import * as React from 'react';
import * as c from 'classnames';
import { takeRight } from 'lodash';
import { Updates } from 'collections/Updates';
import { Comment } from 'components/Comment/Comment';
import { Clickable } from 'components/Button/Clickable';
import { CommentBox } from 'components/Comment/CommentBox';
import { Meteor } from 'utils/Meteor';
import { Users } from 'collections/Users';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { translate } from 'utils/translate';
import { Link } from 'components/Router/Link';
import { Partups } from 'collections/Partups';

interface Props {
    className?: string;
    collapsedMax?: number;
    hideComments?: boolean;
    update: any;
    redirectCommentIntent?: boolean;
}

interface State {
    showAllComments: boolean;
    showCommentBox: boolean;
}

export class UpdateTileComments extends React.Component<Props, State> {

    public static defaultProps: Partial<Props> = {
        collapsedMax: 2,
    };

    public state: State = {
        showAllComments: false,
        showCommentBox: true,
    };

    private commentBoxComponent: CommentBox|null = null;

    public render() {
        const { update, hideComments } = this.props;
        const { comments_count = 0 } = Updates.findOne({ _id: update._id }) || {};
        const { showCommentBox } = this.state;
        const user = Users.findLoggedInUser();
        const canComment = !hideComments && showCommentBox;

        return (
            <div className={this.getClassNames()}>
                { this.renderCommentControls() }

                { !hideComments && (comments_count > 0) && this.renderComments() }

                {canComment && (
                    <CommentBox
                        update={update}
                        avatar={
                            <UserAvatar
                                user={user}
                                small
                                square />
                        }
                        ref={el => this.commentBoxComponent = el}
                        onSubmit={this.submitComment}
                        className={`pur-UpdateTileComments__comment-box`}
                    />
                )}
            </div>
        );
    }

    private renderCommentControls() {
        const { update, redirectCommentIntent } = this.props;
        const { comments_count = 0, partup_id = '' } = update;
        const partupSlug = Partups.getSlugById(partup_id);

        if (redirectCommentIntent) {
            return (
                <div className={`pur-UpdateTileComments__controls`}>
                    <Link
                        className={`pur-UpdateTileComments__control-reactions`}
                        target={'_partup'}
                        to={`/partups/${partupSlug}/updates/${update._id}`}
                    >
                        {translate('pur-dashboard-update_tile-comment_count', { comments_count })}
                    </Link>
                    {` • `}
                    <Link
                        className={`pur-UpdateTileComments__control-respond-link`}
                        target={'_partup'}
                        to={`/partups/${partupSlug}/updates/${update._id}`}
                    >
                        {translate('pur-dashboard-update_tile-comment')}
                    </Link>
                </div>
            );
        }

        return (
            <div className={`pur-UpdateTileComments__controls`}>
                <Clickable
                    className={`pur-UpdateTileComments__control-reactions`}
                    onClick={this.onCommentCountClick}
                >
                    {translate('pur-dashboard-update_tile-comment_count', { comments_count })}
                </Clickable>
                {` • `}
                <Clickable
                    className={`pur-UpdateTileComments__control-respond-link`}
                    onClick={this.onCommentLinkClick}
                >
                    {translate('pur-dashboard-update_tile-comment')}
                </Clickable>
            </div>
        );
    }

    private renderComments() {
        const { update, collapsedMax } = this.props;
        const { comments = [], comments_count = 0 } = Updates.findOne({ _id: update._id }) || {};
        const { showAllComments } = this.state;

        const amountOfCommentToShow = showAllComments ? comments_count : collapsedMax;
        const commentComponents = comments
            .filter(({ type }) => type !== 'system')
            .map((comment: any) => {
                if (comment.type === 'motivation') {
                    return <Comment prefix={translate('pur-dashboard-update_tile-motivation_prefix')} key={comment._id} comment={comment} update={update} />;
                }

                return (
                    <Comment
                        onRemove={this.removeComment}
                        onSubmit={this.submitEditComment}
                        key={comment._id}
                        comment={comment}
                        update={update} />
                );
            });

        return (
            <div className={`pur-UpdateTileComments__container`}>
                { takeRight(commentComponents, amountOfCommentToShow) }
            </div>

        );
    }

    private handleCommentClick = () => {
        const { showCommentBox } = this.state;

        if (showCommentBox) {
            if (this.commentBoxComponent) this.commentBoxComponent.focus();
        } else {
            this.setState({
                showCommentBox: true,
            }, () => {
                if (this.commentBoxComponent) this.commentBoxComponent.focus();
            });
        }
    }

    private onCommentCountClick = () => {
        const { hideComments } = this.props;

        if (!hideComments) this.toggleAllComments();
    }

    private onCommentLinkClick = () => {
        const { hideComments } = this.props;

        if (!hideComments) this.handleCommentClick();
    }

    private toggleAllComments = () => {
        this.setState({
            showAllComments: !this.state.showAllComments,
        });
    }

    private submitComment = (e: Event, { comment }: {comment: string}) => {
        e.preventDefault();
        const { update } = this.props;

        Meteor.call('updates.comments.insert', update._id, {
            content: comment.trim(),
        });
    }

    private submitEditComment = (e: Event, { comment, commentId }: {comment: string, commentId: string}) => {
        e.preventDefault();
        const { update } = this.props;

        Meteor.call('updates.comments.update', update._id, commentId, {
            content: comment.trim(),
        });
    }

    private removeComment = (e: Event, { commentId }: {commentId: string}) => {
        e.preventDefault();
        const { update } = this.props;

        Meteor.call('updates.comments.remove', update._id, commentId);
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-UpdateTileComments', className, {

        });
    }
}
