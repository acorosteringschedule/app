# Deployment

## 1. MongoDB Atlas

Create a free M0 cluster, create a database user, and allow the deployment service to connect. Copy the driver connection string for `MONGO_URL` and use `aco_shift_scheduler` as `DB_NAME`.

## 2. Render API

Create a Blueprint from this repository. Render will detect `render.yaml` and create the FastAPI service. Set the secret values marked `sync: false` in the Render Environment page.

Required values include:

- `MONGO_URL`: the Atlas connection string
- `JWT_SECRET`: a long random secret
- `CORS_ORIGINS`: the final Vercel URL, for example `https://aco-shift-scheduler.vercel.app`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `EMAIL_REPLY_TO`

The API URL will look like `https://aco-shift-scheduler-api.onrender.com`.

Use a paid Render instance for the API. The `render.yaml` in this repository sets
`plan: starter`, which keeps the service running continuously and avoids Free-tier
cold starts. After pushing or importing this Blueprint, sync the Blueprint in
Render and confirm the service plan is **Starter**. Render billing must be enabled;
the YAML change alone cannot upgrade an already-existing service until the
Blueprint sync is approved.

## 3. Vercel frontend

Import the repository into Vercel and set the project root to `frontend`. Vercel will use `frontend/vercel.json` and build with `yarn build`.

Set this environment variable in Vercel:

```env
REACT_APP_BACKEND_URL=https://aco-shift-scheduler-api.onrender.com
```

Redeploy after setting the variable. Open the Vercel URL to use the application.

## 4. Finish CORS

After Vercel provides the final domain, replace `CORS_ORIGINS` in Render with that exact HTTPS origin and redeploy the API.

Do not commit `backend/.env` or `frontend/.env`; use the platform environment variable settings instead.