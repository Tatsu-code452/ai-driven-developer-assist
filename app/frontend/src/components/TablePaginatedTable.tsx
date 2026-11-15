"use client";

import { Section } from "@astryxdesign/core/Section";
import type { TableColumn } from "@astryxdesign/core/Table";
import {
    paginateData,
    Table,
    useTablePagination,
} from "@astryxdesign/core/Table";
import { useState } from "react";

interface Props<T extends Record<string, unknown>> {
    columns: TableColumn<T>[];
    rawData: T[];
}

export default function TablePaginatedTable<T extends Record<string, unknown>>({
    columns,
    rawData,
}: Props<T>) {
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const plugin = useTablePagination<T>({
        page,
        onPageChange: setPage,
        totalItems: rawData.length,
        pageSize,
    });

    return (
        <Section>
            <Table
                data={paginateData(rawData, page, pageSize)}
                columns={columns}
                idKey="id"
                plugins={{ pagination: plugin }}
            />
        </Section>
    );
}
