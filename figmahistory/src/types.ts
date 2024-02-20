import { Timestamp } from 'firebase/firestore';

export interface User {
    id: string;
    handle: string;
    img_url: string;
    email: string;
};

export enum Side {
    LEFT = 0,
    RIGHT = 1
}

export interface Color {
    a: number;
    r: number;
    g: number;
    b: number;
}

export interface Document {
    name: string;
    version: string;
    pages: Page[];
}

export interface Page {
    documentId: string,
    id: string;
    children: any[];
    name: string;
    nameOtherVersion: string;
    backgroundColor: Color;
    presentInVersionLeft: boolean;
    presentInVersionRight: boolean;
    flatNodes: Node[];
    boundingRect: Rect;
    isLoaded: boolean
}

export interface Version {
    id: string;
    created_at: string;
    label: string;
    description: string;
    user: User;
    value: string;
};

export interface NodeWithImage {
    id: string;
    child: any;
    imageUrl: string;
}

export interface FigmaNode {
    id: string;
    name: string;
    children?: FigmaNode[];
    absoluteBoundingBox?: any;
    type?: any;
}

export interface Node {
    nodeId: string;
    isPresentInOtherVersion: boolean;
    isEqualToOtherVersion: boolean;
    figmaNode: FigmaNode;
    type?: any;
    isChildOfFrame: boolean;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Difference {
    type: string;
    boundingRect: Rect;
    isChildOfFrame: boolean;
}

export interface ViewDiffs {
    showSections: boolean;
    showFrames: boolean;
    showComponents: boolean;
    showInstances: boolean;
    showGroups: boolean;
    showText: boolean;
    showShapes: boolean;
}


export enum AppState {
    NOT_REGISTERED,
    TRIAL_EXPIRED,
    TRIAL_ACTIVE,
    ACTIVE,
    LICENSE_DISABLED
}

export enum LicenseOverlayMode{
    TRIAL_EXPIRED,
    INPUT_LICENSE_KEY
}


export interface AppResponse {
    state: AppState,
    user: User | undefined,
    token: string,
    trialDaysLeft: number
}