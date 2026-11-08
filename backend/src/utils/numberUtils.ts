import { POSITIVE_INTEGER } from "@/utils/textConst";

export const isPositiveIntegerString = (value: unknown): value is string => {
    return typeof value === "string" && POSITIVE_INTEGER.test(value)
}

export const positiveIntegerFrom = (value: unknown): number | undefined => {
    if (!isPositiveIntegerString(value)) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
};

export const convertToPositiveIntegerOrDefault = (value: unknown, defaultValue: number): number | undefined => {
    return positiveIntegerFrom(value) ?? defaultValue;
}