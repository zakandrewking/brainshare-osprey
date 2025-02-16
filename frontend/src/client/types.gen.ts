// This file is auto-generated by @hey-api/openapi-ts

export type CustomTypeSuggestion = {
    name: string;
    description: string;
    rules: Array<string>;
    examples: Array<string>;
    notExamples: Array<string>;
    minValue?: number | null;
    maxValue?: number | null;
    logScale?: boolean | null;
};

export type HttpValidationError = {
    detail?: Array<ValidationError>;
};

export type Identification = {
    type: string;
    description: string;
    suggestedActions?: Array<string> | null;
    id?: string | null;
    name?: string | null;
    kind?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
    logScale?: boolean | null;
};

export type NumericOptions = {
    needsMinMax: boolean;
    needsLogScale: boolean;
    kind: string;
};

export type SuggestCustomTypeArgs = {
    columnName: string;
    sampleValues: Array<string>;
    numericOptions?: NumericOptions | null;
};

export type SuggestWidgetArgs = {
    columns: Array<SuggestWidgetColumn>;
    existingWidgets: Array<WidgetSuggestion>;
    dataSize: number;
};

export type SuggestWidgetColumn = {
    fieldName: string;
    identification: Identification;
    sampleValues: Array<string>;
};

export type ValidationError = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};

export type WidgetSuggestion = {
    name: string;
    description: string;
    vegaLiteSpec: unknown;
};

export type GetHealthHealthGetData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/health';
};

export type GetHealthHealthGetResponses = {
    /**
     * Successful Response
     */
    200: unknown;
};

export type GetSuggestWidgetSuggestWidgetPostData = {
    body: SuggestWidgetArgs;
    path?: never;
    query?: never;
    url: '/suggest/widget';
};

export type GetSuggestWidgetSuggestWidgetPostErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type GetSuggestWidgetSuggestWidgetPostError = GetSuggestWidgetSuggestWidgetPostErrors[keyof GetSuggestWidgetSuggestWidgetPostErrors];

export type GetSuggestWidgetSuggestWidgetPostResponses = {
    /**
     * Successful Response
     */
    200: WidgetSuggestion;
};

export type GetSuggestWidgetSuggestWidgetPostResponse = GetSuggestWidgetSuggestWidgetPostResponses[keyof GetSuggestWidgetSuggestWidgetPostResponses];

export type GetSuggestCustomTypeSuggestCustomTypePostData = {
    body: SuggestCustomTypeArgs;
    path?: never;
    query?: never;
    url: '/suggest/custom-type';
};

export type GetSuggestCustomTypeSuggestCustomTypePostErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type GetSuggestCustomTypeSuggestCustomTypePostError = GetSuggestCustomTypeSuggestCustomTypePostErrors[keyof GetSuggestCustomTypeSuggestCustomTypePostErrors];

export type GetSuggestCustomTypeSuggestCustomTypePostResponses = {
    /**
     * Successful Response
     */
    200: CustomTypeSuggestion;
};

export type GetSuggestCustomTypeSuggestCustomTypePostResponse = GetSuggestCustomTypeSuggestCustomTypePostResponses[keyof GetSuggestCustomTypeSuggestCustomTypePostResponses];

export type ClientOptions = {
    baseUrl: `${string}://openapi.json` | (string & {});
};