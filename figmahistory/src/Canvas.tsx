import React, { useRef, useEffect } from 'react';
import { NodeWithImage } from './NodeWithImage';

interface CanvasProps {
    name: string;
    nodesWithImages: NodeWithImage[];
    canvasWidth: number;
    canvasHeight: number;
    offsetX: number;
    offsetY: number;
}

const Canvas: React.FC<CanvasProps> = ({ name, nodesWithImages, canvasWidth, canvasHeight, offsetX, offsetY }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    let factor = 1;

    useEffect(() => {
        console.log("Drawing canvas: " + name);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;



        console.log("Setting canvas (" + name + ") size to: " + (canvasWidth + (-offsetX)) + "," + (canvasHeight + (-offsetY)));
        // Set canvas width and height from props
        canvas.width = (canvasWidth + (-offsetX)) / factor;
        canvas.height = (canvasHeight + (-offsetY)) / factor;

        // Clear the canvas
        context.clearRect(0, 0, ((canvasWidth + (-offsetX)) / factor), ((canvasHeight + (-offsetY)) / factor));

        // Draw images based on coordinates
        nodesWithImages.forEach((nodeWithImage) => {
            console.log("Drawing:" + nodeWithImage.imageUrl)
            const img = new Image();
            img.src = nodeWithImage.imageUrl;
            img.onload = () => {
                console.log("Loaded:" + nodeWithImage.imageUrl)
                context.drawImage(img, (nodeWithImage.child.absoluteBoundingBox.x + (-offsetX)) / factor, (nodeWithImage.child.absoluteBoundingBox.y + (-offsetY)) / factor, img.width / factor, img.height / factor);
            };
        });
    }, [name, nodesWithImages, canvasWidth, canvasHeight, offsetX, offsetY]);

    return <div className='displayFlex'>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} style={{ border: '1px solid #000' }} />
    </div>
};

export default Canvas;
