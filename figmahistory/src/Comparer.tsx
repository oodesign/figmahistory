import React, { ChangeEvent, useImperativeHandle, useRef, useState } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { User, Side, Color, Document, Version, Page, NodeWithImage, FigmaNode, Node, Difference, Rect } from './types';
import { globalState, setDocumentID, setAccessToken, setDocumentLeft, setDocumentRight, updateDocumentPageLeftChildrenAndFlatNodes, updateDocumentPageRightChildrenAndFlatNodes, setSelectedPageId, updateDocumentPageLeftFlatNodes, updateDocumentPageRightFlatNodes, updateDocumentPageRightBounds, updateDocumentPageLeftBounds, setSelectedNodeId, } from './globals';
import { ReactCompareSlider } from 'react-compare-slider';
import isEqual from 'lodash/isEqual';
import Canvas from './Canvas';
import Select, { ActionMeta, ControlProps, ValueContainerProps, components } from 'react-select'
import MultiValue from 'react-select/dist/declarations/src/components/MultiValue';

interface ComparerProps {
    className: string;

    gotDocumentName: (name: string) => void;
    initialLoadComplete: () => void;
}

export interface ComparerRef {
    fetchFigmaFiles: () => Promise<void>;
}

const Comparer: React.ForwardRefRenderFunction<ComparerRef, ComparerProps> = (props, ref) => {

    const rightImage = useRef<ReactZoomPanPinchRef>(null);
    const leftImage = useRef<ReactZoomPanPinchRef>(null);
    const canvasDiv = useRef<HTMLDivElement | null>(null);

    const selectPrefix = "reactselect";

    const [isLoadingLeftPage, setIsLoadingLeftPage] = useState<boolean>(true);
    const [isLoadingRightPage, setIsLoadingRightPage] = useState<boolean>(true);
    const [isLoadingLeftImages, setIsLoadingLeftImages] = useState<boolean>(true);
    const [isLoadingRightImages, setIsLoadingRightImages] = useState<boolean>(true);

    // #region canvas drawing state variables 

    const [selectVersionLeftSelectedOption, setSelectVersionLeftSelectedOption] = useState<Version>();
    const [selectVersionRightSelectedOption, setSelectVersionRightSelectedOption] = useState<Version>();
    const [selectedVersionNameLeft, setSelectedVersionNameLeft] = useState<string>("");
    const [selectedVersionNameRight, setSelectedVersionNameRight] = useState<string>("");
    const [selectedPageColorLeft, setSelectedPageColorLeft] = useState<string>("#FFFFFF");
    const [selectedPageColorRight, setSelectedPageColorRight] = useState<string>("#FFFFFF");


    const [isLeftPageAvailable, setIsLeftPageAvailable] = useState<boolean>(true);
    const [isRightPageAvailable, setIsRightPageAvailable] = useState<boolean>(true);

    const [pagesListVersionLeft, setPagesListVersionLeft] = useState<Page[]>();
    const [pagesListVersionRight, setPagesListVersionRight] = useState<Page[]>();

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

    const [sliderPadding, setSliderPadding] = useState(100);
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
                    : <div>No label</div>}
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

    async function getDocumentName(): Promise<string> {

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

    async function fetchVersionList(): Promise<Version[]> {
        const versions: Version[] = [];

        async function fetchVersionListPage(url: string | undefined): Promise<void> {
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
                        versions.push({
                            id: version.id,
                            created_at: formatDate(version.created_at),
                            label: version.label ? version.label : "Autosave",
                            description: version.description,
                            user: version.user,
                            value: version.id,
                        });
                    }
                    // console.log(data)
                    // versions.push(...data.versions);

                    // Continue fetching if there is a previous page
                    //console.log("-- Has more pages? NextPage is:" + data.pagination.next_page)
                    if (data.pagination && data.pagination.next_page) {
                        await fetchVersionListPage(data.pagination.next_page);
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

        const documentName: string = await getDocumentName();

        props.gotDocumentName(documentName);

        const allVersions: Version[] = await fetchVersionList();

        setFileVersionsList(allVersions);

        setSelectVersionLeftSelectedOption(allVersions[0]);
        setSelectedVersionNameLeft(allVersions[0].label);
        setSelectVersionRightSelectedOption(allVersions[1]);
        setSelectedVersionNameRight(allVersions[1].label);

        fetchDocumentVersion(allVersions[0].id, Side.LEFT);
        fetchDocumentVersion(allVersions[1].id, Side.RIGHT);

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

    async function fetchPage(versionId: string, pageId: string, side: Side) {

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
            // console.log("OK, Page is ready");
            // console.log(responseJson.nodes);
            // console.log(responseJson.nodes[pageId]);
            // console.log(responseJson.nodes[pageId].document);


            let pageChildren = responseJson.nodes[pageId].document.children;
            let pageFlatNodes = flattenNodes(responseJson.nodes[pageId].document);
            let pageBackground: Color = responseJson.nodes[pageId].document.backgroundColor;

            let minX = 0, minY = 0, maxX = 0, maxY = 0;
            for (const node of pageFlatNodes) {
                minX = Math.min(minX, node.figmaNode.absoluteBoundingBox.x);
                minY = Math.min(minY, node.figmaNode.absoluteBoundingBox.y);
                maxX = Math.max(maxX, +node.figmaNode.absoluteBoundingBox.x + node.figmaNode.absoluteBoundingBox.width);
                maxY = Math.max(maxY, node.figmaNode.absoluteBoundingBox.y + node.figmaNode.absoluteBoundingBox.height);
            }

            let pageDimensions: Rect = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
            }


            if (side == Side.LEFT) {
                updateDocumentPageLeftBounds(pageId, pageDimensions);
                updateDocumentPageLeftChildrenAndFlatNodes(pageId, pageChildren, pageFlatNodes);
                setSelectedPageColorLeft(rgbaToString(pageBackground));
            }
            else if (side == Side.RIGHT) {
                updateDocumentPageRightBounds(pageId, pageDimensions);
                updateDocumentPageRightChildrenAndFlatNodes(pageId, pageChildren, pageFlatNodes);
                setSelectedPageColorRight(rgbaToString(pageBackground));
            }
        }
    }



    function rgbaToString(color: Color) {
        return "rgba(" + Math.round(color.r * 255) + "," + Math.round(color.g * 255) + "," + Math.round(color.b * 255) + "," + Math.round(color.a) + ")";
    }

    async function fetchDocumentVersion(versionId: string, side: Side) {

        if (side == Side.LEFT) {
            setIsLoadingLeftPage(true);
            setIsLoadingLeftImages(true);
            globalState.isDocumentLeftLoaded = false;
            setTimeout(() => {
                setVersionLeftNodesWithImages([]);
                setVersionLeftDifferences([]);
                setSelectedPageColorLeft("transparent");
            }, 500)

        }
        if (side == Side.RIGHT) {
            setIsLoadingRightPage(true);
            setIsLoadingRightImages(true);
            globalState.isDocumentRightLoaded = false;
            setTimeout(() => {
                setVersionRightNodesWithImages([]);
                setVersionRightDifferences([]);
                setSelectedPageColorRight("transparent");
            }, 500)
        }

        // console.log("Fetching version:" + versionId + " for side:" + side.valueOf());
        // console.log("At this point, globalPageId is:" + globalState.selectedPageId);

        // let depth = "";
        let depth = "&depth=1";
        // let depth = "&depth=2";

        let getPagesVersion = await fetch('https://api.figma.com/v1/files/' + globalState.documentId + "?version=" + versionId + depth, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${globalState.accessToken}`
            }
        })

        if (getPagesVersion.ok) {
            const responseJson = await getPagesVersion.json();
            // console.log("OK, document is ready");
            // console.log(responseJson);


            let figmaDocumentPages: any[] = responseJson.document.children.filter((child: any) => child.type === 'CANVAS');
            // console.log(figmaDocumentPages);

            let pages: Page[] = figmaDocumentPages.map((page: any, index: number) => {
                return {
                    id: page.id,
                    children: page.children, //Will be empty if depth is set to 1
                    name: page.name,
                    nameOtherVersion: "",
                    backgroundColor: page.backgroundColor,
                    presentInVersionLeft: false,
                    presentInVersionRight: false,
                    flatNodes: [],
                    boundingRect: { x: 0, y: 0, width: 0, height: 0 }
                };
            });

            let versionDocument: Document = {
                name: responseJson.document.name,
                version: versionId,
                pages: pages,
            }

            if (side == Side.LEFT) {
                setDocumentLeft(versionDocument);
                setPagesListVersionLeft(pages);
                setIsLoadingLeftPage(false);
                globalState.isDocumentLeftLoaded = true;
                if (globalState.isDocumentRightLoaded) props.initialLoadComplete();
            }
            if (side == Side.RIGHT) {
                setDocumentRight(versionDocument);
                setPagesListVersionRight(pages);
                setIsLoadingRightPage(false);
                globalState.isDocumentRightLoaded = true;
                if (globalState.isDocumentLeftLoaded) props.initialLoadComplete();
            }

            //If node-id retrieved from URL belongs to a page, and globalState.selectedPageId has not been set yet, set it to the retrieved id.
            if (!globalState.selectedPageId && globalState.selectedNodeId) {
                if (pages.some(page => page.id == globalState.selectedNodeId))
                    setSelectedPageId(globalState.selectedNodeId);
            }

            let pageId = globalState.selectedPageId ? globalState.selectedPageId : versionDocument.pages[0].id;

            drawPage(pageId, side);

        }
    }

    // #endregion

    // #region Draw pages

    async function drawPage(pageId: string, side: Side) {

        let versionId = "";

        if (side == Side.LEFT) {
            versionId = globalState.documentLeft.version;
        } else if (side == Side.RIGHT) {
            versionId = globalState.documentRight.version;
        }

        if (side == Side.LEFT) {
            setIsLoadingLeftPage(true);
            setIsLoadingLeftImages(true);
            setTimeout(() => {
                setVersionLeftNodesWithImages([]);
                setVersionLeftDifferences([]);
                setSelectedPageColorLeft("transparent");
            }, 500)

        }
        if (side == Side.RIGHT) {
            setIsLoadingRightPage(true);
            setIsLoadingRightImages(true);
            setTimeout(() => {
                setVersionRightNodesWithImages([]);
                setVersionRightDifferences([]);
                setSelectedPageColorRight("transparent");
            }, 500)
        }

        await fetchPage(versionId, pageId, side);

        calculateDifferences(pageId);
        setCanvasDimensionsAndOffset(pageId);

        drawVersionPresent(side, true);

        let page: Page | undefined = undefined;
        let leftPage = globalState.documentLeft.pages.find(page => page.id === pageId);
        let rightPage = globalState.documentRight.pages.find(page => page.id === pageId);



        if (side == Side.LEFT) {
            versionId = globalState.documentLeft.version;
            page = leftPage;
        } else if (side == Side.RIGHT) {
            page = rightPage;
            versionId = globalState.documentRight.version;
        }

        if (page) {

            let allowedTypes = ['FRAME', 'SECTION', 'COMPONENT', 'COMPONENT_SET'];

            if (leftPage && rightPage) {
                // console.log("nodesInPage. Side:" + side)
                // console.log(nodesInLeftPage)
                // console.log(nodesInRightPage)

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
                // console.log(leftDifferences);
                // console.log(rightDifferences);

                setVersionLeftDifferences(leftDifferences);
                setVersionRightDifferences(rightDifferences);
            }

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

            // console.log("newNodesWithImages:")
            // console.log(newNodesWithImages)


            // console.log("contentIds:" + contentIds)

            let getPagesVersion1Image = await fetch('https://api.figma.com/v1/images/' + globalState.documentId + "?ids=" + contentIds + "&format=png&scale=1&version=" + versionId, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${globalState.accessToken}` // Replace FigmaAPIKey with your actual access token
                }
            })

            if (getPagesVersion1Image.ok) {
                const responseJson = await getPagesVersion1Image.json();

                // console.log(responseJson.images);

                let mapper = newNodesWithImages.map((node) => {
                    const imageUrl = responseJson.images[node.id] || '';

                    return {
                        ...node,
                        imageUrl,
                    };
                });


                if (side == Side.LEFT) {

                    setIsLoadingLeftPage(false);
                    setVersionLeftNodesWithImages(mapper);
                }
                else if (side == Side.RIGHT) {
                    setIsLoadingRightPage(false);
                    setVersionRightNodesWithImages(mapper);
                }

            }
        }

    }


    function drawVersionPresent(side: Side, present: boolean) {
        if (side == Side.LEFT) setIsLeftPageAvailable(present);
        if (side == Side.RIGHT) setIsRightPageAvailable(present);
    }

    // #endregion



    function setCanvasDimensionsAndOffset(pageId: string) {
        let pageLeftBounds = globalState.documentLeft.pages.find(page => page.id == pageId)?.boundingRect;
        let pageRightBounds = globalState.documentRight.pages.find(page => page.id == pageId)?.boundingRect;

        if (pageLeftBounds && pageRightBounds) {
            let canvasMinX = Math.min(pageLeftBounds.x, pageRightBounds.x);
            let canvasMinY = Math.min(pageLeftBounds.y, pageRightBounds.y);
            let canvasMaxX = Math.max((pageLeftBounds.x + pageLeftBounds.width), (pageRightBounds.x + pageRightBounds.width));
            let canvasMaxY = Math.max((pageLeftBounds.y + pageLeftBounds.height), (pageRightBounds.y + pageRightBounds.height));
            let canvasWidth = canvasMaxX - canvasMinX;
            let canvasHeight = canvasMaxY - canvasMinY;
            let pageOffsetX = canvasMinX;
            let pageOffsetY = canvasMinY;

            setCanvasWidth(canvasWidth);
            setCanvasHeight(canvasHeight);
            setCanvasPageOffsetX(pageOffsetX);
            setCanvasPageOffsetY(pageOffsetY);

            fitIntoView();

            if (canvasDiv.current) {
                let scaleX = (canvasDiv.current.clientWidth - canvasPadding) / canvasWidth;
                let scaleY = (canvasDiv.current.clientHeight - canvasPadding) / canvasHeight;

                (rightImage.current as any).setTransform(canvasPadding / 2, canvasPadding / 2, Math.min(scaleX, scaleY), 0);
                (leftImage.current as any).setTransform(canvasPadding / 2, canvasPadding / 2, Math.min(scaleX, scaleY), 0);
            }
        }
    }

    function fitIntoView() {
        if (canvasDiv.current) {
            let scaleX = (canvasDiv.current.clientWidth - canvasPadding) / canvasWidth;
            let scaleY = (canvasDiv.current.clientHeight - canvasPadding) / canvasHeight;

            (rightImage.current as any).setTransform(canvasPadding / 2, canvasPadding / 2, Math.min(scaleX, scaleY), 0);
            (leftImage.current as any).setTransform(canvasPadding / 2, canvasPadding / 2, Math.min(scaleX, scaleY), 0);
        }
    }

    function calculateDifferences(pageId: string) {

        let pageLeftNodes = globalState.documentLeft.pages.find(page => page.id == pageId)?.flatNodes;
        let pageRightNodes = globalState.documentRight.pages.find(page => page.id == pageId)?.flatNodes;

        if (pageLeftNodes && pageLeftNodes.length > 0 && pageRightNodes && pageRightNodes.length > 0) {

            const newDocumentLeftFlatNodes = getVersionComparison(pageLeftNodes, pageRightNodes);
            const newDocumentRightFlatNodes = getVersionComparison(pageRightNodes, pageLeftNodes);

            updateDocumentPageLeftFlatNodes(pageId, newDocumentLeftFlatNodes);
            updateDocumentPageRightFlatNodes(pageId, newDocumentRightFlatNodes);
        }

    }

    function getVersionComparison(array1FlatNodes: Node[], array2FlatNodes: Node[]) {
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
                type: node1.type,
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

    const renderOptions = () => {
        return fileVersionsList.map((fileVersion) => (
            <option key={fileVersion.id} value={fileVersion.id}>
                {fileVersion.label} - {fileVersion.user.handle}
            </option>
        ));
    };

    function mergePagesPreservingOrder(array1: Page[], array2: Page[]): Page[] {
        const mergedArray: Page[] = [];

        function addPage(page: Page, presentInVersionLeft: boolean, presentInVersionRight: boolean, secondName: string) {
            const newPage: Page = {
                id: page.id,
                children: page.children,
                name: page.name,
                nameOtherVersion: secondName,
                backgroundColor: page.backgroundColor,
                presentInVersionLeft: presentInVersionLeft,
                presentInVersionRight: presentInVersionRight,
                flatNodes: page.flatNodes,
                boundingRect: page.boundingRect
            };
            mergedArray.push(newPage);
        }

        for (const page of array1) {
            const array2Page = array2.find(page2 => page.id === page2.id);
            if (array2Page)
                addPage(page, true, true, array2Page.name);
            else
                addPage(page, true, false, "");
        }


        for (const page of array2) {
            if (!array1.some(page1 => page.id === page1.id))
                addPage(page, false, true, "");
        }

        return mergedArray;
    }

    const renderPageList = () => {
        //console.log("Rendering pages")
        let combinedPageOptions: Page[] = [];
        if (pagesListVersionLeft && pagesListVersionRight)
            combinedPageOptions = mergePagesPreservingOrder(pagesListVersionLeft, pagesListVersionRight);


        function onPageChangedClick(page: Page) {
            return (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {

                setSelectedPageId(page.id);

                if (page.presentInVersionLeft) {
                    //console.log("Will try to draw left version. version id is:" + globalState.documentLeft.version)
                    drawPage(page.id, Side.LEFT);
                }
                else
                    drawVersionPresent(Side.LEFT, false);

                if (page.presentInVersionRight) {
                    //console.log("Will try to draw right version. version id is:" + globalState.documentRight.version)
                    drawPage(page.id, Side.RIGHT);
                }
                else
                    drawVersionPresent(Side.RIGHT, false);
            };
        }

        return combinedPageOptions?.map((page) => (
            <div className='listItem' key={page.id} onClick={onPageChangedClick(page)}>
                <div className='verticalLayout'>
                    <div className='rowAuto primaryText'>
                        {page.name}
                    </div>
                    {page.name != page.nameOtherVersion && page.nameOtherVersion != "" ? (
                        <div className='rowAuto secondaryText'>
                            ( {page.nameOtherVersion})
                        </div>
                    ) : ""}
                    {page.presentInVersionLeft && !page.presentInVersionRight ? (
                        <div className='rowAuto primaryText'>
                            🌟 Just in vLeft
                        </div>
                    ) : ""}
                    {!page.presentInVersionLeft && page.presentInVersionRight ? (
                        <div className='rowAuto primaryText'>
                            🌟 Just in vRight
                        </div>
                    ) : ""}
                </div>
            </div>
        ));
    };

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
            // console.log("clientWidth:" + canvasDiv.current.clientWidth)
            // console.log("Slider padding is (in abs percentage):" + sliderPaddingPercentage)

            // if ((position > sliderPaddingPercentage) && (position < (100 - sliderPaddingPercentage))) {
            //   setCanvasLeftNamePosition((position / 100) / 2 * canvasDiv.current.clientWidth);
            //   setCanvasRightNamePosition(((1 - position / 100)) / 2 * canvasDiv.current.clientWidth);
            // }
        }
    }



    // #region UIEvent handlers

    // function onVersion1Changed(event: ChangeEvent<HTMLSelectElement>): void {
    //     // console.log("Changed v1 to version:" + event.target.value);
    //     setSelectVersionLeftSelectedOption(event.target.value);
    //     fetchDocumentVersion(event.target.value, Side.LEFT);
    // }
    // function onVersion2Changed(event: ChangeEvent<HTMLSelectElement>): void {
    //     // console.log("Changed v2 to version:" + event.target.value);
    //     setSelectVersionRightSelectedOption(event.target.value);
    //     fetchDocumentVersion(event.target.value, Side.RIGHT);
    // }

    function canvasLeftAllImagesLoaded(): void {
        setIsLoadingLeftImages(false);
    }

    function canvasRightAllImagesLoaded(): void {
        setIsLoadingRightImages(false);
    }

    function onVersion1Changed(newValue: any, actionMeta: ActionMeta<any>): void {
        console.log("Changed left version");
        setSelectVersionLeftSelectedOption(newValue);
        fetchDocumentVersion(newValue.id, Side.LEFT);
    }

    function onVersion2Changed(newValue: any, actionMeta: ActionMeta<any>): void {
        console.log("Changed right version");
        setSelectVersionRightSelectedOption(newValue);
        fetchDocumentVersion(newValue.id, Side.RIGHT);
    }

    // #endregion

    return (
        <div className={`comparer rowAvailable verticalLayout ${props.className}`}>
            <div className='rowAuto'>

                {/* <select id="selectVersion1" value={selectVersionLeftSelectedOption} onChange={onVersion1Changed}>
                    {renderOptions()}
                </select>
                <select id="selectVersion2" value={selectVersionRightSelectedOption} onChange={onVersion2Changed}>
                    {renderOptions()}
                </select> */}

                <input type="checkbox" value="SECTION" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('SECTION')} />
                <label>Section</label>
                <input type="checkbox" value="FRAME" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('FRAME')} />
                <label>Frame</label>
                <input type="checkbox" value="COMPONENT_SET" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('COMPONENT_SET')} />
                <label>Component sets</label>
                <input type="checkbox" value="COMPONENT" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('COMPONENT')} />
                <label>Components</label>
                <input type="checkbox" value="INSTANCE" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('INSTANCE')} />
                <label>Instances</label>
                <input type="checkbox" value="GROUP" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('GROUP')} />
                <label>Groups</label>
                <input type="checkbox" value="RECTANGLE" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('RECTANGLE')} />
                <label>Rectangle</label>
                <input type="checkbox" value="TEXT" onChange={onDifferenceTypesChanged} checked={differencesTypes.includes('TEXT')} />
                <label>Text</label>

                <button onClick={fitIntoView}>Fit into view</button>



            </div>
            <div className='rowAvailable horizontalLayout'>
                <div className="colAuto">
                    <div className="verticalLayout">
                        {renderPageList()}
                    </div>
                </div>
                <div ref={canvasDiv} className="colAvailable verticalLayout">
                    <ReactCompareSlider className='extend' onPositionChange={onSliderPositionChange} boundsPadding={sliderPadding}
                        onlyHandleDraggable={true}
                        itemOne={
                            <TransformWrapper ref={leftImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
                                <TransformComponent wrapperClass='verticalLayout' contentClass='verticalLayout'>
                                    <Canvas name='LEFT' allImagesLoaded={canvasLeftAllImagesLoaded} nodesWithImages={versionLeftNodesWithImages} differences={versionLeftDifferences} differenceTypes={differencesTypes} canvasWidth={canvasWidth} canvasHeight={canvasHeight} offsetX={canvasPageOffsetX} offsetY={canvasPageOffsetY} background={selectedPageColorLeft} containerClass={`innerCanvas animatedDiv invisible ${isLoadingLeftPage ? 'fadeOut' : 'fadeIn'}`} />
                                </TransformComponent>
                                <div className="alignFullCenter" style={{
                                    position: 'absolute',
                                    width: `${canvasLeftWidth}px`,
                                    top: '0px',
                                }}>
                                    <div className="canvasVersionOverlay">
                                        <Select className='select' classNamePrefix={selectPrefix} defaultMenuIsOpen options={fileVersionsList} isMulti={false} unstyled components={customComponents} isSearchable={false} onChange={onVersion1Changed} value={selectVersionLeftSelectedOption} />
                                    </div>
                                </div>

                                <div className={`animatedDiv invisible ${(!isLoadingLeftImages && !isLoadingLeftPage) ? 'fadeOut' : 'fadeOut'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div id="indeterminateLoader" className="verticalLayout alignFullCenterAndCenterText indeterminateLoader show">
                                        <div className="dualRingLoader"></div>
                                        <div className="loaderMessage">
                                            Loading stuff - {isLoadingLeftImages ? "loadingLeftImages" : "notLoadingLeftImages"} - {isLoadingLeftPage ? "loadingLeftPage" : "notLoadingLeftPage"}
                                        </div>
                                    </div>
                                </div>
                            </TransformWrapper>
                        }
                        itemTwo={
                            <TransformWrapper ref={rightImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
                                <TransformComponent wrapperClass='verticalLayout' contentClass='verticalLayout'>
                                    <Canvas name='RIGHT' allImagesLoaded={canvasRightAllImagesLoaded} nodesWithImages={versionRightNodesWithImages} differences={versionRightDifferences} differenceTypes={differencesTypes} canvasWidth={canvasWidth} canvasHeight={canvasHeight} offsetX={canvasPageOffsetX} offsetY={canvasPageOffsetY} background={selectedPageColorRight} containerClass={`innerCanvas animatedDiv invisible ${isLoadingRightPage ? 'fadeOut' : 'fadeIn'}`} />

                                </TransformComponent>
                                <div className="alignFullCenter" style={{
                                    position: 'absolute',
                                    width: `${canvasRightWidth}px`,
                                    left: `${canvasLeftWidth}px`,
                                    top: '0px'
                                }}>
                                    <div className="canvasVersionOverlay">
                                        <Select className='select' classNamePrefix={selectPrefix} options={fileVersionsList} isMulti={false} unstyled components={customComponents} isSearchable={false} onChange={onVersion2Changed} value={selectVersionRightSelectedOption} />
                                    </div>
                                </div>


                                <div className={`animatedDiv invisible ${(!isLoadingRightImages && !isLoadingRightPage) ? 'fadeOut' : 'fadeOut'}`} style={{
                                    position: 'absolute',
                                    width: `${canvasRightWidth}px`,
                                    left: `${canvasLeftWidth}px`,
                                    height: '100%',
                                    top: '0px',
                                }}>
                                    <div id="indeterminateLoader" className="verticalLayout alignFullCenterAndCenterText indeterminateLoader show">
                                        <div className="dualRingLoader"></div>
                                        <div className="loaderMessage">
                                            Loading stuff - {isLoadingRightImages ? "loadingRightImages" : "notLoadingRightImages"} - {isLoadingRightPage ? "loadingRightPage" : "notLoadingRightPage"}
                                        </div>
                                    </div>
                                </div>
                            </TransformWrapper>
                        }
                    />

                </div>
            </div>
        </div>
    );
};


export default React.forwardRef(Comparer);