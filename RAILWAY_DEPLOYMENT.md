# 🚀 Railway Deployment Guide

## Step-by-Step Guide to Deploy Your Discord Bot to Railway.app

Follow these steps carefully. I'll guide you through each one!

---

## 📋 **Prerequisites**

Before starting, make sure you have:
- ✅ A GitHub account
- ✅ Your Discord bot token and client ID
- ✅ Git installed on your computer

---

## 🎯 **STEP 1: Push Your Code to GitHub**

First, we need to push your updated code to GitHub.

### 1.1 Check Git Status
Open terminal in your project folder and run:
```bash
cd /Users/nhan/github/secret-bot
git status
```

### 1.2 Add All Changes
```bash
git add .
```

### 1.3 Commit Changes
```bash
git commit -m "Prepare for Railway deployment - add env variable support"
```

### 1.4 Push to GitHub
```bash
git push origin main
```
(If your branch is called `master`, use `git push origin master`)

**✋ STOP HERE - Confirm you've completed this step before proceeding!**

---

## 🌐 **STEP 2: Create Railway Account**

### 2.1 Go to Railway
Visit: https://railway.app/

### 2.2 Sign Up
Click **"Login"** in the top right → **"Login with GitHub"**

This will connect your GitHub account to Railway.

**✋ STOP HERE - Confirm you've created your account!**

---

## 🚂 **STEP 3: Create New Project on Railway**

### 3.1 Create Project
Once logged in, click **"New Project"**

### 3.2 Deploy from GitHub
Select **"Deploy from GitHub repo"**

### 3.3 Authorize Railway
If prompted, click **"Configure GitHub App"** and give Railway access to your repositories

### 3.4 Select Your Repository
Find and select **"secret-bot"** from the list

Railway will now start deploying, but it will FAIL because we haven't added environment variables yet. That's expected!

**✋ STOP HERE - Confirm you see your project on Railway!**

---

## 🔐 **STEP 4: Get Your Discord Bot Credentials**

You need two things from Discord Developer Portal:

### 4.1 Get Bot Token
1. Go to https://discord.com/developers/applications
2. Click on your bot application
3. Go to **"Bot"** tab on the left
4. Under **"TOKEN"**, click **"Reset Token"** (or "Copy" if you see it)
5. **COPY THIS TOKEN** - you'll need it in the next step
   
⚠️ **IMPORTANT:** Never share this token publicly!

### 4.2 Get Client ID
1. Still in Discord Developer Portal
2. Go to **"OAuth2"** tab → **"General"**
3. Copy the **"CLIENT ID"** (it's a long number)

**✋ STOP HERE - Confirm you have both TOKEN and CLIENT ID copied!**

---

## ⚙️ **STEP 5: Add Environment Variables to Railway**

### 5.1 Open Variables Tab
In Railway, click on your **secret-bot** service → Click **"Variables"** tab

### 5.2 Add Discord Token
Click **"New Variable"**
- **Key:** `DISCORD_TOKEN`
- **Value:** Paste your bot token from Step 4.1

### 5.3 Add Client ID
Click **"New Variable"** again
- **Key:** `DISCORD_CLIENT_ID`
- **Value:** Paste your client ID from Step 4.2

### 5.4 Save
Railway automatically saves when you add variables.

Your bot should now automatically redeploy!

**✋ STOP HERE - Confirm you've added both environment variables!**

---

## 🎉 **STEP 6: Deploy Slash Commands**

Your bot is now running, but you need to register the slash commands!

### Option A: Deploy from Railway Dashboard

1. In Railway dashboard, click on your service
2. Click the **"..."** menu (three dots) → **"Run Command"**
3. Enter: `npm run deploy`
4. Click **"Run"**

### Option B: Deploy from Your Local Machine

```bash
# Make sure you have a .env file locally
cp .env.example .env

# Edit .env and add your credentials
# Then run:
npm run deploy
```

**✋ STOP HERE - Confirm commands are deployed (you should see "Successfully reloaded X commands")!**

---

## ✅ **STEP 7: Verify Bot is Running**

### 7.1 Check Railway Logs
In Railway dashboard:
- Click on your service
- Click **"Deployments"** tab
- Click the latest deployment
- View the logs - you should see "Logged in as [Your Bot Name]"

### 7.2 Test in Discord
1. Go to your Discord server
2. Type `/` and you should see your bot's commands:
   - `/self-destruct-channel-message`
   - `/self-destruct-dm`
3. Try sending a test message!

---

## 🎊 **Congratulations!**

Your bot is now live 24/7 on Railway! 🚀

---

## 📊 **What's Next?**

### Monitor Your Bot
- Check Railway dashboard to see logs and resource usage
- Railway's free tier gives you 500 hours/month ($5 credit)

### Auto-Deploy on Push
Now whenever you `git push` to GitHub, Railway will:
1. Automatically pull your changes
2. Rebuild and redeploy your bot
3. Keep it running!

### If Something Goes Wrong
Check the **"Logs"** tab in Railway dashboard to see error messages.

---

## 🆘 **Troubleshooting**

### Bot shows as offline
- Check Railway logs for errors
- Verify environment variables are set correctly
- Make sure DISCORD_TOKEN is valid

### Commands don't appear
- Run the deploy command again (`npm run deploy`)
- Wait a few minutes for Discord to update
- Try kicking and re-inviting the bot

### Bot crashes on startup
- Check Railway logs
- Verify all required intents are enabled in Discord Developer Portal

---

## 💰 **Railway Free Tier Limits**

- **500 hours/month** execution time
- **$5/month** free credit
- Should be plenty for a small Discord bot!

Monitor usage at: Railway Dashboard → Your Service → "Usage" tab

---

**Need help? Let me know which step you're on and I'll guide you through it!**
