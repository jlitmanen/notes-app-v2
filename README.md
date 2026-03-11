# .notes (dot-notes)

A minimalist, smart note-taking application designed for speed and organization. Built with **React 19**, **Vite 8**, and **PocketBase**.

## ✨ Features

-   **Smart Editor**: A unified editor that handles multiple formats:
    -   **Notes**: Standard text notes.
    -   **Lists**: Automatically parsed lists (using shorthand like `Category: \n - Item`).
    -   **Menus**: Weekly meal planning with date ranges and daily meal slots.
-   **Recipe Integration**: Link recipes to your menus using the `@` symbol (e.g., `@Spaghetti Carbonara`).
-   **Dashboard Widgets**:
    -   **Quick Note**: Capture thoughts instantly.
    -   **Active Menu**: View your current meal plan at a glance.
    -   **Incomplete Lists**: Quick access to your pending to-do or shopping lists.
-   **Real-time Collaboration**: Powered by PocketBase subscriptions for instant updates across devices.
-   **Sharing & Groups**: Share notes, lists, and menus with specific groups.
-   **Theme Support**: Toggle between Light (Sand & Sapphire) and Dark (Deep Slate & Sky) modes.

## 🚀 Tech Stack

-   **Frontend**: React 19 (Hooks, Context), Lucide-React (Icons).
-   **Build Tool**: Vite 8.
-   **Backend**: [PocketBase](https://pocketbase.io/) (Auth, Database, Real-time subscriptions).
-   **Styling**: Vanilla CSS with CSS Variables for theming.

## 🛠️ Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18+)
-   A running [PocketBase](https://pocketbase.io/docs/) instance.

### Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd notes-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add your PocketBase URL:
    ```env
    VITE_PB_URL=http://127.0.0.1:8090
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

### PocketBase Configuration

To fully utilize the app, ensure your PocketBase instance has the following collections:

-   `notes`: `title`, `data`/`content`, `user` (relation), `group` (relation).
-   `lists`: `title`, `data` (JSON), `user` (relation), `group` (relation).
-   `menus`: `title`, `data` (JSON), `start` (date), `end` (date), `user` (relation), `group` (relation).
-   `recipes`: `name`, `content`, `user` (relation).
-   `groups`: `name`, `members` (relation).

## 📝 Usage Tips

-   **Parsing Lists**: In the editor, switch to "List" mode. Type a category ending with a colon (e.g., `Groceries:`) followed by items starting with a hyphen (e.g., `- Milk`). The app will parse this into an interactive checklist.
-   **Recipe Linking**: When editing a "Menu", type `@` to search and link your existing recipes to specific meal slots.
-   **Quick Access**: Use the Dashboard to quickly mark items as "done" without opening the full editor.

## 📄 License

[MIT](LICENSE)
