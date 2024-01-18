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
}

const Canvas2: React.FC<Canvas2Props> = ({ name, nodesWithImages, differences, canvasWidth, canvasHeight, offsetX, offsetY, containerClass }) => {
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
                key={index}
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

    const renderDifferences = (): React.ReactNode => {
        //console.log("Drawing canvas: " + name + ". Offset:" + offsetX + "," + offsetY);
        return differences.map((difference, index) => (

            <div key={index}>

                <div className='negativeText' style={{
                    position: 'absolute',
                    left: `${(difference.boundingRect.x + (-offsetX))}px`,
                    top: `${(difference.boundingRect.y + (-offsetY) - 30)}px`,
                    backgroundColor: `yellow`,
                    height: `24px`
                }}>
                    CHANGED
                </div>

                <div
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
        ));
    };

    return (
        <div style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }} className={`displayFlex pageCanvas ${containerClass}`}>
            {renderNodes()}
            {renderDifferences()}
        </div>
    );
};

export default Canvas2;
