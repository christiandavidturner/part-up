import { get, each } from 'lodash';

// jscs:disable
/**
 * Widget to render an update
 * @param {Boolean} LINK Make the title a clickable link that directs to the update detail page
 */
// jscs:enable

Template.Update.helpers({
  update() {
    // Override the non-reactive data.update to make it reactive
    return Updates.findOne(get(this.update, '_id'));
  },
  updateMeta() {
    const templateInstance = Template.instance();
    const update = this.update;
    const partup = Partups.findOne(get(update, 'partup_id'));

    if (!update || !partup) {
      return {};
    }

    return {
      title() {
        const titleKey = `update-type-${update.type}-title`;
        const params = {};

        if (update.upper_id) {
          params.name = User(Meteor.users.findOne(update.upper_id)).getFirstname();
        } else if (update.system) {
          params.name = 'Part-up';
        }

        const inviteeNames = get(update, 'type_data.invitee_names');
        if (inviteeNames) {
          let parsed = '';
          each(inviteeNames, (current, index) => {
            if (index === inviteeNames.length - 1) {
              parsed = `${parsed} ${TAPi18n.__('update-general-and')} ${current}`;
            } else {
              parsed = `${parsed} ${current}`;
            }
          });
          params.invitee_names = parsed;
        }

        if (update.isContributionUpdate()) {
          const activityId = get(update, 'type_data.activity_id');
          if (activityId) {
            const activity = Activities.findOne(activityId);
            params.activity = activity.name;
          }
          const contributorId = get(update, 'type_data.contributor_id');
          if (contributorId) {
            params.contributor = User(Meteor.users.findOne(contributorId)).getFirstname();
          }
        }

        return TAPi18n.__(titleKey, params);
      },
      titlePath() {
        const slug = this.partupSlug;
        let path;
        if (update.type.indexOf('partups_new_user') > -1) {
          path = Router.path('profile', { _id: update.upper_id });
        } else {
          path = Router.path('partup-update', { slug, update_id: update._id });
        }
        return path;
      },
      templateName() {
        if (update.type === 'partups_activities_invited') {
          return 'update_partups_invited';
        }
        return 'update_' + update.type;
      },
      activity() {
        return Activities.findOne(get(update, 'type_data.activity_id'));
      },
      isStarred() {
        return get(partup, 'starred_updates', []).includes(update._id);
      },
    };
  },
  systemMessageContent() {
    return Partup.client.strings.newlineToBreak(
      TAPi18n.__(
        `update-type-partups_message_added-system-${get(this.update, 'type_data.type')}-content`
      )
    );
  },
  commentable() {
    return !this.update.isContributionUpdate() && !this.update.isActivityUpdate() && !!!this.update.system;
  },
  commentLimit() {
    return this.DETAIL ? 0 : 2;
  },
  format() {
    return function(content) {
      return new Partup.client.message(content)
        .sanitize()
        .autoLink()
        .getContent();
    };
  },
  NOT_DETAIL() {
    return !this.DETAIL;
  }
});

Template.Update.events({
    'click [data-edit-message]': function(event, template) {
        event.preventDefault();
        Partup.client.popup.open({
            id: 'edit-message-' + template.data.updateId,
        });
    },
    'click [data-remove-message]': function(event, template) {
        event.preventDefault();
        Partup.client.prompt.confirm({
            title: TAPi18n.__('prompt-title-remove_message'),
            message: TAPi18n.__('prompt-message-remove_message'),
            onConfirm: function() {
                Meteor.call('updates.messages.remove', template.data.update._id, function(
                    error,
                    result
                ) {
                    if (error) {
                        Partup.client.notify.error(error.reason);
                        return;
                    }
                    Partup.client.notify.success(TAPi18n.__('prompt-success_remove-message'));
                });
            },
        });
    },
});
