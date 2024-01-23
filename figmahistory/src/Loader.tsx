import React from 'react';

interface LoaderProps {
}

const Loader: React.ForwardRefRenderFunction<HTMLDivElement, LoaderProps> = (props, ref) => {
    
    return (
        <div ref={ref}>
            <div id="indeterminateLoader" className="verticalLayout alignFullCenter indeterminateLoader show">
                <div className="dualRingLoader"></div>
            </div>
        </div>
    );
};

export default React.forwardRef(Loader);


