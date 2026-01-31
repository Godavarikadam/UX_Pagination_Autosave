const parseFunction = (jsSource, required = false) => {
    
    if (!jsSource || !jsSource.trim()) {
        return {
            type: "text",
            options: [],
            validate: null,
            jsSource,
            error: required ? "Required fields must have DSL or a JS validation function." : null
        };
    }

    const src = jsSource.trim();

    const dsl = src.match(/^(dropdown|radio|checkbox)\s*\{(.*?)\}$/i);
    
    if (dsl) {
        const type = dsl[1].toLowerCase();
        const body = dsl[2].trim();

        const options = body
            .split(",")
            .map((s) => {
                if (!s) return null;
                const trimmedS = s.trim();
                if (trimmedS.includes(":")) {
                    const [label, value] = trimmedS.split(":").map((x) => x.trim());
                    return { label, value };
                }
                return { label: trimmedS, value: trimmedS };
            })
            .filter(Boolean);

        return {
            type,
            options,
            validate: null,
            jsSource,
            error: null
        };
    }
    
try {
    const src = jsSource.trim();

    // 1. DYNAMIC DETECTION: Find the first variable or function name defined
    // This looks for 'const NAME', 'let NAME', 'var NAME', or 'function NAME'
    const nameMatch = src.match(/(?:const|let|var|function)\s+([a-zA-Z0-9_$]+)/);
    const userDefinedName = nameMatch ? nameMatch[1] : null;

    // 2. THE RUNNER: Executes the code and returns the function regardless of name
    const runner = new Function(`
        ${src}; 
        
        // If we found a name via Regex, return that variable
        if ("${userDefinedName}" && typeof ${userDefinedName} !== 'undefined') {
            return ${userDefinedName};
        }

        // FALLBACK: If no 'const/function' keywords were used, 
        // try to evaluate the whole thing as a naked arrow function expression
        try {
            return eval(${JSON.stringify(src)});
        } catch (e) {
            return null;
        }
    `);

    const fn = runner();

    if (typeof fn !== "function") {
        return {
            type: "text",
            options: [],
            validate: null,
            jsSource,
            error: "No valid function found. Please define a function or an arrow expression."
        };
    }

    return {
        type: "text",
        options: [],
        validate: fn, // This is now your user's custom function
        jsSource,
        error: null
    };
} catch (err) {
    return {
        type: "text",
        options: [],
        validate: null,
        jsSource,
        error: `Invalid JS: ${err.message}`
    };
}
};

export { parseFunction };