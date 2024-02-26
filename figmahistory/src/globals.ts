// globals.ts

import { Timestamp } from 'firebase/firestore';
import { User, Side, Color, Document, Version, Page, FigmaNode, Node, Rect, ViewDiffs, AppState } from './types';

export interface GlobalState {
    documentId: string;
    documentName: string;
    accessToken: string;
    documentLeft: Document;
    documentRight: Document;
    selectedPageId: string;
    selectedNodeId: string;
    isDocumentLeftLoaded: boolean;
    isDocumentRightLoaded: boolean;
    user: User;
    viewDiffs: ViewDiffs;
    hasMultipleVersionPages: boolean;
    versionPagesCount: number;
    loadedDocuments: Document[];
    appState: AppState;
    appTrialDaysLeft: number;
}

export let globalState: GlobalState = {
    documentId: "",
    documentName: "",
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
    loadedDocuments: [],
    appState: AppState.NOT_REGISTERED,
    appTrialDaysLeft: 0
};

export function setDocumentID(id: string) {
    globalState = { ...globalState, documentId: id };
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

export function setDocumentLeft(doc: Document) {
    globalState = { ...globalState, documentLeft: doc };
}

export function addLoadedDocument(doc: Document) {
    globalState = {
        ...globalState,
        loadedDocuments: [...globalState.loadedDocuments, doc],
    };
}

export function setHasMultipleVersionPages(hasMultipleVersionPages: boolean) {
    globalState = { ...globalState, hasMultipleVersionPages: hasMultipleVersionPages };
}

export function setVersionPagesCount(versionPagesCount: number) {
    globalState = { ...globalState, versionPagesCount: versionPagesCount };
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
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === globalState.documentLeft.version) {
                return {
                    ...document,
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
                };
            }
            return document;
        }),
    };
}



export function updateDocumentPageIsLoaded(documentId: string, pageId: string, isLoaded: boolean) {
    globalState = {
        ...globalState,
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === documentId) {
                return {
                    ...document,
                    pages: document.pages.map(page => {
                        if (page.id === pageId) {
                            return {
                                ...page,
                                isLoaded: isLoaded,
                            };
                        }
                        return page;
                    }),
                };
            }
            return document;
        }),
        documentLeft: {
            ...globalState.documentLeft,
            ...(globalState.documentLeft.version === documentId && {
                pages: globalState.documentLeft.pages.map((page) => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            isLoaded: isLoaded,
                        };
                    } else {
                        return page;
                    }
                }),
            }),
        },
        documentRight: {
            ...globalState.documentRight,
            ...(globalState.documentRight.version === documentId && {
                pages: globalState.documentRight.pages.map((page) => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            isLoaded: isLoaded,
                        };
                    } else {
                        return page;
                    }
                }),
            }),
        },
    };
}

export function updateDocumentPageChildrenFlatNodesAndBackground(documentId: string, pageId: string, pageChildren: any[], flatNodes: Node[], backgroundColor: Color) {
    globalState = {
        ...globalState,
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === documentId) {
                return {
                    ...document,
                    pages: document.pages.map(page => {
                        if (page.id === pageId) {
                            return {
                                ...page,
                                children: pageChildren,
                                flatNodes: flatNodes,
                                backgroundColor: backgroundColor,
                            };
                        }
                        return page;
                    }),
                };
            }
            return document;
        }),
        documentLeft: {
            ...globalState.documentLeft,
            ...(globalState.documentLeft.version === documentId && {
                pages: globalState.documentLeft.pages.map((page) => {
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
            }),
        },
        documentRight: {
            ...globalState.documentRight,
            ...(globalState.documentRight.version === documentId && {
                pages: globalState.documentRight.pages.map((page) => {
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
            }),
        },
    };
}


export function updateDocumentPageLeftFlatNodes(page: Page, flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentLeft: {
            ...globalState.documentLeft,
            pages: globalState.documentLeft.pages.map((currentPage) => {
                if (currentPage.id === page.id) {
                    return {
                        ...currentPage,
                        flatNodes: flatNodes,
                    };
                } else {
                    return page;
                }
            }),
        },
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === globalState.documentLeft.version) {
                return {
                    ...document,
                    pages: globalState.documentLeft.pages.map((currentPage) => {
                        return {
                            ...currentPage,
                            flatNodes: flatNodes,
                        };
                    }),
                };
            }
            return document;
        }),
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
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === globalState.documentLeft.version) {
                return {
                    ...document,
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
                };
            }
            return document;
        }),
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
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === globalState.documentRight.version) {
                return {
                    ...document,
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
                };
            }
            return document;
        }),
    };
}

export function updateDocumentPageRightFlatNodes(page: Page, flatNodes: Node[]) {
    globalState = {
        ...globalState,
        documentRight: {
            ...globalState.documentRight,
            pages: globalState.documentRight.pages.map((currentPage) => {
                return {
                    ...currentPage,
                    flatNodes: flatNodes,
                };
            }),
        },
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === globalState.documentRight.version) {
                return {
                    ...document,
                    pages: globalState.documentRight.pages.map((currentPage) => {
                        if (currentPage.id === page.id) {
                            return {
                                ...currentPage,
                                flatNodes: flatNodes,
                            };
                        } else {
                            return page;
                        }
                    }),
                };
            }
            return document;
        }),
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
        loadedDocuments: globalState.loadedDocuments.map(document => {
            if (document.version === globalState.documentRight.version) {
                return {
                    ...document,
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
                };
            }
            return document;
        }),
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


