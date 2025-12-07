#!/bin/sh

# Inject API_KEY into config.js
echo "window.env = { API_KEY: '$API_KEY' };" > /usr/share/nginx/html/config.js

# Execute the CMD
exec "$@"
