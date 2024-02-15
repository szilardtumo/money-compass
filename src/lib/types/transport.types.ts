type ActionResponseSuccess<T> = T extends undefined
  ? { success: true }
  : {
      success: true;
      data: T;
    };

type ActionResponseError = {
  success: false;
  error: {
    message: string;
  };
};

export type ActionResponse<T = undefined> = ActionResponseSuccess<T> | ActionResponseError;
