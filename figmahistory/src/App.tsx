import React, { ChangeEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import { Routes, HashRouter, Route } from 'react-router-dom';
import axios from 'axios';
import ImageDiff from 'react-image-diff';
import ReactCompareImage from 'react-compare-image';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { globalState, setDocumentID, setAccessToken, setDocumentLeft, setDocumentRight, updateDocumentPageLeftChildrenAndFlatNodes, updateDocumentPageRightChildrenAndFlatNodes, setSelectedPageId, updateDocumentPageLeftFlatNodes, updateDocumentPageRightFlatNodes, updateDocumentPageRightBounds, updateDocumentPageLeftBounds, setSelectedNodeId, setUser, setDocumentName } from './globals';

import { User, Side, Color, Document, Version, Page, NodeWithImage, FigmaNode, Node, Difference, Rect } from './types';

import Canvas from './Canvas';
import './App.css';
import { timeout } from 'q';
import { positional } from 'yargs';
import { relative } from 'path';
import FigmaFileInput from './FigmaFileInput';
import Loader from './Loader';
import Comparer, { ComparerRef } from './Comparer';
import { node } from 'prop-types';
import { ReactSVG } from 'react-svg';

const Start = () => {

  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  const figmaFileInputRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const comparerRef = useRef<ComparerRef>(null);

  const [onInputState, setOnInputState] = useState<boolean>(true);
  const [onLoadingState, setOnLoadingState] = useState<boolean>(false);
  const [onComparerState, setOnComparerState] = useState<boolean>(false);


  const [loaderMessage, setLoaderMessage] = useState<string>("Connecting to Figma");


  const [userData, setUserData] = useState<User>();


  // #region Authentication and access

  const handleFigmaAuthentication = async (code: string) => {


    fetch('http://localhost:5002/get-figma-access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(async response => {
        const responseObject = await response.json();
        if (responseObject.figmaData.access_token) {
          setAccessToken(responseObject.figmaData.access_token);
          getUser();
          if (comparerRef.current)
            comparerRef.current.fetchFigmaFiles();
        }
      })
      .then(data => {
        // console.log(data) 
      })
      .catch(error => console.error('Error:', error));

  };


  const gotDocumentName = (name: string) => {
    setDocumentName(name);
    setLoaderMessage("Loading " + name);
  }

  const initialLoadComplete = () => {
    setOnInputState(false);
    setOnLoadingState(false);
    setOnComparerState(true);
  }


  const getDocument = (id: string, nodeId: string) => {
    setOnInputState(false);
    setOnLoadingState(true);
    setOnComparerState(false);


    setDocumentID(id);
    setSelectedNodeId(nodeId);


    if (globalState.accessToken && globalState.documentId) {
      if (comparerRef.current)
        comparerRef.current.fetchFigmaFiles();
    }
    else {
      openPopupWindow();
    }
  }

  async function getUser(): Promise<void> {

    const response = await fetch('https://api.figma.com/v1/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${globalState.accessToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data);
      setUserData(data);
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
    //TODO Retrieve token from storage
    // const token = "figu_c3F858MxN07ZBhWSXewYZglB_c_hGa4l0tx_MLrb";
    // setAccessToken(token);
    // getUser();
  }, []);



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




  return <div className='gridExtender app'>

    <Loader ref={loaderRef} message={loaderMessage} className={`singleCellExtend animatedDiv invisible ${onLoadingState ? 'fadeIn' : 'fadeOut'}`} />
    <Comparer ref={comparerRef} gotDocumentName={gotDocumentName} initialLoadComplete={initialLoadComplete} className={`singleCellExtend animatedDiv invisible ${onComparerState ? 'fadeIn' : 'fadeOut'}`} />
    <FigmaFileInput ref={figmaFileInputRef} getDocument={getDocument} className={`singleCellExtend animatedDiv visible ${onInputState ? 'fadeIn' : 'fadeOut'}`} />

    <div className="logo">
      <ReactSVG src="./figmahistory/images/logo.svg" renumerateIRIElements={false} />
    </div>

    <div className={`userData alignVerticalCenter animatedDiv invisible ${userData ? 'fadeIn' : 'fadeOut'}`}>
      <img src={userData?.img_url} />
      <span className='primaryText'>{userData?.handle}</span>
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





