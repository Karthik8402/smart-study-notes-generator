#!/bin/bash
# ============================================================
# AWS EC2 Deployment Script - Smart Study Notes Generator
# For Ubuntu 22.04 LTS on t2.micro with swap file
# ============================================================

set -e  # Exit on error

echo "============================================================"
echo "   Smart Study Notes Generator - EC2 Deployment"
echo "============================================================"
echo ""

# Configuration
APP_NAME="smart-study-notes"
APP_DIR="/home/ubuntu/$APP_NAME"
REPO_URL="https://github.com/Karthik8402/smart-study-notes-generator.git"
NODE_VERSION="18"
PYTHON_VERSION="3.11"
SWAP_SIZE="2G"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

# ============================================================
# Step 1: Create Swap File (for t2.micro with 1GB RAM)
# ============================================================
echo ""
echo "Step 1: Setting up swap file..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l $SWAP_SIZE /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    print_step "Swap file created ($SWAP_SIZE)"
else
    print_warning "Swap file already exists, skipping..."
fi

# ============================================================
# Step 2: Update System
# ============================================================
echo ""
echo "Step 2: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_step "System updated"

# ============================================================
# Step 3: Install System Dependencies
# ============================================================
echo ""
echo "Step 3: Installing system dependencies..."
sudo apt install -y \
    software-properties-common \
    build-essential \
    curl \
    git \
    nginx \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils

print_step "System dependencies installed"

# ============================================================
# Step 4: Install Python 3.11
# ============================================================
echo ""
echo "Step 4: Installing Python $PYTHON_VERSION..."
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python$PYTHON_VERSION python$PYTHON_VERSION-venv python$PYTHON_VERSION-dev python3-pip
print_step "Python $PYTHON_VERSION installed"

# ============================================================
# Step 5: Install Node.js
# ============================================================
echo ""
echo "Step 5: Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
sudo apt install -y nodejs
print_step "Node.js $(node -v) installed"

# Install PM2 globally
sudo npm install -g pm2
print_step "PM2 installed"

# ============================================================
# Step 6: Clone Repository
# ============================================================
echo ""
echo "Step 6: Cloning repository..."
if [ -d "$APP_DIR" ]; then
    print_warning "Directory exists, pulling latest changes..."
    cd $APP_DIR
    git pull
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi
print_step "Repository cloned to $APP_DIR"

# ============================================================
# Step 7: Setup Backend
# ============================================================
echo ""
echo "Step 7: Setting up backend..."
cd $APP_DIR/backend

# Create virtual environment
python$PYTHON_VERSION -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

print_step "Backend dependencies installed"

# Create .env file if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Created .env from example. Please edit with your secrets!"
fi

# ============================================================
# Step 8: Setup Frontend
# ============================================================
echo ""
echo "Step 8: Setting up frontend..."
cd $APP_DIR/frontend

# Install dependencies
npm install

# Build for production
npm run build

print_step "Frontend built successfully"

# ============================================================
# Step 9: Copy PM2 ecosystem config
# ============================================================
echo ""
echo "Step 9: Setting up PM2..."
cd $APP_DIR

# PM2 ecosystem file should already exist after git clone
if [ ! -f ecosystem.config.js ]; then
    print_error "ecosystem.config.js not found! Please create it."
fi

print_step "PM2 configuration ready"

# ============================================================
# Step 10: Configure Nginx
# ============================================================
echo ""
echo "Step 10: Configuring Nginx..."

# Copy frontend build to nginx directory
sudo rm -rf /var/www/html/*
sudo cp -r $APP_DIR/frontend/dist/* /var/www/html/

# Copy nginx configuration
sudo cp $APP_DIR/nginx.conf /etc/nginx/sites-available/smart-study-notes
sudo ln -sf /etc/nginx/sites-available/smart-study-notes /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

print_step "Nginx configured"

# ============================================================
# Step 11: Start Services with PM2
# ============================================================
echo ""
echo "Step 11: Starting services..."
cd $APP_DIR

# Stop existing PM2 processes if any
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

print_step "Services started with PM2"

# ============================================================
# Final Summary
# ============================================================
echo ""
echo "============================================================"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your secrets (MongoDB URL, API keys)"
echo "  2. Restart services: pm2 restart all"
echo "  3. View logs: pm2 logs"
echo ""
echo "Your app should be accessible at:"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<YOUR-EC2-IP>")
echo "  http://$PUBLIC_IP"
echo ""
echo "Health check:"
echo "  curl http://localhost:8000/api/health"
echo ""
echo "============================================================"
