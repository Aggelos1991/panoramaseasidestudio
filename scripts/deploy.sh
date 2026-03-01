#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Panorama Seaside Studios — Server Deployment & Hardening Script
# Run on Hetzner server as root: bash deploy.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check root
[[ $EUID -ne 0 ]] && err "This script must be run as root"

log "Starting Panorama server deployment..."

# ─── 1. System Updates ────────────────────────────────────────
log "Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl wget git htop nano \
  ufw fail2ban unattended-upgrades \
  apt-transport-https ca-certificates gnupg lsb-release

# ─── 2. Automatic Security Updates ───────────────────────────
log "Configuring automatic security updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# ─── 3. UFW Firewall ─────────────────────────────────────────
log "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# BLOCK MySQL from external access (critical!)
ufw deny 3306/tcp comment 'Block MySQL external access'

ufw --force enable
log "Firewall enabled. Only ports 22, 80, 443 are open."

# ─── 4. Fail2Ban (SSH brute force protection) ────────────────
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3
bantime = 86400
EOF

systemctl enable fail2ban
systemctl restart fail2ban
log "Fail2ban configured: 3 failed SSH attempts = 24h ban"

# ─── 5. SSH Hardening ────────────────────────────────────────
log "Hardening SSH configuration..."

# Backup original
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Apply hardening (only if not already applied)
if ! grep -q "# PANORAMA HARDENED" /etc/ssh/sshd_config; then
  cat >> /etc/ssh/sshd_config << 'EOF'

# PANORAMA HARDENED
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
AllowTcpForwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
  systemctl restart sshd
  log "SSH hardened: key-only auth, no password login"
else
  log "SSH already hardened, skipping"
fi

warn "IMPORTANT: Make sure you have an SSH key configured BEFORE logging out!"
warn "Test in a new terminal: ssh root@$(hostname -I | awk '{print $1}')"

# ─── 6. Stop Existing MySQL (if exposed) ─────────────────────
log "Checking for exposed MySQL service..."
if systemctl is-active --quiet mysql 2>/dev/null; then
  warn "Found running MySQL service — stopping and disabling..."
  systemctl stop mysql
  systemctl disable mysql
  log "System MySQL stopped and disabled (will use Docker instead)"
elif systemctl is-active --quiet mariadb 2>/dev/null; then
  warn "Found running MariaDB service — stopping and disabling..."
  systemctl stop mariadb
  systemctl disable mariadb
  log "System MariaDB stopped and disabled"
else
  log "No system MySQL/MariaDB found"
fi

# ─── 7. Install Docker ──────────────────────────────────────
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  log "Docker installed successfully"
else
  log "Docker already installed"
fi

# ─── 8. Create Deploy User ──────────────────────────────────
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

# ─── 9. Create App Directory ────────────────────────────────
log "Creating application directory..."
mkdir -p /opt/panorama/backups
chown -R deploy:deploy /opt/panorama

# ─── 10. Docker Log Rotation ────────────────────────────────
log "Configuring Docker log rotation..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

# ─── 11. System Limits ──────────────────────────────────────
log "Setting system limits..."
cat > /etc/sysctl.d/99-panorama.conf << 'EOF'
# Network security
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

# Performance
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
vm.swappiness = 10
EOF
sysctl -p /etc/sysctl.d/99-panorama.conf

# ─── Summary ─────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}Server hardening complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Firewall:     UFW active (22, 80, 443 only)"
echo "  MySQL:        Port 3306 BLOCKED from internet"
echo "  SSH:          Key-only, no password, 3 max retries"
echo "  Fail2ban:     Active (24h ban after 3 SSH failures)"
echo "  Auto-updates: Enabled"
echo "  Docker:       Installed with log rotation"
echo "  Deploy user:  'deploy' (member of docker group)"
echo ""
echo "Next steps:"
echo "  1. cd /opt/panorama"
echo "  2. git clone https://github.com/Aggelos1991/panoramaseasidestudio.git ."
echo "  3. cp .env.production.example .env && nano .env"
echo "  4. chmod 600 .env"
echo "  5. docker compose up -d --build"
echo "  6. docker exec panorama-app npx prisma db push"
echo "  7. docker exec panorama-app npx prisma db seed"
echo ""
echo -e "${YELLOW}VERIFY: nmap $(hostname -I | awk '{print $1}') — port 3306 must NOT appear${NC}"
echo ""
