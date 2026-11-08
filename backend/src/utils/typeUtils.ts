export const isString = (value: unknown): value is string => {
    return typeof value === "string";
}

export const isNumber = (value: unknown): value is number => {
    return typeof value === "number";
}

export const isBoolean = (value: unknown): value is boolean => {
    return typeof value === "boolean";
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
}

export const isArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
}
