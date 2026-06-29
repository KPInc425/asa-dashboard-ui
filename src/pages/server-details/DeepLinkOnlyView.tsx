import React from "react";

interface DeepLinkOnlyViewProps {
  serverName: string | undefined;
  currentEnvironment: {
    name: string;
    description?: string;
    links?: Record<string, string | undefined>;
    backends: unknown[];
  };
}

const DeepLinkOnlyView: React.FC<DeepLinkOnlyViewProps> = ({
  serverName,
  currentEnvironment,
}) => {
  const links = currentEnvironment.links ?? {};
  const linkEntries = Object.entries(links)
    .filter(([, url]) => !!url)
    .map(([key, url]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase()),
      url: url as string,
    }));

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-primary mb-1">{serverName}</h1>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">{currentEnvironment.name}</h2>
            <p className="text-base-content/70 mb-4">
              {currentEnvironment.description ||
                "This environment is configured as read-only. Server details are not available without a backend API connection."}
            </p>
            {linkEntries.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {linkEntries.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-primary"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepLinkOnlyView;
