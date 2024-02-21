import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, useReactCompareSliderRef } from 'react-compare-slider';
import { ReactSVG } from 'react-svg';
import { LicenseOverlayMode } from './types';
import { globalState } from './globals';


interface LicenseOverlayProps {
    goBack?: () => void;
    onRegisterLicenseClick?: () => void;
    onActivateLicenseClick?: (licenseKey: string) => void;
    className: string;
    mode: LicenseOverlayMode;
    validationMessage?: string
    isActivating?: boolean
    activationSuccessful?: boolean
}

const LicenseOverlay: React.ForwardRefRenderFunction<HTMLDivElement, LicenseOverlayProps> = (props, ref) => {

    const [localMode, setLocalMode] = useState<LicenseOverlayMode>(LicenseOverlayMode.TRIAL_EXPIRED);
    const [localValidationMessage, setLocalValidationMessage] = useState<string>("");

    useEffect(() => {
        setLocalMode(props.mode)
    }, [props.mode]);

    useEffect(() => {
        if (props.validationMessage)
            setLocalValidationMessage(props.validationMessage)
    }, [props.validationMessage]);


    function goBack(): void {
        if (props.goBack)
            props.goBack();
    }

    function registerLicense(): void {
        if (props.onRegisterLicenseClick)
            props.onRegisterLicenseClick();
    }

    function onActivateLicense(): void {
        const inputElement = document.getElementById("licenseInput") as HTMLInputElement;
        const inputLicense = inputElement.value;

        const regex = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{8}-[a-zA-Z0-9]{8}-[a-zA-Z0-9]{8}$/
        const matches = inputLicense.match(regex);

        if (!matches) {
            //TODO Handle incorrect format error
            // return { id: "", nodeId: "" };
            console.log("License format is not correct")
            setLocalValidationMessage("The license key format is not correct")
        }
        else {
            if (props.onActivateLicenseClick)
                props.onActivateLicenseClick(inputLicense);
        }
    }

    return (

        <div className={`${props.className} verticalLayout licenseOverlay`}>
            <div className="mainContent alignVCenter verticalLayout">
                <div className='rowAuto logoBig'>
                    <ReactSVG src="/figmahistory/images/logoBig.svg" renumerateIRIElements={false} />
                </div>

                {localMode == LicenseOverlayMode.TRIAL_EXPIRED ? (
                    <div className="rowAuto">
                        <div className='verticalLayout'>
                            <div className="rowAuto primaryText">
                                Wop! Looks like your trial is over now.
                            </div>
                            <div className="rowAuto primaryText">
                                If you'd like to continue the magic we'd like to suggest one of two flavours:
                            </div>
                            <div className="rowAuto options">
                                <a href="https://oodesign.gumroad.com/l/figmahistory?option=x8JwFOfp2eKY-GgXKSg2aA%3D%3D&_gl=1*1xpb5kb*_ga*MTUwNTk1MDE5OS4xNjc4MTAzNjAz*_ga_6LJN6D94N6*MTcwODMyNDE5OC44NC4wLjE3MDgzMjQyMDIuMC4wLjA." target="_blank">
                                    <button className='btnPrimary large'>Get a single license</button>
                                </a>
                                <a href="https://oodesign.gumroad.com/l/figmahistory?option=R67uvQjSzl_CPgpdXWJplg%3D%3D&_gl=1*184pbn5*_ga*MTUwNTk1MDE5OS4xNjc4MTAzNjAz*_ga_6LJN6D94N6*MTcwODMyNDE5OC44NC4wLjE3MDgzMjQyMDIuMC4wLjA." target="_blank">
                                    <button className='btnSecondary large'>Get a team license</button>
                                </a>
                                <button className='btnTertiary large' onClick={registerLicense}>I already have a license!</button>
                            </div>

                            <div className="rowAuto secondaryText">
                                Please note that Figma history is currently in open Beta, and some glitches may still occur 😉 .
                            </div>
                        </div>
                    </div>
                ) : ""}


                {localMode == LicenseOverlayMode.INPUT_LICENSE_KEY ? (
                    <div className="rowAuto">
                        <div className='verticalLayout'>
                            <div className="rowAuto primaryText">
                                If you acquired a license on <a href="https://oodesign.gumroad.com/l/figmahistory?option=x8JwFOfp2eKY-GgXKSg2aA%3D%3D&_gl=1*1xpb5kb*_ga*MTUwNTk1MDE5OS4xNjc4MTAzNjAz*_ga_6LJN6D94N6*MTcwODMyNDE5OC44NC4wLjE3MDgzMjQyMDIuMC4wLjA." target="_blank">
                                    Gumroad</a> you may have received an email with your license key.
                            </div>
                            <div className="rowAuto primaryText">
                                Please type in your license key below to activate your license.
                            </div>
                            <div className="rowAuto inputForm">
                                <div className="rowAuto label secondaryText">
                                    License key
                                </div>
                                <div className="rowAuto">
                                    <div className=" horizontalLayout">
                                        <form className="colAvailable displayFlex">
                                            <input
                                                id="licenseInput"
                                                type="text"
                                                autoFocus
                                                placeholder="00000000-00000000-00000000-00000000"
                                                className='linkUrlInput displayFlex colAvailable'
                                            />
                                        </form>
                                        <div className="colAuto">
                                            <button className={`btnPrimary large btnActivate ${props.activationSuccessful ? 'success' : ''}`} onClick={onActivateLicense} disabled={props.isActivating}>
                                                <div className="horizontalLayout alignFlexHorizontalCenter">
                                                    <div className="textContent colAuto alignFullCenterAndCenterText">
                                                        {props.activationSuccessful ? "License is active" : props.isActivating ? "Activating" : "Activate license"}
                                                    </div>
                                                    <div id="indeterminateLoader" className={`colAuto alignVCenter indeterminateLoader small negative show ${props.isActivating ? '' : 'notDisplayed'}`}>
                                                        <div className="dualRingLoader"></div>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className={`rowAuto  ${props.activationSuccessful ? 'successText' : 'errorText'}`}>
                                    {localValidationMessage}
                                </div>
                            </div>

                            <div className="rowAuto secondaryText">
                                <button className='btnSecondary large' onClick={goBack}>Go back</button>
                            </div>
                        </div>
                    </div>
                ) : ""}



            </div>
        </div>
    );
};

export default React.forwardRef(LicenseOverlay);
