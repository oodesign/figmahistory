// globals.ts

import { User, Side, Color, Document, Version, Page, FigmaNode, Node, Rect } from './types';

export interface GlobalState {
    documentId: string;
    accessToken: string;
    documentLeft: Document;
    documentRight: Document;
    selectedPageId: string;
    selectedNodeId: string;
    isDocumentLeftLoaded: boolean;
    isDocumentRightLoaded: boolean;
    user: User;
}

export let globalState: GlobalState = {
    documentId: "",
    accessToken: "",
    documentLeft: {
        name: "",
        version: "",
        pages: [],
    },
    documentRight: {
        name: "",
        version: "",
        pages: [],
    },
    selectedPageId: "",
    selectedNodeId: "",
    isDocumentLeftLoaded: false,
    isDocumentRightLoaded: false,
    user: {
        id: "",
        handle: "",
        img_url: "",
        email: ""
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

export function updateDocumentPageLeftBounds(pageId: string, boundingRect: Rect) {
    globalState = {
        ...globalState,
        documentLeft: {
            ...globalState.documentLeft,
            pages: globalState.documentLeft.pages.map((page) => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        boundingRect: boundingRect,
                    };
                } else {
                    return page;
                }
            }),
        },
    };
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
export function updateDocumentPageLeftChildrenAndFlatNodes(pageId: string, pageChildren: any[], flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentLeft: {
            ...globalState.documentLeft,
            pages: globalState.documentLeft.pages.map((page) => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        children: pageChildren,
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


export function updateDocumentPageRightBounds(pageId: string, boundingRect: Rect) {
    globalState = {
        ...globalState,
        documentRight: {
            ...globalState.documentRight,
            pages: globalState.documentRight.pages.map((page) => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        boundingRect: boundingRect,
                    };
                } else {
                    return page;
                }
            }),
        },
    };
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

export function updateDocumentPageRightChildrenAndFlatNodes(pageId: string, pageChildren: any[], flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentRight: {
            ...globalState.documentRight,
            pages: globalState.documentRight.pages.map((page) => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        children: pageChildren,
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

export function setSelectedNodeId(id: string) {
    globalState = { ...globalState, selectedNodeId: id };
}

export function setUser(user: User) {
    globalState = { ...globalState, user: user };
}


