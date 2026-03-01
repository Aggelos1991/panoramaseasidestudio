#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Panorama — Complete the remaining setup steps
# (deploy.sh stopped at SSH restart — this finishes the job)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && err "This script must be run as root"

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}Completing Panorama server setup...${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── 1. Restart SSH (Ubuntu 24.04 uses 'ssh' not 'sshd') ──
log "Restarting SSH service..."
if systemctl list-units --type=service | grep -q "sshd.service"; then
  systemctl restart sshd
else
  systemctl restart ssh
fi
log "SSH restarted with hardened config"

# ─── 2. STOP EXPOSED MySQL (BSI flagged this!) ────────────
log "Stopping exposed MySQL service..."
if systemctl is-active --quiet mysql 2>/dev/null; then
  systemctl stop mysql
  systemctl disable mysql
  log "MySQL STOPPED and DISABLED — no longer exposed on port 3306!"
elif systemctl is-active --quiet mariadb 2>/dev/null; then
  systemctl stop mariadb
  systemctl disable mariadb
  log "MariaDB STOPPED and DISABLED"
else
  log "No system MySQL/MariaDB running (good)"
fi

# ─── 3. Verify Docker ────────────────────────────────────
log "Checking Docker..."
if command -v docker &> /dev/null; then
  DOCKER_VER=$(docker --version)
  log "Docker OK: $DOCKER_VER"
else
  err "Docker not found! Run: apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
fi

# ─── 4. Create deploy user ───────────────────────────────
log "Creating deploy user..."
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash -G docker deploy
  mkdir -p /home/deploy/.ssh
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
  log "Deploy user created and added to docker group"
else
  log "Deploy user already exists"
fi

# ─── 5. App directory + backups ───────────────────────────
log "Setting up app directory..."
mkdir -p /opt/panorama/backups
chown -R deploy:deploy /opt/panorama

# ─── 6. Docker log rotation ──────────────────────────────
log "Configuring Docker log rotation..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'DEOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DEOF
systemctl restart docker
log "Docker log rotation configured"

# ─── 7. Network security sysctl ──────────────────────────
log "Setting network security parameters..."
cat > /etc/sysctl.d/99-panorama.conf << 'SEOF'
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
vm.swappiness = 10
SEOF
sysctl -p /etc/sysctl.d/99-panorama.conf
log "Network security hardened"

# ─── 8. Pull latest code ─────────────────────────────────
log "Pulling latest code from GitHub..."
cd /opt/panorama
git pull origin main
log "Code updated"

# ─── Summary ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}Server setup COMPLETE!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  SSH:          Restarted with hardened config"
echo "  MySQL:        System MySQL STOPPED & DISABLED"
echo "  Docker:       OK with log rotation"
echo "  Deploy user:  Created"
echo "  Firewall:     UFW active (22, 80, 443 only)"
echo "  Network:      Hardened sysctl parameters"
echo ""
echo -e "${YELLOW}NEXT: You need to create your .env file:${NC}"
echo ""
echo "  cd /opt/panorama"
echo "  cp .env.production.example .env"
echo "  nano .env    # fill in your real passwords and API keys"
echo "  chmod 600 .env"
echo ""
echo "  Then build & launch:"
echo "  docker compose up -d --build"
echo "  docker exec panorama-app npx prisma db push"
echo "  docker exec panorama-app npx prisma db seed"
echo ""
