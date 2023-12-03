import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
// import axios from 'axios';

const app = express();
const fetch = require('node-fetch');



app.use(cors());

const CLIENT_ID = "pLCXoLFHH1UngPRH0ENGzV";
const CLIENT_SECRET = "ofJNB7vNpSpy0zhDHKIt8pItQ3RMC1";
const REDIRECT_URI = "http://127.0.0.1:5002/callFigmaOAuth";

app.post('/get-figma-access-token', async (req, res) => {

    try {
        // Extract the code from the request body or wherever it is provided
        const code = req.body.code;

        // Create the request body as URLSearchParams
        const requestBody = new URLSearchParams();
        requestBody.append('client_id', CLIENT_ID);
        requestBody.append('client_secret', CLIENT_SECRET);
        requestBody.append('redirect_uri', REDIRECT_URI);
        requestBody.append('code', code);
        requestBody.append('grant_type', 'authorization_code');

        // Make a POST request to the Figma API to exchange the code for an access token
        const figmaResponse = await fetch('https://www.figma.com/api/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody,
        });

        // Handle the response from the Figma API
        const figmaData = await figmaResponse.json();

        // Your server logic...

        // Send a response back to your client
        res.status(200).json({ figmaData, yourServerData: "example" });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/callFigmaOAuth', async (req, res) => {
    try {

        const code = req.query.code;

        let responseData = {
            figmaSentCode: code,
        };
        res.send(`
            <script>
              window.opener.postMessage(${JSON.stringify(responseData)}, "*");
            </script>
          `);
    } catch (error: any) {
        console.error('Error calling Figma OAuth:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export const api = functions.https.onRequest(app);