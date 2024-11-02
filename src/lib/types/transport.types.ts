type ActionResponseSuccess<T> = T extends undefined
  ? { success: true }
  : {
      success: true;
      data: T;
    };

type ActionResponseError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ActionResponse<T = undefined> = ActionResponseSuccess<T> | ActionResponseError;

export enum ActionErrorCode {
  Unknown = 'unknown',
  UniqueViolation = '23505',
  ForeignKeyViolation = '23503',
  NotFound = '404',
}

export interface Paginated<T> {
  data: T[];
  // total: number;
  page: number;
  pageSize: number;
}
