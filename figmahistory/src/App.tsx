import React, { ChangeEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import { Routes, HashRouter, Route } from 'react-router-dom';
import axios from 'axios';
import ImageDiff from 'react-image-diff';
import ReactCompareImage from 'react-compare-image';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { globalState, setDocumentID, setAccessToken, setDocumentLeft, setDocumentRight, updateDocumentPageLeftChildrenAndFlatNodes, updateDocumentPageRightChildrenAndFlatNodes, setSelectedPageId, updateDocumentPageLeftFlatNodes, updateDocumentPageRightFlatNodes, updateDocumentPageRightBounds, updateDocumentPageLeftBounds, setSelectedNodeId, setUser, setDocumentName, setAppState, setAppTrialDaysLeft } from './globals';

import { User, Side, Color, Document, Version, Page, NodeWithImage, FigmaNode, Node, Difference, Rect, AppResponse, AppState, LicenseOverlayMode } from './types';

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
import LicenseOverlay from './LicenseOverlay';

const Start = () => {

  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  const figmaFileInputRef = useRef<HTMLDivElement>(null);
  const licenseOverlayTrialRef = useRef<HTMLDivElement>(null);
  const licenseOverlayKeyRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const comparerRef = useRef<ComparerRef>(null);

  const [onInputState, setOnInputState] = useState<boolean>(true);
  const [onLoadingState, setOnLoadingState] = useState<boolean>(false);
  const [onComparerState, setOnComparerState] = useState<boolean>(false);
  const [onTrialExpiredState, setOnTrialExpiredState] = useState<boolean>(false);
  const [onLicenseKeyInputState, setOnLicenseKeyInputState] = useState<boolean>(false);

  const [licenseValidationMessage, setLicenseValidationMessage] = useState<string>("");


  const [loaderMessage, setLoaderMessage] = useState<string>("Connecting to Figma");

  // #region Authentication and access


  function ProceedAsActiveUser() {
    if (comparerRef.current)
      comparerRef.current.fetchFigmaFiles();
  }

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
        if (responseObject) {
          const appResponse: AppResponse = responseObject.appResponse;

          if (appResponse) {
            setAppState(appResponse.state);
            setAppTrialDaysLeft(appResponse.trialDaysLeft);
            if (appResponse.user) setUser(appResponse.user);
            if (appResponse.token) setAccessToken(appResponse.token);

            switch (appResponse.state) {
              case AppState.ACTIVE:
                // console.log("User is active");
                ProceedAsActiveUser();
                break;

              case AppState.TRIAL_ACTIVE:
                // console.log("User is in active trial");
                ProceedAsActiveUser();
                break;

              case AppState.TRIAL_EXPIRED:
                // console.log("User trial already expired");
                setOnTrialExpiredState(true);
                break;

              case AppState.NOT_REGISTERED:
                // console.log("User is not registered");
                break;
            }
          }
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



  const closeLicenseOverlay = () => {
    setOnLicenseKeyInputState(false);
  }

  // async function getUser(): Promise<void> {

  //   const response = await fetch('https://api.figma.com/v1/me/', {
  //     method: 'GET',
  //     headers: {
  //       'Authorization': `Bearer ${globalState.accessToken}`
  //     }
  //   });

  //   if (response.ok) {
  //     const data = await response.json();
  //     setUser(data);
  //     setUserData(data);
  //   }
  // }

  // #endregion

  // #region Helpers

  const openPopupWindow = () => {

    const url = 'https://www.figma.com/oauth?client_id=pLCXoLFHH1UngPRH0ENGzV&redirect_uri=http://127.0.0.1:5002/callFigmaOAuth&scope=files:read&state=qpolpolq&response_type=code'; // Replace with your actual URL
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


  function onRegisterLicenseClick(): void {
    setOnLicenseKeyInputState(true);
  }

  function onActivateLicenseClick(licenseKey: string): void {
    const email = globalState.user.email;
    const token = globalState.accessToken;
    // console.log("We will try to activate license." + email + "," + token + "," + licenseKey)
    fetch('http://localhost:5002/activate-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token, licenseKey }),
    })
      .then(async response => {
        const responseObject = await response.json();
        if (responseObject) {
          if (responseObject.message == "License not valid") {
            console.log("License is not valid");
            setLicenseValidationMessage("Apparently the license key is not valid")
          }
          else if (responseObject.message == "License already used") {
            console.log("License already used");
            setLicenseValidationMessage("This license was already used for a different account")
          }
          else if (responseObject.message == "License was activated") {
            console.log("License was activated successfully")
            setLicenseValidationMessage("License was activated successfully")

            if (globalState.appState != AppState.TRIAL_ACTIVE) {
              ProceedAsActiveUser();
            }

            setAppState(AppState.ACTIVE);
            setOnTrialExpiredState(false);
            setOnLicenseKeyInputState(false);
          }
        }
      });

  }

  return <div className='gridExtender app'>

    <Loader ref={loaderRef} message={loaderMessage} className={`singleCellExtend animatedDiv invisible ${onLoadingState ? 'fadeIn' : 'fadeOut'}`} />
    <Comparer ref={comparerRef} gotDocumentName={gotDocumentName} initialLoadComplete={initialLoadComplete} onRegisterLicenseClick={onRegisterLicenseClick} className={`singleCellExtend animatedDiv invisible ${onComparerState ? 'fadeIn' : 'fadeOut'}`} />
    <FigmaFileInput ref={figmaFileInputRef} getDocument={getDocument} className={`singleCellExtend animatedDiv visible ${onInputState ? 'fadeIn' : 'fadeOut'}`} />
    <LicenseOverlay ref={licenseOverlayTrialRef} mode={LicenseOverlayMode.TRIAL_EXPIRED} onRegisterLicenseClick={onRegisterLicenseClick} className={`singleCellExtend animatedDiv invisible ${onTrialExpiredState ? 'fadeIn' : 'fadeOut'}`} />
    <LicenseOverlay ref={licenseOverlayKeyRef} mode={LicenseOverlayMode.INPUT_LICENSE_KEY} onActivateLicenseClick={onActivateLicenseClick} validationMessage={licenseValidationMessage}  goBack={closeLicenseOverlay} className={`singleCellExtend animatedDiv fast invisible ${onLicenseKeyInputState ? 'fadeIn' : 'fadeOut'}`} />

    <div className="logo">
      <ReactSVG src="/figmahistory/images/logo.svg" renumerateIRIElements={false} />
    </div>

    <div className={`userData alignVerticalCenter animatedDiv invisible ${globalState.user.img_url ? 'fadeIn' : 'fadeOut'}`}>
      <img src={globalState.user.img_url} />
      <span className='primaryText'>{globalState.user.handle}</span>
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






