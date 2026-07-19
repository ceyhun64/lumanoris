"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

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
        <div className="mb-5 flex items-stretch gap-3 rounded-xl border border-transparent p-4">
            <div className="flex flex-1 flex-wrap gap-3">
                {fields.map((field) => (
                    <Input
                        key={field.name}
                        type="text"
                        className="flex-1"
                        placeholder={field.placeholder}
                        value={values[field.name]}
                        onChange={(e) => handleChange(e, field.name)}
                        disabled={!isEditing}
                    />
                ))}
            </div>
            <Button onClick={handleButtonClick} className="h-auto min-w-[100px] border border-transparent">
                {isEditing ? "Kaydet" : "Düzenle"}
            </Button>
        </div>
    );
}
