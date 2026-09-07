# SHEQ — Frontend Baseline

A polished React/Vite frontend for **SHEQ – A Community-Driven Women’s Safety & Reporting Platform**.

## Run it

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Stack

- React + JSX
- Vite
- React Router
- Bootstrap 5
- Framer Motion
- Leaflet + React Leaflet
- Lucide React
- Mock async service layer

## Syllabus mapping

This frontend intentionally demonstrates the concepts from the Web Development syllabus:

- **HTML:** semantic React/JSX structure, forms, navigation, inputs, buttons, sections.
- **CSS:** custom layout, responsive design, animations, hover states, visual theme.
- **Bootstrap:** Bootstrap CSS is included and Bootstrap utility classes such as `container`, `btn`, `w-100` and responsive patterns are used.
- **Git/GitHub:** project is structured so team members can work on separate pages/components and merge through branches.
- **JavaScript functions:** filtering, validation, calculations and event callbacks.
- **Async programming / Promises:** mock services in `src/services/`.
- **Regular expressions:** email and phone validation utilities.
- **DOM/event handling:** React event handlers drive interactive UI.
- **Form validation:** Login, signup and incident report forms.
- **React:** routes, JSX, functional components, props, state and hooks.
- **Props:** data is passed into reusable components such as `ReportCard` and `StatCard`.
- **State:** filters, forms, selected/confirmed reports, authentication and SOS state.
- **Hooks:** `useState`, `useEffect`, `useMemo`, `useScroll`, `useTransform`.
- **Modules:** components, pages, services, hooks, data and utilities are separated.

## Important

This is a **frontend/lab baseline**. Authentication, SOS integrations and persistence are simulated.

The service layer is intentionally separated so it can later be replaced with:
`React → Express API → MongoDB`

## Suggested team branches

```text
main
leena/landing-and-theme
leena/map-and-report
ankita/auth-and-dashboard
ankita/alerts-and-insights
```

Keep `main` stable and merge completed features through pull requests.
