/**
 * ApiEndpointSelector
 *
 * Backward-compatibility wrapper around EnvironmentSwitcher.
 *
 * During the Phase 5 migration, components that referenced
 * `ApiEndpointSelector` continue to work while the new
 * `EnvironmentSwitcher` becomes the canonical selector.
 *
 * @see EnvironmentSwitcher
 */

import React from "react";
import EnvironmentSwitcher from "./EnvironmentSwitcher";

interface ApiEndpointSelectorProps {
    onEndpointChange?: (endpoint: string) => void;
}

const ApiEndpointSelector: React.FC<ApiEndpointSelectorProps> = ({
    onEndpointChange: _onEndpointChange,
}) => {
    return <EnvironmentSwitcher />;
};

export default ApiEndpointSelector;
