# Pushing to GitHub (Single Repo)

This project lives in **one** GitHub repository with three folders: `frontend/`, `backend/`, and `ai-service/`. Each folder has its own `.gitignore` so `node_modules`, `venv`, `.env`, and build artifacts are not committed.

## 1. Create one repository on GitHub

Create a **new empty** repository (no README, no .gitignore), e.g. `AI_Classroom_Cheating_Detection_System` or `ai-classroom-cheating-detection`.

## 2. Push from the project root

From the project root `AI_Classroom_Cheating_Detection_System/` run:

```bash
git init
git add .
git commit -m "Initial commit: frontend, backend, ai-service"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

## 3. Using SSH

If you use SSH keys:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

## Notes

- Copy `.env.example` to `.env` in `frontend/`, `backend/`, and `ai-service/` and fill in values; never commit `.env`.
- If the GitHub repo was created with a README or other files, run `git pull origin main --rebase` before your first push, or push to a different branch and open a PR.
