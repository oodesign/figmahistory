import React from 'react';

interface FigmaFileInputProps {
    getData: (id: string, nodeId: string) => void;
}

const FigmaFileInput: React.ForwardRefRenderFunction<HTMLDivElement, FigmaFileInputProps> = ({ getData }, ref) => {

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
                getData(id, nodeId);
            }
            else {
                //TODO Handle incorrect format error
            }

        }
    }

    return (
        <div>
            <input
                id="figmaFileURL"
                type="text"
                placeholder="Paste your Figma URL here"
                defaultValue="https://www.figma.com/file/HTUxsQSO4pR1GCvv8Nvqd5/HistoryChecker?type=design&node-id=1%3A2&mode=design&t=ffdrgnmtJ92dZgeQ-1"
            />
            <button onClick={getFigmaDocumentInfo}>Load</button>
        </div>
    );
};

export default React.forwardRef(FigmaFileInput);
