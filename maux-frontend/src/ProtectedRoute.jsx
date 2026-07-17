import { Outlet } from 'react-router-dom';
import { useKeycloak } from './KeycloakProvider';

export default function ProtectedRoute() {
    const { keycloak } = useKeycloak();

    if (!keycloak.authenticated) {
        const redirectUri = window.location.href;
        keycloak.login({ redirectUri });
        return null;
    }

    return <Outlet />;
}
