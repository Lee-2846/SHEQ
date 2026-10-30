# 07 — Core Programming Concepts & Code Architecture for Viva

---

## 1. Asynchronous JavaScript, Promises & `async/await`

### A. The Core Concept Explained in Plain English
Imagine you are sitting in a restaurant:
* **Synchronous (Blocking) Code:** The waiter takes your food order, walks to the kitchen, stands in front of the chef for 20 minutes doing nothing while your pasta cooks, and refuses to talk to or serve any other customer until your pasta is delivered to your table. If the kitchen is slow, the entire restaurant freezes.
* **Asynchronous (Non-Blocking) Code:** The waiter takes your order, hands a slip to the kitchen, and **immediately walks away to serve other tables**. When your food is ready, a bell rings, and the waiter brings your pasta. The restaurant continues running smoothly without waiting.

Node.js is **single-threaded**. If database lookups or password hashing were synchronous, the entire server would freeze for every visitor in the world while one user logged in. Asynchronous operations ensure the server can handle thousands of simultaneous requests.

---

### B. What Is a Promise?
A **Promise** is a JavaScript object that represents the eventual completion (or failure) of an asynchronous operation and its resulting value.

A Promise has 3 states:
1. **Pending:** Initial state; the operation is still running (e.g. MongoDB is currently searching for a user).
2. **Fulfilled (Resolved):** The operation succeeded, returning the result value.
3. **Rejected:** The operation failed (e.g. database network error or validation failure).

---

### C. What Do `async` and `await` Actually Do?
* **`async` keyword:** Placed before a function declaration. It automatically wraps the function's return value in a Promise.
* **`await` keyword:** Placed before a Promise inside an `async` function. It **pauses execution of that specific function** until the Promise resolves or rejects. Crucially, it does **not** freeze the Node.js event loop—other HTTP requests continue executing concurrently.

---

### D. Tracing Real Code Examples From SHEQ

#### Example 1: `await User.findOne(...)` in `backend/src/routes/auth.js`
```javascript
const existingUser = await User.findOne({ email });
if (existingUser) {
  return res.status(409).json({ error: "User already exists." });
}
```
* **Execution Order:**
  1. Node.js executes `User.findOne({ email })`. This sends a BSON query across the network socket to MongoDB.
  2. The `await` keyword pauses the `handleSignupInitiation` function.
  3. While MongoDB searches its B-tree index on disk, Node.js is free to process other incoming HTTP requests.
  4. When MongoDB returns the document (or `null`), the Promise fulfills.
  5. The variable `existingUser` is assigned, and execution resumes on the `if` statement.

#### Example 2: `await bcrypt.hash(...)` in `backend/src/routes/auth.js`
```javascript
const passwordHash = await bcrypt.hash(password, 10);
```
* **Execution Order:**
  1. Bcrypt performs 10 rounds of cryptographic salting and key stretching.
  2. Because key stretching is CPU-intensive, it runs in the background worker thread pool (`libuv`).
  3. `await` waits for the computation to complete and returns the 60-character hash string.

#### Example 3: Handling Errors with `try / catch` vs `asyncHandler`
* If an awaited operation throws an error (e.g. MongoDB connection drops), execution immediately jumps to the nearest `catch` block.
* In SHEQ, all route handlers are wrapped in `asyncHandler`:
  ```javascript
  // backend/src/utils/asyncHandler.js
  export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  ```
  **Why this is elegant:** If an unhandled exception occurs inside any `async` route handler, `catch(next)` catches it automatically and forwards it to the central error middleware (`backend/src/middleware/errors.js`). The server **never crashes**; it safely returns HTTP `500 Internal Server Error`.

---

## 2. Frontend Routing in a Single Page Application (SPA)

### A. How React Router Works
In a traditional multi-page website, clicking a link (`<a href="/map">`) forces the browser to request a completely new HTML file from the server, causing a white-screen flash.

In SHEQ (a **Single Page Application** using `react-router-dom`):
1. Only **one single HTML file** (`index.html`) is downloaded when the website first loads.
2. When a user clicks a link (e.g. `/map`), React Router intercepts the browser URL change using the HTML5 History API (`pushState`).
3. React Router matches the URL path against the routes defined in `src/App.jsx`.
4. It swaps out the component tree inside `<motion.main>` (e.g. unmounts `Dashboard` and mounts `SafetyMap`) without reloading the page.

---

### B. Route Protection Architecture

```
[ Visitor enters /admin in browser URL ]
                    |
                    v
[ src/App.jsx: Matches <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>} /> ]
                    |
                    v
[ src/components/AdminRoute.jsx Executes ]
Reads: { user, isAuthenticated, loading } = useAuth()
                    |
                    +---> If loading === true: Renders <div>Loading authentication state...</div>
                    |
                    +---> If !isAuthenticated: Renders <Navigate to="/login" replace />
                    |
                    +---> If user.role !== "admin": Renders <Navigate to="/dashboard" replace />
                    |
                    +---> If user.role === "admin": Renders children (<AdminLayout />)
```

---

## 3. React Hooks Masterclass (With SHEQ Examples)

### A. `useState` — Reactive Local Component State
* **Purpose:** Stores values that, when changed, trigger a re-render of the component UI.
* **SHEQ Example in `src/pages/SOS.jsx`:**
  ```javascript
  const [sosModalOpen, setSosModalOpen] = useState(false);
  ```
  When the user clicks "Test SOS Protocol", `setSosModalOpen(true)` updates the state, causing React to immediately re-render and mount the `<SOSModal />`.

---

### B. `useEffect` — Managing Side Effects
* **Purpose:** Runs code in response to component mounting, unmounting, or changes to specific dependencies.
* **SHEQ Example in `src/pages/Profile.jsx`:**
  ```javascript
  useEffect(() => {
    if (activeTab === "identity") {
      loadVerification();
    }
  }, [activeTab]);
  ```
  **How it works:** Whenever the `activeTab` URL query parameter changes to `"identity"`, the effect executes, calling the backend API to fetch the latest document vault status.

---

### C. `useMemo` — Caching Expensive Calculations
* **Purpose:** Memoizes (caches) the result of a calculation so it doesn't run on every unrelated re-render.
* **SHEQ Example in `src/context/DataContext.jsx`:**
  ```javascript
  const hotspotCandidates = useMemo(() => {
    return calculateHotspotCandidates(reports);
  }, [reports]);
  ```
  **Why it matters:** Calculating hotspot clusters and severity weights across hundreds of reports takes processing time. `useMemo` guarantees that this calculation only runs when the `reports` array changes, not when the user clicks an unrelated button or toggles a dropdown.

---

### D. `useContext` — Global State Without "Prop Drilling"
* **The Problem:** Passing user session data down through 10 nested components (`App` $\rightarrow$ `Layout` $\rightarrow$ `Header` $\rightarrow$ `Navbar` $\rightarrow$ `UserMenu`) is tedious and error-prone ("prop drilling").
* **The Solution:** React Context provides a "broadcast tower". Any component in the app can listen directly.
* **SHEQ Implementation:**
  * `AuthProvider` wraps the entire app in `src/App.jsx`.
  * Any component calls `const { user, logout } = useAuth();` to access session data directly.

---

## 4. HTTP Protocol & REST API Fundamentals

### A. HTTP Request Anatomy
Every call from the frontend contains:
1. **HTTP Method:** Indicates the desired action.
   * `GET`: Retrieve data (no request body).
   * `POST`: Submit new data or trigger an action (payload in `body`).
   * `PATCH`: Partially update an existing record.
   * `PUT`: Completely replace an existing record.
   * `DELETE`: Remove a record.
2. **Request Headers:**
   * `Content-Type: application/json` $\rightarrow$ Informs Express to parse the body with `express.json()`.
   * `Authorization: Bearer eyJhbGci...` $\rightarrow$ Transmits the signed JWT token.
3. **Status Codes:**
   * `200 OK`: Request succeeded.
   * `201 Created`: Resource successfully created in database.
   * `400 Bad Request`: Validation error (e.g. password too short, invalid coordinates).
   * `401 Unauthorized`: Token is missing, expired, or invalid.
   * `403 Forbidden`: Authenticated, but lacking permission (e.g. regular user accessing admin routes).
   * `404 Not Found`: Target endpoint or database record does not exist.
   * `409 Conflict`: Duplicate record violation (e.g. user already confirmed this report).
   * `500 Internal Server Error`: Unhandled server crash.
   * `503 Service Unavailable`: External provider unconfigured or database offline.

---

### B. What Is CORS & Why Does It Occur in Development?
* **CORS (Cross-Origin Resource Sharing)** is a browser security mechanism that blocks web pages from making AJAX requests to a different domain, port, or protocol than the one that served the page.
* **In SHEQ Development:**
  * Frontend runs on `http://localhost:5173` (served by Vite).
  * Backend API runs on `http://localhost:5000` (served by Express).
  * Because the ports are different (`5173` vs `5000`), the browser considers this a cross-origin request and sends an HTTP `OPTIONS` "pre-flight" check.
* **The Fix in `backend/src/app.js`:**
  ```javascript
  app.use(cors({
    origin(origin, callback) { ... },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  }));
  ```
  Express responds to the pre-flight check with approval headers, allowing the Vite frontend to communicate seamlessly.
