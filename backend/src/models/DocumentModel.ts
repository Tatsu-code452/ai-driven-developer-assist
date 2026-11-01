import type { Heading } from "./Heading";
import type { MarkdownList } from "./MarkdownList";
import type { MarkdownTable } from "./MarkdownTable";

export type DocumentModel = {
  fileName: string;
  title: string;
  rawContent: string;
  headings: Heading[];
  lists: MarkdownList[];
  tables: MarkdownTable[];
};
