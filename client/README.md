# InsiderJobs frontend

The React/Vite frontend for InsiderJobs. See the [project README](../README.md) for architecture, manual configuration, setup, API documentation, security boundaries and known limitations, and the [independent browser audit](../docs/FINAL_E2E_AUDIT.md) for current verification evidence. Run `npm run dev:local` alongside the backend's matching command for the persistent local application on 5175/5000; see the [demo guide](../docs/DEMO_GUIDE.md).

Run `npm ci`, then `npm run dev` for local development. `npm run lint` and `npm run build` validate the client. Existing environment files must remain confidential and unchanged.

The original Vite scaffold notes below are retained as tooling reference.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
