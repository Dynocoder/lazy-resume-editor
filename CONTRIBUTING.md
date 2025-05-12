# 🛠️ Contributing Guidelines

Thank you for considering contributing to this project! Before you start, please take a few minutes to read through these guidelines to ensure a smooth experience for both you and future contributors.

## 📌 General Guidelines

- **TypeScript only**: New frontend code **must be written in TypeScript** (`.ts`/`.tsx`). Existing JavaScript will be migrated gradually—**do not add new `.js/.jsx` files**.
- **Modular Codebase**: Avoid bloated files. Keep related functionality separated and encapsulated.
- **TailwindCSS**: New frontend Styles **must be written using TailwindCSS** (within the component). Existing `.css` files will be migrated gradually—**do not add new `.css` files**.
- **Don't Repeat Yourself**: Reuse existing utilities, services, and components where applicable.
- **Clean Commits**: Write descriptive commit messages and keep PRs focused and clean.

---

## 🧠 Project Overview

The project is a **resume editor** with:
- A **Flask backend** (REST API)
- A **React (Vite) frontend**, recently migrated to TypeScript

---

## 🧩 Frontend Structure & Contribution Rules

> Located in `/frontend`

### ✔️ Use TypeScript

All new files must be `.ts` or `.tsx`. No new `.js/.jsx` files will be accepted.
Use tailwind for styling components.

### 📁 Folder Structure & Responsibilities

```
src/
├── components/    # Reusable presentational or logic-heavy components
├── services/      # API calls and business logic (create this if missing)
├── utils/         # Helper functions
├── data/          # Static mock data
```

### 🧭 Guidelines

- **Component logic** goes into `components/`. Prefer small, focused components.
- If you're making **API calls**:
  - Place them in `src/services/` as named functions.
  - Avoid direct fetch calls inside components.
- **Shared utilities** like formatters or validators go in `src/utils/`.

---

## 🐍 Backend Structure & Contribution Rules

> Located in `/backend`

### 📁 Folder Structure & Responsibilities

```
app/
├── routes/        # Handles request/response flow only
├── services/      # Business logic and reusable operations
├── config.py      # App-wide configuration
```

### 🧭 Guidelines

- **All new functionality** must follow the **Routes ↔ Services** pattern:
  - **Routes**: Lightweight; handle validation, flow control, and call services.
  - **Services**: Contain all core logic, integrations, and reusable code.
- Do **not** write business logic directly in `routes/`.
- Reuse existing services when adding new features.
- Add new services to `app/services/` and keep them functionally organized.

---

## ✅ Pull Request Checklist

Before submitting your PR:

- [ ] Code is written in **TypeScript (frontend)** or **Python (backend)**.
- [ ] Styles are written in **TailwindCSS**.
- [ ] Code is placed in the correct module (routes, services, components, utils).
- [ ] No large files doing "everything"; things are modular and maintainable.
- [ ] You've tested your feature end-to-end (UI → API if applicable).
- [ ] Your PR description clearly states the **purpose**, **changes**, and **testing done**.

---

## 🙅‍♂️ What Not to Do

- ❌ Don’t write new `.js` or `.jsx` files
- ❌ Don’t write new `.css` files.
- ❌ Don’t place API logic directly in components
- ❌ Don’t dump all logic into a single route or component file
- ❌ Don’t duplicate existing utilities or services

---

## 🙌 Need Help?

If you’re unsure where to place something or how to structure your contribution, feel free to open an issue or discussion. Better to ask first than to rewrite later!
