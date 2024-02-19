import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, useReactCompareSliderRef } from 'react-compare-slider';
import { ReactSVG } from 'react-svg';

interface FigmaFileInputProps {
    getDocument: (id: string, nodeId: string) => void;
    className: string;
}

const FigmaFileInput: React.ForwardRefRenderFunction<HTMLDivElement, FigmaFileInputProps> = (props, ref) => {


    const reactCompareSliderRef = useReactCompareSliderRef();
    const [isLogoAnimated, setIsLogoAnimated] = useState<boolean>(true);
    const [clipPath, setClipPath] = useState<string | undefined>(/* initial clip-path */);


    const getFigmaDocumentInfo = () => {
        const inputElement = document.getElementById("figmaFileURL") as HTMLInputElement;
        const inputURL = inputElement.value;

        const regex = /^((http|https):\/\/)?(www\.)?figma\.com\/file\/([a-zA-Z0-9]{22})(?:.*node-id=([0-9]+-[0-9]+))?/
        const matches = inputURL.match(regex);

        if (!matches) {
            //TODO Handle incorrect format error
            // return { id: "", nodeId: "" };
        }
        else {
            const id = matches[4] || "";
            let nodeId = matches[5] || "";
            nodeId = nodeId.replace("-", ":")

            if (id) {
                props.getDocument(id, nodeId);
            }
            else {
                //TODO Handle incorrect format error
            }

        }
    }

    useEffect(() => {
        const fireTransition = async () => {
            await new Promise(resolve => setTimeout(() => {
                reactCompareSliderRef.current.setPosition(50);
                resolve(true);
            }, 100));
            await new Promise(resolve => setTimeout(() => {
                reactCompareSliderRef.current.setPosition(75);
                resolve(true);
            }, 750));
            await new Promise(resolve => setTimeout(() => {
                setIsLogoAnimated(false);
                resolve(true);
            }, 850));
        };
        fireTransition();
    }, [reactCompareSliderRef]);

    function onSliderPositionChange(position: number): void {
        const calculatedClipPath = `polygon(0% 0%, ${position}% 0%, ${position}% 100%, 0% 100%)`;
        setClipPath(calculatedClipPath);
    }

    return (

        <div className={`${props.className} verticalLayout figmaFileInput`}>
            <div className="alignVCenter verticalLayout">
                <div className='rowAuto logoSlider'>
                    <ReactCompareSlider ref={reactCompareSliderRef} transition="0.75s ease-in-out" position={100} onPositionChange={onSliderPositionChange} onlyHandleDraggable
                        itemOne={
                            <div className={`extend front ${isLogoAnimated ? 'animated' : ''}`} style={{ clipPath }}>
                                <ReactSVG src="/figmahistory/images/logoSlider.svg" renumerateIRIElements={false} />
                            </div>
                        }
                        itemTwo={
                            <div className="extend back">
                                <ReactSVG src="/figmahistory/images/logoSlider.svg" renumerateIRIElements={false} />
                            </div>
                        }
                    />
                </div>

                <div className="rowAuto inputForm">
                    <div className="rowAuto label secondaryText">
                        Paste your Figma file link below
                    </div>
                    <div className="rowAuto horizontalLayout">
                        <form className="colAvailable displayFlex" onSubmit={getFigmaDocumentInfo}>
                            <input
                                id="figmaFileURL"
                                type="text"
                                autoFocus
                                placeholder="In Figma, click 'Share' and 'Copy link', and paste the link here"
                                className='linkUrlInput displayFlex colAvailable'
                                defaultValue="https://www.figma.com/file/HTUxsQSO4pR1GCvv8Nvqd5/HistoryChecker?type=design&node-id=1%3A2&mode=design&t=ffdrgnmtJ92dZgeQ-1"
                            />
                        </form>
                        <div className="colAuto">
                            <button className='btnPrimary large' onClick={getFigmaDocumentInfo}>Compare</button>
                        </div>
                    </div>
                </div>
                <div className="rowAuto secondaryText spaced">
                    Access to designs is only used for comparison rendering.<br />
                    We do not (and will never) store, analyze, or share your designs. We do not track analytics. <br />
                    Your designs are (and will continue to be) just for your eyes.
                </div>
            </div>
        </div>
    );
};

export default React.forwardRef(FigmaFileInput);
