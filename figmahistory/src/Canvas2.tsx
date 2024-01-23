import React, { useRef, useEffect, useState } from 'react';
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
}

const Canvas2: React.FC<Canvas2Props> = ({ name, nodesWithImages, differences, canvasWidth, canvasHeight, offsetX, offsetY, containerClass, differenceTypes, background }) => {
    const [containerWidth, setContainerWidth] = useState(canvasWidth);
    const [containerHeight, setContainerHeight] = useState(canvasHeight);

    useEffect(() => {
        setContainerWidth(canvasWidth);
        setContainerHeight(canvasHeight);
    }, [canvasWidth, canvasHeight, offsetX, offsetY]);

    const renderNodes = (): React.ReactNode => {
        //console.log("Drawing canvas: " + name + ". Offset:" + offsetX + "," + offsetY);
        return nodesWithImages.map((nodeWithImage, index) => (
            <img
                key={`Image ${index}`}
                src={nodeWithImage.imageUrl}
                alt={`Image ${index}`}
                style={{
                    position: 'absolute',
                    left: `${(nodeWithImage.child.absoluteBoundingBox.x + (-offsetX))}px`,
                    top: `${(nodeWithImage.child.absoluteBoundingBox.y + (-offsetY))}px`,
                    width: `${nodeWithImage.child.absoluteBoundingBox.width}px`,
                    height: `${nodeWithImage.child.absoluteBoundingBox.height}px`,
                }}
            />
        ));
    };



    const renderArtboards = (): React.ReactNode => {
        //console.log("Drawing canvas: " + name + ". Offset:" + offsetX + "," + offsetY);
        return differences.map((difference, index) => (
            (difference.type == "FRAME" && !difference.isChildOfFrame) ?
                <div key={`Frame${index}`}>
                    <div className={`negativeText`}
                        style={{
                            position: 'absolute',
                            left: `${(difference.boundingRect.x + (-offsetX))}px`,
                            top: `${(difference.boundingRect.y + (-offsetY))}px`,
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
        return differences.map((difference, index) => (
            (differenceTypes.includes(difference.type) ?
                ((difference.type != "FRAME") || (difference.type == "FRAME" && !difference.isChildOfFrame) ?
                    <div key={index}>

                        <div className={`negativeText`} style={{
                            position: 'absolute',
                            left: `${(difference.boundingRect.x + (-offsetX))}px`,
                            top: `${(difference.boundingRect.y + (-offsetY) - 30)}px`,
                            backgroundColor: `yellow`,
                            height: `24px`
                        }}>
                            CHANGED
                        </div>

                        <div className={`negativeText`}
                            style={{
                                position: 'absolute',
                                left: `${(difference.boundingRect.x + (-offsetX))}px`,
                                top: `${(difference.boundingRect.y + (-offsetY))}px`,
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
        <div style={{ width: `${containerWidth}px`, height: `${containerHeight}px`, backgroundColor: `${background}` }} className={`displayFlex pageCanvas ${containerClass}`}>
            {renderArtboards()}
            {renderNodes()}
            {renderDifferences()}
        </div>
    );
};

export default Canvas2;
