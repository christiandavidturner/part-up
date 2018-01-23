import { Collection, CollectionDocument } from 'collections/Collection';

export interface FileDocument extends CollectionDocument {
    _id: string;
    name: string;
    bytes: number;
    guid: string;
    link: string;
    type: string;
    service: string;
    createdAt: string;
    meta: {[key: string]: any};
}

class FilesCollection extends Collection<FileDocument> {

}

export const Files = new FilesCollection({
    collection: 'cfs.files.filerecord',
});
