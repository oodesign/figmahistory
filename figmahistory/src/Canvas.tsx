import React, { useRef, useEffect } from 'react';
import { NodeWithImage } from './NodeWithImage';

interface CanvasProps {
    nodesWithImages: NodeWithImage[];
    canvasWidth: number;
    canvasHeight: number;
}

const Canvas: React.FC<CanvasProps> = ({ nodesWithImages, canvasWidth, canvasHeight }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        console.log("Drawing canvas")
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;


        // Set canvas width and height from props
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Clear the canvas
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw images based on coordinates
        nodesWithImages.forEach((nodeWithImage) => {
            console.log("Drawing:" + nodeWithImage.imageUrl)
            const img = new Image();
            img.src = nodeWithImage.imageUrl;
            img.onload = () => {
                context.drawImage(img, nodeWithImage.child.absoluteBoundingBox.x, nodeWithImage.child.absoluteBoundingBox.y, img.width, img.height);
            };
        });
    }, [nodesWithImages, canvasWidth, canvasHeight]);

    return <div className='displayFlex'>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} style={{ border: '1px solid #000' }} />

    </div>
};

export default Canvas;
