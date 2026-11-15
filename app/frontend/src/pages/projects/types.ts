import type { ProjectStatus } from "../../types/Project";

export const fieldDefs = [
    { key: 'name', type: 'string', label: '名称' },
    {
        key: 'status',
        type: 'enum',
        label: '状態',
        enumValues: [
            { value: "PLANNING", label: "計画中" },
            { value: "ACTIVE", label: "進行中" },
            { value: "SUSPENDED", label: "停止中" },
            { value: "COMPLETED", label: "完了" },
            { value: "ARCHIVED", label: "アーカイブ" },
        ] as { value: ProjectStatus, label: string }[],
    },
] as const;