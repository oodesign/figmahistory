import React, { ChangeEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import { Routes, HashRouter, Route } from 'react-router-dom';
import axios from 'axios';
import ImageDiff from 'react-image-diff';
import ReactCompareImage from 'react-compare-image';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";


import './App.css';
import { access } from 'fs';
import { NodeWithImage } from './NodeWithImage';
import Canvas from './Canvas';
import Canvas2 from './Canvas2';


type User = {
  id: string;
  handle: string;
  img_url: string;
  email: string;
};

enum Side {
  LEFT = 0,
  RIGHT = 1
}

type Version = {
  id: string;
  created_at: string;
  label: string;
  description: string;
  user: User;
};



const Start = () => {

  const [documentID, setDocumentID] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firstImage = useRef<ReactZoomPanPinchRef>(null);
  const secondImage = useRef<ReactZoomPanPinchRef>(null);

  const [file1SelectedOption, setFile1SelectedOption] = useState<string>("");
  const [file2SelectedOption, setFile2SelectedOption] = useState<string>("");

  const [versionLeftNodesWithImages, setVersionLeftNodesWithImages] = useState<NodeWithImage[]>([]);
  const [versionRightNodesWithImages, setVersionRightNodesWithImages] = useState<NodeWithImage[]>([]);


  const [pageLeftMaxX, setPageLeftMaxX] = useState(0);
  const [pageLeftMaxY, setPageLeftMaxY] = useState(0);
  const [pageRightMaxX, setPageRightMaxX] = useState(0);
  const [pageRightMaxY, setPageRightMaxY] = useState(0);
  const [canvasMaxWidth, setCanvasMaxWidth] = useState(1000);
  const [canvasMaxHeight, setCanvasMaxHeight] = useState(1000);
  const [canvasOffsetX, setCanvasOffsetX] = useState(0);
  const [canvasOffsetY, setCanvasOffsetY] = useState(0);

  const [fileVersions, setFileVersions] = useState<Version[]>([]);


  async function fetchAllVersions(documentIDReceived: string, accessTokenReceived: string): Promise<Version[]> {
    const versions: Version[] = [];

    async function fetchPage(url: string | undefined): Promise<void> {
      //console.log("Fetching url: "+url);
      if (url) {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessTokenReceived}` // Replace FigmaAPIKey with your actual access token
          }
        });

        if (response.ok) {
          const data = await response.json();
          // console.log(data)
          versions.push(...data.versions);

          // Continue fetching if there is a previous page
          console.log("-- Has more pages? NextPage is:" + data.pagination.next_page)
          if (data.pagination && data.pagination.next_page) {
            await fetchPage(data.pagination.next_page);
          }
        } else {
          console.error(`Failed to fetch versions: ${response.statusText}`);
        }
      }
    }

    // Start fetching with the initial page (undefined for the first page)
    await fetchPage('https://api.figma.com/v1/files/' + documentIDReceived + "/versions");

    return versions;
  }


  async function fetchVersion(fileId: string, side: Side, documentIDReceived: string, accessTokenReceived: string) {

    console.log("Fetching version. documentID:" + documentIDReceived + ", accessToken:" + accessTokenReceived)

    console.log("PageLeftMax:" + pageLeftMaxX + "," + pageLeftMaxY + " - PageRightMax:" + pageRightMaxX + "," + pageRightMaxY );

    let getPagesVersion = await fetch('https://api.figma.com/v1/files/' + documentIDReceived + "?version=" + fileId + "&depth=2", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessTokenReceived}`
      }
    })

    if (getPagesVersion.ok) {
      const responseJson = await getPagesVersion.json();
      console.log(responseJson);

      let pages = responseJson.document.children.filter((child: any) => child.type === 'CANVAS');
      console.log(pages);

      let firstPage = pages[0];
      console.log(firstPage)
      let allowedTypes = ['FRAME', 'SECTION', 'COMPONENT', 'COMPONENT_SET'];
      // let firstPageContents = firstPage.children.filter((child: any) => allowedTypes.includes(child.type));
      // let firstPageContentsIDs = firstPageContents.map((child: any) => child.id).join(',');

      let newNodesWithImages = firstPage.children
        .filter((child: any) => allowedTypes.includes(child.type))
        .map((child: any) => ({
          id: child.id,
          child: child,
          image: null, // Replace with your actual function to generate thumbnail URL
        }));

      let firstPageContentsIDs: string = newNodesWithImages.map((node: NodeWithImage) => node.child.id).join(',');


      console.log("newNodesWithImages:")
      console.log(newNodesWithImages)

      let getPagesVersion1Image = await fetch('https://api.figma.com/v1/images/' + documentIDReceived + "?ids=" + firstPageContentsIDs + "&format=png&scale=1&version=" + fileId, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessTokenReceived}` // Replace FigmaAPIKey with your actual access token
        }
      })


      if (getPagesVersion1Image.ok) {
        const responseJson = await getPagesVersion1Image.json();

        console.log(responseJson.images);

        let mapper = newNodesWithImages.map((node) => {
          const imageUrl = responseJson.images[node.id] || '';

          return {
            ...node,
            imageUrl,
          };
        });


        console.log("newNodesWithImages (again):")
        console.log(mapper);

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


        console.log("boundingBoxMinMaxX:" + boundingBoxMinX + "," + boundingBoxMaxX + " - boundingBoxMinMaxY:" + boundingBoxMinY + "," + boundingBoxMaxY );
        console.log("PageLeftMax:" + pageLeftMaxX + "," + pageLeftMaxY + " - PageRightMax:" + pageRightMaxX + "," + pageRightMaxY );

        if (side == Side.LEFT) {
          setVersionLeftNodesWithImages(mapper);
          setPageLeftMaxX((boundingBoxMaxX + (-boundingBoxMinX)));
          setPageLeftMaxY((boundingBoxMaxY + (-boundingBoxMinY)));

          canvasMaxWidth = (Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageRightMaxX));
          canvasMaxHeight = (Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageRightMaxY));

          console.log("setCanvasMaxWidth(L):" + Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageRightMaxX));
          console.log("setCanvasMaxHeight(L):" + Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageRightMaxY));
        }
        else if (side == Side.RIGHT) {
          setVersionRightNodesWithImages(mapper);
          setPageRightMaxX((boundingBoxMaxX + (-boundingBoxMinX)));
          setPageRightMaxY((boundingBoxMaxY + (-boundingBoxMinY)));

          canvasMaxWidth = (Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageLeftMaxX));
          canvasMaxHeight = (Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageLeftMaxY));

          console.log("setCanvasMaxWidth(R):" + Math.max((boundingBoxMaxX + (-boundingBoxMinX)), pageLeftMaxX));
          console.log("setCanvasMaxHeight(R):" + Math.max((boundingBoxMaxY + (-boundingBoxMinY)), pageLeftMaxY));
        }


        setCanvasMaxWidth(canvasMaxWidth);
        setCanvasMaxHeight(canvasMaxHeight);

        setCanvasOffsetX(Math.min(boundingBoxMinX, canvasOffsetX));
        setCanvasOffsetY(Math.min(boundingBoxMinY, canvasOffsetY));
        console.log("setCanvasOffsetX:" + boundingBoxMinX);
        console.log("setCanvasOffsetY:" + boundingBoxMinY);

        let scaleX = window.innerWidth / canvasMaxWidth;
        let scaleY = window.innerHeight / canvasMaxHeight;


        console.log("Window:" + window.innerWidth + "," + window.innerHeight + " - Canvas:" + canvasMaxWidth + "," + canvasMaxHeight + ". Scale:" + scaleX + "," + scaleY);

        (firstImage.current as any).setTransform(0, 0, Math.min(scaleX, scaleY), 0);
        (secondImage.current as any).setTransform(0, 0, Math.min(scaleX, scaleY), 0);

      }

    }
  }


  // Usage in a React component or elsewhere in your TypeScript code
  const fetchFigmaFiles = async (documentIDReceived: string, accessTokenReceived: string) => {

    const allVersions: Version[] = await fetchAllVersions(documentIDReceived, accessTokenReceived);

    console.log("allVersions:");
    console.log(allVersions);

    setFileVersions(allVersions);

    setFile1SelectedOption(allVersions[0].id);
    setFile2SelectedOption(allVersions[1].id);

    fetchVersion(allVersions[0].id, Side.LEFT, documentIDReceived, accessTokenReceived);
    fetchVersion(allVersions[1].id, Side.RIGHT, documentIDReceived, accessTokenReceived);

  };

  const handleFigmaAuthentication = async (code: string) => {

    let figmaDocumentID = getFigmaDocumentID();
    console.log("Document IDs is:" + figmaDocumentID);
    if (figmaDocumentID) setDocumentID(figmaDocumentID);

    console.log("Try post call");
    fetch('http://localhost:5002/get-figma-access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(async response => {
        const responseObject = await response.json();
        console.log(responseObject.figmaData)
        console.log("AccessToken returned is:" + responseObject.figmaData.access_token)
        if (responseObject.figmaData.access_token) setAccessToken(responseObject.figmaData.access_token);
        setDocumentID(figmaDocumentID);
        fetchFigmaFiles(figmaDocumentID, responseObject.figmaData.access_token)
      })
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));

  };

  const getFigmaDocumentID = () => {
    const inputElement = document.getElementById("figmaFileURL") as HTMLInputElement;
    const inputURL = inputElement.value;

    // regular expression that matches figma file urls
    const regex = /^((http|https):\/\/)?(www\.)?figma.com\/file\/([a-zA-Z0-9]{22})(.*)?/

    // test the user input against the regular expression
    const matches = inputURL.match(regex)

    // if there are no matches, the user didn't paste a link to their figma file
    if (matches === null) return "";

    // if there is a match, the fourth group matched will be the file id
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

  const getData = () => {
    const token = "figu_c3F858MxN07ZBhWSXewYZglB_c_hGa4l0tx_MLrb";

    let figmaDocumentID = getFigmaDocumentID();
    console.log("Document IDs is:" + figmaDocumentID);
    if (figmaDocumentID) setDocumentID(figmaDocumentID);

    if (token && figmaDocumentID) {
      console.log("Token is known")
      setAccessToken(token);
      setDocumentID(figmaDocumentID);
      fetchFigmaFiles(figmaDocumentID, token)
    }
    else {
      openPopupWindow();
    }
  }

  useEffect(() => {
    const handlePopupData = (event: MessageEvent) => {
      // Check if the event data contains the parameters you expect
      if (event.data && event.data.figmaSentCode) {
        // Handle the received parameters
        handleFigmaAuthentication(event.data.figmaSentCode);

        // Close the popup window
        if (popupWindow) {
          popupWindow.close();
        }
      }
    };

    // Set up event listener when the component mounts
    window.addEventListener('message', handlePopupData);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handlePopupData);
    };
  }, [popupWindow]);



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
    return fileVersions.map((fileVersion) => (
      <option key={fileVersion.id} value={fileVersion.id}>
        {fileVersion.label} - {fileVersion.user.handle}
      </option>
    ));
  };


  function onVersion1Changed(event: ChangeEvent<HTMLSelectElement>): void {
    console.log("Changed v1 to version:" + event.target.value);
    setFile1SelectedOption(event.target.value);
    if (documentID && accessToken) fetchVersion(event.target.value, Side.LEFT, documentID, accessToken);
  }
  function onVersion2Changed(event: ChangeEvent<HTMLSelectElement>): void {
    console.log("Changed v2 to version:" + event.target.value);
    setFile2SelectedOption(event.target.value);
    if (documentID && accessToken) fetchVersion(event.target.value, Side.RIGHT, documentID, accessToken);
  }

  return <div className='rowAvailable verticalLayout'>
    <div className='rowAuto'>
      {/* <input id="figmaFileURL" type='text' placeholder='Paste your Figma URL here' defaultValue="https://www.figma.com/file/58J9lvktDn7tFZu16UDJHl/Dolby-pHRTF---Capture-app---No-Cloud?type=design&node-id=10163%3A65721&mode=design&t=6n0ZrLO9YyM2lHjb-1" /> */}
      <input id="figmaFileURL" type='text' placeholder='Paste your Figma URL here' defaultValue="https://www.figma.com/file/HTUxsQSO4pR1GCvv8Nvqd5/HistoryChecker?type=design&node-id=1%3A2&mode=design&t=ffdrgnmtJ92dZgeQ-1" />
      <button onClick={getData}>Auth Figma</button>
      <select id="selectVersion1" value={file1SelectedOption} onChange={onVersion1Changed}>
        {renderOptions()}
      </select>
      <select id="selectVersion2" value={file2SelectedOption} onChange={onVersion2Changed}>
        {renderOptions()}
      </select>

    </div>
    <div className='rowAvailable verticalLayout'>

      <ReactCompareSlider
        onlyHandleDraggable={true} className='verticalLayout'
        itemOne={
          <TransformWrapper ref={secondImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
            <TransformComponent wrapperClass='verticalLayout leftcanvas' contentClass='verticalLayout'>
              <Canvas2 name='LEFT' nodesWithImages={versionLeftNodesWithImages} canvasWidth={canvasMaxWidth} canvasHeight={canvasMaxHeight} offsetX={canvasOffsetX} offsetY={canvasOffsetY} containerClass='' />
            </TransformComponent>
          </TransformWrapper>
        }
        itemTwo={
          <TransformWrapper ref={firstImage} onTransformed={handleTransform} minScale={0.01} limitToBounds={false}>
            <TransformComponent wrapperClass='verticalLayout rightcanvas' contentClass='verticalLayout'>
              <Canvas2 name='RIGHT' nodesWithImages={versionRightNodesWithImages} canvasWidth={canvasMaxWidth} canvasHeight={canvasMaxHeight} offsetX={canvasOffsetX} offsetY={canvasOffsetY} containerClass='' />
            </TransformComponent>
          </TransformWrapper>
        }
      />

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
