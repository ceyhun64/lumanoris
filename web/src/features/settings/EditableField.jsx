"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";

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
        <div className="mb-5 flex items-stretch gap-3 rounded-xl border border-white/10 p-4">
            <div className="flex flex-1 flex-wrap gap-3">
                {fields.map((field) => (
                    <Input
                        key={field.name}
                        type="text"
                        className="flex-1 uppercase"
                        placeholder={field.placeholder}
                        value={values[field.name]}
                        onChange={(e) => handleChange(e, field.name)}
                        disabled={!isEditing}
                    />
                ))}
            </div>
            <button
                onClick={handleButtonClick}
                className="min-w-[100px] rounded-xl border border-white/70 bg-gradient-btn px-3 font-display text-sm font-medium text-white shadow-glow transition-all duration-300 hover:scale-[1.03] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {isEditing ? "Kaydet" : "Düzenle"}
            </button>
        </div>
    );
}
