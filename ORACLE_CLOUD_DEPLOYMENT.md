# 🔮 Oracle Cloud Deployment Guide

## Deploy Your Discord Bot to Oracle Cloud Always Free Tier

This guide will help you deploy your Discord bot to Oracle Cloud's **Always Free** tier - which is actually free forever!

---

## 🎁 **What You Get (FREE FOREVER):**

- 2 AMD-based or 4 ARM-based VMs
- 24GB RAM total (12GB per ARM VM)
- 200GB storage
- 10TB/month outbound data transfer
- **No time limit - free for life!**

---

## 📋 **Prerequisites**

- ✅ Oracle Cloud account (we'll create this)
- ✅ Your Discord bot token and client ID
- ✅ Basic terminal/SSH knowledge
- ✅ 15-20 minutes of setup time

---

## 🚀 **STEP 1: Create Oracle Cloud Account**

### 1.1 Sign Up
1. Go to: **https://www.oracle.com/cloud/free/**
2. Click **"Start for free"**
3. Fill in your information:
   - Email address
   - Country/Territory
   - First and Last Name

### 1.2 Verify Account
1. Check your email for verification
2. Click the verification link
3. Complete your profile

### 1.3 Payment Information
⚠️ **Important:** Oracle requires a credit card for verification but **will NOT charge you** for Always Free resources.
- Add your credit card information
- This is purely for identity verification
- You'll get a $300 credit for 30 days (optional to use)

### 1.4 Complete Setup
- Choose your home region (pick the closest one to you)
- Accept terms and conditions
- Wait for account provisioning (takes 1-2 minutes)

**✋ STOP HERE - Confirm you've created your account and can see the Oracle Cloud dashboard!**

---

## 🖥️ **STEP 2: Create a Free VM Instance**

### 2.1 Navigate to Compute
1. In Oracle Cloud Console, click the **hamburger menu** (☰) top left
2. Go to: **Compute** → **Instances**
3. Click **"Create Instance"**

### 2.2 Configure Your Instance

**Name:**
```
secret-discord-bot
```

**Compartment:**
- Leave as default (root compartment)

**Placement:**
- Leave as default

**Image and Shape:**
1. Click **"Change Image"**
   - Select: **Ubuntu 22.04** (or latest Ubuntu)
   - Click **"Select Image"**

2. Click **"Change Shape"**
   - Click **"Ampere"** tab
   - Select: **VM.Standard.A1.Flex**
   - Set OCPUs: **1** (or 2 if available)
   - Set Memory: **6 GB** (or more if you want)
   - Click **"Select Shape"**

⚠️ **Important:** Make sure you see "Always Free-eligible" badge!

### 2.3 Networking
- **Virtual Cloud Network:** Create new (or use existing)
- **Subnet:** Create new public subnet (or use existing)
- **Assign a public IPv4 address:** ✅ **YES** (checked)

### 2.4 SSH Keys

**Option A: Generate new SSH key pair**
1. Select **"Generate a key pair for me"**
2. Click **"Save Private Key"** - save as `oracle-key.pem`
3. Click **"Save Public Key"** (optional backup)

**Option B: Use existing key**
- If you have an SSH key, you can upload it

⚠️ **IMPORTANT:** Save the private key file - you'll need it to connect!

### 2.5 Boot Volume
- Leave defaults (Always Free eligible)

### 2.6 Create Instance
1. Click **"Create"** button
2. Wait for instance to provision (1-2 minutes)
3. Status will change from "Provisioning" → "Running" (orange → green)

**✋ STOP HERE - Confirm your instance is RUNNING with a green status!**

---

## 🌐 **STEP 3: Configure Firewall Rules**

### 3.1 Open Network Security List
1. On your instance details page, under **Instance Details**
2. Find **Primary VNIC** section
3. Click on the **Subnet** link (e.g., "subnet-20250107...")
4. Click on the **Default Security List**

### 3.2 Add Ingress Rule (Optional - for monitoring)
We don't need to open ports for a Discord bot, but if you want to add a health check endpoint:

1. Click **"Add Ingress Rules"**
2. Fill in:
   - **Source CIDR:** `0.0.0.0/0`
   - **Destination Port Range:** `3000` (if you add Express health check)
   - **Description:** `Discord Bot Health Check`
3. Click **"Add Ingress Rules"**

> **Note:** Discord bots don't need incoming ports - they connect OUT to Discord. This step is optional.

**✋ STOP HERE - Firewall configured!**

---

## 🔑 **STEP 4: Connect to Your VM**

### 4.1 Get Your IP Address
1. Go back to your instance details page
2. Copy the **Public IP Address** (e.g., `xxx.xxx.xxx.xxx`)

### 4.2 Set SSH Key Permissions (Mac/Linux)
```bash
chmod 400 ~/Downloads/oracle-key.pem
```

### 4.3 Connect via SSH
```bash
ssh -i ~/Downloads/oracle-key.pem ubuntu@YOUR_PUBLIC_IP
```

Replace `YOUR_PUBLIC_IP` with the IP address you copied.

**First time connecting:**
- You'll see "The authenticity of host... can't be established"
- Type `yes` and press Enter

**✋ STOP HERE - Confirm you're connected to the VM (you should see `ubuntu@instance-name:~$`)!**

---

## 📦 **STEP 5: Install Node.js and Dependencies**

### 5.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 5.2 Install Node.js 20.x (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 5.3 Verify Installation
```bash
node --version
npm --version
```

You should see Node.js v20.x and npm v10.x

### 5.4 Install Git
```bash
sudo apt install -y git
```

**✋ STOP HERE - Confirm Node.js and Git are installed!**

---

## 📥 **STEP 6: Clone and Setup Your Bot**

### 6.1 Clone Repository
```bash
git clone https://github.com/nhannpl/secret-bot.git
cd secret-bot
```

### 6.2 Install Dependencies
```bash
npm install
```

### 6.3 Create Environment File
```bash
nano .env
```

### 6.4 Add Your Credentials
Paste the following (replace with your actual values):
```env
DISCORD_TOKEN=your_actual_bot_token_here
DISCORD_CLIENT_ID=your_actual_client_id_here
```

**To save and exit nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### 6.5 Create config.json (for defaultTimeout)
```bash
nano config.json
```

Paste:
```json
{
    "defaultTimeout": 10
}
```

Save and exit (Ctrl+X, Y, Enter)

**✋ STOP HERE - Confirm files are set up!**

---

## 🎮 **STEP 7: Deploy Commands and Test**

### 7.1 Deploy Slash Commands
```bash
npm run deploy
```

You should see: "Successfully reloaded X application (/) commands."

### 7.2 Test the Bot (Quick Test)
```bash
npm start
```

You should see: "Ready! Logged in as [Your Bot Name]"

**Test in Discord:**
- Go to your Discord server
- Type `/` and check if your bot's commands appear
- Try a quick command

**To stop the bot:**
- Press `Ctrl + C`

**✋ STOP HERE - Confirm bot works before proceeding to background setup!**

---

## 🔄 **STEP 8: Setup Bot as a Service (Keep Running 24/7)**

### 8.1 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 8.2 Start Bot with PM2
```bash
pm2 start index.js --name secret-bot
```

### 8.3 Save PM2 Configuration
```bash
pm2 save
```

### 8.4 Setup PM2 Startup (Auto-restart on reboot)
```bash
pm2 startup
```

This will show a command starting with `sudo env...`
**Copy and run that exact command.**

### 8.5 Verify Bot is Running
```bash
pm2 status
```

You should see your `secret-bot` with status `online`

### 8.6 View Logs (Optional)
```bash
pm2 logs secret-bot
```

Press `Ctrl + C` to exit logs view.

**✋ STOP HERE - Confirm bot is running with PM2!**

---

## 🎉 **STEP 9: Verification**

### 9.1 Check Bot Status
Your bot should now be:
- ✅ Running 24/7
- ✅ Auto-restart on crashes
- ✅ Auto-start on VM reboot

### 9.2 Test in Discord
1. Go to your Discord server
2. Run a command like `/self-destruct-dm`
3. Verify it works!

---

## 🛠️ **Useful PM2 Commands**

```bash
# Check bot status
pm2 status

# View logs
pm2 logs secret-bot

# Restart bot
pm2 restart secret-bot

# Stop bot
pm2 stop secret-bot

# Delete bot from PM2
pm2 delete secret-bot
```

---

## 🔄 **Updating Your Bot (When You Make Changes)**

### Method 1: Pull Updates
```bash
cd ~/secret-bot
git pull
npm install  # If you added new dependencies
pm2 restart secret-bot
```

### Method 2: Deploy New Commands
```bash
cd ~/secret-bot
npm run deploy
pm2 restart secret-bot
```

---

## 📊 **Monitoring & Maintenance**

### Check VM Resources
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top
```
(Press `q` to exit top)

### Oracle Cloud Dashboard
- Monitor instance status
- Check network traffic
- Ensure you're staying in "Always Free" limits

---

## 🆘 **Troubleshooting**

### Bot won't start
```bash
# Check logs for errors
pm2 logs secret-bot

# Restart the bot
pm2 restart secret-bot

# Test manually
npm start
```

### Can't SSH into VM
- Check your public IP in Oracle Cloud Console
- Verify SSH key permissions: `chmod 400 oracle-key.pem`
- Check security list rules

### Bot goes offline randomly
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs secret-bot --lines 100`
- Verify environment variables: `cat .env`

### Out of memory
```bash
# Check memory
free -h

# Restart bot
pm2 restart secret-bot
```

---

## 🎊 **Congratulations!**

Your Discord bot is now running 24/7 on Oracle Cloud for **FREE FOREVER**! 🚀

### What You've Accomplished:
✅ Created an Oracle Cloud Always Free VM
✅ Installed Node.js and dependencies
✅ Deployed your Discord bot
✅ Setup automatic startup and monitoring with PM2
✅ Your bot runs 24/7 with auto-restart protection

---

## 💡 **Pro Tips**

1. **Keep your SSH key safe** - it's your access to the server
2. **Monitor usage** in Oracle Cloud dashboard to stay within free limits
3. **Regular updates:** SSH in monthly to run `sudo apt update && sudo apt upgrade`
4. **Backup your .env file** locally - don't lose your credentials!

---

**Need help? Stuck on a step? Let me know and I'll guide you through it!**
