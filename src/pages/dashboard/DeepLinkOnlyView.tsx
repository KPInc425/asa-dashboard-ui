import React from "react";

interface DeepLinkOnlyViewProps {
  name: string;
  description: string;
  links: Record<string, string>;
}

const DeepLinkOnlyView: React.FC<DeepLinkOnlyViewProps> = ({
  name,
  description,
  links,
}) => {
  const linkEntries = Object.entries(links)
    .filter(([, url]) => !!url)
    .map(([key, url]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase()),
      url: url as string,
    }));

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">{name}</h2>
            <p className="text-base-content/70 mb-4">
              {description ||
                "This environment is configured as read-only. No backend API is connected."}
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
