import React, { useRef, useEffect, useState, SyntheticEvent } from 'react';
import { NodeWithImage, Difference } from './types';

interface Canvas2Props {
    name: string;
    nodesWithImages: NodeWithImage[];
    differences: Difference[];
    canvasWidth: number;
    canvasHeight: number;
    offsetX: number;
    offsetY: number;
    containerClass: string;
    differenceTypes: string[];
    background: string;
    isLoadingPage: boolean;
}

const Canvas2: React.FC<Canvas2Props> = (props) => {
    const [containerWidth, setContainerWidth] = useState(props.canvasWidth);
    const [containerHeight, setContainerHeight] = useState(props.canvasHeight);

    const [allImagesLoaded, setAllImagesLoaded] = useState<boolean>(false);

    useEffect(() => {
        setContainerWidth(props.canvasWidth);
        setContainerHeight(props.canvasHeight);
    }, [props.canvasWidth, props.canvasHeight, props.offsetX, props.offsetY]);

    const renderNodes = (): React.ReactNode => {
        let imagesLoaded = 0;
        
        function imageLoaded(event: SyntheticEvent<HTMLImageElement, Event>): void {
            imagesLoaded++;
            console.log("Image loaded");
            if (imagesLoaded >= props.nodesWithImages.length)
                setAllImagesLoaded(true);
        }

        //console.log("Drawing canvas: " + name + ". Offset:" + offsetX + "," + offsetY);
        return props.nodesWithImages.map((nodeWithImage, index) => (
            <img
                key={`Image ${index}`}
                src={nodeWithImage.imageUrl}
                alt={`Image ${index}`}
                style={{
                    position: 'absolute',
                    left: `${(nodeWithImage.child.absoluteBoundingBox.x + (-props.offsetX))}px`,
                    top: `${(nodeWithImage.child.absoluteBoundingBox.y + (-props.offsetY))}px`,
                    width: `${nodeWithImage.child.absoluteBoundingBox.width}px`,
                    height: `${nodeWithImage.child.absoluteBoundingBox.height}px`,
                }}
                onLoad={imageLoaded}
            />
        ));
    };



    const renderArtboards = (): React.ReactNode => {
        //console.log("Drawing canvas: " + name + ". Offset:" + offsetX + "," + offsetY);
        return props.differences.map((difference, index) => (
            (difference.type == "FRAME" && !difference.isChildOfFrame) ?
                <div key={`Frame${index}`}>
                    <div className={`negativeText`}
                        style={{
                            position: 'absolute',
                            left: `${(difference.boundingRect.x + (-props.offsetX))}px`,
                            top: `${(difference.boundingRect.y + (-props.offsetY))}px`,
                            width: `${difference.boundingRect.width}px`,
                            height: `${difference.boundingRect.height}px`,
                            backgroundColor: `rgba(255,255,255,0.05)`
                        }}
                    />
                </div>

                : ""
        ));
    };

    const renderDifferences = (): React.ReactNode => {
        //console.log("Drawing canvas: " + name + ". Offset:" + offsetX + "," + offsetY);
        return props.differences.map((difference, index) => (
            (props.differenceTypes.includes(difference.type) ?
                ((difference.type != "FRAME") || (difference.type == "FRAME" && !difference.isChildOfFrame) ?
                    <div key={index}>

                        <div className={`negativeText`} style={{
                            position: 'absolute',
                            left: `${(difference.boundingRect.x + (-props.offsetX))}px`,
                            top: `${(difference.boundingRect.y + (-props.offsetY) - 30)}px`,
                            backgroundColor: `yellow`,
                            height: `24px`
                        }}>
                            CHANGED
                        </div>

                        <div className={`negativeText`}
                            style={{
                                position: 'absolute',
                                left: `${(difference.boundingRect.x + (-props.offsetX))}px`,
                                top: `${(difference.boundingRect.y + (-props.offsetY))}px`,
                                width: `${difference.boundingRect.width}px`,
                                height: `${difference.boundingRect.height}px`,
                                border: `2px solid yellow`
                            }}
                        />
                    </div>

                    : ""
                )
                : ""
            )
        ));
    };

    return (
        <div style={{ width: `${containerWidth}px`, height: `${containerHeight}px`, backgroundColor: `${props.background}` }} className={`displayFlex pageCanvas ${props.containerClass}`}>
            <div className={`animatedDiv invisible ${props.isLoadingPage ? 'fadeOut' : 'fadeIn'}`}>
                {renderArtboards()}
                {renderNodes()}
                {renderDifferences()}
            </div>
            <div className={`pageLoader animatedDiv visible ${(!props.isLoadingPage && allImagesLoaded) ? 'fadeOut' : 'fadeIn'}`}>
                Loading stuff...
            </div>
        </div>
    );
};

export default Canvas2;
