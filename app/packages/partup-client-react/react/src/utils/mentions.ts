import { MentionSuggestion, GroupSuggestion, UserSuggestion } from 'components/MentionsInput/MentionsInput';

export function encode(message: string, mentions: Array<MentionSuggestion>): string {
  let encodedMessage = message;

  mentions.forEach((mention) => {
    let encodedMention: string;

    if ('users' in mention) {

      const groupMention = <GroupSuggestion> mention;
      const userIds: string = groupMention.users.map((user: any) => user._id).join(',');
      encodedMention = `[${groupMention.name}:${userIds}]`;

    } else if ('_id' in mention) {

      const userMention = <UserSuggestion> mention;
      encodedMention = `[user:${userMention._id}|${userMention.name}]`;

    } else {

      encodedMention = '';
      // write very special log for front-end stuff that can never happen but do.
      console.log('can or may never happen... ', mention);

    }

    encodedMessage = encodedMessage.replace(new RegExp(`@${mention.name}`, 'g'), encodedMention);
  });

  return encodedMessage;
}

/**
 * Replace mentions in a message with hyperlinks
 *
 * @name decode
 *
 * @param {String} message
 *
 * @return {String}
 */
export function decode(message: string): string {
    return message.replace(/\[Supporters:(?:([^\]]+))?\]/g, (m: string, users: string) => {
        // decode supporter mentions
        return `<a data-hovercontainer="HoverContainer_upperList" data-hovercontainer-context="${
           users
        }" class="pu-mention-group pur-mention-group">Supporters</a>`;
    }).replace(/\[Partners:(?:([^\]]+))?\]/g, (m: string, users: string) => {
        // decode upper mentions
        return `<a data-hovercontainer="HoverContainer_upperList" data-hovercontainer-context="${
            users
        }" class="pu-mention-group pur-mention-group">Partners</a>`;
    }).replace(/\[user:([^\]|]+)(?:\|([^\]]+))?\]/g, (m: string, _id: string, name: string) => {
        // decode invividual mentions
        return `<a href="profile/${
            _id
        }" data-hovercontainer="HoverContainer_upper" data-hovercontainer-context="${
            _id
        }" class="pu-mention-user pur-mention-user">${
            name
        }</a>`;
    });
}

export function decodeForInput(mentions: Array<MentionSuggestion>, message: string): string {
  if (!message.length) {
    return message;
  }
  return message
    .replace(/\[Supporters:(?:([^\]]+))?\]/g, (message, ids: string) => {
      mentions.push({
        name: 'Supporters',
        users: ids.split(','),
      });
      return '@Supporters';
    })
    .replace(/\[Partners:(?:([^\]]+))?\]/g, (message, ids: string) => {
      mentions.push({
        name: 'Partners',
        users: ids.split(','),
      });
      return '@Partners';
    })
    .replace(/\[user:([^\]|]+)(?:\|([^\]]+))?\]/g, (message, id, name) => `@${name}`);
}
