# Frontend Repository

This is the frontend repository for the project. Follow the steps below to set up and run the application locally.

---

## Setup Instructions

1. **Copy the Environment File**:

   - Copy the `env.example` file and rename it to `.env` in the root directory.

2. **Get Environment Variables**:

   - Obtain the required environment variables from the repository owner and add them to the `.env` file.

3. **Install Dependencies**:

   - Run the following command to install all required dependencies:
     ```bash
     npm install
     ```

4. **Run the Development Server**:
   - Start the development server with:
     ```bash
     npm run dev
     ```

---

## Technical Details

### Backend Communication

- **Axios**:
  - The frontend uses `axios` to communicate with the backend.
  - Axios intercepts each request and attaches the user's request ID as a `Bearer` token in the request headers.
  - The backend verifies this token using the JWT secret to ensure it is signed by the same entity.
  - If the token is valid, the request is allowed through. Otherwise, an unauthorized error is returned.

---

### Adding a New Page

- To add a new page:
  1. Navigate to the `src/app` directory.
  2. Create a new folder with the name of the route (e.g., `about` for `/about`).
  3. Inside the folder, create a `page.tsx` file. This file will define the content of the page.
  - Next.js will automatically route to this page based on the folder name.

---

### Data Fetching

- The application uses **React Query** for data fetching and state management.
- **GET Requests**:
  - Use React Query's `queries` for all `GET` requests. They should be in the queries folder
- **POST and Other Requests**:
  - Use React Query's `mutations` for `POST`, `PUT`, `DELETE`, and other non-GET requests. They should be in the mutations folder.

---

### UI Materials

- You can use any UI library for building components.
- For simplicity, we recommend using [shadcn](https://shadcn.dev/), which provides a clean and customizable UI component library.

---

### Contexts

- The application provides a `useUser()` context to access user details throughout the app.

---

## Additional Notes

- Ensure you have the correct environment variables in your `.env` file before running the application.
- Follow the folder structure and conventions to maintain consistency across the project.
