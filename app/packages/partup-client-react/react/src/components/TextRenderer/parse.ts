import * as marked from 'marked';
const EmojiConvertor = require('emoji-js');

export function parseMentions(text: string): string {
    return text.replace(/\[Supporters:(?:([^\]]+))?\]/g, (m: string, users: string) => {
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

export function parseMarkdown(text: string): string {

    return marked(text);
}

export function parseLinks(text: string): string {
    const rexp = /(\b(http|ftp|https):\/\/([\w-]+\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?)/ig;

    return text.replace(rexp, '<a href="$1" target="_blank">$3</a>');
}

export function parseEmojis(text: string): string {
    const converter = new EmojiConvertor();
    const unifiedText = converter.replace_unified(text);
    return converter.replace_colons(unifiedText);
}

export function parseHTML(text: string): string {
    return text;
}

type CustomTextParseFunction = (s: string) => string;

export class TextParser {

    public parsed: string;
    public raw: string;

    constructor({ text }: { text: string }) {
        this.raw = text;
        this.parsed = this.raw;
    }

    public mentions = (): TextParser => {
        this.parsed = parseMentions(this.parsed);

        return this;
    }

    public markdown = (): TextParser => {
        this.parsed = parseMarkdown(this.parsed);

        return this;
    }

    public links = (): TextParser => {
        this.parsed = parseLinks(this.parsed);

        return this;
    }

    public emojis = (): TextParser => {
        this.parsed = parseEmojis(this.parsed);

        return this;
    }

    public html = (): TextParser => {
        this.parsed = parseHTML(this.parsed);

        return this;
    }
    /**
     * Should always return the parsed text
     *
     * @param  {CustomTextParseFunction=(s} customParser
     * @returns TextParser
     */
    public custom = (customParser: CustomTextParseFunction): TextParser => {
        this.parsed = customParser(this.parsed);

        return this;
    }
}
