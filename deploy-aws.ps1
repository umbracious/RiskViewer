# RiskViewer AWS Deployment Script (PowerShell)
# This script automates the deployment of the RiskViewer frontend to AWS

param(
    [string]$BucketName = "riskviewer-app-frontend",
    [string]$Region = "us-east-1",
    [string]$DistributionId = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting RiskViewer AWS Deployment" -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Build the application
Write-Host "📦 Building the application..." -ForegroundColor Yellow
Set-Location "riskviewer-frontend"

npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "dist\riskviewer-frontend")) {
    Write-Host "❌ Build output directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Application built successfully" -ForegroundColor Green

# Create S3 bucket if it doesn't exist
Write-Host "🪣 Creating S3 bucket..." -ForegroundColor Yellow
try {
    aws s3api head-bucket --bucket $BucketName 2>$null
    Write-Host "✅ Bucket $BucketName already exists" -ForegroundColor Green
} catch {
    aws s3 mb "s3://$BucketName" --region $Region
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Created bucket $BucketName" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create bucket" -ForegroundColor Red
        exit 1
    }
}

# Configure bucket for static website hosting
Write-Host "🌐 Configuring static website hosting..." -ForegroundColor Yellow
aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html

# Set bucket policy for public read access
Write-Host "🔓 Setting bucket policy..." -ForegroundColor Yellow
aws s3api put-bucket-policy --bucket $BucketName --policy file://..\aws-config\bucket-policy.json

# Configure public access block
aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

Write-Host "✅ S3 bucket configured for static hosting" -ForegroundColor Green

# Upload files to S3
Write-Host "📤 Uploading files to S3..." -ForegroundColor Yellow
Set-Location "dist\riskviewer-frontend"

# Upload all files with sync
aws s3 sync . "s3://$BucketName" --delete

# Set cache headers for HTML files (no cache for SPA routing)
aws s3 cp index.html "s3://$BucketName/index.html" --metadata-directive REPLACE --cache-control "no-cache, no-store, must-revalidate" --content-type "text/html"

# Set cache headers for CSS and JS files (long cache)
Get-ChildItem -Recurse -Include "*.css", "*.js" | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    aws s3 cp $_.FullName "s3://$BucketName/$relativePath" --metadata-directive REPLACE --cache-control "public, max-age=31536000"
}

Write-Host "✅ Files uploaded successfully" -ForegroundColor Green

# Get the website URL
$WebsiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"
Write-Host "🌍 Website URL: $WebsiteUrl" -ForegroundColor Green

# Invalidate CloudFront cache if distribution ID is provided
if ($DistributionId -ne "") {
    Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Yellow
    aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
    Write-Host "✅ CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "⚠️  CloudFront distribution ID not set. Skipping cache invalidation." -ForegroundColor Yellow
    Write-Host "   To enable CloudFront caching, create a distribution and set -DistributionId parameter" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📱 Your RiskViewer app is now live at: $WebsiteUrl" -ForegroundColor Green

# Return to original directory
Set-Location "..\..\.."

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Create a CloudFront distribution for better performance"
Write-Host "   2. Set up a custom domain with Route 53"
Write-Host "   3. Configure SSL certificate with AWS Certificate Manager"
Write-Host "   4. Set up monitoring with CloudWatch"
