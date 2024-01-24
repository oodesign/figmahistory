import React, { useRef, useEffect, useState, SyntheticEvent } from 'react';
import { NodeWithImage, Difference } from './types';

interface CanvasProps {
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

    allImagesLoaded: () => void;
}

const Canvas: React.FC<CanvasProps> = (props) => {
    const [containerWidth, setContainerWidth] = useState(props.canvasWidth);
    const [containerHeight, setContainerHeight] = useState(props.canvasHeight);


    useEffect(() => {
        setContainerWidth(props.canvasWidth);
        setContainerHeight(props.canvasHeight);
    }, [props.canvasWidth, props.canvasHeight, props.offsetX, props.offsetY]);

    const renderNodes = (): React.ReactNode => {
        let imagesLoaded = 0;

        function imageLoaded(event: SyntheticEvent<HTMLImageElement, Event>): void {
            imagesLoaded++;
            // console.log(props.name +" - Image loaded");
            if (imagesLoaded >= props.nodesWithImages.length)
                props.allImagesLoaded();
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
            {renderArtboards()}
            {renderNodes()}
            {renderDifferences()}
        </div>
    );
};

export default Canvas;
