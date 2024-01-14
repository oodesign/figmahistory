import React, { useRef, useEffect, useState } from 'react';
import { NodeWithImage } from './NodeWithImage';

interface Canvas2Props {
    name: string;
    nodesWithImages: NodeWithImage[];
    canvasWidth: number;
    canvasHeight: number;
    offsetX: number;
    offsetY: number;
    containerClass: string;
}

const Canvas2: React.FC<Canvas2Props> = ({ name, nodesWithImages, canvasWidth, canvasHeight, offsetX, offsetY, containerClass }) => {
    const [containerWidth, setContainerWidth] = useState(canvasWidth);
    const [containerHeight, setContainerHeight] = useState(canvasHeight);

    useEffect(() => {
        setContainerWidth(canvasWidth);
        setContainerHeight(canvasHeight);
    }, [canvasWidth, canvasHeight, offsetX, offsetY]);

    const renderOptions = (): React.ReactNode => {
        console.log("Drawing canvas: " + name + ". Offset:" + offsetX + "," + offsetY);
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

    return (
        <div style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }} className={`displayFlex ${containerClass}`}>
            {renderOptions()}
        </div>
    );
};

export default Canvas2;
