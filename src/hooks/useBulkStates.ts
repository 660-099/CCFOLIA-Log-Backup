import { useBulkImageStore, useIllustrationBulkStore } from '../store/useBulkStore';

export const useBulkImageState = () => {
  return useBulkImageStore();
};

export const useIllustrationBulkState = () => {
  return useIllustrationBulkStore();
};
