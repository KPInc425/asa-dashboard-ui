/**
 * EnvAwareRouter
 *
 * A route wrapper component that automatically switches the active
 * environment when the user navigates to an `/env/:envId/...` URL.
 *
 * Place this as a wrapper around route content that needs to react
 * to `:envId` URL parameter changes.
 */

import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useEnvironment } from "../contexts/EnvironmentContext";
import { getEnvironmentById } from "../config/environments";

interface EnvAwareRouterProps {
  children: React.ReactNode;
}

const EnvAwareRouter: React.FC<EnvAwareRouterProps> = ({ children }) => {
  const { envId } = useParams<{ envId: string }>();
  const { currentEnvironment, setCurrentEnvironment } = useEnvironment();
  const lastEnvRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!envId) return;

    // Resolve the envId to a canonical environment ID.
    // The envId in the URL is the environment's `slug` or `environmentId`.
    const env = getEnvironmentById(envId) ?? getEnvironmentById(`env:${envId}`);

    if (env && env.environmentId !== currentEnvironment.environmentId) {
      // Avoid re-triggering if we already switched to this env
      if (lastEnvRef.current !== env.environmentId) {
        lastEnvRef.current = env.environmentId;
        setCurrentEnvironment(env.environmentId);
      }
    }
  }, [envId, currentEnvironment.environmentId, setCurrentEnvironment]);

  return <>{children}</>;
};

export default EnvAwareRouter;
