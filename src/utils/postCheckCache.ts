let _hasPosted: boolean | null = null;

export const postCheckCache = {
  get: (): boolean | null => _hasPosted,
  setTrue: (): void => { _hasPosted = true; },
  clear: (): void => { _hasPosted = null; },
};
