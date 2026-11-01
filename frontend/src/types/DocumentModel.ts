export type Heading = {
  level: number;
  text: string;
  lineNumber: number;
};

export type MarkdownList = {
  items: string[];
  lineNumber: number;
};

export type MarkdownTable = {
  headers: string[];
  rows: string[][];
  lineNumber: number;
};

export type DocumentModel = {
  fileName: string;
  title: string;
  rawContent: string;
  headings: Heading[];
  lists: MarkdownList[];
  tables: MarkdownTable[];
};
