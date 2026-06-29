export const serverQueryKeys = {
  all: ["servers"] as const,
  lists: () => [...serverQueryKeys.all, "list"] as const,
  list: () => serverQueryKeys.lists(),
  details: () => [...serverQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...serverQueryKeys.details(), id] as const,
  liveData: () => [...serverQueryKeys.all, "live"] as const,
  live: (id: string) => [...serverQueryKeys.liveData(), id] as const,
  running: (id: string) => [...serverQueryKeys.all, "running", id] as const,
};
