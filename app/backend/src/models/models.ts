//
// 共通
//

export type EntityId = string;

export type DateTimeString = string;

//
// API共通
//

export type ItemResponse<T> = {
    success: boolean;
    item: T;
};

export type ItemsResponse<T> = {
    success: boolean;
    items: T[];
};

export type PagedResponse<T> = {
    success: boolean;

    items: T[];

    count: number;

    page: number;

    pageSize: number;

    totalPages: number;
};