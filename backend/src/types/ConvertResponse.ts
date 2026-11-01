export type ConvertResponse = {

  success: boolean;

  data: {

    document: unknown;

    tasks: unknown[];

    documents: unknown[];

    output: {
      tasksFile: string;
      documentsFile: string;
    };

    summary: {
      taskCount: number;
      documentCount: number;
    };

  };

};
