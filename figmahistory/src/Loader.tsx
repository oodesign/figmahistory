import React from 'react';

interface LoaderProps {
    className: string;
    message: string;
}

const Loader: React.ForwardRefRenderFunction<HTMLDivElement, LoaderProps> = (props, ref) => {

    return (
        <div ref={ref} className={props.className}>
            <div id="indeterminateLoader" className="verticalLayout alignFullCenter indeterminateLoader show">
                <div className="dualRingLoader"></div>
                <div className="loaderMessage">
                    {props.message}
                </div>
            </div>
        </div>
    );
};

export default React.forwardRef(Loader);


