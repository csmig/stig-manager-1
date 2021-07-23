
# Generic OAuth2 provider support

This is a development release for testing our support of non-Keycloak OAuth2 providers, such as F5.


## Environment variables

These are the envvars relevant to the generic OAuth2 support. Other envvars from the current beta release have been retained. *Some of the envvars below replace envvars from the current beta release!*

| Variable | Description | Affects |
| --- | --- | --- |
|STIGMAN_OAUTH_AUTHORITY|**Required**<br>Base URL of the OAuth2 provider. The app will append `./well-known/openid-configuration` to obtain OIDC metadata.<br><br>This envvar *replaces* `STIGMAN_API_AUTHORITY`, `STIGMAN_CLIENT_KEYCLOAK_AUTH` and `STIGMAN_CLIENT_KEYCLOAK_REALM`|API<br>Client|
|STIGMAN_CLIENT_AUTHORITY|Default: none<br>If provided, overrides `STIGMAN_OAUTH_AUTHORITY` for the webapp only. Use if the OAuth2 provider has different URLs for the frontend and backend.|Client|
|STIGMAN_CLIENT_EXTRA_SCOPES|Default: none<br>Space separated additional scopes the webapp will request from the OAuth2 provider. For example, some providers require scope `offline_access` to generate a refresh token.|Client|
|STIGMAN_CLIENT_ID|Default: `stig-manager`<br>The OAuth2 clientId assigned to the webapp by the OAuth2 provider.<br><br>This envvar *replaces* `STIGMAN_CLIENT_KEYCLOAK_CLIENTID`|Client|
|STIGMAN_JWT_NAME_CLAIM|Default: `name`<br>The access token claim whose value is the user's full name|API<br>Client|
|STIGMAN_JWT_PRIVILEGES_CLAIM|Default: `realm_access.roles`<br>The access token claim whose value is the user's privileges.<br><br>This envvar *replaces* `STIGMAN_JWT_ROLES_CLAIM`|API<br>Client|
|STIGMAN_JWT_SCOPE_CLAIM|Default: `scope`<br>The token claim whose value is the list of authorized scopes|API<br>Client|
|STIGMAN_JWT_SCOPE_FORMAT|Default: `rfc`<br>The format used to serialize the list of scopes in the access token.<br>`rfc`: scopes are formatted as a space-separated list<br>`json`: scopes are formatted as a JSON string array|API<br>Client|
|STIGMAN_JWT_USERNAME_CLAIM|Default: `preferred_username`<br>The access token claim whose value is the user's username|API<br>Client|
