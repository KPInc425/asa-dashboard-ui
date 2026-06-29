export const getStatusColor = (status: string) => {
  switch (status) {
    case "running":
      return "badge-success";
    case "stopped":
      return "badge-error";
    case "restarting":
      return "badge-warning";
    case "starting":
      return "badge-warning";
    case "stopping":
      return "badge-info";
    default:
      return "badge-neutral";
  }
};
