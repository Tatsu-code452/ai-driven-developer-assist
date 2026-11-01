/**
 * タスクステータス
 */
export type TaskStatus =
    'pending' // 未着手
    | 'rejected' //却下
    | 'not-applicable' //該当なし
    | 'in-progress' //進行中
    | 'resolved' //解決済み
    | 'deferred' //延期
    | 'canceled' //キャンセル
    | 'on-hold' //保留
    | 'duplicate' //重複
    | 'completed' //完了
    | 'closed' //クローズ
    | 'archived' //アーカイブ
    ;

/**
 * 優先度
 */
export type TaskPriority =
    'low' // 低
    | 'medium' // 中
    | 'high' // 高
    | 'urgent' // 緊急
    ;

export type Task = {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
}