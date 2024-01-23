import React from 'react';

interface FigmaFileInputProps {
    getData: () => void;
}

const FigmaFileInput: React.FC<FigmaFileInputProps> = ({ getData }) => {
    const handleButtonClick = () => {
        getData();
    };

    return (
        <div>
            <input
                id="figmaFileURL"
                type="text"
                placeholder="Paste your Figma URL here"
                defaultValue="https://www.figma.com/file/HTUxsQSO4pR1GCvv8Nvqd5/HistoryChecker?type=design&node-id=1%3A2&mode=design&t=ffdrgnmtJ92dZgeQ-1"
            />
            <button onClick={handleButtonClick}>Load</button>
        </div>
    );
};

export default FigmaFileInput;
