#!/bin/bash
# AWS EC2 User Data Script for PackNow
# This script automatically sets up the server and deploys the app

# 1. Update and Install Dependencies
yum update -y
yum install -y git docker

# 2. Start Docker
service docker start
usermod -a -G docker ec2-user

# 3. Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. Clone Repository
cd /home/ec2-user
git clone https://github.com/prathameshratthe/PackNow.git
cd PackNow

# 5. Create Environment File
cat <<EOT >> .env
POSTGRES_USER=packnow_user
POSTGRES_PASSWORD=$(openssl rand -base64 12)
POSTGRES_DB=packnow
SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_ORIGINS=*
EOT

# 6. Deploy
/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d

# 7. Setup Nginx Reverse Proxy (Optional, if not using Docker Nginx)
# For this setup, we expose port 80 directly from Docker, so no extra Nginx needed on host.
