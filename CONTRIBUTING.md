# Contributing to Pathfinder AI 🗺️

Thank you for your interest in contributing to **Pathfinder AI**! We welcome contributions from developers of all skill levels, whether you are fixing a bug, adding new features, improving documentation, or creating test cases.

---

## 🚀 How to Contribute

### 1. Fork & Clone the Repository
1. Fork the repository on GitHub: Click **Fork** at the top right of [https://github.com/guruvishnu0501/PathFinder.ai](https://github.com/guruvishnu0501/PathFinder.ai).
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PathFinder.ai.git
   cd PathFinder.ai
   ```

### 2. Create a Feature Branch
Create a descriptive branch name for your changes:
```bash
# For a new feature:
git checkout -b feature/your-feature-name

# For a bug fix:
git checkout -b fix/issue-description
```

### 3. Set Up Local Environment
Follow the setup instructions in [README.md](README.md#-%EF%B8%8F-getting-started):
- Copy `backend/.env.example` to `backend/.env` and supply your Groq API key and local MongoDB URI.
- Ensure backend (`uvicorn main:app --port 8001`) and frontend (`npm run dev`) run cleanly.

### 4. Make Your Changes & Commit
Adhere to standard code style guidelines:
- **Backend (Python)**: Follow PEP 8 formatting. Run `flake8 .` before committing.
- **Frontend (React)**: Follow standard React component conventions.

Commit your changes with clean commit messages following Conventional Commits format:
```bash
git commit -m "feat(backend): add dynamic question difficulty adjustments"
# or
git commit -m "fix(frontend): resolve navigation state bug on profile page"
```

### 5. Push & Submit a Pull Request
1. Push your branch to your GitHub fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a **Pull Request (PR)** against the `main` branch of [guruvishnu0501/PathFinder.ai](https://github.com/guruvishnu0501/PathFinder.ai).
3. Provide a detailed explanation of your changes in the PR description.

---

## 📜 Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

---

## 👥 Core Maintainers & Contributors

- **Project Lead / Lead Maintainer**: [@guruvishnu0501](https://github.com/guruvishnu0501)

Thank you for helping make Pathfinder AI better for students everywhere! 🎓
