import React from 'react';

interface LoaderProps {
}

const Loader: React.FC<LoaderProps> = ({ }) => {

    return (
        <div>
            <div id="indeterminateLoader" className="verticalLayout alignFullCenter indeterminateLoader show">
                <div className="dualRingLoader"></div>
            </div>
        </div>
    );
};

export default Loader;


