import React from 'react';

interface LoaderProps {
    className: string;
    message: string;
    description: string;
}

const Loader: React.ForwardRefRenderFunction<HTMLDivElement, LoaderProps> = (props, ref) => {

    return (
        <div ref={ref} className={`${props.className} loader`}>
            <div id="indeterminateLoader" className="verticalLayout alignFullCenterAndCenterText indeterminateLoader show">
                <div className="dualRingLoader"></div>
                <div className={`message ${!props.description ? 'secondaryText' : 'primaryText'}`}>
                    {props.message}
                </div>
                <div className="secondaryText">
                    {props.description}
                </div>
            </div>
        </div>
    );
};

export default React.forwardRef(Loader);


