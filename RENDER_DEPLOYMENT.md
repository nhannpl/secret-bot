# 🎨 Render.com Deployment Guide

## Deploy Your Discord Bot to Render.com (Free Tier)

Quick and easy deployment - takes about 5 minutes!

---

## 🎁 **What You Get (FREE):**

- 750 hours/month execution time
- Auto-deploy from GitHub
- Easy web dashboard
- No credit card required

**⚠️ Important:** Free tier services sleep after 15 minutes of inactivity. Your bot will wake up when someone uses a command (~30 second delay).

---

## 🚀 **STEP 1: Create Render Account**

### 1.1 Go to Render
Visit: **https://render.com/**

### 1.2 Sign Up
1. Click **"Get Started"** or **"Sign Up"**
2. Choose **"Sign up with GitHub"**
3. Authorize Render to access your GitHub account

**✋ STOP HERE - Confirm you're logged into Render dashboard!**

---

## 📦 **STEP 2: Create a New Web Service**

### 2.1 Create New Service
1. In Render dashboard, click **"New +"** button (top right)
2. Select **"Web Service"**

### 2.2 Connect Repository
1. Click **"Connect account"** if needed to authorize GitHub
2. Find and select **"secret-bot"** repository
3. Click **"Connect"**

**✋ STOP HERE - Confirm repository is connected!**

---

## ⚙️ **STEP 3: Configure Your Service**

### 3.1 Basic Settings

**Name:**
```
secret-discord-bot
```

**Region:**
- Choose the closest region to you (e.g., Oregon USA, Frankfurt EU, Singapore)

**Branch:**
```
main
```
(or `master` if that's your branch name)

**Root Directory:**
- Leave blank

**Runtime:**
```
Node
```

### 3.2 Build & Start Commands

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

### 3.3 Plan
- Select **"Free"** plan
- You should see "750 hours/month" mentioned

**✋ STOP HERE - Before clicking "Create Web Service"!**

---

## 🔐 **STEP 4: Add Environment Variables**

Before creating the service, scroll down to **Environment Variables** section.

### 4.1 Add Discord Token
Click **"Add Environment Variable"**

**Key:**
```
DISCORD_TOKEN
```

**Value:**
```
your_actual_discord_bot_token_here
```

### 4.2 Add Client ID
Click **"Add Environment Variable"** again

**Key:**
```
DISCORD_CLIENT_ID
```

**Value:**
```
your_actual_client_id_here
```

### 4.3 Get Your Discord Credentials

**If you don't have them handy:**

1. Go to https://discord.com/developers/applications
2. Click your bot application
3. **Bot Token:**
   - Go to "Bot" tab
   - Click "Reset Token" (or "Copy" if visible)
   - Copy the token
4. **Client ID:**
   - Go to "OAuth2" → "General"
   - Copy the "Client ID"

**✋ STOP HERE - Confirm you've added BOTH environment variables!**

---

## 🎉 **STEP 5: Deploy!**

### 5.1 Create Service
1. Scroll to bottom
2. Click **"Create Web Service"**

### 5.2 Wait for Deployment
- Render will now build and deploy your bot
- You'll see logs in real-time
- Wait for "Your service is live 🎉" message
- This takes 2-3 minutes

**✋ STOP HERE - Confirm deployment is complete (status shows "Live")!**

---

## 🎮 **STEP 6: Deploy Slash Commands**

Your bot is running, but you need to register Discord commands!

### Option A: Using Render Shell

1. In Render dashboard, click on your service
2. Click **"Shell"** tab at the top
3. In the shell, run:
```bash
npm run deploy
```
4. You should see "Successfully reloaded X application (/) commands"

### Option B: From Your Local Machine

If Render shell doesn't work, deploy from your computer:

1. Make sure you have `.env` locally:
```bash
cd /Users/nhan/github/secret-bot
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```bash
nano .env
```

Add:
```
DISCORD_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
```

3. Deploy commands:
```bash
npm run deploy
```

**✋ STOP HERE - Confirm commands are deployed!**

---

## ✅ **STEP 7: Test Your Bot**

### 7.1 Check Logs
1. In Render dashboard, go to your service
2. Click **"Logs"** tab
3. You should see "Ready! Logged in as [Your Bot Name]"

### 7.2 Test in Discord
1. Go to your Discord server
2. Type `/` and you should see your bot's commands
3. Try `/self-destruct-dm` with a test message
4. It should work!

---

## 🎊 **Congratulations!**

Your Discord bot is now deployed on Render! 🚀

---

## ⚠️ **Important: Understanding the Free Tier**

### How the Sleep Works:

**When bot sleeps:**
- After 15 minutes of no HTTP requests
- Discord bots typically sleep quickly since they don't receive HTTP requests

**When bot wakes:**
- When Discord sends a command to it
- Takes ~30 seconds to wake up
- User will see "Bot is thinking..." during this time

### Best Practices:

✅ **This is fine for:**
- Personal bots
- Low-traffic servers
- Bots that don't need instant responses

❌ **Not ideal for:**
- High-traffic bots
- Bots with scheduled tasks (cron jobs)
- Bots needing instant responses

---

## 🔄 **Auto-Deploy on Git Push**

Great news! Render automatically deploys when you push to GitHub:

1. Make changes to your code locally
2. Commit and push:
```bash
git add .
git commit -m "Your changes"
git push origin main
```
3. Render automatically detects the push and redeploys!
4. Watch the deployment in Render dashboard

---

## 🛠️ **Useful Render Features**

### View Logs
- Dashboard → Your Service → "Logs" tab
- See real-time bot activity

### Restart Service
- Dashboard → Your Service → "Manual Deploy" → "Deploy latest commit"

### Environment Variables
- Dashboard → Your Service → "Environment" tab
- Add/edit/remove variables
- Service auto-restarts when you change them

### Shell Access
- Dashboard → Your Service → "Shell" tab
- Run commands directly on the server

---

## 🆘 **Troubleshooting**

### Bot shows offline
- Check Render logs for errors
- Verify environment variables are set correctly
- Make sure service is "Live" (not "Build failed")

### Commands don't appear
- Run `npm run deploy` again
- Wait a few minutes for Discord to update
- Try kicking and re-inviting the bot

### Bot is slow to respond
- This is normal - free tier sleeps after 15 mins
- First command after sleep takes ~30 seconds
- Subsequent commands are instant

### Deployment failed
- Check Render logs for error messages
- Verify `package.json` has correct start script
- Make sure all dependencies are in `package.json`

---

## 💡 **Keeping Bot Awake (Optional)**

If you want your bot to respond faster, you can use **UptimeRobot** or **cron-job.org** to ping your bot every 15 minutes:

**Note:** This only works if you add a simple HTTP endpoint to your bot. Not required for basic functionality.

---

## 🔄 **Updating Your Bot**

1. Make changes locally
2. Test locally with `npm start`
3. Push to GitHub:
```bash
git add .
git commit -m "Update bot"
git push origin main
```
4. Render automatically redeploys!
5. If you added new commands, run `npm run deploy` from Render Shell

---

## 📊 **Monitor Usage**

Check your usage to stay within free tier:

1. Render Dashboard → Account Settings
2. View "Usage" section
3. Make sure you're under 750 hours/month

**Tip:** One bot running 24/7 = 720 hours/month (within free tier!)

---

## 💰 **Upgrade Options (Optional)**

If you outgrow the free tier:
- **Starter Plan:** $7/month (always on, no sleeping)
- Still cheaper than most hosting options

---

**Need help? Let me know which step you're on!** 🚀
