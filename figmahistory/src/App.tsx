import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import { Routes, HashRouter, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';


const Start = () => {

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFigmaAuthentication = async (code: string) => {

    console.log("Try post call");
    fetch('http://localhost:5002/get-figma-access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  };

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

  useEffect(() => {
    const handlePopupData = (event: MessageEvent) => {
      // Check if the event data contains the parameters you expect
      if (event.data && event.data.figmaSentCode) {
        // Handle the received parameters
        console.log('Received parameters:', event.data.figmaSentCode);
        handleFigmaAuthentication(event.data.figmaSentCode);

        // Close the popup window
        if (popupWindow) {
          popupWindow.close();
        } else {
          console.log("popupWindow seems to be null");
          console.log(popupWindow);
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
    <button onClick={openPopupWindow}>Auth Figma</button>
    <br /><br /><br />
    Token or error:
    {accessToken && <p>Access Token: {accessToken}</p>}
    {error && <p>Error: {error}</p>}
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
