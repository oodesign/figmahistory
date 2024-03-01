// globals.ts

import { Timestamp } from 'firebase/firestore';
import { User, Side, Color, Document, Version, Page, FigmaNode, Node, Rect, ViewDiffs, AppState } from './types';

export interface GlobalState {
    documentId: string;
    documentName: string;
    accessToken: string;
    documentLeftId: string;
    documentRightId: string;
    selectedPageId: string;
    selectedNodeId: string;
    isDocumentLeftLoaded: boolean;
    isDocumentRightLoaded: boolean;
    user: User;
    viewDiffs: ViewDiffs;
    hasMultipleVersionPages: boolean;
    versionPagesCount: number;
    loadedDocuments: { [version: string]: Document };
    appState: AppState;
    appTrialDaysLeft: number;
    urlPaths: string;
}

export let globalState: GlobalState = {
    documentId: "",
    documentName: "",
    accessToken: "",
    documentLeftId: "",
    documentRightId: "",
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
    viewDiffs: {
        showSections: true,
        showFrames: true,
        showComponents: true,
        showInstances: true,
        showGroups: false,
        showText: false,
        showShapes: false,
    },
    hasMultipleVersionPages: false,
    versionPagesCount: 1,
    loadedDocuments: {},
    appState: AppState.NOT_REGISTERED,
    appTrialDaysLeft: 0,
    urlPaths: ""
};

export function setDocumentID(id: string) {
    globalState = { ...globalState, documentId: id };
}

export function setDocumentUrlPaths(urlPath: string) {
    globalState = { ...globalState, urlPaths: urlPath };
}

export function setAppState(state: AppState) {
    globalState = { ...globalState, appState: state };
}

export function setAppTrialDaysLeft(appTrialDaysLeft: number) {
    globalState = { ...globalState, appTrialDaysLeft: appTrialDaysLeft };
}

export function setAccessToken(token: string) {
    globalState = { ...globalState, accessToken: token };
}

export function setDocumentLeftId(id: string) {
    globalState = { ...globalState, documentLeftId: id };
}

export function addLoadedDocument(doc: Document) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [doc.version]: doc,
        },
    };
}


export function setHasMultipleVersionPages(hasMultipleVersionPages: boolean) {
    globalState = { ...globalState, hasMultipleVersionPages: hasMultipleVersionPages };
}

export function setVersionPagesCount(versionPagesCount: number) {
    globalState = { ...globalState, versionPagesCount: versionPagesCount };
}

export function updateDocumentPageLeftBounds(documentId: string, pageId: string, boundingRect: Rect) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((page) => {
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
        },
    };
}



export function updateDocumentPageIsLoaded(documentId: string, pageId: string, isLoaded: boolean) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((page) => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            isLoaded: isLoaded,
                        };
                    } else {
                        return page;
                    }
                }),
            },
        },
    };
}

export function updateDocumentPageChildrenFlatNodesAndBackground(documentId: string, pageId: string, pageChildren: any[], flatNodes: Node[], backgroundColor: Color) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((page) => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            children: pageChildren,
                            flatNodes: flatNodes,
                            backgroundColor: backgroundColor,
                        };
                    } else {
                        return page;
                    }
                }),
            },
        },
    };
}

export function updateDocumentPageLeftFlatNodes(documentId: string, pageId: string, flatNodes: Node[]) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((currentPage) => {
                    if (currentPage.id === pageId) {
                        return {
                            ...currentPage,
                            flatNodes: flatNodes,
                        };
                    } else {
                        return currentPage;
                    }
                }),
            },
        },
    };
}




export function updateDocumentPageLeftChildrenAndFlatNodes(documentId: string, pageId: string, pageChildren: any[], flatNodes: Node[]) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((page) => {
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
        },
    };
}

export function setDocumentRightId(id: string) {
    globalState = { ...globalState, documentRightId: id };
}


export function updateDocumentPageRightBounds(documentId: string, pageId: string, boundingRect: Rect) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((page) => {
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
        },
    };
}

export function updateDocumentPageRightFlatNodes(documentId: string, pageId: string, flatNodes: Node[]) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((currentPage) => {
                    if (currentPage.id === pageId) {
                        return {
                            ...currentPage,
                            flatNodes: flatNodes,
                        };
                    } else {
                        return currentPage;
                    }
                }),
            },
        },
    };
}

export function updateDocumentPageRightChildrenAndFlatNodes(documentId: string, pageId: string, pageChildren: any[], flatNodes: Node[]) {
    globalState = {
        ...globalState,
        loadedDocuments: {
            ...globalState.loadedDocuments,
            [documentId]: {
                ...globalState.loadedDocuments[documentId],
                pages: globalState.loadedDocuments[documentId].pages.map((page) => {
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

export function setViewDiffs(viewDiffs: ViewDiffs) {
    globalState = { ...globalState, viewDiffs: viewDiffs };
}

export function setDocumentName(name: string) {
    globalState = { ...globalState, documentName: name };
}

export function sideToName(side: Side) {
    if (side == Side.LEFT) return "Left";
    else if (side == Side.RIGHT) return "Right";
}


