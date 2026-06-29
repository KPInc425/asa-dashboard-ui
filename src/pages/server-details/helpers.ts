import type { UseQueryResult } from "@tanstack/react-query";

export function getTypeLabel(type: string) {
  switch (type) {
    case "container":
      return "Container";
    case "native":
      return "Native";
    case "cluster":
      return "Cluster";
    case "cluster-server":
      return "Cluster Server";
    case "individual":
      return "Individual Server";
    default:
      return type;
  }
}

export function getStatusColor(status: string) {
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
}

export function getUpdateStatusBadge(
  autoUpdateStatusQuery: Pick<UseQueryResult, "data">,
) {
  const status = autoUpdateStatusQuery.data as {
    success?: boolean;
    updateAvailable?: boolean;
    status?: string;
  } | null;

  if (!status?.success) {
    return null;
  }

  if (status.updateAvailable) {
    return <span className="badge badge-warning">Needs update</span>;
  }

  switch (status.status) {
    case "checking":
      return <span className="badge badge-info">Checking updates</span>;
    case "warning":
    case "updating":
      return <span className="badge badge-primary">Updating</span>;
    case "failed":
      return <span className="badge badge-error">Update failed</span>;
    default:
      return <span className="badge badge-success">Up to date</span>;
  }
}
