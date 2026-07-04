import React from "react";

export default function Alert({ message, onClose, type = "warning" }) {
    return (
        <div className={`custom-alert ${type}`}>
            <span className="icon">
                {/* Warning icon */}
                <svg width="20" height="20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#FF66C4" />
                    <path d="M10 5V11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="15" r="1" fill="#fff" />
                </svg>
            </span>
            <span>{message}</span>
            <button onClick={onClose} className="close-alert" tabIndex={-1}>×</button>
            
        </div>
    );
}
