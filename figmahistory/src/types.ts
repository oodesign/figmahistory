
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
    children: any[];
    pages: any[];
    flatNodes: Node[];
}

export interface Page {
    id: string;
    children: any[];
    name: string;
    nameOtherVersion: string;
    backgroundColor: Color;
    presentInVersionLeft: boolean
    presentInVersionRight: boolean
}

export interface Version {
    id: string;
    created_at: string;
    label: string;
    description: string;
    user: User;
};

export interface NodeWithImage {
    id: string,
    child: any;
    imageUrl: string;
}

export interface FigmaNode {
    id: string
    children?: FigmaNode[];
}

export interface Node {
    nodeId: string
    isPresentInOtherVersion: boolean
    isEqualToOtherVersion: boolean
    figmaNode: FigmaNode;
}