import React, { ChangeEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import { Routes, HashRouter, Route } from 'react-router-dom';
import axios from 'axios';
import ImageDiff from 'react-image-diff';
import ReactCompareImage from 'react-compare-image';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { globalState, setDocumentID, setAccessToken, setDocumentLeft, setDocumentRight, updateDocumentPageLeftChildrenAndFlatNodes, updateDocumentPageRightChildrenAndFlatNodes, setSelectedPageId, updateDocumentPageLeftFlatNodes, updateDocumentPageRightFlatNodes, updateDocumentPageRightBounds, updateDocumentPageLeftBounds, setSelectedNodeId, } from './globals';

import { User, Side, Color, Document, Version, Page, NodeWithImage, FigmaNode, Node, Difference, Rect } from './types';

import Canvas2 from './Canvas2';
import './App.css';
import { timeout } from 'q';
import { positional } from 'yargs';
import { relative } from 'path';
import FigmaFileInput from './FigmaFileInput';
import Loader from './Loader';
import Comparer, { ComparerRef } from './Comparer';
import { node } from 'prop-types';

const Start = () => {

  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  const figmaFileInputRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const comparerRef = useRef<ComparerRef>(null);

  const [onInputState, setOnInputState] = useState<boolean>(true);
  const [onLoadingState, setOnLoadingState] = useState<boolean>(false);
  const [onComparerState, setOnComparerState] = useState<boolean>(false);


  const [loaderMessage, setLoaderMessage] = useState<string>("Loading");


  // #region Authentication and access

  const handleFigmaAuthentication = async (code: string) => {

    let figmaDocumentInfo = "";//TODO Review calls when going through this path --> getFigmaDocumentInfo();
    let figmaDocumentId = "";//TODO Review calls when going through this path --> figmaDocumentInfo.id;
    let figmaDocumentNodeId = "";//TODO Review calls when going through this path --> figmaDocumentInfo.nodeId;

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

        setDocumentID(figmaDocumentId);

        if (figmaDocumentNodeId)
          setSelectedNodeId(figmaDocumentNodeId);

        //TODO Review calls when going through this path --> fetchFigmaFiles();
      })
      .then(data => {
        // console.log(data) 
      })
      .catch(error => console.error('Error:', error));

  };


  const gotDocumentName = (name: string) => {
    setLoaderMessage("Loading " + name);
  }


  const getDocument = (id: string, nodeId: string) => {
    console.log("Getting data! id:" + id + ", nodeId:" + nodeId)
    setOnInputState(false);
    setOnLoadingState(true);
    setOnComparerState(false);
    //TODO Retrieve token from storage
    const token = "figu_c3F858MxN07ZBhWSXewYZglB_c_hGa4l0tx_MLrb";

    let figmaDocumentId = id;
    let figmaDocumentNodeId = nodeId;


    if (token && figmaDocumentId) {
      // console.log("Token is known")
      setAccessToken(token);
      setDocumentID(figmaDocumentId);

      if (figmaDocumentNodeId)
        setSelectedNodeId(figmaDocumentNodeId);

      if (comparerRef.current)
        comparerRef.current.fetchFigmaFiles();
    }
    else {
      openPopupWindow();
    }
  }

  // #endregion

  // #region Helpers

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




  return <div className='gridExtender'>

    <FigmaFileInput ref={figmaFileInputRef} getDocument={getDocument} className={`singleCellExtend animatedDiv visible ${onInputState ? 'fadeIn' : 'fadeOut'}`} />
    <Loader ref={loaderRef} message={loaderMessage} className={`singleCellExtend animatedDiv invisible ${onLoadingState ? 'fadeIn' : 'fadeOut'}`} />
    <Comparer ref={comparerRef} gotDocumentName={gotDocumentName} className={`singleCellExtend animatedDiv invisible ${onComparerState ? 'fadeIn' : 'fadeOut'}`} />


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





