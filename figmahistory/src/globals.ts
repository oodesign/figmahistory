// globals.ts

import { User, Side, Color, Document, Version, Page } from './types';

export interface GlobalState {
    documentId: string;
    accessToken: string;
    documentLeft: Document;
    documentRight: Document;
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
    documentRight: {
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

export function setDocumentLeft(doc: Document) {
    globalState = { ...globalState, documentLeft: doc };
}

export function setDocumentRight(doc: Document) {
    globalState = { ...globalState, documentRight: doc };
}

