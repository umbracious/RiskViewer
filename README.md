# 🏦 RiskViewer - Enterprise Risk Analytics Platform

[![Angular](https://img.shields.io/badge/Angular-19.2-red)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![AWS Ready](https://img.shields.io/badge/AWS-Ready-orange)](https://aws.amazon.com/)

Modern risk analytics dashboard with real-time market data integration and AWS deployment capabilities.

## 🚀 Quick Start
```bash
cd riskviewer-frontend
npm install && npm start
```
Open [http://localhost:4200](http://localhost:4200)

## ✨ Core Features

- **Real-time Portfolio Tracking** - Live P&L, market values, and risk metrics
- **Market Data Integration** - Yahoo Finance & Finnhub APIs with fallback
- **Risk Analytics** - VaR (95%), Portfolio Beta, Volatility calculations
- **Modern UI** - Responsive design with professional card-based layout
- **AWS Deployment** - One-click deploy scripts for S3 + CloudFront

## 🛠️ Tech Stack

- **Angular 19.2** with TypeScript 5.7
- **RxJS** for reactive programming
- **SCSS** for styling
- **Spring Boot 3** backend (Java 17)
- **AWS S3 + CloudFront** deployment

## 🚀 Deployment

### Development
```bash
git clone <repository-url>
cd RiskViewer/riskviewer-frontend
npm install && npm start
```

### Production Build
```bash
npm run build
```

### AWS Deployment
```bash
# Windows
.\deploy-aws.ps1 -BucketName "your-bucket-name"

# Linux/Mac
./deploy-aws.sh
```

## 📁 Project Structure

```
RiskViewer/
├── riskviewer-frontend/           # Angular application
│   ├── src/app/
│   │   ├── main-dashboard/        # Main dashboard component
│   │   ├── services/              # Market data & portfolio services
│   │   └── environments/          # Environment configs
│   └── package.json
├── riskviewer-backend/            # Spring Boot API
│   ├── src/main/java/
│   └── pom.xml
├── aws-config/                    # AWS deployment configs
├── deploy-aws.ps1                 # Windows deployment script
└── deploy-aws.sh                  # Linux/Mac deployment script
```

## 📊 Key Components

- **Market Data Service** - Real-time price feeds from Yahoo Finance/Finnhub
- **Portfolio Service** - P&L calculations and risk metrics
- **Alert Service** - Risk threshold monitoring
- **Main Dashboard** - Consolidated view with portfolio summary and risk analytics

---

**Built by Satyam** | Enterprise risk analytics platform for capital markets teams
