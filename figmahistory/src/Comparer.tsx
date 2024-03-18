import React, { ChangeEvent, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { User, Side, Color, Document, Version, Page, NodeWithImage, FigmaNode, Node, Difference, Rect, ViewDiffs, AppState } from './types';
import { globalState, setDocumentID, setAccessToken, setDocumentLeftId, setDocumentRightId, updateDocumentPageLeftChildrenAndFlatNodes, updateDocumentPageRightChildrenAndFlatNodes, setSelectedPageId, updateDocumentPageLeftFlatNodes, updateDocumentPageRightFlatNodes, updateDocumentPageRightBounds, updateDocumentPageLeftBounds, setSelectedNodeId, setViewDiffs, addLoadedDocument, updateDocumentPageIsLoaded, updateDocumentPageChildrenFlatNodesAndBackground, setHasMultipleVersionPages, setVersionPagesCount, sideToName, } from './globals';
import { ReactCompareSlider, ReactCompareSliderHandle, useReactCompareSliderRef } from 'react-compare-slider';
import isEqual from 'lodash/isEqual';
import Canvas from './Canvas';
import Select, { ActionMeta, ControlProps, DropdownIndicatorProps, ValueContainerProps, components } from 'react-select'
import { Tooltip as ReactTooltip } from "react-tooltip";
import { ReactSVG } from 'react-svg'
import List from './List';
import * as numberToWords from 'number-to-words';

interface ComparerProps {
    className: string;

    gotDocumentName: (parentDocumentName: string, name: string) => void;
    accessFailed: () => void;
    initialLoadComplete: () => void;
    onRegisterLicenseClick?: () => void;
}

export interface ComparerRef {
    fetchFigmaFiles: () => Promise<void>;
}

const Comparer: React.ForwardRefRenderFunction<ComparerRef, ComparerProps> = (props, ref) => {

    const rightImage = useRef<ReactZoomPanPinchRef>(null);
    const leftImage = useRef<ReactZoomPanPinchRef>(null);
    const canvasDiv = useRef<HTMLDivElement | null>(null);

    const sliderRef = useReactCompareSliderRef();


    const selectPrefix = "reactselect";

    const [isCompareModeOn, setIsCompareModeOn] = useState<boolean>(true);


    const [isLoadingLeftPage, setIsLoadingLeftPage] = useState<boolean>(true);
    const [isLoadingRightPage, setIsLoadingRightPage] = useState<boolean>(true);
    const [isLoadingLeftImages, setIsLoadingLeftImages] = useState<boolean>(true);
    const [isLoadingRightImages, setIsLoadingRightImages] = useState<boolean>(true);


    const [isTakingLongTime, setIsTakingLongTime] = useState<boolean>(false);



    // #region canvas drawing state variables 

    const [selectVersionLeftSelectedOption, setSelectVersionLeftSelectedOption] = useState<Version>();
    const [selectVersionRightSelectedOption, setSelectVersionRightSelectedOption] = useState<Version>();
    const [selectedVersionNameLeft, setSelectedVersionNameLeft] = useState<string>("");
    const [selectedVersionNameRight, setSelectedVersionNameRight] = useState<string>("");
    const [selectedPageColorLeft, setSelectedPageColorLeft] = useState<string>("#FFFFFF");
    const [selectedPageColorRight, setSelectedPageColorRight] = useState<string>("#FFFFFF");


    const [isLeftPageAvailable, setIsLeftPageAvailable] = useState<boolean>(true);
    const [isRightPageAvailable, setIsRightPageAvailable] = useState<boolean>(true);

    const [hasLeftPageContent, setHasLeftPageContent] = useState<boolean>(true);
    const [hasRightPageContent, setHasRightPageContent] = useState<boolean>(true);

    const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(true);
    const versionPagesLoaded = useRef<number>(0);


    const [pagesListVersionLeft, setPagesListVersionLeft] = useState<Page[]>();
    const [pagesListVersionRight, setPagesListVersionRight] = useState<Page[]>();
    const [mergedPagesList, setMergedPagesList] = useState<Page[]>();

    const [versionLeftNodesWithImages, setVersionLeftNodesWithImages] = useState<NodeWithImage[]>([]);
    const [versionRightNodesWithImages, setVersionRightNodesWithImages] = useState<NodeWithImage[]>([]);

    const [versionLeftDifferences, setVersionLeftDifferences] = useState<Difference[]>([]);
    const [versionRightDifferences, setVersionRightDifferences] = useState<Difference[]>([]);
    const [differencesTypes, setDifferencesTypes] = useState<string[]>(['FRAME', 'SECTION']);

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);
    const [canvasPageOffsetX, setCanvasPageOffsetX] = useState(0);
    const [canvasPageOffsetY, setCanvasPageOffsetY] = useState(0);
    const [canvasPadding, setCanvasPadding] = useState(100);

    const [fileVersionsList, setFileVersionsList] = useState<Version[]>([]);

    const [sliderPadding, setSliderPadding] = useState(50);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [canvasLeftWidth, setCanvasLeftWidth] = useState(0);
    const [canvasRightWidth, setCanvasRightWidth] = useState(0);



    const CustomOption = ({ innerProps, data }) => (
        <div {...innerProps} className='versionOption verticalLayout'>
            <div className="rowAuto primaryText">{data.label}</div>
            <div className="rowAuto secondaryText small">{data.created_at}</div>
            <div className="rowAuto alignVerticalCenter">
                <img src={data.user.img_url} />
                <span className='secondaryText small'>{data.user.handle}</span>
            </div>
        </div>
    );

    const DropdownIndicator = (
        props
    ) => {
        return (
            <components.DropdownIndicator {...props}>
                <ReactSVG src={globalState.urlPaths + "/images/chevronDown.svg"} />
            </components.DropdownIndicator>
        );
    };

    const ValueContainer = ({
        children,
        ...props
    }: ValueContainerProps<Version>) => {
        const { selectProps } = props;
        const selectedOption = selectProps.value;

        return (
            <components.ValueContainer {...props}>
                {(selectedOption && 'label' in selectedOption) ?
                    <div className='versionContainer'>
                        <div className='verticalLayout'>
                            <div className="rowAuto primaryText">{selectedOption.label}</div>
                            <div className="rowAuto secondaryText small">{selectedOption.created_at}</div>
                            <div className="rowAuto alignVerticalCenter">
                                <img src={selectedOption.user.img_url} alt="User Avatar" />
                                <span className='secondaryText small'>{selectedOption.user.handle}</span>
                            </div>
                        </div>
                        <div className="dummy-input-wrapper">
                            {children}
                        </div>
                    </div>
                    : <div className='versionContainer primaryText'>---</div>}
            </components.ValueContainer>
        )
        // }
    };


    const colourStyles = {
        control: styles => ({ ...styles, backgroundColor: '#ff00ff' }),
    };



    const customComponents = {
        Option: CustomOption,
        ValueContainer: ValueContainer,
        DropdownIndicator: DropdownIndicator
    };

    // #endregion


    // #region Fetching files, versions

    const formatDate = (inputDate) => {
        const date = new Date(inputDate);

        const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
        const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
        const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(date);
        const rawHour = date.getHours();
        const hour = (rawHour % 12 || 12).toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');

        return `${month} ${day}, ${year}, ${hour}.${minute} ${date.getHours() < 12 ? 'AM' : 'PM'}`;
    };

    async function getDocumentName(): Promise<string | null> {
        try {
            const response = await fetch('https://api.figma.com/v1/files/' + globalState.documentId + "?depth=1", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${globalState.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.name;
            }
            else
                return "";
        }
        catch (error) {
            console.error('Could not access document:', error);
            return null;
        }
    }

    async function getParentDocumentName(): Promise<string | null> {
        try {
            if (globalState.parentDocumentId) {
                const response = await fetch('https://api.figma.com/v1/files/' + globalState.parentDocumentId + "?depth=1", {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${globalState.accessToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.name;
                }
                else
                    return "";
            }
            return "";
        }
        catch (error) {
            console.error('Could not access document:', error);
            return null;
        }
    }

    async function fetchVersionList(): Promise<Version[]> {
        const versions: Version[] = [];

        async function fetchVersionListPage(url: string | undefined): Promise<void> {
            const versionsInPage: Version[] = [];
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${globalState.accessToken}` // Replace FigmaAPIKey with your actual access token
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    let fetchedVersionList = data.versions;
                    for (const version of fetchedVersionList) {
                        versionsInPage.push({
                            id: version.id,
                            created_at: formatDate(version.created_at),
                            label: version.label ? version.label : "Autosave",
                            description: version.description,
                            user: version.user,
                            value: version.id,
                        });
                    }
                    // console.log(data)
                    versions.push(...versionsInPage);

                    if (data.pagination && data.pagination.next_page) {
                        setHasMultipleVersionPages(true);
                        setVersionPagesCount(globalState.versionPagesCount + 1);
                        //Version load will be async.
                        fetchVersionListPage(data.pagination.next_page);
                    }

                    versionPagesLoaded.current++;
                    if (versionPagesLoaded.current >= globalState.versionPagesCount) {
                        setIsLoadingVersions(false);
                    }



                } else {
                    console.error(`Failed to fetch versions: ${response.statusText}`);
                }
            }
        }

        // Start fetching with the initial page (undefined for the first page)
        await fetchVersionListPage('https://api.figma.com/v1/files/' + globalState.documentId + "/versions");

        return versions;
    }

    const fetchFigmaFiles = async () => {

        const parentDocumentName: string | null = await getParentDocumentName();
        const documentName: string | null = await getDocumentName();
        if (documentName) {
            if (parentDocumentName != null)
                props.gotDocumentName(parentDocumentName, documentName);

            const allVersions: Version[] = await fetchVersionList();

            setFileVersionsList(allVersions);

            setViewDifferences();

            setSelectVersionLeftSelectedOption(allVersions[0]);
            setSelectedVersionNameLeft(allVersions[0].label);
            setSelectVersionRightSelectedOption(allVersions[1]);
            setSelectedVersionNameRight(allVersions[1].label);

            fetchDocumentVersion(allVersions[0].id, Side.LEFT);
            fetchDocumentVersion(allVersions[1].id, Side.RIGHT);
        }
        else {
            console.error("Apparently you don't have access to this document.")
            props.accessFailed();
        }

    };

    useImperativeHandle(ref, () => ({
        fetchFigmaFiles,
    }));

    function flattenNodes(node: FigmaNode): Node[] {
        let flatNodes: Node[] = [];

        function traverse(node: FigmaNode, includeNode: boolean, isChildOfFrame: boolean) {
            if (includeNode) {
                let pushNode: Node = {
                    nodeId: node.id,
                    figmaNode: node,
                    isPresentInOtherVersion: false,
                    isEqualToOtherVersion: false,
                    type: node.type,
                    isChildOfFrame: isChildOfFrame
                }
                flatNodes.push(pushNode);
            }

            if (node.children) {
                for (const child of node.children) {
                    traverse(child, true, (node.type == "FRAME")); // Recursively traverse child nodes
                }
            }
        }

        traverse(node, false, (node.type == "FRAME"));

        return flatNodes;
    }

    function getExistingPage(versionId: string, pageId: string) {
        const existingDocument = globalState.loadedDocuments[versionId];
        if (existingDocument) {
            const existingPage = existingDocument.pages.find(page => page.documentId == versionId && page.id == pageId);
            if (existingPage) return existingPage;
            else return null;
        }
        else return null;
    }

    async function fetchPage(versionId: string, pageId: string, side: Side) {

        let pageChildren: any[] = [];
        let pageFlatNodes: Node[] = [];
        let pageBackground: Color = { a: 1, r: 255, g: 255, b: 255 };

        const existingPage = getExistingPage(versionId, pageId);

        // if (existingPage)
        //     console.log("fetchPage " + sideToName(side) + ". existingPage is defined, " + (existingPage.isLoaded ? "and loaded" : "but not loaded yet"));
        // else
        //     console.log("fetchPage " + sideToName(side) + ". Page doesn't exist in document?")

        if (existingPage && existingPage.isLoaded) {
            // console.log("Should not load this page because was already loaded");

            pageChildren = existingPage.children;
            pageFlatNodes = existingPage.flatNodes;
            pageBackground = existingPage.backgroundColor;
            // console.log("Page was loaded from storage. children:" + pageChildren.length + " - flatNodes:" + pageFlatNodes.length + " - bgColor:" + pageBackground.r + " ," + pageBackground.g + " ," + pageBackground.b + " ," + pageBackground.a)

        }
        else {
            // console.log("Should load page because it hadn't been loaded yet.")

            // console.log("Fetching page:" + pageId + " for side:" + side.valueOf());
            let depth = "";
            // let depth = "&depth=2";

            let getPageNode = await fetch('https://api.figma.com/v1/files/' + globalState.documentId + "/nodes?version=" + versionId + depth + "&ids=" + pageId, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${globalState.accessToken}`
                }
            });

            if (getPageNode.ok) {
                const responseJson = await getPageNode.json();
                pageChildren = responseJson.nodes[pageId].document.children;
                pageFlatNodes = flattenNodes(responseJson.nodes[pageId].document);
                pageBackground = responseJson.nodes[pageId].document.backgroundColor;

                // console.log("Record fetched page. versionId:" + versionId + " pageId:" + pageId);

                updateDocumentPageIsLoaded(versionId, pageId, true);
                updateDocumentPageChildrenFlatNodesAndBackground(versionId, pageId, pageChildren, pageFlatNodes, pageBackground);
                // console.log("Page (for " + sideToName(side) + ") was fetched. children:" + pageChildren.length + " - flatNodes:" + pageFlatNodes.length + " - bgColor:" + pageBackground.r + " ," + pageBackground.g + " ," + pageBackground.b + " ," + pageBackground.a)
            }
        }




        // console.log("OK, Page is ready");
        // console.log(responseJson.nodes);
        // console.log(responseJson.nodes[pageId]);
        // console.log(responseJson.nodes[pageId].document);


        let minX = 0, minY = 0, maxX = 0, maxY = 0;
        for (const node of pageFlatNodes) {
            // console.log("Processing flatNodes dimensions.  node.figmaNode.absoluteBoundingBox is:" + node.figmaNode.absoluteBoundingBox);
            // console.log("--- node.figmaNode (id and name and type) are:" + node.nodeId + " - "+node.figmaNode.name + " - "+node.figmaNode.type);
            if (node.figmaNode.absoluteBoundingBox) {
                minX = Math.min(minX, node.figmaNode.absoluteBoundingBox.x);
                minY = Math.min(minY, node.figmaNode.absoluteBoundingBox.y);
                maxX = Math.max(maxX, +node.figmaNode.absoluteBoundingBox.x + node.figmaNode.absoluteBoundingBox.width);
                maxY = Math.max(maxY, node.figmaNode.absoluteBoundingBox.y + node.figmaNode.absoluteBoundingBox.height);
            }
        }

        let pageDimensions: Rect = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        }


        if (side == Side.LEFT) {
            updateDocumentPageLeftBounds(versionId, pageId, pageDimensions);
            updateDocumentPageLeftChildrenAndFlatNodes(versionId, pageId, pageChildren, pageFlatNodes);
        }
        else if (side == Side.RIGHT) {
            updateDocumentPageRightBounds(versionId, pageId, pageDimensions);
            updateDocumentPageRightChildrenAndFlatNodes(versionId, pageId, pageChildren, pageFlatNodes);
        }

    }



    function rgbaToString(color: Color) {
        return "rgba(" + Math.round(color.r * 255) + "," + Math.round(color.g * 255) + "," + Math.round(color.b * 255) + "," + Math.round(color.a) + ")";
    }

    async function fetchDocumentVersion(versionId: string, side: Side) {

        hideSide(side, true);

        // console.log("Fetching version:" + versionId + " for side:" + side.valueOf());
        // console.log("At this point, globalPageId is:" + globalState.selectedPageId);

        let versionDocument = globalState.loadedDocuments[versionId];

        if (!versionDocument) {
            // console.log("Need to fetch document")
            let depth = "&depth=1";

            let getPagesVersion = await fetch('https://api.figma.com/v1/files/' + globalState.documentId + "?version=" + versionId + depth, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${globalState.accessToken}`
                }
            })

            if (getPagesVersion.ok) {
                const responseJson = await getPagesVersion.json();

                let figmaDocumentPages: any[] = responseJson.document.children.filter((child: any) => child.type === 'CANVAS');

                let pages: Page[] = figmaDocumentPages.map((page: any, index: number) => {
                    return {
                        documentId: versionId,
                        id: page.id,
                        children: page.children,
                        name: page.name,
                        nameOtherVersion: "",
                        backgroundColor: page.backgroundColor,
                        presentInVersionLeft: side == Side.LEFT,
                        presentInVersionRight: side == Side.RIGHT,
                        flatNodes: [],
                        boundingRect: { x: 0, y: 0, width: 0, height: 0 },
                        isLoaded: false
                    };
                });

                versionDocument = {
                    name: responseJson.document.name,
                    version: versionId,
                    pages: pages,
                }

                addLoadedDocument(versionDocument)
            }
        }
        // else
        //     console.log("Document was already loaded")

        if (versionDocument) {
            if (side == Side.LEFT) {
                setDocumentLeftId(versionDocument.version);
                setPagesListVersionLeft(versionDocument.pages);
                setIsLoadingLeftPage(false);
                globalState.isDocumentLeftLoaded = true;
                if (globalState.isDocumentRightLoaded) props.initialLoadComplete();
            }
            if (side == Side.RIGHT) {
                setDocumentRightId(versionDocument.version);
                setPagesListVersionRight(versionDocument.pages);
                setIsLoadingRightPage(false);
                globalState.isDocumentRightLoaded = true;
                if (globalState.isDocumentLeftLoaded) props.initialLoadComplete();
            }

            if (!globalState.selectedPageId) {
                if (globalState.selectedNodeId) {
                    if (versionDocument.pages.some(page => page.id == globalState.selectedNodeId))
                        setSelectedPageId(globalState.selectedNodeId);
                    else
                        setSelectedPageId(versionDocument.pages[0].id);
                }
                else
                    setSelectedPageId(versionDocument.pages[0].id);
            }

            const mergedPageList = getBothDocumentVersionsMergedPagesList();

            setMergedPagesList(mergedPageList);

            if (versionDocument.pages.some(page => page.id == globalState.selectedPageId))
                drawPage(globalState.selectedPageId, side);
            else {
                if (side == Side.LEFT) setIsLeftPageAvailable(false);
                if (side == Side.RIGHT) setIsRightPageAvailable(false);
            }
        }
    }


    function getBothDocumentVersionsMergedPagesList() {
        const mergedPageList: Page[] = [];
        if (globalState.loadedDocuments[globalState.documentLeftId] && globalState.loadedDocuments[globalState.documentRightId]) {
            for (const leftPage of globalState.loadedDocuments[globalState.documentLeftId].pages) {
                const rightPage = globalState.loadedDocuments[globalState.documentRightId].pages.find(rightPage => rightPage.id == leftPage.id)
                if (rightPage) {
                    leftPage.presentInVersionRight = true;
                    leftPage.nameOtherVersion = rightPage.name;
                }
                else {
                    leftPage.presentInVersionRight = false;
                    leftPage.nameOtherVersion = "";
                }
                if (!mergedPageList.some(page => page.id == leftPage.id)) mergedPageList.push(leftPage);
            }
            for (const rightPage of globalState.loadedDocuments[globalState.documentRightId].pages) {
                const leftPage = globalState.loadedDocuments[globalState.documentLeftId].pages.find(leftPage => leftPage.id == rightPage.id)
                if (leftPage) {
                    rightPage.presentInVersionLeft = true;
                    rightPage.nameOtherVersion = leftPage.name;
                }
                else {
                    rightPage.presentInVersionLeft = false;
                    rightPage.nameOtherVersion = "";
                }
                if (!mergedPageList.some(page => page.id == rightPage.id)) mergedPageList.push(rightPage);
            }
        }

        return mergedPageList;
    }

    // #endregion

    // #region Draw pages


    function getPromisesForAllNodeIds(contentIds: string, versionId: string) {
        const chunkSize = 30;
        const contentIdsArray = contentIds.split(',');

        const fetchPromises: Promise<Response>[] = [];
        while (contentIdsArray.length > 0) {
            const chunk = contentIdsArray.splice(0, chunkSize);
            const queryString = chunk.join(',');
            const url = `https://api.figma.com/v1/images/${globalState.documentId}?ids=${queryString}&format=png&scale=1&version=${versionId}`;

            fetchPromises.push(
                fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${globalState.accessToken}`,
                    },
                })
            );
        }

        //console.log("getPromisesForAllNodeIds. In total this resulted in " + fetchPromises.length + " promises");

        return fetchPromises;
    }

    async function drawPage(pageId: string, side: Side) {

        let versionId = "";

        if (side == Side.LEFT) {
            versionId = globalState.documentLeftId;
        } else if (side == Side.RIGHT) {
            versionId = globalState.documentRightId;
        }

        const timeoutId = setTimeout(() => {
            setIsTakingLongTime(true);
        }, 5000);

        await fetchPage(versionId, pageId, side);

        clearTimeout(timeoutId);

        if (globalState.selectedPageId == pageId) {

            let page: Page | undefined = undefined;
            let leftPage = globalState.loadedDocuments[globalState.documentLeftId].pages.find(page => page.id === pageId);
            let rightPage = globalState.loadedDocuments[globalState.documentRightId].pages.find(page => page.id === pageId);

            if (side == Side.LEFT) {
                page = leftPage;
            } else if (side == Side.RIGHT) {
                page = rightPage;
            }

            if (leftPage && leftPage.isLoaded && rightPage && rightPage.isLoaded) {

                // console.log("Now that both pages are loaded we will try now to calculate differences btw both")
                // if (leftPage) {
                //     console.log("For reference, leftPage (" + leftPage?.id + ") is:")
                //     console.log(leftPage);
                // } else console.log("For reference, leftPage is undefined");
                // if (rightPage) {
                //     console.log("For reference, rightPage (" + rightPage?.id + ") is:")
                //     console.log(rightPage);
                // } else console.log("For reference, rightPage is undefined");

                calculateDifferences(leftPage, rightPage);

                let leftDifferences: Difference[] = [];
                for (const node of leftPage.flatNodes) {
                    if (!node.isEqualToOtherVersion || !node.isPresentInOtherVersion) {
                        leftDifferences.push({
                            type: node.type,
                            boundingRect: node.figmaNode.absoluteBoundingBox,
                            isChildOfFrame: node.isChildOfFrame
                        });
                    }
                }

                let rightDifferences: Difference[] = [];
                for (const node of rightPage.flatNodes) {
                    if (!node.isEqualToOtherVersion || !node.isPresentInOtherVersion) {
                        rightDifferences.push({
                            type: node.type,
                            boundingRect: node.figmaNode.absoluteBoundingBox,
                            isChildOfFrame: node.isChildOfFrame
                        });
                    }
                }

                // console.log("Differences:");
                // console.log("leftDifferences: " + leftDifferences.length);
                // console.log("rightDifferences: " + rightDifferences.length);

                setTimeout(() => {
                    setVersionLeftDifferences(leftDifferences);
                    setVersionRightDifferences(rightDifferences);
                }, 500);
            }


            if (page) {

                let allowedTypes = ['FRAME', 'SECTION', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'GROUP', 'FRAMEGROUP', 'TEXT', 'RECTANGLE', 'VECTOR', 'STAR', 'LINE', 'ELLIPSE', 'REGULAR_POLYGON', 'BOOLEAN_OPERATION'];

                // console.log("page:")
                // console.log(page);


                let newNodesWithImages = page.children
                    .filter((child: any) => allowedTypes.includes(child.type))
                    .map((child: any) => ({
                        id: child.id,
                        child: child,
                        imageUrl: ""
                    }));

                let contentIds: string = newNodesWithImages.map((node: NodeWithImage) => node.child.id).join(',');

                if (contentIds && contentIds != "") {
                    const fetchPromises = getPromisesForAllNodeIds(contentIds, versionId);

                    const responses = await Promise.all(fetchPromises);

                    const responseJsonArray = await Promise.all(responses.map(async (response) => {
                        if (response.ok) {
                            return await response.json();
                        } else {
                            throw new Error(`Error fetching data: ${response.statusText}`);
                        }
                    }));

                    let mapper: any = [];

                    const newNodesWithImagesArray = responseJsonArray.map((responseJson) => {
                        newNodesWithImages.forEach((nodeWithImage) => {
                            const imageUrl = responseJson.images[nodeWithImage.id];
                            if (imageUrl !== undefined) {
                                // Only push to mapper if there is a related image
                                mapper.push({
                                    id: nodeWithImage.id,
                                    child: nodeWithImage.child,
                                    imageUrl: imageUrl,
                                });
                            }
                        });
                    });


                    if (side == Side.LEFT) {
                        setVersionLeftNodesWithImages(mapper);
                        setSelectedPageColorLeft(leftPage ? rgbaToString(leftPage.backgroundColor) : "transparent");
                        setIsLeftPageAvailable(true);
                        setIsLoadingLeftPage(false);
                        setHasLeftPageContent(true);
                    }
                    else if (side == Side.RIGHT) {
                        setVersionRightNodesWithImages(mapper);
                        setSelectedPageColorRight(rightPage ? rgbaToString(rightPage.backgroundColor) : "transparent");
                        setIsRightPageAvailable(true);
                        setIsLoadingRightPage(false);
                        setHasRightPageContent(true);
                    }

                    setCanvasDimensionsAndOffset(pageId);
                }
            }
            else {
                if (side == Side.LEFT) {
                    setIsLeftPageAvailable(true);
                    setIsLoadingLeftPage(false);
                    setHasLeftPageContent(false);
                }
                else if (side == Side.RIGHT) {
                    setIsRightPageAvailable(true);
                    setIsLoadingRightPage(false);
                    setHasRightPageContent(false);
                }

                setCanvasDimensionsAndOffset(pageId);
            }
        } else {
            console.log("Not drawing page " + pageId + " because apparently now the selectedpage is " + globalState.selectedPageId);
        }
    }


    // #endregion



    function setCanvasDimensionsAndOffset(pageId: string) {
        let pageLeftBounds = globalState.loadedDocuments[globalState.documentLeftId].pages.find(page => page.id == pageId)?.boundingRect;
        let pageRightBounds = globalState.loadedDocuments[globalState.documentRightId].pages.find(page => page.id == pageId)?.boundingRect;


        // console.log("Trying to setCanvasDimensionsAndOffset.");
        // console.log("---pageLeftBounds is ");
        // console.log(pageLeftBounds);
        // console.log("---pageRightBounds is ");
        // console.log(pageRightBounds);

        let canvasMinX = 0;
        let canvasMinY = 0;
        let canvasMaxX = 1000;
        let canvasMaxY = 1000;
        let canvasWidth = 1000;
        let canvasHeight = 1000;
        let pageOffsetX = 0;
        let pageOffsetY = 0;

        if (pageLeftBounds && pageRightBounds) {
            canvasMinX = Math.min(pageLeftBounds.x, pageRightBounds.x);
            canvasMinY = Math.min(pageLeftBounds.y, pageRightBounds.y);
            canvasMaxX = Math.max((pageLeftBounds.x + pageLeftBounds.width), (pageRightBounds.x + pageRightBounds.width));
            canvasMaxY = Math.max((pageLeftBounds.y + pageLeftBounds.height), (pageRightBounds.y + pageRightBounds.height));
            canvasWidth = canvasMaxX - canvasMinX;
            canvasHeight = canvasMaxY - canvasMinY;
            pageOffsetX = canvasMinX;
            pageOffsetY = canvasMinY;
        } else if (pageLeftBounds) {
            canvasMinX = pageLeftBounds.x;
            canvasMinY = pageLeftBounds.y;
            canvasMaxX = (pageLeftBounds.x + pageLeftBounds.width);
            canvasMaxY = (pageLeftBounds.y + pageLeftBounds.height);
            canvasWidth = canvasMaxX - canvasMinX;
            canvasHeight = canvasMaxY - canvasMinY;
            pageOffsetX = canvasMinX;
            pageOffsetY = canvasMinY;
        } else if (pageRightBounds) {
            canvasMinX = pageRightBounds.x;
            canvasMinY = pageRightBounds.y;
            canvasMaxX = (pageRightBounds.x + pageRightBounds.width);
            canvasMaxY = (pageRightBounds.y + pageRightBounds.height);
            canvasWidth = canvasMaxX - canvasMinX;
            canvasHeight = canvasMaxY - canvasMinY;
            pageOffsetX = canvasMinX;
            pageOffsetY = canvasMinY;
        }

        setCanvasWidth(canvasWidth);
        setCanvasHeight(canvasHeight);
        setCanvasPageOffsetX(pageOffsetX);
        setCanvasPageOffsetY(pageOffsetY);

        //Fit into view
        const topFactor = 40;
        if (canvasDiv.current) {
            let scaleX = (canvasDiv.current.clientWidth - canvasPadding) / canvasWidth;
            let scaleY = (canvasDiv.current.clientHeight - canvasPadding - topFactor) / canvasHeight;
            let availableWidth = canvasDiv.current.clientWidth;

            if (!isCompareModeOn) {
                availableWidth = availableWidth / 2;
                scaleX = scaleX / 2;
            }

            let offsetX = (availableWidth) / 2 - (canvasWidth * Math.min(scaleX, scaleY)) / 2;
            let offsetY = (canvasDiv.current.clientHeight) / 2 - (canvasHeight * Math.min(scaleX, scaleY)) / 2;

            (rightImage.current as any).setTransform(offsetX, offsetY + topFactor, Math.min(scaleX, scaleY), 0);
            (leftImage.current as any).setTransform(offsetX, offsetY + topFactor, Math.min(scaleX, scaleY), 0);
        }
    }

    function fitIntoView() {
        const topFactor = 40;
        if (canvasDiv.current) {
            let scaleX = (canvasDiv.current.clientWidth - canvasPadding) / canvasWidth;
            let scaleY = (canvasDiv.current.clientHeight - canvasPadding - topFactor) / canvasHeight;
            let availableWidth = canvasDiv.current.clientWidth;

            if (!isCompareModeOn) {
                availableWidth = availableWidth / 2;
                scaleX = scaleX / 2;
            }

            let offsetX = (availableWidth) / 2 - (canvasWidth * Math.min(scaleX, scaleY)) / 2;
            let offsetY = (canvasDiv.current.clientHeight) / 2 - (canvasHeight * Math.min(scaleX, scaleY)) / 2;

            (rightImage.current as any).setTransform(offsetX, offsetY + topFactor, Math.min(scaleX, scaleY), 0);
            (leftImage.current as any).setTransform(offsetX, offsetY + topFactor, Math.min(scaleX, scaleY), 0);
        }
    }

    function calculateDifferences(leftPage: Page, rightPage: Page) {

        let pageLeftNodes = leftPage.flatNodes;
        let pageRightNodes = rightPage.flatNodes;

        // console.log("--- CalculateDifferences. leftPage.isLoaded:" + leftPage.isLoaded + ". rightPage.isLoaded:" + rightPage.isLoaded)
        // console.log("--- CalculateDifferences. pageLeftNodes:" + pageLeftNodes?.length + ". pageRightNodes:" + pageRightNodes?.length)

        if (pageLeftNodes && pageLeftNodes.length > 0 && pageRightNodes && pageRightNodes.length > 0) {

            const newDocumentLeftFlatNodes = getPageComparison(pageLeftNodes, pageRightNodes);
            const newDocumentRightFlatNodes = getPageComparison(pageRightNodes, pageLeftNodes);

            leftPage.flatNodes = newDocumentLeftFlatNodes;
            updateDocumentPageLeftFlatNodes(leftPage.documentId, leftPage.id, newDocumentLeftFlatNodes);

            rightPage.flatNodes = newDocumentRightFlatNodes;
            updateDocumentPageRightFlatNodes(rightPage.documentId, rightPage.id, newDocumentRightFlatNodes);


            // console.log("------ Found " + newDocumentLeftFlatNodes.filter(node => node.isEqualToOtherVersion == false || node.isPresentInOtherVersion == false).length + " differences on LEFT");
            // console.log("------ Found " + newDocumentRightFlatNodes.filter(node => node.isEqualToOtherVersion == false || node.isPresentInOtherVersion == false).length + " differences on RIGHT");
        }


    }

    function getPageComparison(array1FlatNodes: Node[], array2FlatNodes: Node[]) {
        let newDocumentFlatNodes: Node[] = [];

        for (const node1 of array1FlatNodes) {
            let isPresentInOtherVersion = false;
            let isEqualToOtherVersion = false;

            const correspondingNode2 = array2FlatNodes.find(node2 => node1.nodeId === node2.nodeId);

            if (correspondingNode2) {
                isPresentInOtherVersion = true;
                isEqualToOtherVersion = (node1.nodeId === correspondingNode2.nodeId && isEqual(node1.figmaNode, correspondingNode2.figmaNode));
            } else {
                isPresentInOtherVersion = false;
            }

            newDocumentFlatNodes.push({
                nodeId: node1.nodeId,
                isPresentInOtherVersion: isPresentInOtherVersion,
                isEqualToOtherVersion: isEqualToOtherVersion,
                type: node1.type + ((node1.type == "FRAME" && node1.isChildOfFrame) ? "GROUP" : ""),
                figmaNode: node1.figmaNode,
                isChildOfFrame: node1.isChildOfFrame
            });
        }

        return newDocumentFlatNodes;
    }




    // #region UI drawing

    function handleTransform(ref: ReactZoomPanPinchRef, state: { scale: number; positionX: number; positionY: number; }): void {

        if (leftImage.current) {
            if (!(leftImage.current.instance.transformState.positionX == ref.state.positionX && leftImage.current.instance.transformState.positionY == ref.state.positionY && leftImage.current.instance.transformState.scale == ref.state.scale))
                (leftImage.current as any).setTransform(ref.state.positionX, ref.state.positionY, ref.state.scale, 0);
        }

        if (rightImage.current) {
            if (!(rightImage.current.instance.transformState.positionX == ref.state.positionX && rightImage.current.instance.transformState.positionY == ref.state.positionY && rightImage.current.instance.transformState.scale == ref.state.scale))
                (rightImage.current as any).setTransform(ref.state.positionX, ref.state.positionY, ref.state.scale, 0);
        }
    }

    // #endregion

    function onDifferenceTypesChanged(event: ChangeEvent<HTMLInputElement>): void {
        const { value, checked } = event.target;

        setDifferencesTypes((prevSelectedTypes) => {
            if (checked) {
                return [...prevSelectedTypes, value];
            } else {
                return prevSelectedTypes.filter((type) => type !== value);
            }
        });
    }

    function onSliderPositionChange(position: number): void {
        if (canvasDiv.current) {
            let sliderPaddingPercentage = (sliderPadding / canvasDiv.current.clientWidth) * 100;

            if ((position > sliderPaddingPercentage) && (position < (100 - sliderPaddingPercentage))) {
                setSliderPosition(position)
                setCanvasLeftWidth((position / 100) * canvasDiv.current.clientWidth);
                setCanvasRightWidth((1 - (position / 100)) * canvasDiv.current.clientWidth);
            }
        }
    }

    function canvasLeftAllImagesLoaded(): void {
        setIsLoadingLeftImages(false);
    }

    function canvasRightAllImagesLoaded(): void {
        setIsLoadingRightImages(false);
    }

    function onVersion1Changed(newValue: any, actionMeta: ActionMeta<any>): void {
        // console.log("Changed left version");
        setSelectVersionLeftSelectedOption(newValue);
        fetchDocumentVersion(newValue.id, Side.LEFT);
    }

    function onVersion2Changed(newValue: any, actionMeta: ActionMeta<any>): void {
        // console.log("Changed right version");
        setSelectVersionRightSelectedOption(newValue);
        fetchDocumentVersion(newValue.id, Side.RIGHT);
    }

    function setViewDifferences() {
        let newDifferences: string[] = [];
        if (globalState.viewDiffs.showSections) newDifferences.push("SECTION");
        if (globalState.viewDiffs.showFrames) newDifferences.push("FRAME");
        if (globalState.viewDiffs.showComponents) newDifferences.push("COMPONENT", "COMPONENT_SET");
        if (globalState.viewDiffs.showInstances) newDifferences.push("INSTANCE");
        if (globalState.viewDiffs.showGroups) newDifferences.push("GROUP", "FRAMEGROUP");
        if (globalState.viewDiffs.showText) newDifferences.push("TEXT");
        if (globalState.viewDiffs.showShapes) newDifferences.push("RECTANGLE", "VECTOR", "STAR", "LINE", "ELLIPSE", "REGULAR_POLYGON");

        setDifferencesTypes(newDifferences);
    }


    useEffect(() => {
        fitIntoView();
    }, [isCompareModeOn]);

    function setViewMode(type: string): void {
        switch (type) {
            case 'compare':
                setIsCompareModeOn(true);
                sliderRef.current.setPosition(50);
                break;
            case 'sidebyside':
                setIsCompareModeOn(false);
                sliderRef.current.setPosition(50);
                break;
        }
    }

    function onDiffChange(type: string): void {

        switch (type) {
            case 'sections':
                globalState.viewDiffs.showSections = !globalState.viewDiffs.showSections;
                break;
            case 'frames':
                globalState.viewDiffs.showFrames = !globalState.viewDiffs.showFrames;
                break;
            case 'components':
                globalState.viewDiffs.showComponents = !globalState.viewDiffs.showComponents;
                break;
            case 'instances':
                globalState.viewDiffs.showInstances = !globalState.viewDiffs.showInstances;
                break;
            case 'groups':
                globalState.viewDiffs.showGroups = !globalState.viewDiffs.showGroups;
                break;
            case 'text':
                globalState.viewDiffs.showText = !globalState.viewDiffs.showText;
                break;
            case 'shapes':
                globalState.viewDiffs.showShapes = !globalState.viewDiffs.showShapes;
                break;
        }
        setViewDifferences();
    }


    function hideSide(side: Side, resetIsDocumentLoaded: boolean) {
        if (side == Side.LEFT) {

            setHasLeftPageContent(true);
            setIsLoadingLeftPage(true);
            setIsLoadingLeftImages(true);
            if (resetIsDocumentLoaded)
                globalState.isDocumentLeftLoaded = false;

            setTimeout(() => {
                setVersionLeftNodesWithImages([]);
                setVersionLeftDifferences([]);
                setSelectedPageColorLeft("transparent");
            }, 500)

        }
        if (side == Side.RIGHT) {
            setHasRightPageContent(true);
            setIsLoadingRightPage(true);
            setIsLoadingRightImages(true);
            if (resetIsDocumentLoaded)
                globalState.isDocumentRightLoaded = false;

            setTimeout(() => {
                setVersionRightNodesWithImages([]);
                setVersionRightDifferences([]);
                setSelectedPageColorRight("transparent");
            }, 500)
        }
    }



    function onPageSelectionChange(page: Page): void {
        // console.log("Page changed. New page is:" + page.name);

        setSelectedPageId(page.id);

        hideSide(Side.LEFT, false);
        hideSide(Side.RIGHT, false);

        if (page.presentInVersionLeft) {
            setIsLeftPageAvailable(true);
            drawPage(page.id, Side.LEFT);
        }
        else
            setIsLeftPageAvailable(false);

        if (page.presentInVersionRight) {
            setIsRightPageAvailable(true);
            drawPage(page.id, Side.RIGHT);
        }
        else
            setIsRightPageAvailable(false);
    }

    function registerLicense(): void {
        if (props.onRegisterLicenseClick)
            props.onRegisterLicenseClick();
    }

    // #endregion

    return (
        <div className={`comparer rowAvailable horizontalLayout ${props.className}`}>
            <div className={`colAuto sidePanel ${pagesListVersionLeft && pagesListVersionRight ? '' : 'collapsed'}`}>
                <div className="verticalLayout sidePanelContent">
                    <div className="logo">
                        <ReactSVG src={globalState.urlPaths + '/images/logo.svg'} renumerateIRIElements={false} />
                    </div>
                    <div className={`rowAuto title ${globalState.parentDocumentName ? 'hasSubtitle' : ''}`}>
                        {globalState.parentDocumentName ? globalState.parentDocumentName : globalState.documentName}
                    </div>
                    <div className={`rowAuto subtitle ${!globalState.parentDocumentName ? 'notDisplayed' : ''}`}>
                        {globalState.documentName}
                    </div>

                    <div className="rowAuto header">
                        Pages
                    </div>

                    <List pageList={mergedPagesList} selectedVersionNameLeft={selectedVersionNameLeft} selectedVersionNameRight={selectedVersionNameRight} selectedItemId={globalState.selectedPageId} onSelectionChange={(selectedItem) => onPageSelectionChange(selectedItem)} />

                    {(globalState.appState == AppState.TRIAL_ACTIVE) ? (
                        <div className="rowAuto trialMessage">
                            <div className="secondaryText">You still have {globalState.appTrialDaysLeft} days of <br />trial sunshine left. Enjoy! ☀️</div>
                            <a href="https://oodesign.gumroad.com/l/figmahistory?option=x8JwFOfp2eKY-GgXKSg2aA%3D%3D&_gl=1*1xpb5kb*_ga*MTUwNTk1MDE5OS4xNjc4MTAzNjAz*_ga_6LJN6D94N6*MTcwODMyNDE5OC44NC4wLjE3MDgzMjQyMDIuMC4wLjA." target="_blank">
                                <button className='btnPrimary'>Get Figma history</button>
                            </a>
                            <button className='btnSecondary' onClick={registerLicense}>I already have a license</button>
                        </div>
                    ) : ""}
                </div>
            </div>
            <div className='colAvailable verticalLayout'>
                <div ref={canvasDiv} className="rowAvailable">
                    <ReactCompareSlider ref={sliderRef} className='extend' onPositionChange={onSliderPositionChange} boundsPadding={sliderPadding} onlyHandleDraggable={true} disabled={!isCompareModeOn}
                        handle={
                            <ReactCompareSliderHandle className={`${isCompareModeOn ? "compareHandle" : "sidebysideHandle"}`} buttonStyle={{ display: `${isCompareModeOn ? "grid" : "none"}` }}
                                linesStyle={{ boxShadow: `${isCompareModeOn ? true : undefined}`, cursor: `${isCompareModeOn ? "ew-resize" : "default"}` }}
                            />}
                        itemOne={
                            <TransformWrapper ref={leftImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
                                <TransformComponent wrapperClass='verticalLayout dotted' contentClass='verticalLayout'>
                                    <Canvas name='LEFT' allImagesLoaded={canvasLeftAllImagesLoaded} nodesWithImages={versionLeftNodesWithImages} differences={versionLeftDifferences} differenceTypes={differencesTypes} canvasWidth={canvasWidth} canvasHeight={canvasHeight} offsetX={canvasPageOffsetX} offsetY={canvasPageOffsetY} background={selectedPageColorLeft} containerClass={`innerCanvas animatedDiv invisible ${isLoadingLeftPage ? 'fadeOut' : 'fadeIn'}`} />
                                </TransformComponent>


                                <div className={`animatedDiv invisible noPointerEvents ${((isLoadingLeftImages || isLoadingLeftPage) && isLeftPageAvailable && hasLeftPageContent) ? 'fadeIn' : 'fadeOut'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div id="indeterminateLoader" className="verticalLayout alignFullCenterAndCenterText indeterminateLoader show">
                                        <div className="dualRingLoader"></div>
                                        {/* <div className="loaderMessage">
                                            Loading from Figma - {isLoadingLeftImages ? "loadingLeftImages" : "notLoadingLeftImages"} - {isLoadingLeftPage ? "loadingLeftPage" : "notLoadingLeftPage"}
                                        </div> */}
                                    </div>
                                </div>

                                <div className={`animatedDiv invisible ${isLeftPageAvailable ? 'fadeOut' : 'fadeIn'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div className='verticalLayout alignFullCenterAndCenterText secondaryText'>
                                        This page is not available in this version
                                    </div>
                                </div>

                                <div className={`animatedDiv invisible ${hasLeftPageContent ? 'fadeOut' : 'fadeIn'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div className='verticalLayout alignFullCenterAndCenterText secondaryText'>
                                        This page is empty
                                    </div>
                                </div>

                                <div className="alignFullCenter" style={{
                                    position: 'absolute',
                                    width: `${canvasLeftWidth}px`,
                                    top: '24px',
                                }}>
                                    <div className="canvasVersionOverlay">
                                        <Select className='select' isLoading={isLoadingVersions} classNamePrefix={selectPrefix} options={fileVersionsList} isMulti={false} unstyled components={customComponents} isSearchable={false} onChange={onVersion1Changed} value={selectVersionLeftSelectedOption} />
                                    </div>
                                </div>
                            </TransformWrapper>
                        }
                        itemTwo={
                            <TransformWrapper ref={rightImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
                                <TransformComponent wrapperClass={`verticalLayout dotted ${!isCompareModeOn ? 'comparePadded' : ''}`} contentClass='verticalLayout'>
                                    <Canvas name='RIGHT' allImagesLoaded={canvasRightAllImagesLoaded} nodesWithImages={versionRightNodesWithImages} differences={versionRightDifferences} differenceTypes={differencesTypes} canvasWidth={canvasWidth} canvasHeight={canvasHeight} offsetX={canvasPageOffsetX} offsetY={canvasPageOffsetY} background={selectedPageColorRight} containerClass={`innerCanvas animatedDiv invisible ${isLoadingRightPage ? 'fadeOut' : 'fadeIn'}`} />
                                </TransformComponent>

                                <div className={`animatedDiv invisible noPointerEvents ${((isLoadingRightImages || isLoadingRightPage) && isRightPageAvailable && hasRightPageContent) ? 'fadeIn' : 'fadeOut'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasRightWidth}px`,
                                    left: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div id="indeterminateLoader" className="verticalLayout alignFullCenterAndCenterText indeterminateLoader show">
                                        <div className="dualRingLoader"></div>
                                        {/* <div className="loaderMessage">
                                            Loading from Figma - {isLoadingRightImages ? "loadingRightImages" : "notLoadingRightImages"} - {isLoadingRightPage ? "loadingRightPage" : "notLoadingRightPage"}
                                        </div> */}
                                    </div>
                                </div>

                                <div className={`animatedDiv invisible ${isRightPageAvailable ? 'fadeOut' : 'fadeIn'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasRightWidth}px`,
                                    left: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div className='verticalLayout alignFullCenterAndCenterText secondaryText'>
                                        This page is not available in the this version
                                    </div>
                                </div>
                                <div className={`animatedDiv invisible ${hasRightPageContent ? 'fadeOut' : 'fadeIn'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasRightWidth}px`,
                                    left: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div className='verticalLayout alignFullCenterAndCenterText secondaryText'>
                                        This page is empty
                                    </div>
                                </div>

                                <div className="alignFullCenter" style={{
                                    position: 'absolute',
                                    width: `${canvasRightWidth}px`,
                                    left: `${canvasLeftWidth}px`,
                                    top: '24px'
                                }}>
                                    <div className="canvasVersionOverlay">
                                        <Select className='select' isLoading={isLoadingVersions} classNamePrefix={selectPrefix} options={fileVersionsList} isMulti={false} unstyled components={customComponents} isSearchable={false} onChange={onVersion2Changed} value={selectVersionRightSelectedOption} />
                                    </div>
                                </div>


                            </TransformWrapper>
                        }
                    />
                    <div className={`bigFilesDisclaimer animatedDiv ${isTakingLongTime ? 'fadeIn' : 'fadeOut'}`}>
                        Pages with a lot of elements my take a while to load and render properly.<br />We're on it, but we apologize if this feels a bit sluggish these days 🙏.
                    </div>
                </div>
                <div className='rowAuto bottomBar'>

                    <div className="horizontalLayout leftElements">
                        <button className={`colAuto btnSecondary viewOption ${isCompareModeOn ? 'checked' : ''}`} onClick={() => setViewMode('compare')}>Compare</button>
                        <button className={`colAuto btnSecondary viewOption ${!isCompareModeOn ? 'checked' : ''}`} onClick={() => setViewMode('sidebyside')}>Side by side</button>
                    </div>



                    <button className='btnSecondary alignHorizontalCenter centerElements' onClick={fitIntoView}>Fit into view</button>


                    <div className="horizontalLayout rightElements">
                        <span className="colAuto secondaryText alignVerticalCenter">
                            Show changes in
                        </span>
                        <button className={`colAuto btnSecondary iconButton ${globalState.viewDiffs.showSections ? 'checked' : ''}`} onClick={() => onDiffChange('sections')} data-tooltip-id="showDiffSectionsTooltip">
                            <ReactSVG src={globalState.urlPaths + "/images/sectionIcon.svg"} />
                        </button>
                        <button className={`colAuto btnSecondary iconButton ${globalState.viewDiffs.showFrames ? 'checked' : ''}`} onClick={() => onDiffChange('frames')} data-tooltip-id="showDiffFramesTooltip">
                            <ReactSVG src={globalState.urlPaths + "/images/frameIcon.svg"} />
                        </button>
                        <button className={`colAuto btnSecondary iconButton ${globalState.viewDiffs.showComponents ? 'checked' : ''}`} onClick={() => onDiffChange('components')} data-tooltip-id="showDiffComponentsTooltip">
                            <ReactSVG src={globalState.urlPaths + "/images/componentIcon.svg"} />
                        </button>
                        <button className={`colAuto btnSecondary iconButton ${globalState.viewDiffs.showInstances ? 'checked' : ''}`} onClick={() => onDiffChange('instances')} data-tooltip-id="showDiffInstancesTooltip">
                            <ReactSVG src={globalState.urlPaths + "/images/instanceIcon.svg"} />
                        </button>
                        <button className={`colAuto btnSecondary iconButton ${globalState.viewDiffs.showGroups ? 'checked' : ''}`} onClick={() => onDiffChange('groups')} data-tooltip-id="showDiffGroupsTooltip">
                            <ReactSVG src={globalState.urlPaths + "/images/groupIcon.svg"} />
                        </button>
                        <button className={`colAuto btnSecondary iconButton ${globalState.viewDiffs.showText ? 'checked' : ''}`} onClick={() => onDiffChange('text')} data-tooltip-id="showDiffTextTooltip">
                            <ReactSVG src={globalState.urlPaths + "/images/textIcon.svg"} />
                        </button>
                        <button className={`colAuto btnSecondary iconButton ${globalState.viewDiffs.showShapes ? 'checked' : ''}`} onClick={() => onDiffChange('shapes')} data-tooltip-id="showDiffShapesTooltip">
                            <ReactSVG src={globalState.urlPaths + "/images/shapesIcon.svg"} />
                        </button>
                    </div>

                    <ReactTooltip id="showDiffSectionsTooltip" place="top" content="Sections" />
                    <ReactTooltip id="showDiffFramesTooltip" place="top" content="Frames" />
                    <ReactTooltip id="showDiffComponentsTooltip" place="top" content="Components" />
                    <ReactTooltip id="showDiffInstancesTooltip" place="top" content="Instances" />
                    <ReactTooltip id="showDiffGroupsTooltip" place="top" content="Groups" />
                    <ReactTooltip id="showDiffTextTooltip" place="top" content="Text" />
                    <ReactTooltip id="showDiffShapesTooltip" place="top" content="Shapes" />
                </div>
            </div>

        </div >
    );
};


export default React.forwardRef(Comparer);

