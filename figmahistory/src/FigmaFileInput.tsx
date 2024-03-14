import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage, useReactCompareSliderRef } from 'react-compare-slider';
import { ReactSVG } from 'react-svg';
import { globalState } from './globals';
import { Tooltip as ReactTooltip } from "react-tooltip";

interface FigmaFileInputProps {
    getDocument: (id: string, branchId: string, nodeId: string) => void;
    validationMessage?: string;
    className: string;
}

const FigmaFileInput: React.ForwardRefRenderFunction<HTMLDivElement, FigmaFileInputProps> = (props, ref) => {


    const reactCompareSliderRef = useReactCompareSliderRef();
    const [isLogoAnimated, setIsLogoAnimated] = useState<boolean>(true);
    const [clipPath, setClipPath] = useState<string | undefined>(/* initial clip-path */);
    const [localValidationMessage, setLocalValidationMessage] = useState<string>("");



    const [viewComparer_showOverlay, setViewComparer_showOverlay] = useState<boolean>(true);


    const [showSections, setShowSections] = useState<boolean>(true);
    const [showFrames, setShowFrames] = useState<boolean>(true);
    const [showComponents, setShowComponents] = useState<boolean>(true);
    const [showInstances, setShowInstances] = useState<boolean>(true);
    const [showGroups, setShowGroups] = useState<boolean>(false);
    const [showText, setShowText] = useState<boolean>(false);
    const [showShapes, setShowShapes] = useState<boolean>(false);

    useEffect(() => {
        if (props.validationMessage) setLocalValidationMessage(props.validationMessage);
    }, [props.validationMessage]);

    const getFigmaDocumentInfo = () => {
        const inputElement = document.getElementById("figmaFileURL") as HTMLInputElement;
        const inputURL = inputElement.value;

        const regex = /^((http|https):\/\/)?(www\.)?figma\.com\/file\/([a-zA-Z0-9]{22})(?:\/branch\/([a-zA-Z0-9]+))?(?:.*node-id=([0-9]+%3A[0-9]+))?/;
        const matches = inputURL.match(regex);

        if (!matches) {
            setLocalValidationMessage("This link doesn't seem to belong to a Figma file");
        }
        else {
            const id = matches[4] || "";
            const branchId = matches[5] || "";
            let nodeId = matches[6] || "";
            nodeId = nodeId.replace("-", ":")


            if (id || branchId) {
                props.getDocument(id, branchId, nodeId);
            }
            else {
                //TODO Handle incorrect format error
            }

        }
    }

    // useEffect(() => {
    //     const fireTransition = async () => {
    //         await new Promise(resolve => setTimeout(() => {
    //             reactCompareSliderRef.current.setPosition(50);
    //             resolve(true);
    //         }, 100));
    //         await new Promise(resolve => setTimeout(() => {
    //             reactCompareSliderRef.current.setPosition(75);
    //             resolve(true);
    //         }, 750));
    //         await new Promise(resolve => setTimeout(() => {
    //             setIsLogoAnimated(false);
    //             resolve(true);
    //         }, 850));
    //     };
    //     fireTransition();
    // }, [reactCompareSliderRef]);

    function onSliderPositionChange(position: number): void {
        const calculatedClipPath = `polygon(0% 0%, ${position}% 0%, ${position}% 100%, 0% 100%)`;
        setClipPath(calculatedClipPath);
    }

    function chooseView(option: number): void {
        setViewComparer_showOverlay(option == 0);
    }



    function onDiffChange(type: string): void {

        switch (type) {
            case 'sections':
                setShowSections(!showSections);
                break;
            case 'frames':
                setShowFrames(!showFrames);
                break;
            case 'components':
                setShowComponents(!showComponents);
                break;
            case 'instances':
                setShowInstances(!showInstances);
                break;
            case 'groups':
                setShowGroups(!showGroups);
                break;
            case 'text':
                setShowText(!showText);
                break;
            case 'shapes':
                setShowShapes(!showShapes);
                break;
        }
    }


    return (

        <div className={`${props.className}  mainSite scrollable`}>
            <div className='content verticalLayout'>
                <div className='rowAuto hero'>
                    <div className='verticalLayout'>
                        <div className='rowAuto alignHorizontalCenter logoCircle'>
                            <ReactSVG src={globalState.urlPaths + "/images/logoCircle.svg"} renumerateIRIElements={false} />
                        </div>
                        <div className='rowAuto alignHorizontalCenter productName'>
                            <h3>Figma history</h3>
                        </div>
                        <div className='rowAuto alignHorizontalCenter title'>
                            <h1><span>What has </span><span className='decorated'>changed</span><span> in the design since the last time </span><span className='decorated'>you saw it</span><span> ?</span></h1>
                        </div>
                        <div className='rowAuto alignHorizontalCenter subtitle'>
                            <h6>Easily see and compare different versions of a Figma file</h6>
                        </div>
                        <div className='rowAuto alignHorizontalCenter linkUrlInput'>
                            <div className="horizontalLayout">
                                <div className="colAvailable inputField">
                                    <input
                                        id="figmaFileURL"
                                        type="text"
                                        autoFocus
                                        placeholder="In Figma, click 'Share' and 'Copy link', and paste the link here"
                                        className=' displayFlex'
                                    />
                                </div>
                                <div className="colAuto">
                                    <button className='btnPrimary' onClick={getFigmaDocumentInfo}>Compare</button>
                                </div>
                            </div>
                        </div>
                        <div className="rowAuto errorText">
                            {localValidationMessage}
                        </div>
                    </div>
                </div>

                <div className='rowAuto comparer'>
                    <div className='screen'>
                        <div className='content'>
                            <ReactCompareSlider ref={reactCompareSliderRef} transition="0.75s ease-in-out" position={50} boundsPadding={20} onlyHandleDraggable
                                itemOne={
                                    <ReactCompareSliderImage src="./images/comparisonNew.png" alt="Newer version showing differences with previous one" />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src="./images/comparisonOld.png" alt="Older version showing differences with the new one" />
                                }
                            />
                        </div>
                    </div>
                    <div className="rowAuto imageNote">
                        Design inspired on the <a href="https://www.figma.com/community/file/1013369588870007180">Travel App UI UX Exploration</a> design, by <a href="https://www.figma.com/@febysbl">Feby Sabihul Hanafi</a>, in the Figma community.
                    </div>
                </div>

                <div className='rowAuto leftContentBlock'>
                    <div className='left '>
                        <div className='rowAuto blockTitle'>
                            <h1>Overlay and <br />side by side views</h1>
                        </div>
                        <div className='rowAuto blockDescription'>
                            <p><span className='highlight'>Overlaying</span> both versions is super handy to easily spot or show what changed to stakeholders.</p>

                            <p>But... when it's about A/B-ing or going for detail <span className='highlight'>Side by side</span> is definitely a winner.</p>

                            <p>Oh my! Can't pick just one! 🤩</p>
                        </div>
                    </div>
                    <div className={`right verticalLayout`}>
                        <div className={`rowAuto blockComparer alignHorizontalCenter ${viewComparer_showOverlay ? '' : 'notDisplayed'}`}>
                            <ReactCompareSlider ref={reactCompareSliderRef} transition="0.75s ease-in-out" position={50} onlyHandleDraggable
                                itemOne={
                                    <ReactCompareSliderImage src="./images/views_Overlay_New.png" alt="Newer version showing differences with previous one" />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src="./images/views_Overlay_Old.png" alt="Older version showing differences with the new one" />
                                }
                            />
                        </div>
                        <div className={`rowAuto blockImage ${!viewComparer_showOverlay ? '' : 'notDisplayed'}`}>
                            <img src="./images/views_Sidebyside.png" alt="Both versions presented side by side and showing differences between both" />
                        </div>
                        <div className='rowAuto '>
                            <div className='horizontalLayout alignFullCenter'>
                                <button className={`btnSecondary ${viewComparer_showOverlay ? 'checked' : ''} optionButton`} onClick={() => chooseView(0)} >Overlay</button>
                                <button className={`btnSecondary ${!viewComparer_showOverlay ? 'checked' : ''}`} onClick={() => chooseView(1)}>Side by side</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='rowAuto leftContentBlock'>
                    <div className='left '>
                        <div className={`rowAuto blockImage`}>
                            <img src="./images/types_Base.png" alt="Two frames of a design" />
                        </div>

                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showSections ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Sections.png" alt="Two frames of a design" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showFrames ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Frames.png" alt="Two frames of a design" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showComponents ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Components.png" alt="Two frames of a design" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showInstances ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Instances.png" alt="Two frames of a design" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showGroups ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Groups.png" alt="Two frames of a design" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showText ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Texts.png" alt="Two frames of a design" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showShapes ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Shapes.png" alt="Two frames of a design" />
                        </div>

                    </div>
                    <div className='right '>
                        <div className='rowAuto blockTitle'>
                            <h1>Pick which elements you want to show changes for</h1>
                        </div>
                        <div className='rowAuto blockDescription'>
                            <p>Designs change a lot from version to version. From entire frames to tiny tweaks in texts. And sometimes showing all changes... well, may be a bit overwhelming.</p>
                            <p>So feel free to pick just the ones you care about.</p>
                            <div className="horizontalLayout rightElements">
                                <button className={`colAuto btnSecondary iconButton ${showSections ? 'checked' : ''}`} onClick={() => onDiffChange('sections')} data-tooltip-id="showDiffSectionsTooltip">
                                    <ReactSVG src={globalState.urlPaths + "/images/sectionIcon.svg"} />
                                </button>
                                <button className={`colAuto btnSecondary iconButton ${showFrames ? 'checked' : ''}`} onClick={() => onDiffChange('frames')} data-tooltip-id="showDiffFramesTooltip">
                                    <ReactSVG src={globalState.urlPaths + "/images/frameIcon.svg"} />
                                </button>
                                <button className={`colAuto btnSecondary iconButton ${showComponents ? 'checked' : ''}`} onClick={() => onDiffChange('components')} data-tooltip-id="showDiffComponentsTooltip">
                                    <ReactSVG src={globalState.urlPaths + "/images/componentIcon.svg"} />
                                </button>
                                <button className={`colAuto btnSecondary iconButton ${showInstances ? 'checked' : ''}`} onClick={() => onDiffChange('instances')} data-tooltip-id="showDiffInstancesTooltip">
                                    <ReactSVG src={globalState.urlPaths + "/images/instanceIcon.svg"} />
                                </button>
                                <button className={`colAuto btnSecondary iconButton ${showGroups ? 'checked' : ''}`} onClick={() => onDiffChange('groups')} data-tooltip-id="showDiffGroupsTooltip">
                                    <ReactSVG src={globalState.urlPaths + "/images/groupIcon.svg"} />
                                </button>
                                <button className={`colAuto btnSecondary iconButton ${showText ? 'checked' : ''}`} onClick={() => onDiffChange('text')} data-tooltip-id="showDiffTextTooltip">
                                    <ReactSVG src={globalState.urlPaths + "/images/textIcon.svg"} />
                                </button>
                                <button className={`colAuto btnSecondary iconButton ${showShapes ? 'checked' : ''}`} onClick={() => onDiffChange('shapes')} data-tooltip-id="showDiffShapesTooltip">
                                    <ReactSVG src={globalState.urlPaths + "/images/shapesIcon.svg"} />
                                </button>
                            </div>
                            <ReactTooltip id="showDiffSectionsTooltip" place="top" content="Sections" />
                            <ReactTooltip id="showDiffFramesTooltip" place="top" content="Frames" />
                            <ReactTooltip id="showDiffComponentsTooltip" place="top" content="Components" />
                            <ReactTooltip id="showDiffInstancesTooltip" place="top" content="Instances" />
                            <ReactTooltip id="showDiffGroupsTooltip" place="top" content="Groups" />
                            <ReactTooltip id="showDiffTextTooltip" place="top" content="Text" />
                            <ReactTooltip id="showDiffShapesTooltip" place="top" content="Shapes" />
                        </div>
                    </div>
                </div>

                {/* <div className="rowAuto">
                    <div className='verticalLayout'>


                     
                        <div className="rowAuto secondaryText spaced">
                            Access to designs is only used for comparison rendering.<br />
                            We do not (and will never) store, analyze, or share your designs. We do not track analytics. <br />
                            Your designs are (and will continue to be) just for your eyes.
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default React.forwardRef(FigmaFileInput);
