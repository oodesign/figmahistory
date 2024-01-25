import React, { SyntheticEvent, useRef } from 'react';
import { ReactCompareSlider, useReactCompareSliderRef } from 'react-compare-slider';

interface FigmaFileInputProps {
    getDocument: (id: string, nodeId: string) => void;
    className: string;
}

const FigmaFileInput: React.ForwardRefRenderFunction<HTMLDivElement, FigmaFileInputProps> = (props, ref) => {


    const reactCompareSliderRef = useReactCompareSliderRef();

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



    function setSliderPosition(event: SyntheticEvent<HTMLDivElement, Event>): void {
        if (reactCompareSliderRef.current) {
            reactCompareSliderRef.current.setPosition(50);
            setTimeout(() => {
                reactCompareSliderRef.current.setPosition(75);
            }, 1000);
        }
    }

    return (

        <div className={`${props.className} verticalLayout figmaFileInput`}>
            <div className="alignFullCenter verticalLayout">
                <div className='rowAuto logoSlider'>
                    <ReactCompareSlider ref={reactCompareSliderRef} onLoad={setSliderPosition} transition="1s ease-in-out" position={100}

                        itemOne={
                            <div className="extend innerCanvas">
                                <img src="./figmahistory/images/logoSlider.png" />
                            </div>
                        }
                        itemTwo={
                            <div className="extend innerCanvas">
                                <img src="./figmahistory/images/logoSlider2.png" />
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
                <div className="rowAuto secondaryText">
                    Access to your designs is solely used for comparison rendering.<br />
                    We do not (and will never) store, analyze, or share your designs. We do not track analytics. <br />
                    Your designs are, and will continue to be, just for your eyes.
                </div>
            </div>
        </div>
    );
};

export default React.forwardRef(FigmaFileInput);
