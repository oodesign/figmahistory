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

    const getFigmaDocumentInfo = (fieldId: string) => {
        const inputElement = document.getElementById(fieldId) as HTMLInputElement;
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
                            <h6>Easily compare versions of a Figma file, and never miss a change again</h6>
                        </div>
                        <div className='rowAuto alignHorizontalCenter linkUrlInput'>
                            <input
                                id="figmaFileURL"
                                type="text"
                                autoFocus
                                placeholder="Paste your Figma file link here"
                                className=' inputField'
                            />
                            <button className='btnPrimary' onClick={() => getFigmaDocumentInfo('figmaFileURL')}>Compare</button>
                        </div>
                        <div className="rowAuto errorText">
                            {localValidationMessage}
                        </div>
                        <div className="rowAuto startHere">
                            <img src="./images/startHere.png" alt="Indication to paste the Figma file link in the field above to get started" />
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

                <div className='rowAuto twoColumnsContentBlock leftContent'>
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
                        <div className={`rowAuto blockImage alignHorizontalCenter ${!viewComparer_showOverlay ? '' : 'notDisplayed'}`}>
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
                <div className='rowAuto twoColumnsContentBlock rightContent'>
                    <div className='left '>
                        <div className={`rowAuto blockImage`}>
                            <img src="./images/types_Base.png" alt="Two frames of a design" />
                        </div>

                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showSections ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Sections.png" alt="Shows sections that have differences" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showFrames ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Frames.png" alt="Shows frames that have differences" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showComponents ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Components.png" alt="Shows components that have differences" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showInstances ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Instances.png" alt="Shows instances that have differences" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showGroups ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Groups.png" alt="Shows groups that have differences" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showText ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Texts.png" alt="Shows texts that have differences" />
                        </div>
                        <div className={`rowAuto blockImage animatedDiv fast typeOverlay ${showShapes ? 'fadeIn' : 'fadeOut'}`}>
                            <img src="./images/types_Shapes.png" alt="Shows shapes that have differences" />
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

                <div className='rowAuto twoColumnsContentBlock leftContent'>
                    <div className='left '>
                        <div className='rowAuto blockTitle'>
                            <h1>Are my files safe?</h1>
                        </div>
                        <div className='rowAuto blockDescription'>
                            <p>We use the Figma REST API to access your files and present the comparison. <span className='highlight'>We can only read files</span>, meaning we can't edit anything in them. If you feel curious, you may find more detail here about <a href="https://www.figma.com/developers/api#authentication-scopes">Figma authentication scopes</a>.</p>
                            <p>Access to designs is only used for comparison rendering. <span className='highlight'>We do not (and will never) store, analyze, or share your designs</span>. We do not track analytics at all.</p>
                            <p>Your designs are (and will continue to be) just for your eyes.</p>
                        </div>
                    </div>
                    <div className="right verticalLayout mediumImage">
                        <img src="./images/filesSafe.png" alt="Screenshot of Figma authentication screen to grant Figma history access to the designs" />
                    </div>
                </div>


                <div className='rowAuto fullWidthBlock'>
                    <div className='rowAuto title'>
                        <h1>This is saving us a lot of time.<br />Hope it will for you too.</h1>
                    </div>
                    <div className='rowAuto subtitle'>
                        <h3>Developers always know what changed and don't miss anything</h3>
                        <h3>Designers can focus on designing and avoid communication overload</h3>
                        <h3>PMs can easily keep track of what changed and when</h3>
                    </div>
                    <div className='pricing twoColumns'>
                        <div className='columnLeft pricingBlock left verticalLayout'>
                            <div className='rowAuto'>
                                <img src="./images/pricing_Single.png" alt="Single license icon" />
                            </div>
                            <div className='rowAuto title'>
                                <h2>Single license</h2>
                            </div>
                            <div className='rowAuto subtitle'>
                                <h6>A single license for a single Figma account</h6>
                            </div>
                            <div className='rowAuto price'>
                                <h6>for $5/year</h6>
                            </div>
                            <a href="https://oodesign.gumroad.com/l/figmahistory?option=x8JwFOfp2eKY-GgXKSg2aA%3D%3D&_gl=1*1xpb5kb*_ga*MTUwNTk1MDE5OS4xNjc4MTAzNjAz*_ga_6LJN6D94N6*MTcwODMyNDE5OC44NC4wLjE3MDgzMjQyMDIuMC4wLjA." target="_blank">
                                <button className='btnPrimary'>I want a single license</button>
                            </a>
                        </div>
                        <div className='columnRight pricingBlock right verticalLayout'>
                            <div className='rowAuto'>
                                <img src="./images/pricing_Team.png" alt="Team license icon" />
                            </div>
                            <div className='rowAuto title'>
                                <h2>Team license</h2>
                            </div>
                            <div className='rowAuto subtitle'>
                                <h6>A shared license for the team. As many Figma accounts as you need.</h6>
                            </div>
                            <div className='rowAuto price'>
                                <h6>for $45/year</h6>
                            </div>
                            <a href="https://oodesign.gumroad.com/l/figmahistory?option=R67uvQjSzl_CPgpdXWJplg%3D%3D&_gl=1*184pbn5*_ga*MTUwNTk1MDE5OS4xNjc4MTAzNjAz*_ga_6LJN6D94N6*MTcwODMyNDE5OC44NC4wLjE3MDgzMjQyMDIuMC4wLjA." target="_blank">
                                <button className='btnPrimary'>Get a license for my team</button>
                            </a>
                        </div>
                    </div>

                    <div className='rowAuto startTrial'>
                        <div className='verticalLayout'>
                            <div className='rowAuto subtitle'>
                                <h3>Or actually... you could give it a try now, and decide later on</h3>
                            </div>

                            <div className='rowAuto alignHorizontalCenter linkUrlInput'>
                                <input
                                    id="figmaFileURL_Trial1"
                                    type="text"
                                    placeholder="Paste your Figma file link here"
                                    className=' inputField'
                                />
                                <button className='btnPrimary' onClick={() => getFigmaDocumentInfo('figmaFileURL_Trial1')}>Compare</button>
                            </div>
                            <div className="rowAuto errorText">
                                {localValidationMessage}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='rowAuto fullWidthBlock faqItems'>
                    <div className='rowAuto title'>
                        <h1>Frequently asked questions</h1>
                    </div>

                    <div className='rowAuto faqItem'>
                        <div className='faqTitle'>May I try it out before getting it?</div>
                        <div className='faqDescription'>
                            <p>Sure! Figma history has a completely functional <span className='webPrimaryText'>7-day free trial</span>.<br />
                                Paste your file link in the field above, click Compare, and your trial will automatically begin. </p>
                        </div>
                    </div>
                    <div className='rowAuto faqItem'>
                        <div className='faqTitle'>How does the license work?</div>
                        <div className='faqDescription'>
                            <p>The Figma history license is per Figma account. <br />
                                You may need a license for each Figma account you want to activate it on.</p>
                            <p>The team license will enable you to activate it for as many Figma accounts as you need.</p>
                        </div>
                    </div>
                    <div className='rowAuto faqItem'>
                        <div className='faqTitle'>Why is this in Beta?</div>
                        <div className='faqDescription'>
                            <p>We're currently on open Beta, trying to understand better the different flows Figma history can help with, and stress testing a bit the platform.</p>
                            <p>Figma history is fully functional. Some glitches are still expected here and there, though 😉.</p>
                        </div>
                    </div>
                    <div className='rowAuto faqItem'>
                        <div className='faqTitle'>How can Figma history access my files?</div>
                        <div className='faqDescription'>
                            <p>Well, it can't, unless you let it in 😅. When trying to access a file, a Figma popup will appear for you to log in to Figma, and to ask for permission to access your file and be able to present the comparison.</p>
                            <p>You may have seen this pattern before, as it's the same as Zeroheight, MS Teams, Slack, Principle - just to name some - do.</p>
                        </div>
                    </div>
                    <div className='rowAuto faqItem'>
                        <div className='faqTitle'>Are there any discounts for students, beginners, or so?</div>
                        <div className='faqDescription'>
                            <p>Absolutely! Just <a href="mailto:hello@oodesign.me">drop us an email</a> and tell us your case 😊. </p>
                        </div>
                    </div>
                </div>

                <div className='rowAuto fullWidthBlock footer'>
                    <div className='rowAuto title'>
                        <h1>Start comparing now</h1>
                    </div>
                    <div className='rowAuto subtitle'>
                        <h3>And never miss a change again</h3>
                    </div>

                    <div className='rowAuto startTrial'>
                        <div className='rowAuto alignHorizontalCenter linkUrlInput'>
                            <input
                                id="figmaFileURL_Trial2"
                                type="text"
                                placeholder="Paste your Figma file link here"
                                className=' inputField'
                            />
                            <button className='btnPrimary' onClick={() => getFigmaDocumentInfo('figmaFileURL_Trial2')}>Compare</button>
                        </div>
                        <div className="rowAuto errorText">
                            {localValidationMessage}
                        </div>
                    </div>


                    <div className='rowAuto webSecondaryText'>
                        <div>oodesign - All rights reserved</div>
                    </div>
                </div>
            </div>
            <div className='productHuntBadge'>
                <a href="https://www.producthunt.com/posts/figma-history?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-figma&#0045;history" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=445174&theme=light" alt="Figma&#0032;history - Easily&#0032;compare&#0032;Figma&#0032;file&#0032;versions&#0044;&#0032;and&#0032;never&#0032;miss&#0032;a&#0032;change | Product Hunt" /></a>
            </div>
        </div>
    );
};

export default React.forwardRef(FigmaFileInput);
