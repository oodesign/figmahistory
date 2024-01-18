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
    },
    documentRight: {
        name: "",
        version: "",
        children: [],
        pages: [],
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

export function updateDocumentPageLeftFlatNodes(pageId: string, flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentLeft: {
            ...globalState.documentLeft,
            pages: globalState.documentLeft.pages.map((page) => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        flatNodes: flatNodes,
                    };
                } else {
                    return page;
                }
            }),
        },
    };
}

export function setDocumentRight(doc: Document) {
    globalState = { ...globalState, documentRight: doc };
}

export function updateDocumentPageRightFlatNodes(pageId: string, flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentRight: {
            ...globalState.documentRight,
            pages: globalState.documentRight.pages.map((page) => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        flatNodes: flatNodes,
                    };
                } else {
                    return page;
                }
            }),
        },
    };
}

export function setSelectedPageId(id: string) {
    globalState = { ...globalState, selectedPageId: id };
}


