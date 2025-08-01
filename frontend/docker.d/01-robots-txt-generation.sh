#!/bin/bash

set -e
set +x

ME=$(basename $0)

entrypoint_log() {
    if [ -z "${NGINX_ENTRYPOINT_QUIET_LOGS:-}" ]; then
        echo "$@"
    fi
}

generate_robots_txt() {
    # Check if NGINX_GENERATE_ROBOTS_TXT is set to "true" or "True" (case-insensitive)
    if [[ "${NGINX_GENERATE_ROBOTS_TXT,,}" == "true" ]]; then
        cat <<EOF > /usr/share/nginx/html/robots.txt
User-agent: *
Disallow: /
EOF
        entrypoint_log "$ME: robots.txt generated."
    else
        entrypoint_log "$ME: GENERATE_ROBOTS_TXT is not set to 'true'. Skipping robots.txt generation."
    fi
}

generate_robots_txt

exit 0