"use client";
import React, { useState, useEffect } from "react";

export default function EditableField({ fields, onSubmit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [values, setValues] = useState(
        fields.reduce((acc, field) => {
            acc[field.name] = field.value || "";
            return acc;
        }, {})
    );

     useEffect(() => {
        setValues(
        fields.reduce((acc, field) => {
            acc[field.name] = field.value || "";
            return acc;
        }, {})
        );
    }, [fields]);



    const handleChange = (e, name) => {
        setValues({ ...values, [name]: e.target.value });
    };

    const handleButtonClick = () => {
        if (isEditing) {
            if (onSubmit) onSubmit(values);
        }
        setIsEditing(!isEditing);
    };

    return (
        <div className="editable-field-wrapper">
            <div className="editable-inputs">
                {fields.map((field) => (
                    <input
                        key={field.name}
                        type="text"
                        className="editable-input"
                        placeholder={field.placeholder}
                        value={values[field.name]}
                        onChange={(e) => handleChange(e, field.name)}
                        disabled={!isEditing}
                    />
                ))}
            </div>
            <button className="editable-submit-btn" onClick={handleButtonClick}>
                {isEditing ? "Kaydet" : "Düzenle"}
            </button>
        </div>
    );
}
