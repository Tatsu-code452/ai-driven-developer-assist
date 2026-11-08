import { isBoolean, isNumber, isObject, isString } from "@/utils/typeUtils";

export const isObjectProperty = (value: Record<string, unknown>, propName: string): boolean => {
    return propName in value &&
        isObject(value[propName]);
}

export const isStringProperty = (value: Record<string, unknown>, propName: string): boolean => {
    return propName in value &&
        isString(value[propName]);
}

export const isNumberProperty = (value: Record<string, unknown>, propName: string): boolean => {
    return propName in value &&
        isNumber(value[propName]);
}

export const isBooleanProperty = (value: Record<string, unknown>, propName: string): boolean => {
    return propName in value &&
        isBoolean(value[propName]);
}

