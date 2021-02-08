window._config = {
    cognito: {
        userPoolId: '{{ user_pool_id }}', 
        userPoolClientId: '{{ user_pool_client_id }}', 
        region: '{{ region }}'
    },
    api: {
        invokeUrl: '{{ api_url }}{{ resource_name }}',
    }
};
