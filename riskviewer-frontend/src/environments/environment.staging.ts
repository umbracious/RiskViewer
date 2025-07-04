export const environment = {
  production: false,
  apiUrl: 'https://staging-api.riskviewer.com', // Replace with your staging backend API URL
  websocketUrl: 'wss://staging-api.riskviewer.com/ws',
  enableAnalytics: false,
  enableErrorReporting: true,
  marketDataRefreshInterval: 10000, // 10 seconds for staging
  logLevel: 'info',
  features: {
    realTimeUpdates: true,
    advancedAnalytics: true,
    exportFunctionality: true,
    alertsSystem: true
  },
  aws: {
    region: 'us-east-1',
    userPoolId: '', // Add Cognito User Pool ID for staging
    userPoolWebClientId: '', // Add Cognito App Client ID for staging
    identityPoolId: '' // Add Cognito Identity Pool ID if needed
  },
  version: '1.0.0-staging'
};
