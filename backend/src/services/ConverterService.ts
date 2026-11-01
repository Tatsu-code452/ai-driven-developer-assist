export type ConverterResponse = {
    success: boolean;
    taskCount: number;
    documentCount: number;
}

export type ConverterRequest = {
    files: File[];
}

export type File = {
    name: string;
    type: string;
    size: number;
    content: ArrayBuffer;
}

export type ConverterService = {
    convert: (request: ConverterRequest) => Promise<ConverterResponse>
}

export type ConverterServiceRequest = {

}

export type ConverterServiceResponse = {
}

export type ConverterServiceError = {
}

export type ConverterServiceRequestBody = {
}

export type ConverterServiceResponseBody = {
}

export type ConverterServiceErrorBody = {
}

export type ConverterServiceRequestHeaders = {
}

export type ConverterServiceResponseHeaders = {
}

export type ConverterServiceErrorHeaders = {
}

export type ConverterServiceRequestParams = {
}

export type ConverterServiceResponseParams = {
}

export type ConverterServiceErrorParams = {
}

export type ConverterServiceRequestQuery = {
}

export type ConverterServiceResponseQuery = {
}

export type ConverterServiceErrorQuery = {
}



