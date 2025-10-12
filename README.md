# Home Book Library

A modern web application for personal book cataloging, featuring smart data fetching, CSV import/export, and a persistent library storage system.

![Application Screenshot](https://raw.githubusercontent.com/19orzeszek90/Home-Book-Library/main/screenshot.png)

## ✨ Features

*   **📚 Comprehensive Library Management:** Catalog your books with rich details, from title and author to genres, tags, and personal ratings.
*   **💡 Smart Data Fetching:** Use the integrated online search to find books by title, author, or ISBN. The app pulls data from Google Books and Open Library, allowing you to autofill forms with a single click.
*   **🔖 Wishlist & Reading Status:** Keep a separate wishlist for books you want to read. Track your progress by marking books as "Read," and log your reading dates.
*   **📊 Insightful Statistics:** Visualize your library with detailed statistics, including reading progress, total pages read, top authors, genre distribution, and rating breakdowns.
*   **🛠️ Powerful Command Center:** Go beyond basic edits with an advanced management tool. Bulk delete books, or clean up and manage all your genres and bookshelves from a single, powerful interface.
*   **🔄 Effortless Data Migration:** Easily import your existing library from a CSV file, or export your entire collection for backup. The importer intelligently avoids creating duplicates.
*   **🎨 Customizable & Responsive UI:** Enjoy a sleek, modern, dark-themed interface that works beautifully on any device. Customize the library view with compact, default, or cozy grid layouts.
*   **🐳 Fully Dockerized:** Get up and running in minutes. The entire application, including the PostgreSQL database, is containerized for a simple and reliable setup using Docker Compose.
*   **💾 Persistent Storage:** Your data is always safe. The book library and cover images are stored in persistent Docker volumes, so your collection is preserved across restarts.

## 🚀 Getting Started

Follow these steps to launch the application on your local machine.

### Prerequisites

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Launch

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/19orzeszek90/Home-Book-Library.git
    cd Home-Book-Library
    ```

2.  **Prepare Docker files:**
    *   To ensure compatibility with version control systems, you need to rename two files:
    *   Rename `APP_BUILD_INSTRUCTIONS.txt` to `Dockerfile`.
    *   Rename `BUILD_CONTEXT_EXCLUSIONS_LIST.txt` to `.dockerignore`.

3.  **Build and Run with Docker Compose:**
    *   This single command will build the app's Docker image and start all necessary services in the background.

    ```bash
    docker-compose up -d --build
    ```

4.  **Access the Application:**
    *   Once the containers are running, open your web browser and navigate to:
    *   **http://localhost:3001**

## 📦 Project Structure

This project uses a containerized setup for both the frontend application and the PostgreSQL database.

*   `Dockerfile`: Defines the steps to build the production Node.js server image, which serves the React frontend.
*   `docker-compose.yml`: Orchestrates the application and database services, networking, and volumes.
*   `server.js`: The Express.js backend that handles API requests, database interactions, and CSV operations.
*   `src/`: Contains the React frontend application source code.

## 💾 Data Persistence

*   Your book library data is stored in a persistent Docker volume (`db_data`) attached to the PostgreSQL container.
*   Book cover images are stored in another persistent Docker volume (`book-storage`).
*   All your data will be preserved even if you stop and restart the containers.
*   To **completely remove all data**, run the command: `docker-compose down -v`.