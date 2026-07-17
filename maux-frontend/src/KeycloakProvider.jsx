import { createContext, useContext, useEffect, useState } from 'react';
import keycloak from './keycloak';

const KeycloakContext = createContext(null);

export function useKeycloak() {
    return useContext(KeycloakContext);
}

export default function KeycloakProvider({ children }) {
    const [state, setState] = useState({ initialized: false });

    useEffect(() => {
        keycloak
            .init({
                onLoad: 'check-sso',
                checkLoginIframe: false,
            })
            .then(() => {
                setState({ initialized: true });
            })
            .catch(() => {
                setState({ initialized: true });
            });
    }, []);

    if (!state.initialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500 text-lg">Cargando...</div>
            </div>
        );
    }

    return (
        <KeycloakContext.Provider value={{ keycloak }}>
            {children}
        </KeycloakContext.Provider>
    );
}
