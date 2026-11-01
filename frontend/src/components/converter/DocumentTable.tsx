import type { Document } from "../../types/ConverterResult";

type Props = {
    documents: Document[];
};

export const DocumentTable = (props: Props) => {
    return (
        <table
            className="
      w-full
      border
      text-sm
      "
        >
            <thead>
                <tr
                    className="
          bg-slate-100
          "
                >
                    <th>ID</th>
                    <th>Title</th>
                    <th>Type</th>
                </tr>
            </thead>

            <tbody>
                {props.documents.map((document) => (
                    <tr key={document.id}>
                        <td>{document.id}</td>

                        <td>{document.title}</td>

                        <td>{document.type}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
