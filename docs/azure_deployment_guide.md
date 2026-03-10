# Azure Complete Deployment Guide (Backend + Frontend)

This guide walks you through deploying your entire application: the Python FastAPI Backend on **Azure App Service**, and the React Vite Frontend on **Azure Static Web Apps**. 

Both of these will run on the **Free Tier** in the `East US` region and update automatically via GitHub Actions anytime you push code to `main`.

---

# Part 1: Deploy Backend (Azure App Service)

## 1.1 Create the Azure App Service

Open your terminal (or Azure Cloud Shell) and log in:
```bash
az login
```

Run these commands line by line. We will create a resource group, a Free tier app service plan in `eastus`, and the python web app itself:

```bash
# Variables
RESOURCE_GROUP="smartstudy-rg"
LOCATION="eastus" 
PLAN_NAME="smartstudy-plan"
APP_NAME="smart-study-api-backend" # MUST BE UNIQUE across all of Azure! Change if taken.

# Create Resource Group & App Plan
az group create --name $RESOURCE_GROUP --location $LOCATION
az appservice plan create --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku F1 --is-linux --location $LOCATION

# Create Web App (Python 3.10)
az webapp create --resource-group $RESOURCE_GROUP --plan $PLAN_NAME --name $APP_NAME --runtime "PYTHON:3.10"

# Tell the App Service to start FastAPI
az webapp config set --resource-group $RESOURCE_GROUP --name $APP_NAME --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app"
```

## 1.2 Inject Environment Variables Securely

```bash
# Set your production secrets here. Replace with your actual values!
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
  MONGODB_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/" \
  DATABASE_NAME="studynotes" \
  SECRET_KEY="your-secret-key" \
  ALGORITHM="HS256" \
  ACCESS_TOKEN_EXPIRE_MINUTES="30" \
  GROQ_API_KEY="gsk_your_groq_key_here" \
  CHROMA_PERSIST_DIRECTORY="./chroma_db" \
  UPLOAD_DIRECTORY="./uploads" \
  MAX_UPLOAD_SIZE_MB="50" \
  EMBEDDING_MODEL="all-MiniLM-L6-v2"
```

## 1.3 Setup GitHub Actions CI/CD (Backend)

1. Get your Publish Profile Security Key:
    ```bash
    az webapp deployment list-publishing-profiles --name $APP_NAME --resource-group $RESOURCE_GROUP --xml
    ```
    *Copy the entire XML output from the terminal.*
2. Go to your GitHub Repository online -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
3. **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. **Secret**: *Paste the giant XML string.*

## 1.4 Link Backend Domain (`api.karthikdev.app`)

1. Go to your Name.com Settings for `karthikdev.app`.
2. Add a **CNAME** Record:
    - **Host**: `api`
    - **Answer**: `smart-study-api-backend.azurewebsites.net` (Replace with your actual App Name URL)
3. Add a **TXT** Record (For Azure verification):
    - **Host**: `asuid.api`
    - **Answer**: *(Grab the Verification ID from Azure Portal -> Your Web App -> Custom Domains -> Copy "Custom Domain Verification ID")*
4. In Azure CLI, attach the domain:
    ```bash
    az webapp config hostname add --webapp-name $APP_NAME --resource-group $RESOURCE_GROUP --hostname api.karthikdev.app
    ```

---

# Part 2: Deploy Frontend (Azure Static Web Apps)

Azure Static Web Apps is the absolute best way to host React applications. It provides a global CDN.

## 2.1 Create the Static Web App

If you haven't closed your terminal from Part 1:

```bash
RESOURCE_GROUP="karthik.24cap_rg_4277"
LOCATION="southeastasia"
STATIC_NAME="smart-study-frontend-karthi"

# We use the 'Free' SKU for the frontend
az staticwebapp create \
    --name $STATIC_NAME \
    --resource-group $RESOURCE_GROUP \
    --source https://github.com/Karthik8402/smart-study-notes-generator \
    --location $LOCATION \
    --branch main \
    --app-location "/frontend" \
    --output-location "dist" \
    --login-with-github
```
*Note: This command will ask you to authenticate with GitHub in your web browser so Azure can automatically create the CI/CD Pipeline secret.*

## 2.2 GitHub Actions Configuration

Azure automatically creates a secret in your repository named something like `AZURE_STATIC_WEB_APPS_API_TOKEN...`. 

1. Open `.github/workflows/deploy-frontend.yml` in your editor.
2. Find the line: `azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}`
3. Make sure the secret name matches exactly what Azure created in your GitHub Repository settings!

*Note: The Frontend Deployment Pipeline has an Environment Variable called `VITE_API_URL` hardcoded to `https://api.karthikdev.app`. Ensure your backend is running there!*

## 2.3 Link Frontend Domain (`karthikdev.app`)

We want your React app to appear on your main domain.

1. Go to your Name.com settings.
2. Add an **ALIAS** or **ANAME** record (if your DNS provider supports it at the root) OR add a **CNAME** wrapper for `www`:
    - **Host**: `www`
    - **Answer**: *(Go to the Azure Portal -> Static Web App -> Copy the auto-generated URL like `mango-river.azurestaticapps.net`)*
3. Add the **TXT** verification record requested by the Azure Portal (under Static Web App -> Custom Domains).

You are entirely done! Once you commit and push to the `main` branch, GitHub Actions will seamlessly build and deploy your entire project (Frontend and Backend) simultaneously!
