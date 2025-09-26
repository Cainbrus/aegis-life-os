# MongoDB Atlas Setup for Aegis Production

## 🎯 **STEP-BY-STEP DATABASE SETUP (10 minutes)**

### **1. Create MongoDB Atlas Account**
- Go to: https://cloud.mongodb.com
- Click "Try Free" 
- Sign up with email/password

### **2. Create New Cluster**
- Choose "FREE" tier (M0 Sandbox)
- Select region closest to you
- Cluster name: `aegis-cluster`
- Click "Create Cluster"

### **3. Database Security Setup**
- **Database Access** → Add New Database User
  - Username: `aegis`
  - Password: Generate secure password (save it!)
  - Database User Privileges: Read and write to any database
  - Add User

- **Network Access** → Add IP Address
  - Click "Add Current IP Address" 
  - Also add: `0.0.0.0/0` (Allow access from anywhere - for Railway)
  - Add Entry

### **4. Get Connection String**
- Go to **Database** → **Connect**
- Choose "Connect your application"
- Driver: Node.js, Version: 4.1 or later
- Copy the connection string:
  ```
  mongodb+srv://aegis:<password>@aegis-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```

### **5. Configure Database**
Replace `<password>` with your actual password:
```
mongodb+srv://aegis:YOUR_PASSWORD@aegis-cluster.xxxxx.mongodb.net/aegis_production?retryWrites=true&w=majority
```

### **6. Test Connection**
Your database will automatically create collections when Aegis starts using them:
- `user_onboarding`
- `beta_users` 
- `vault_access_logs`
- `emergency_events`
- And more...

### **✅ Ready for Production!**
Your MongoDB Atlas database is now ready to handle Aegis users worldwide with:
- Free tier: 512 MB storage, shared RAM
- Can handle ~1,000 active users
- Automatic backups
- Global clusters available

**Save your connection string - you'll need it for Railway deployment!**