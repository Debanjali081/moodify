import React from 'react'
import FaceExpression from '../../Expression/components/FaceExpression'

const MoodDetector = ({ onDetect }) => {
    return (
        <div className="mood-detector">
            <div className="mood-detector__header">
                <span className="mood-detector__icon">🎭</span>
                <div>
                    <h2 className="mood-detector__title">Mood Detector</h2>
                    <p className="mood-detector__desc">Point your camera — we'll find songs that match your vibe</p>
                </div>
            </div>
            <FaceExpression onClick={onDetect} />
        </div>
    )
}

export default MoodDetector
