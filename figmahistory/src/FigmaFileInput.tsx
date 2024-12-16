import React, { SyntheticEvent, useEffect, useRef, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  useReactCompareSliderRef,
} from "react-compare-slider";
import { ReactSVG } from "react-svg";
import { globalState } from "./globals";
import { Tooltip as ReactTooltip } from "react-tooltip";

interface FigmaFileInputProps {
  getDocument: (id: string, branchId: string, nodeId: string) => void;
  validationMessage?: string;
  className: string;
}

const FigmaFileInput: React.ForwardRefRenderFunction<
  HTMLDivElement,
  FigmaFileInputProps
> = (props, ref) => {
  const reactCompareSliderRef = useReactCompareSliderRef();
  const [isLogoAnimated, setIsLogoAnimated] = useState<boolean>(true);
  const [clipPath, setClipPath] = useState<
    string | undefined
  >(/* initial clip-path */);
  const [localValidationMessage, setLocalValidationMessage] =
    useState<string>("");

  const [viewComparer_showOverlay, setViewComparer_showOverlay] =
    useState<boolean>(true);

  const [showSections, setShowSections] = useState<boolean>(true);
  const [showFrames, setShowFrames] = useState<boolean>(true);
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [showInstances, setShowInstances] = useState<boolean>(true);
  const [showGroups, setShowGroups] = useState<boolean>(false);
  const [showText, setShowText] = useState<boolean>(false);
  const [showShapes, setShowShapes] = useState<boolean>(false);

  useEffect(() => {
    if (props.validationMessage)
      setLocalValidationMessage(props.validationMessage);
  }, [props.validationMessage]);

  const getFigmaDocumentInfo = (fieldId: string) => {
    const inputElement = document.getElementById(fieldId) as HTMLInputElement;
    const inputURL = inputElement.value;

    const regex =
      /^((http|https):\/\/)?(www\.)?figma.com\/([\w-]+)\/([a-zA-Z0-9]{22,128})(?:\/branch\/([a-zA-Z0-9]+))?(?:.*node-id=([0-9]+%3A[0-9]+))?/;
    const matches = inputURL.match(regex);

    if (!matches) {
      setLocalValidationMessage(
        "This link doesn't seem to belong to a Figma file"
      );
    } else {
      const id = matches[4] || "";
      const branchId = matches[5] || "";
      let nodeId = matches[6] || "";
      nodeId = nodeId.replace("-", ":");

      if (id || branchId) {
        props.getDocument(id, branchId, nodeId);
      } else {
        //TODO Handle incorrect format error
      }
    }
  };

  function chooseView(option: number): void {
    setViewComparer_showOverlay(option == 0);
  }

  function onDiffChange(type: string): void {
    switch (type) {
      case "sections":
        setShowSections(!showSections);
        break;
      case "frames":
        setShowFrames(!showFrames);
        break;
      case "components":
        setShowComponents(!showComponents);
        break;
      case "instances":
        setShowInstances(!showInstances);
        break;
      case "groups":
        setShowGroups(!showGroups);
        break;
      case "text":
        setShowText(!showText);
        break;
      case "shapes":
        setShowShapes(!showShapes);
        break;
    }
  }

  return (
    <div className={`${props.className}  mainSite alignFullCenter`}>
      <div className="placeholderMessage">
        <h4>
          Figma's <a href="https://help.figma.com/hc/en-us/articles/15023193382935-Compare-changes-in-Dev-Mode">Compare changes</a> in Dev Mode addresses natively what Figma History was bringing as a
          separate app, and it works great! So Figma History is now discotinued...
        </h4>
      </div>
    </div>
  );
};

export default React.forwardRef(FigmaFileInput);
