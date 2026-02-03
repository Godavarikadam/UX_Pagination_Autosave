import React, { useLayoutEffect, useRef } from 'react';

const FormField = ({ field, index, onValueChange, onCheckboxToggle, error, readOnly }) => {
    const textareaRef = useRef(null);
    const currentValue = field.value || (field.type === 'checkbox' ? [] : '');

    // 🟢 Ensures height is calculated immediately on content change
    useLayoutEffect(() => {
        if (field.type === 'textarea' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [currentValue, field.type]);

    const handleChange = (e) => {
        onValueChange(index, e.target.value);
    };

    const handleCheckboxChange = (e) => {
        onCheckboxToggle(index, e.target.value, e.target.checked);
    };

    let inputElement;

    switch (field.type) {
        case 'dropdown':
            inputElement = (
                <select
                    value={currentValue}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="border text-[12px] text-black rounded-lg p-1 w-full bg-gray-100 focus:border-[#1E90FF] outline-none"
                >
                    <option value="">Select...</option>
                    {field.options?.map((o, j) => (
                        <option key={j} value={o.value}>{o.label}</option>
                    ))}
                </select>
            );
            break;

        case 'textarea':
            inputElement = (
                <textarea
                    ref={textareaRef}
                    value={currentValue}
                    onChange={handleChange}
                    readOnly={readOnly}
                    rows={1}
                    // onInput provides instant feedback while typing
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    className="text-[12px] text-black bg-gray-100 border border-gray-100 p-1 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-[#1E90FF]/40 resize-none overflow-hidden block min-h-[40px]"
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
            );
            break;

        case 'radio':
            inputElement = (
                <div className="flex flex-col gap-1 mt-2">
                    {field.options?.map((opt, j) => (
                        <label key={j} className="text-[12px] text-black flex gap-2 items-center cursor-pointer">
                            <input
                                type="radio"
                                name={`radio-${index}`}
                                value={opt.value}
                                checked={currentValue === opt.value}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="accent-[#1E90FF] h-3 w-3"
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            );
            break;

        case 'checkbox':
            inputElement = (
                <div className="flex flex-col gap-1 mt-2 text-sm">
                    {field.options?.map((opt, j) => {
                        const checked = currentValue.includes(opt.value);
                        return (
                            <label key={j} className="flex gap-2 text-black items-center text-[12px]">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={handleCheckboxChange}
                                    disabled={readOnly}
                                    value={opt.value}
                                    className="accent-[#1E90FF] h-3 w-3"
                                />
                                {opt.label}
                            </label>
                        );
                    })}
                </div>
            );
            break;
case 'number':
case 'text':
default:
    inputElement = (
        <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={currentValue ?? ''}
            onChange={handleChange}
            readOnly={readOnly}
            className="text-[12px] text-black bg-gray-100 border border-gray-100 p-1 rounded-md w-full focus:outline-none transition-colors hover:border-gray-300 focus:border-gray/50"
        />
    );
    break;
    }

    return (
        <div className="bg-white p-2">
            <label className="text-black text-[10px] font-semibold uppercase flex gap-1 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 lowercase text-[14px]">*</span>}
            </label>
            {inputElement}
            {error && <p className="text-red-500 mt-1 text-[10px] font-medium">{error}</p>}
        </div>
    );
};

export default FormField;