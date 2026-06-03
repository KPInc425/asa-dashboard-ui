/**
 * EnvAwareLayout
 *
 * A layout component for environment-aware routes (`/env/:envId/...`).
 * Automatically switches the active environment when the route's
 * `:envId` parameter changes, and renders children inside the
 * standard app layout (sidebar + header + content area).
 */

import React from "react";
import { Outlet } from "react-router-dom";
import EnvAwareRouter from "./EnvAwareRouter";

/**
 * Layout component for env-aware routes.
 *
 * Wraps children with EnvAwareRouter so that the environment is
 * automatically switched based on the `:envId` URL parameter.
 */
const EnvAwareLayout: React.FC = () => {
  return (
    <EnvAwareRouter>
      <Outlet />
    </EnvAwareRouter>
  );
};

export default EnvAwareLayout;
