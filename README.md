
  # Company Website for iCurious AI

  This is a code bundle for Company Website for iCurious AI. The original project is available at https://www.figma.com/design/igZyUxJ3ldPNGQfcmVdwsK/Company-Website-for-iCurious-AI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## Running the backend (local)

  The backend server listens on port 5000 by default and must be running for the frontend to call APIs.
  From the project root you can run:

  ```
  # install backend dependencies (once)
  npm --prefix backend install

  # start backend in development mode (nodemon, auto-restarts)
  npm --prefix backend run dev

  # or start production backend (no watcher)
  npm --prefix backend start
  ```

  Notes:
  - Make sure `backend/.env` exists and contains the required secrets (SUPABASE keys, STORYBOOK_PRICE, RAZORPAY keys when available). Do not commit `.env`.
  - If port 5000 is already in use, find and stop the process (Windows):
    ```
    netstat -ano | findstr :5000
    taskkill /PID <PID> /F
    ```
  - The frontend development build uses the backend at `http://localhost:5000` by default.
  