#!/bin/bash

# RiskViewer AWS Deployment Script
# This script automates the deployment of the RiskViewer frontend to AWS

set -e

# Configuration
BUCKET_NAME="riskviewer-app-frontend"
REGION="us-east-1"
DISTRIBUTION_ID=""  # Set this after creating CloudFront distribution

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting RiskViewer AWS Deployment${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Build the application
echo -e "${YELLOW}📦 Building the application...${NC}"
cd riskviewer-frontend
npm ci
npm run build

if [ ! -d "dist/riskviewer-frontend" ]; then
    echo -e "${RED}❌ Build failed or dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application built successfully${NC}"

# Create S3 bucket if it doesn't exist
echo -e "${YELLOW}🪣 Creating S3 bucket...${NC}"
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${GREEN}✅ Bucket $BUCKET_NAME already exists${NC}"
else
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    echo -e "${GREEN}✅ Created bucket $BUCKET_NAME${NC}"
fi

# Configure bucket for static website hosting
echo -e "${YELLOW}🌐 Configuring static website hosting...${NC}"
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

# Set bucket policy for public read access
echo -e "${YELLOW}🔓 Setting bucket policy...${NC}"
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file://aws-config/bucket-policy.json

# Configure public access block
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo -e "${GREEN}✅ S3 bucket configured for static hosting${NC}"

# Upload files to S3
echo -e "${YELLOW}📤 Uploading files to S3...${NC}"
cd dist/riskviewer-frontend

# Upload all files with sync
aws s3 sync . "s3://$BUCKET_NAME" --delete

# Set cache headers for HTML files (no cache for SPA routing)
aws s3 cp index.html "s3://$BUCKET_NAME/index.html" \
    --metadata-directive REPLACE \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

# Set cache headers for CSS and JS files (long cache)
for file in $(find . -name "*.css" -o -name "*.js"); do
    aws s3 cp "$file" "s3://$BUCKET_NAME/$file" \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000"
done

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

# Get the website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo -e "${GREEN}🌍 Website URL: $WEBSITE_URL${NC}"

# Invalidate CloudFront cache if distribution ID is provided
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*"
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}⚠️  CloudFront distribution ID not set. Skipping cache invalidation.${NC}"
    echo -e "${YELLOW}   To enable CloudFront caching, create a distribution and set DISTRIBUTION_ID${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📱 Your RiskViewer app is now live at: $WEBSITE_URL${NC}"

# Return to original directory
cd ../..

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "   1. Create a CloudFront distribution for better performance"
echo -e "   2. Set up a custom domain with Route 53"
echo -e "   3. Configure SSL certificate with AWS Certificate Manager"
echo -e "   4. Set up monitoring with CloudWatch"
