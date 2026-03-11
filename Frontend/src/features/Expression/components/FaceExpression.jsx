import React, { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";

export default function FaceExpression({ onClick = () => { } }) {
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const streamRef = useRef(null);
    const isInitialized = useRef(false);

    const [expression, setExpression] = useState("Detecting...");
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const initializeFaceDetection = async () => {
            if (isInitialized.current) return;

            // Wait for the video element to be available in the DOM
            // Use a polling approach with exponential backoff
            const waitForVideo = async () => {
                const maxAttempts = 20;
                const baseDelay = 50;
                
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    // Check if video element exists and has been rendered
                    if (videoRef.current && videoRef.current instanceof HTMLElement) {
                        return true;
                    }
                    // Wait with increasing delay
                    await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(1.2, attempt)));
                }
                return false;
            };

            const videoReady = await waitForVideo();
            
            if (!videoReady || !videoRef.current) {
                console.warn("Video element not available after retries");
                setIsLoading(false);
                return;
            }

            console.log("Video element found, initializing camera...");
            
            // Initialize the camera and face detection
            const success = await init({ landmarkerRef, videoRef, streamRef });

            if (mounted) {
                isInitialized.current = true;
                setIsCameraReady(success);
                setIsLoading(false);
                
                if (!success) {
                    setExpression("Camera unavailable");
                }
            }
        };

        initializeFaceDetection();

        return () => {
            mounted = false;
            if (landmarkerRef.current) {
                landmarkerRef.current.close();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    async function handleClick() {
        if (!isCameraReady) {
            console.warn("Camera not ready yet");
            return;
        }
        const expression = detect({ landmarkerRef, videoRef, setExpression });
        console.log(expression);
        onClick(expression);
    }

    return (
        <div className="face-expression">
            <div className="face-expression__video-wrap">
                <video
                    ref={videoRef}
                    className="face-expression__video"
                    playsInline
                    autoPlay
                    muted
                />
            </div>
            <p className="face-expression__label">
                {isLoading ? "Loading..." : expression}
            </p>
            <button 
                className="face-expression__btn" 
                onClick={handleClick}
                disabled={!isCameraReady || isLoading}
            >
                {isLoading ? "Initializing..." : isCameraReady ? "Detect My Mood" : "Camera Unavailable"}
            </button>
        </div>
    );
}
