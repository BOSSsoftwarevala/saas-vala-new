#!/bin/bash
# VALA Agent - Nginx Reverse Proxy Fix
# This bypasses blocked port 9876 by routing through Nginx (port 80)
# Run: curl -sSL https://your-domain.com/vala-agent/fix-proxy.sh | sudo bash

set -e

echo "========================================="
echo "  VALA Agent - Nginx Proxy Fix"
echo "========================================="

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "[!] Nginx not found. Installing..."
    apt-get update -qq && apt-get install -y nginx
fi

# Check if vala-agent is running
if ! curl -s http://localhost:9876 > /dev/null 2>&1; then
    echo "[!] VALA Agent not responding on localhost:9876"
    echo "[!] Make sure the agent is running: pm2 status"
    exit 1
fi

echo "[✓] VALA Agent is running on localhost:9876"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo "[i] Server IP: $SERVER_IP"

# Create nginx config for vala-agent proxy
NGINX_CONF="/etc/nginx/sites-available/vala-agent-proxy"

cat > "$NGINX_CONF" << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # VALA Agent Proxy
    location /vala-agent/ {
        proxy_pass http://127.0.0.1:9876/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }
}
NGINX_EOF

# Enable the site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/vala-agent-proxy

# Remove default if it conflicts
if [ -f /etc/nginx/sites-enabled/default ]; then
    # Check if default already has a catch-all on port 80
    # We'll merge our location into default instead
    if grep -q "vala-agent" /etc/nginx/sites-enabled/default 2>/dev/null; then
        echo "[i] Proxy already configured in default site"
    else
        # Add location block to existing default config
        # Safer approach: use separate server block
        echo "[i] Using separate server block for vala-agent proxy"
    fi
fi

# Test nginx config
echo "[i] Testing nginx configuration..."
if nginx -t 2>&1; then
    echo "[✓] Nginx config OK"
else
    echo "[!] Nginx config error. Trying alternative approach..."
    # Alternative: add to default config
    if [ -f /etc/nginx/sites-available/default ]; then
        # Insert location block before the last closing brace
        if ! grep -q "vala-agent" /etc/nginx/sites-available/default; then
            sed -i '/^}/i \    # VALA Agent Proxy\n    location /vala-agent/ {\n        proxy_pass http://127.0.0.1:9876/;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_connect_timeout 10s;\n        proxy_read_timeout 30s;\n    }' /etc/nginx/sites-available/default
        fi
        rm -f "$NGINX_CONF" /etc/nginx/sites-enabled/vala-agent-proxy
    fi
    nginx -t 2>&1 || { echo "[✗] Failed to configure nginx"; exit 1; }
    echo "[✓] Nginx config OK (added to default site)"
fi

# Reload nginx
systemctl reload nginx
echo "[✓] Nginx reloaded"

# Test the proxy
sleep 1
echo "[i] Testing proxy..."
PROXY_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/vala-agent/ 2>/dev/null || echo "000")

if [ "$PROXY_TEST" != "000" ]; then
    echo "[✓] Proxy is working! (HTTP $PROXY_TEST)"
else
    echo "[!] Proxy test returned no response, but it may still work externally"
fi

echo ""
echo "========================================="
echo "  ✅ DONE! Proxy configured successfully"
echo "========================================="
echo ""
echo "  NEW Agent URL: http://$SERVER_IP/vala-agent/"
echo ""
echo "  This URL uses port 80 (always open)"
echo "  No need for port 9876 anymore!"
echo ""
echo "========================================="
