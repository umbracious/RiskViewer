# 🚀 RiskViewer - Quick Reference

## 🏃‍♂️ **Quick Start** (30 seconds)
```bash
cd riskviewer-frontend
npm install && npm start
# Opens http://localhost:4200 automatically
```

## 🛠️ **Development Commands**
```bash
npm start              # Start dev server (auto-opens browser)
npm run dev            # Same as start
npm run build          # Production build
npm run build:prod     # Explicit production build  
npm run build:staging  # Staging build
npm test               # Run tests
npm run lint           # Code linting
npm run analyze        # Bundle size analysis
npm run serve:dist     # Serve production build locally
```

## 🌐 **AWS Deployment** (1 minute)
```bash
# Windows
.\deploy-aws.ps1 -BucketName "your-app-name"

# Linux/Mac
chmod +x deploy-aws.sh && ./deploy-aws.sh
```

## 📊 **Key Features**
- ✅ **Real-time Portfolio Dashboard** - Live P&L, risk metrics, market data
- ✅ **Modern UI/UX** - Professional design, mobile responsive  
- ✅ **High Performance** - 172KB gzipped, <2s load time
- ✅ **AWS Ready** - One-click deployment to cloud
- ✅ **Live Market Data** - Real-time prices during market hours

## 🎯 **Project Structure**
```
riskviewer-frontend/
├── src/app/main-dashboard/     # Main dashboard component
├── src/app/services/           # Business logic & API calls  
├── src/environments/           # Environment configs
├── dist/                       # Production build output
└── package.json               # Dependencies & scripts
```

## 🔧 **Configuration**
- **Development**: Automatic with `npm start`
- **Production**: `src/environments/environment.prod.ts`
- **Staging**: `src/environments/environment.staging.ts`

---
**🎉 That's it! Your modern risk analytics dashboard is ready to go!**
