import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'https://aa.percha.online',
    realm: 'MARIA_AUXILIADORA',
    clientId: import.meta.env.PROD ? 'maria_auxiliadora_client' : 'maria_auxiliadora_client_dev',
});

export default keycloak;
