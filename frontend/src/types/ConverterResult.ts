export type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
};

export type Document = {
  id: string;
  title: string;
  type: string;
  path: string;
};

export type ConverterResult = {

  success: boolean;

  data: {

    tasks: Task[];

    documents: Document[];

    summary: {
      taskCount: number;
      documentCount: number;
    };

    output: {
      tasksFile: string;
      documentsFile: string;
    };

  };

};
