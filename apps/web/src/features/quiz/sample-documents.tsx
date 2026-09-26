type ColumnType =
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "ARRAY"
  | "OBJECT"
  | "NULL"
  | "DATE"
  | "OBJECTID"
  | "MIXED";

function inferType(value: unknown): ColumnType {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return "NUMBER";
  if (typeof value === "boolean") return "BOOLEAN";
  if (Array.isArray(value)) return "ARRAY";
  if (typeof value === "object") return "OBJECT";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) return "DATE";
    if (/^[0-9a-fA-F]{24}$/.test(value)) return "OBJECTID";
    return "STRING";
  }
  return "STRING";
}

function columnType(values: unknown[]): ColumnType {
  const types = new Set(
    values.filter((value) => value !== undefined).map((value) => inferType(value)),
  );
  if (types.size === 0) return "STRING";
  if (types.size === 1) return [...types][0] as ColumnType;
  const withoutNull = [...types].filter((type) => type !== "NULL");
  if (withoutNull.length === 1) return withoutNull[0] as ColumnType;
  return "MIXED";
}

function formatCell(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "—";
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function SampleDocuments({ documents }: { documents: Record<string, unknown>[] }) {
  const columns: string[] = [];
  for (const document of documents) {
    for (const key of Object.keys(document)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  return (
    <div className="overflow-hidden overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-muted/40">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b px-2 py-1.5 align-bottom whitespace-nowrap">
                <span className="type-caption block font-mono font-semibold whitespace-nowrap">
                  {column}
                </span>
                <span className="block text-[0.6rem] font-normal text-muted-foreground">
                  {columnType(documents.map((document) => document[column]))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.map((document, index) => (
            <tr
              key={index}
              className="border-b transition-colors duration-150 ease-out-quint last:border-b-0 hover:bg-muted/30"
            >
              {columns.map((column) => (
                <td
                  key={column}
                  className="max-w-56 truncate px-2 py-1.5 font-mono text-[0.7rem]"
                  title={formatCell(document[column])}
                >
                  {formatCell(document[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
