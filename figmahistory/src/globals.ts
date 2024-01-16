// globals.ts

export interface GlobalState {
    documentId: string;
    accessToken: string;
}

export let globalState: GlobalState = {
    documentId: "",
    accessToken: "",
};

export function setDocumentID(id: string) {
    globalState = { ...globalState, documentId: id };
}

export function setAccessToken(token: string) {
    globalState = { ...globalState, accessToken: token };
}

