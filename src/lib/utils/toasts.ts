import { ActionResponse } from '@/lib/types/transport.types';

export function createToastPromise<T>(promise: Promise<ActionResponse<T>>): Promise<T> {
  return new Promise((resolve, reject) => {
    promise
      .then((response) => {
        if (response.success) {
          resolve('data' in response ? response.data : (undefined as T));
        } else {
          reject(response.error);
        }
      })
      .catch(() => reject(new Error('An error occurred.')));
  });
}
