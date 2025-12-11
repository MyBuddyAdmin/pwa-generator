# MyBuddy PWA Generator

Backend for generating and publishing PWA storefronts.

## Endpoints

### POST /generate
Returns a ZIP file containing a complete PWA.

### POST /publish
Publishes a PWA to:
https://<storename>.mybuddymobile.com

Requires FTP credentials (set in Render environment variables).
