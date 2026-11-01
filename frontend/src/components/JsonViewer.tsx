type Props = {
    data: unknown;
};

export const JsonViewer = (props: Props) => {
    return (
        <pre className="bg-slate-900 text-green-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(props.data, null, 2)}
        </pre>
    );
};
