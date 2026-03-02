'use client'
import React from "react";

function DebouncedInput({value: initialValue, onChange, debounce = 500, ...props}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
    const [value, setValue] = React.useState(initialValue)
    const onChangeRef = React.useRef(onChange)

    // Update ref when onChange changes, but don't trigger effect
    React.useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    React.useEffect(() => {setValue(initialValue)}, [initialValue])

    React.useEffect(() => {
        const timeout = setTimeout(() => {onChangeRef.current(value)}, debounce)
        return () => clearTimeout(timeout)
    }, [value, debounce])

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    )
}

export default DebouncedInput;