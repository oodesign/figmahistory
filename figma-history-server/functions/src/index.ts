import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import * as admin from 'firebase-admin';
import { DocumentData, Timestamp } from 'firebase-admin/firestore'
// import axios from 'axios';

const app = express();
const fetch = require('node-fetch');



app.use(cors());

const CLIENT_ID = "pLCXoLFHH1UngPRH0ENGzV";
const CLIENT_SECRET = "ofJNB7vNpSpy0zhDHKIt8pItQ3RMC1";
const REDIRECT_URI = "https://us-central1-figma-history-server.cloudfunctions.net/api/callFigmaOAuth";//"http://127.0.0.1:5002/callFigmaOAuth";
const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id.firebaseio.com',
});

const firestore = admin.firestore();

enum AppState {
    NOT_REGISTERED,
    TRIAL_EXPIRED,
    TRIAL_ACTIVE,
    ACTIVE,
    LICENSE_DISABLED
}

interface User {
    id: string;
    handle: string;
    img_url: string;
    email: string;
};

interface AppResponse {
    state: AppState,
    user: User | undefined,
    token: string,
    trialDaysLeft: number
}

interface License {
    emails: string[];
    token: string;
    licenseKey: string;
    licenseType: string;
    activationDate: Timestamp
}

interface Trial {
    email: string;
    token: string;
    trialStartDate: Timestamp;
}

// interface User {
//     id: string;
//     handle: string;
//     img_url: string;
//     email: string;
// };

// interface TrialData {
//     email: string;
//     startDate: string;
// }


const addTrial = async (data: Trial): Promise<void> => {
    const trialsRef = admin.firestore().collection('Trials');
    await trialsRef.add(data);
};

const addLicense = async (data: License): Promise<void> => {
    const licensesRef = admin.firestore().collection('Licenses');
    await licensesRef.add(data);
};


async function getUser(token: string): Promise<User> {
    const response = await fetch('https://api.figma.com/v1/me/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}

async function getTrialFromEmailAndUpdateToken(email: string, newToken: string): Promise<Trial | null> {
    try {
        const trialsRef = firestore.collection('Trials');
        const querySnapshot = await trialsRef.where('email', '==', email).get();
        if (querySnapshot.empty) {
            return null; // No license found for the provided email
        }

        const trialDoc = querySnapshot.docs[0];
        const trialId = trialDoc.id;

        await trialsRef.doc(trialId).update({
            token: newToken,
        });

        const trialData = trialDoc.data() as Trial;
        return trialData;
    } catch (error) {
        console.error('Error checking license:', error);
        throw error;
    }
}

async function getLicenseFromKey(licenseKey: string): Promise<DocumentData | null> {
    try {
        const licensesRef = firestore.collection('Licenses');
        const querySnapshot = await licensesRef.where('licenseKey', '==', licenseKey).get();
        if (querySnapshot.empty) {
            return null; // No license found for the provided email
        }

        const licenseDoc = querySnapshot.docs[0];

        return licenseDoc;
    } catch (error) {
        console.error('Error checking license:', error);
        throw error;
    }
}

async function getLicenseFromEmailAndUpdateToken(email: string, newToken: string): Promise<License | null> {
    try {
        const licensesRef = firestore.collection('Licenses');
        //const querySnapshot = await licensesRef.where('email', '==', email).get();
        const querySnapshot = await licensesRef.where('emails', 'array-contains', email).get();
        if (querySnapshot.empty) {
            return null; // No license found for the provided email
        }

        const licenseDoc = querySnapshot.docs[0];
        const licenseId = licenseDoc.id;

        await licensesRef.doc(licenseId).update({
            token: newToken,
        });

        const licenseData = licenseDoc.data() as License;
        licenseData.token = newToken;

        return licenseData;
    } catch (error) {
        console.error('Error checking license:', error);
        throw error;
    }
}

function isTrialActive(trial: Trial) {
    const currentDate = Timestamp.now().toDate();
    const differenceInMilliseconds = currentDate.getTime() - trial.trialStartDate.toDate().getTime();

    const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    const isActive = differenceInMilliseconds < sevenDaysInMilliseconds;

    return isActive;
}

async function getGumroadLicense(licenseKey: string): Promise<any> {
    const apiUrl = `https://api.gumroad.com/v2/licenses/verify`;

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: 'FeA6PPl3A7Bameb0qrAbMw==',
            license_key: licenseKey,
        }),
    };

    try {
        const response = await fetch(apiUrl, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        // Handle errors, log or return false if the license is not valid
        return false;
    }
}

function getTrialDaysLeft(timestamp: Timestamp) {
    const trialDurationDays = 7;
    const millisecondsInDay = 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds

    const currentDate = new Date();
    const trialStartDate = timestamp.toDate();

    const elapsedTime = currentDate.getTime() - trialStartDate.getTime();
    const remainingTime = trialDurationDays * millisecondsInDay - elapsedTime;

    if (remainingTime > 0) {
        const remainingDays = Math.ceil(remainingTime / millisecondsInDay);
        return remainingDays;
    } else {
        return 0; // Trial has expired
    }
}

app.post('/activate-license', async (req, res) => {

    try {
        // Extract the code from the request body or wherever it is provided
        const email = req.body.email;
        const token = req.body.token;
        const licenseKey = req.body.licenseKey;

        //console.log("Activating license!" + email + "," + token + "," + licenseKey)


        //Check license key on Gumroad platform
        const gumroadlicenseResponse = await getGumroadLicense(licenseKey);
        if (gumroadlicenseResponse.success) {
            const licenseType = gumroadlicenseResponse.purchase.variants;

            //TODO  CHECK IF LICENSE ALREADY EXISTS. DEPENDING ON IT RETURN MESSAGE MAY BE DIFFERENT
            let licenseData: License | null = null;
            const fbLicense = await getLicenseFromKey(licenseKey);
            if (fbLicense) {
                //If license already exists in Firebase, check if it's single or team license
                let licenseData = fbLicense.data() as License;
                if (licenseData.licenseType == "(Team license)") {
                    //If team license, add the email in the authorized emails array (if it's not there already)
                    if (!licenseData.emails.includes(email)) {
                        const licensesRef = firestore.collection('Licenses');
                        //console.log("License exists. Updating authorized emails of:" + fbLicense.id)
                        await licensesRef.doc(fbLicense.id).update({
                            emails: [...licenseData.emails, email]
                        });
                    }

                    res.status(200).json({ message: "License was activated", licenseData: JSON.stringify(licenseData) });

                } else if (licenseData.licenseType == "(Single license)") {
                    //If license exists and is single, check if it's same user or not.
                    if (licenseData.emails.includes(email)) {

                        res.status(200).json({ message: "License was activated", licenseData: JSON.stringify(licenseData) });
                    } else {
                        //If email is not in, the license key was used to activate a different account.
                        res.status(200).json({ message: "License already used" });
                    }
                }
            }
            else {
                //If license doesn't exist in Firebase then needs to be created.
                addLicense({
                    emails: [email],
                    token: token,
                    licenseKey: licenseKey,
                    licenseType: licenseType,
                    activationDate: Timestamp.now()
                })
                licenseData = {
                    emails: [email],
                    token: token,
                    licenseKey: licenseKey,
                    licenseType: licenseType,
                    activationDate: Timestamp.now()
                }
                res.status(200).json({ message: "License was activated", licenseData: JSON.stringify(licenseData) });
            }

        }
        else {
            res.status(200).json({ message: "License not valid" });
        }


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


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

        let appResponse: AppResponse = {
            state: AppState.NOT_REGISTERED,
            user: undefined,
            token: '',
            trialDaysLeft: 0
        }

        // Handle the response from the Figma API
        const figmaData = await figmaResponse.json();
        //console.log("Getting user")
        const user = await getUser(figmaData.access_token);
        if (user) {
            appResponse.user = user;
            //console.log("Getting license from email. Email is:" + user.email)
            const license = await getLicenseFromEmailAndUpdateToken(user.email, figmaData.access_token);
            if (license) {
                const gumroadlicenseResponse = await getGumroadLicense(license.licenseKey);
                if (gumroadlicenseResponse.success) {
                    appResponse.state = AppState.ACTIVE;
                    appResponse.token = license.token;
                    //console.log("User was already registered. Here license data:");
                }
                else {
                    appResponse.state = AppState.LICENSE_DISABLED;
                    appResponse.token = "";
                }
            }
            else {
                //console.log("Getting trial from email. Email is:" + user.email)
                const trial = await getTrialFromEmailAndUpdateToken(user.email, figmaData.access_token);
                //console.log(trial);
                if (trial) {
                    const trialActive = isTrialActive(trial);
                    appResponse.state = trialActive ? AppState.TRIAL_ACTIVE : AppState.TRIAL_EXPIRED;
                    appResponse.token = figmaData.access_token;
                    appResponse.trialDaysLeft = getTrialDaysLeft(trial.trialStartDate);
                    //console.log("User is in trial." + (trialActive ? "Trial is active" : "But trial has expired") + ". Here trial data:");
                    //console.log(trial);
                }
                else {
                    //console.log("User is not registered. Let's enable a free trial");
                    addTrial({
                        email: user.email,
                        token: figmaData.access_token,
                        trialStartDate: Timestamp.now()
                    });
                    appResponse.state = AppState.TRIAL_ACTIVE;
                    appResponse.token = figmaData.access_token;
                    appResponse.trialDaysLeft = getTrialDaysLeft(Timestamp.now());
                }
            }

        }

        // Send a response back to your client
        res.status(200).json({ appResponse });


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/callFigmaOAuth', async (req, res) => {
    try {

        console.error("Woooo this is server callFigmaOAuth")
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