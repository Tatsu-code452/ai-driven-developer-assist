// Copyright (c) Meta Platforms, Inc. and affiliates.

"use client";

import type { PowerSearchFilter } from "@astryxdesign/core/PowerSearch";
import { usePowerSearchConfig } from "@astryxdesign/core/PowerSearch";
import type { TableColumn } from "@astryxdesign/core/Table";
import {
    Table,
    toSearchFilters,
    useTableFiltering,
    useTableFilterState,
} from "@astryxdesign/core/Table";

interface Props<T extends Record<string, unknown>> {
    fieldDefs: [];
    columns: TableColumn<T>[];
    rawData: T[];
}

export default function TableFilterableTable<
    T extends Record<string, unknown>,
>({ fieldDefs, columns, rawData }: Props<T>) {
    const { config, applyFilters } = usePowerSearchConfig(fieldDefs);
    const { filters, onFilterChange } = useTableFilterState();

    const filterPlugin = useTableFiltering<T>({
        filters,
        onFilterChange,
        searchConfig: config,
    });

    const data = applyFilters(
        toSearchFilters(filters, columns, config) as PowerSearchFilter[],
        rawData,
    );

    return (
        <Table
            data={data}
            columns={columns}
            idKey="id"
            plugins={{ filter: filterPlugin }}
        />
    );
}
