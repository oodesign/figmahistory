import React from 'react';

interface FigmaFileInputProps {
    getDocument: (id: string, nodeId: string) => void;
    className: string;
}

const FigmaFileInput: React.ForwardRefRenderFunction<HTMLDivElement, FigmaFileInputProps> = (props, ref) => {

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

    return (

        <div className={`${props.className} verticalLayout`}>

            <div className="rowAuto logo">
                <img src="./figmahistory/images/logo.png" />
            </div>
            <div className="rowAvailable ">
                <div className="alignFullCenter verticalLayout">
                    <div className="rowAuto">
                        <input
                            id="figmaFileURL"
                            type="text"
                            placeholder="Paste your Figma URL here"
                            defaultValue="https://www.figma.com/file/HTUxsQSO4pR1GCvv8Nvqd5/HistoryChecker?type=design&node-id=1%3A2&mode=design&t=ffdrgnmtJ92dZgeQ-1"
                        />
                        <button onClick={getFigmaDocumentInfo}>Load</button>
                    </div>
                    <div className="rowAuto secondaryText">
                        Access to your designs is solely used for comparison rendering.<br/>
                        We do not (and will never) store, analyze, or share your designs, not even for analytics. <br/>
                        Your designs are, and will continue to be, just for your eyes.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.forwardRef(FigmaFileInput);
