# Buddyverse

A React + TypeScript frontend for a buddy-matching community. Users can post, filter, manage profiles, view contact details, and use a basic admin console.

## Features

### 1) Auth
- Email + password sign up and sign in
- Nickname and gender collected at registration
- Login state stored locally (token + user profile)
- Unauthenticated access to protected actions redirects to the login page

### 2) Feed (`/`)
- Card-based post feed
- Filter by primary and secondary category
- Search by location keyword
- Filter by gender (all / male / female)
- Infinite scroll (paginated requests)
- Empty state, error retry, and back-to-top

### 3) Create post
- Posts up to 150 characters
- Optional location (up to 200 characters)
- Primary and secondary category required
- Validates content, location, and categories before submit
- If the current user has no contact info, a modal asks them to add WeChat or QQ first

### 4) Profile
- View profile (nickname, email, gender, bio, WeChat, QQ)
- Inline edit and save
- Field validation (nickname length, WeChat format, QQ format)
- Shortcut to My Posts
- Admins can enter the admin console from here

### 5) My posts
- List of posts created by the current user
- Infinite scroll
- Delete with confirmation
- Expand location and copy it to the clipboard

### 6) User profile (`/user/:id`)
- View another user’s profile and posts
- Paginated post loading
- Request to view WeChat / QQ
- Contact unlock requires the viewer to have published at least one post
- One-click copy for contact details

### 7) Admin (`/admin`)
- Basic user and post stats
- Paginated user list with search (nickname / email)
- User detail and their posts
- Delete a user
- Delete a user’s posts

### 8) API debug page (`/api-test`)
- Quick-test buttons for common endpoints
- Run a single test or all tests
- Shows success / failure for each request

## Tech stack

- `React 19` + `TypeScript`
- `React Router`
- `TailwindCSS 4`
- `Ant Design 5`
- `Axios`
- `Vite 7`
- `ESLint`

## Routes

- `/`: Home feed
- `/login`: Sign in
- `/register`: Sign up
- `/create-post`: Create post
- `/profile`: Profile
- `/my-posts`: My posts
- `/user/:id`: User profile
- `/admin`: Admin console
- `/api-test`: API debug page

## Project structure

```txt
src/
├── api/                 # API clients (auth/users/posts/categories/admin, etc.)
├── components/          # Shared UI (Header, PostCard, CategoryFilter)
├── contexts/            # Global state (e.g. gender filter)
├── pages/               # Page components
├── utils/               # Helpers (auth, validation, cache)
├── data/                # Local mock / helper data
├── types/               # TypeScript types
└── App.tsx              # Router entry
```

## Getting started

### Requirements
- Node.js >= 20.19.0
- npm

### Install
```bash
npm install
```

### Environment
Copy `.env.example` to `.env` (and `.env.production` if needed) and fill in local values. Do not commit those files.

### Dev server
```bash
npm run dev
```

### Production build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## Current status

- Core community flow is in place: register / login → create post → browse and filter → view users → exchange contacts
- `App.tsx` currently uses mock login state; wire it to `authUtils` token state for a real session
- An API debug page is included for backend integration

## License

MIT
