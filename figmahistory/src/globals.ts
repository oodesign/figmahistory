// globals.ts

import { User, Side, Color, Document, Version, Page, FigmaNode, Node } from './types';

export interface GlobalState {
    documentId: string;
    accessToken: string;
    documentLeft: Document;
    documentRight: Document;
    selectedPageId: string;
}

export let globalState: GlobalState = {
    documentId: "",
    accessToken: "",
    documentLeft: {
        name: "",
        version: "",
        children: [],
        pages: [],
        flatNodes: []
    },
    documentRight: {
        name: "",
        version: "",
        children: [],
        pages: [],
        flatNodes: []
    },
    selectedPageId: "",
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

export function updateDocumentLeftFlatNodes(flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentLeft: {
            ...globalState.documentLeft,
            flatNodes: flatNodes,
        },
    };
}

export function setDocumentRight(doc: Document) {
    globalState = { ...globalState, documentRight: doc };
}

export function updateDocumentRightFlatNodes(flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentRight: {
            ...globalState.documentRight,
            flatNodes: flatNodes,
        },
    };
}

export function setSelectedPageId(id: string) {
    globalState = { ...globalState, selectedPageId: id };
}


