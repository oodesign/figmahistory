import React, { ChangeEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import { Routes, HashRouter, Route } from 'react-router-dom';
import axios from 'axios';
import ImageDiff from 'react-image-diff';
import ReactCompareImage from 'react-compare-image';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { globalState, setDocumentID, setAccessToken, setDocumentLeft, setDocumentRight, updateDocumentPageLeftChildrenAndFlatNodes, updateDocumentPageRightChildrenAndFlatNodes, setSelectedPageId, updateDocumentPageLeftFlatNodes, updateDocumentPageRightFlatNodes, } from './globals';
import isEqual from 'lodash/isEqual';

import { User, Side, Color, Document, Version, Page, NodeWithImage, FigmaNode, Node, Difference } from './types';

import Canvas2 from './Canvas2';
import './App.css';
import { timeout } from 'q';

const Start = () => {

  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  const firstImage = useRef<ReactZoomPanPinchRef>(null);
  const secondImage = useRef<ReactZoomPanPinchRef>(null);
  const canvasDiv = useRef<HTMLDivElement | null>(null);

  // #region canvas drawing state variables 

  const [selectVersionLeftSelectedOption, setSelectVersionLeftSelectedOption] = useState<string>("");
  const [selectVersionRightSelectedOption, setSelectVersionRightSelectedOption] = useState<string>("");

  const [isLeftPageAvailable, setIsLeftPageAvailable] = useState<boolean>(true);
  const [isRightPageAvailable, setIsRightPageAvailable] = useState<boolean>(true);

  const [pagesListVersionLeft, setPagesListVersionLeft] = useState<Page[]>();
  const [pagesListVersionRight, setPagesListVersionRight] = useState<Page[]>();

  const [versionLeftNodesWithImages, setVersionLeftNodesWithImages] = useState<NodeWithImage[]>([]);
  const [versionRightNodesWithImages, setVersionRightNodesWithImages] = useState<NodeWithImage[]>([]);


  const [versionLeftDifferences, setVersionLeftDifferences] = useState<Difference[]>([]);
  const [versionRightDifferences, setVersionRightDifferences] = useState<Difference[]>([]);
  const [differencesTypes, setDifferencesTypes] = useState<string[]>(['FRAME', 'SECTION']);


  const [pageLeftMaxX, setPageLeftMaxX] = useState(0);
  const [pageLeftMaxY, setPageLeftMaxY] = useState(0);
  const [pageRightMaxX, setPageRightMaxX] = useState(0);
  const [pageRightMaxY, setPageRightMaxY] = useState(0);
  const [canvasMaxWidth, setCanvasMaxWidth] = useState(1000);
  const [canvasMaxHeight, setCanvasMaxHeight] = useState(1000);
  const [canvasOffsetX, setCanvasOffsetX] = useState(0);
  const [canvasOffsetY, setCanvasOffsetY] = useState(0);

  const [fileVersionsList, setFileVersionsList] = useState<Version[]>([]);



  // #endregion

  // #region Fetching files, versions

  async function fetchVersionList(): Promise<Version[]> {
    const versions: Version[] = [];

    async function fetchPage(url: string | undefined): Promise<void> {
      if (url) {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${globalState.accessToken}` // Replace FigmaAPIKey with your actual access token
          }
        });

        if (response.ok) {
          const data = await response.json();
          // console.log(data)
          versions.push(...data.versions);

          // Continue fetching if there is a previous page
          //console.log("-- Has more pages? NextPage is:" + data.pagination.next_page)
          if (data.pagination && data.pagination.next_page) {
            await fetchPage(data.pagination.next_page);
          }
        } else {
          console.error(`Failed to fetch versions: ${response.statusText}`);
        }
      }
    }

    // Start fetching with the initial page (undefined for the first page)
    await fetchPage('https://api.figma.com/v1/files/' + globalState.documentId + "/versions");

    return versions;
  }

  const fetchFigmaFiles = async () => {

    const allVersions: Version[] = await fetchVersionList();


    setFileVersionsList(allVersions);

    setSelectVersionLeftSelectedOption(allVersions[0].id);
    setSelectVersionRightSelectedOption(allVersions[1].id);

    fetchDocumentVersion(allVersions[0].id, Side.LEFT);
    fetchDocumentVersion(allVersions[1].id, Side.RIGHT);

  };

  function getAllPageFigmaNodes(node: FigmaNode, allowedTypes: string[]): any[] {
    let pageFigmaNodes: FigmaNode[] = [];

    function traverse(node: FigmaNode) {
      if (allowedTypes.includes(node.type))
        pageFigmaNodes.push(node);

      if (node.children) {
        for (const child of node.children.filter((child: any) => allowedTypes.includes(child.type))) {
          traverse(child);
        }
      }
    }

    traverse(node);

    return pageFigmaNodes;
  }


  function flattenNodes(node: FigmaNode): Node[] {
    let flatNodes: Node[] = [];

    function traverse(node: FigmaNode, includeNode: boolean) {
      if (includeNode) {
        let pushNode: Node = {
          nodeId: node.id,
          figmaNode: node,
          isPresentInOtherVersion: false,
          isEqualToOtherVersion: false,
          type: node.type
        }
        flatNodes.push(pushNode);
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child, true); // Recursively traverse child nodes
        }
      }
    }

    traverse(node, false);

    return flatNodes;
  }

  async function fetchPage(versionId: string, pageId: string, side: Side) {

    console.log("Fetching page:" + pageId);
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
      // console.log(responseJson.nodes[pageId].document);

      let pageChildren = responseJson.nodes[pageId].document.children;
      let pageFlatNodes = flattenNodes(responseJson.nodes[pageId].document);

      if (side == Side.LEFT) {
        updateDocumentPageLeftChildrenAndFlatNodes(pageId, pageChildren, pageFlatNodes);
      }
      else if (side == Side.RIGHT) {
        updateDocumentPageRightChildrenAndFlatNodes(pageId, pageChildren, pageFlatNodes);
      }
    }
  }

  async function fetchDocumentVersion(versionId: string, side: Side) {

    console.log("Fetching version:" + versionId + " for side:" + side.valueOf());

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
      console.log("OK, document is ready");
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
          flatNodes: []
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
      }
      if (side == Side.RIGHT) {
        setDocumentRight(versionDocument);
        setPagesListVersionRight(pages);
      }


      let pageId = globalState.selectedPageId ? globalState.selectedPageId : versionDocument.pages[0].id;
      // console.log("PageId is:" + pageId);

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

    await fetchPage(versionId, pageId, side);




    calculateDifferences(pageId);

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
              boundingRect: node.figmaNode.absoluteBoundingBox
            });
          }
        }

        let rightDifferences: Difference[] = [];
        for (const node of rightPage.flatNodes) {
          if (!node.isEqualToOtherVersion || !node.isPresentInOtherVersion) {
            rightDifferences.push({
              type: node.type,
              boundingRect: node.figmaNode.absoluteBoundingBox
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


        // console.log("newNodesWithImages (again):")
        // console.log(mapper);

        let boundingBoxMaxX = 0;
        let boundingBoxMinX = 0;
        let boundingBoxMaxY = 0;
        let boundingBoxMinY = 0;

        mapper.forEach((nodeWithImage) => {
          boundingBoxMaxX = Math.max(boundingBoxMaxX, nodeWithImage.child.absoluteBoundingBox.x + nodeWithImage.child.absoluteBoundingBox.width);
          boundingBoxMinX = Math.min(boundingBoxMinX, nodeWithImage.child.absoluteBoundingBox.x);
          boundingBoxMaxY = Math.max(boundingBoxMaxY, nodeWithImage.child.absoluteBoundingBox.y + nodeWithImage.child.absoluteBoundingBox.height);
          boundingBoxMinY = Math.min(boundingBoxMinY, nodeWithImage.child.absoluteBoundingBox.y);
        });

        let canvasMaxWidth, canvasMaxHeight = 0


        // console.log("boundingBoxMinMaxX:" + boundingBoxMinX + "," + boundingBoxMaxX + " - boundingBoxMinMaxY:" + boundingBoxMinY + "," + boundingBoxMaxY);
        // console.log("PageLeftMax:" + pageLeftMaxX + "," + pageLeftMaxY + " - PageRightMax:" + pageRightMaxX + "," + pageRightMaxY);

        if (side == Side.LEFT) {
          setVersionLeftNodesWithImages(mapper);
          setPageLeftMaxX((boundingBoxMaxX + (-boundingBoxMinX)));
          setPageLeftMaxY((boundingBoxMaxY + (-boundingBoxMinY)));

          canvasMaxWidth = (Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageRightMaxX));
          canvasMaxHeight = (Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageRightMaxY));

          // console.log("setCanvasMaxWidth(L):" + Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageRightMaxX));
          // console.log("setCanvasMaxHeight(L):" + Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageRightMaxY));
        }
        else if (side == Side.RIGHT) {
          setVersionRightNodesWithImages(mapper);
          setPageRightMaxX((boundingBoxMaxX + (-boundingBoxMinX)));
          setPageRightMaxY((boundingBoxMaxY + (-boundingBoxMinY)));

          canvasMaxWidth = (Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageLeftMaxX));
          canvasMaxHeight = (Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageLeftMaxY));

          // console.log("setCanvasMaxWidth(R):" + Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageLeftMaxX));
          // console.log("setCanvasMaxHeight(R):" + Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageLeftMaxY));
        }


        setCanvasMaxWidth(canvasMaxWidth);
        setCanvasMaxHeight(canvasMaxHeight);

        setCanvasOffsetX(Math.min(boundingBoxMinX, canvasOffsetX));
        setCanvasOffsetY(Math.min(boundingBoxMinY, canvasOffsetY));
        // console.log("setCanvasOffsetX:" + boundingBoxMinX);
        // console.log("setCanvasOffsetY:" + boundingBoxMinY);

        if (canvasDiv.current) {
          let scaleX = canvasDiv.current.clientWidth / canvasMaxWidth;
          let scaleY = canvasDiv.current.clientHeight / canvasMaxHeight;


          // console.log("Window:" + window.innerWidth + "," + window.innerHeight + " - Canvas:" + canvasMaxWidth + "," + canvasMaxHeight + ". Scale:" + scaleX + "," + scaleY);

          (firstImage.current as any).setTransform(0, 0, Math.min(scaleX, scaleY), 0);
          (secondImage.current as any).setTransform(0, 0, Math.min(scaleX, scaleY), 0);
        }
      }
    }

  }


  function drawVersionPresent(side: Side, present: boolean) {
    if (side == Side.LEFT) setIsLeftPageAvailable(present);
    if (side == Side.RIGHT) setIsRightPageAvailable(present);
  }

  // #endregion

  // #region Authentication and access

  const handleFigmaAuthentication = async (code: string) => {

    let figmaDocumentID = getFigmaDocumentID();
    // console.log("Document IDs is:" + figmaDocumentID);
    if (figmaDocumentID) {
      setDocumentID(figmaDocumentID);
    }


    // console.log("Try post call");
    fetch('http://localhost:5002/get-figma-access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(async response => {
        const responseObject = await response.json();
        if (responseObject.figmaData.access_token)
          setAccessToken(responseObject.figmaData.access_token);

        setDocumentID(figmaDocumentID);
        fetchFigmaFiles();
      })
      .then(data => {
        // console.log(data) 
      })
      .catch(error => console.error('Error:', error));

  };


  const getData = () => {
    //TODO Retrieve token from storage
    const token = "figu_c3F858MxN07ZBhWSXewYZglB_c_hGa4l0tx_MLrb";

    let figmaDocumentID = getFigmaDocumentID();

    if (token && figmaDocumentID) {
      // console.log("Token is known")
      setAccessToken(token);
      setDocumentID(figmaDocumentID);
      fetchFigmaFiles()
    }
    else {
      openPopupWindow();
    }
  }

  // #endregion

  // #region Helpers

  function calculateDifferences(pageId: string) {

    let pageLeftNodes = globalState.documentLeft.pages.find(page => page.id == pageId)?.flatNodes;
    let pageRightNodes = globalState.documentRight.pages.find(page => page.id == pageId)?.flatNodes;

    // console.log(pageLeftNodes);
    // console.log(pageRightNodes);
    // console.log("CalculatingDifferences. At this point documentLeftFlatNodes is (" + documentLeftFlatNodes.length + ") and documentRightFlatNodes is (" + documentRightFlatNodes.length + ")")

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
        figmaNode: node1.figmaNode
      });
    }

    return newDocumentFlatNodes;
  }

  const getFigmaDocumentID = () => {
    const inputElement = document.getElementById("figmaFileURL") as HTMLInputElement;
    const inputURL = inputElement.value;

    const regex = /^((http|https):\/\/)?(www\.)?figma.com\/file\/([a-zA-Z0-9]{22})(.*)?/
    const matches = inputURL.match(regex)
    if (matches === null) return "";
    const id = matches[4]
    return id || "";
  }

  const openPopupWindow = () => {


    const url = 'https://www.figma.com/oauth?client_id=pLCXoLFHH1UngPRH0ENGzV&redirect_uri=http://127.0.0.1:5002/callFigmaOAuth&scope=file_read&state=qpolpolq&response_type=code'; // Replace with your actual URL
    const options = 'toolbar=no,\
     location=no,\
     status=no,\
     menubar=no,\
     scrollbars=yes,\
     resizable=yes,\
     width=600,\
     height=768';

    const popup = window.open(url, 'targetWindow', options);
    setPopupWindow(popup);
  };

  // #endregion

  // #region UI drawing

  function handleTransform(ref: ReactZoomPanPinchRef, state: { scale: number; positionX: number; positionY: number; }): void {

    if (secondImage.current) {
      if (!(secondImage.current.instance.transformState.positionX == ref.state.positionX && secondImage.current.instance.transformState.positionY == ref.state.positionY && secondImage.current.instance.transformState.scale == ref.state.scale))
        (secondImage.current as any).setTransform(ref.state.positionX, ref.state.positionY, ref.state.scale, 0);
    }

    if (firstImage.current) {
      if (!(firstImage.current.instance.transformState.positionX == ref.state.positionX && firstImage.current.instance.transformState.positionY == ref.state.positionY && firstImage.current.instance.transformState.scale == ref.state.scale))
        (firstImage.current as any).setTransform(ref.state.positionX, ref.state.positionY, ref.state.scale, 0);
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
        flatNodes: page.flatNodes
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

  // #region UIEvent handlers

  function onVersion1Changed(event: ChangeEvent<HTMLSelectElement>): void {
    // console.log("Changed v1 to version:" + event.target.value);
    setSelectVersionLeftSelectedOption(event.target.value);
    fetchDocumentVersion(event.target.value, Side.LEFT);
  }
  function onVersion2Changed(event: ChangeEvent<HTMLSelectElement>): void {
    // console.log("Changed v2 to version:" + event.target.value);
    setSelectVersionRightSelectedOption(event.target.value);
    fetchDocumentVersion(event.target.value, Side.RIGHT);
  }

  // #endregion


  useEffect(() => {
    const handlePopupData = (event: MessageEvent) => {
      if (event.data && event.data.figmaSentCode) {
        handleFigmaAuthentication(event.data.figmaSentCode);

        if (popupWindow) {
          popupWindow.close();
        }
      }
    };

    window.addEventListener('message', handlePopupData);

    return () => {
      window.removeEventListener('message', handlePopupData);
    };
  }, [popupWindow]);


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

  return <div className='rowAvailable verticalLayout'>
    <div className='rowAuto'>
      <input id="figmaFileURL" type='text' placeholder='Paste your Figma URL here' defaultValue="https://www.figma.com/file/HTUxsQSO4pR1GCvv8Nvqd5/HistoryChecker?type=design&node-id=1%3A2&mode=design&t=ffdrgnmtJ92dZgeQ-1" />
      <button onClick={getData}>Load</button>
      <select id="selectVersion1" value={selectVersionLeftSelectedOption} onChange={onVersion1Changed}>
        {renderOptions()}
      </select>
      <select id="selectVersion2" value={selectVersionRightSelectedOption} onChange={onVersion2Changed}>
        {renderOptions()}
      </select>

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



    </div>
    <div className='rowAvailable horizontalLayout'>
      <div className="colAuto">
        <div className="verticalLayout">
          {renderPageList()}
        </div>
      </div>
      <div ref={canvasDiv} className="colAvailable verticalLayout">
        <ReactCompareSlider className='extend'
          onlyHandleDraggable={true}
          itemOne={
            <TransformWrapper ref={secondImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
              <TransformComponent wrapperClass='verticalLayout leftcanvas' contentClass='verticalLayout'>
                {isLeftPageAvailable ? (
                  <Canvas2 name='LEFT' nodesWithImages={versionLeftNodesWithImages} differences={versionLeftDifferences} differenceTypes={differencesTypes} canvasWidth={canvasMaxWidth} canvasHeight={canvasMaxHeight} offsetX={canvasOffsetX} offsetY={canvasOffsetY} containerClass='innerCanvas' />
                ) : (
                  <span>Not available</span>
                )}
              </TransformComponent>
            </TransformWrapper>
          }
          itemTwo={
            <TransformWrapper ref={firstImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
              <TransformComponent wrapperClass='verticalLayout rightcanvas' contentClass='verticalLayout'>
                {isRightPageAvailable ? (
                  <Canvas2 name='RIGHT' nodesWithImages={versionRightNodesWithImages} differences={versionRightDifferences} differenceTypes={differencesTypes} canvasWidth={canvasMaxWidth} canvasHeight={canvasMaxHeight} offsetX={canvasOffsetX} offsetY={canvasOffsetY} containerClass='innerCanvas' />
                ) : (
                  <span>Not available</span>
                )}
              </TransformComponent>
            </TransformWrapper>
          }
        />

      </div>
    </div>
  </div>
};


const App = () => {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/start" Component={Start}></Route>
        </Routes>
      </HashRouter>
    </>
  );
};

export default App;



