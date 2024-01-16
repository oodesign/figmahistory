// globals.ts

import { User, Side, Color, Document, Version, Page} from './types';

export interface GlobalState {
    documentId: string;
    accessToken: string;
    documentLeft: Document;
}

export let globalState: GlobalState = {
    documentId: "",
    accessToken: "",
    documentLeft: {
        name: "",
        version: "",
        children: [],
        pages: [],
      },
};

export function setDocumentID(id: string) {
    globalState = { ...globalState, documentId: id };
}

export function setAccessToken(token: string) {
    globalState = { ...globalState, accessToken: token };
}

