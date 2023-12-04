import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import { Routes, HashRouter, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';


const Start = () => {

  const [documentID, setDocumentID] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [error, setError] = useState<string | null>(null);


  const FigmaAPIKey = "figd_RRFsYn0yPhRclt5nVvlfYPEdyazwfwlyPulZQBqc"

  async function figmaFileFetch(fileId: string) {

  }

  async function fetchAllVersions(documentIDReceived: string, accessTokenReceived: string): Promise<any[]> {
    const versions: any[] = [];

    async function fetchPage(url: string | undefined): Promise<void> {
      console.log("Fetching url: "+url);
      if (url) {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessTokenReceived}` // Replace FigmaAPIKey with your actual access token
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data)
          versions.push(...data.versions);

          // Continue fetching if there is a previous page
          console.log("-- Has more pages? NextPage is:"+data.pagination.next_page)
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

  // Usage in a React component or elsewhere in your TypeScript code
  const fetchFigmaFiles = async (documentIDReceived: string, accessTokenReceived: string) => {

    console.log("Document ID is:" + documentIDReceived);
    console.log("accessToken is:" + accessTokenReceived);

    let result = await fetch('https://api.figma.com/v1/files/' + documentIDReceived + "/versions", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessTokenReceived}` // Replace FigmaAPIKey with your actual access token
      }
    })

    let figmaFileStruct = await result.json()

    console.log(figmaFileStruct);
    const allVersions = await fetchAllVersions(documentIDReceived, accessTokenReceived);


    console.log(allVersions);

    let file1Id = figmaFileStruct.versions[0].id;
    let file2Id = figmaFileStruct.versions[3].id;
    console.log("Comparing " + file1Id + " vs. " + file2Id);



    return figmaFileStruct
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
    const token = "figu_aHdxX0k17O-wXPovNOqY85Tw-aFPpSQQrsxIoEiz";

    let figmaDocumentID = getFigmaDocumentID();
    console.log("Document IDs is:" + figmaDocumentID);
    if (figmaDocumentID) setDocumentID(figmaDocumentID);

    if (token && figmaDocumentID) {
      console.log("Token is known")
      setAccessToken(token);
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


  return <div>
    <input id="figmaFileURL" type='text' placeholder='Paste your Figma URL here' defaultValue="https://www.figma.com/file/58J9lvktDn7tFZu16UDJHl/Dolby-pHRTF---Capture-app---No-Cloud?type=design&node-id=10163%3A65721&mode=design&t=6n0ZrLO9YyM2lHjb-1" />
    <button onClick={getData}>Auth Figma</button>

  </div>;
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