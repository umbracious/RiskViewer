export const environment = {
  production: true,
  apiUrl: 'https://api.riskviewer.com', // Replace with your backend API URL
  websocketUrl: 'wss://api.riskviewer.com/ws',
  enableAnalytics: true,
  enableErrorReporting: true,
  marketDataRefreshInterval: 5000, // 5 seconds for production
  logLevel: 'warn',
  features: {
    realTimeUpdates: true,
    advancedAnalytics: true,
    exportFunctionality: true,
    alertsSystem: true
  },
  aws: {
    region: 'us-east-1',
    userPoolId: '', // Add Cognito User Pool ID if using authentication
    userPoolWebClientId: '', // Add Cognito App Client ID
    identityPoolId: '' // Add Cognito Identity Pool ID if needed
  },
  version: '1.0.0'
};
