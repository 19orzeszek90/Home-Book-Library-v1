
# 📚 Home Book Library v1.5

<p align="center">
  <img src="img/screenshot.png" alt="Home Book Library App Preview" width="800">
</p>

A professional, high-performance web application designed for bibliophiles who need more than just a list. Home Book Library is a complete ecosystem for cataloging, managing, and discovering your collection, powered by modern tech and AI.

---

## 🚀 Key Features

### 💎 Intelligent Collection Management
- **Library & Wishlist:** Separate your current collection from your future reads.
- **NEW: Collection View:** Automatically groups your books into series and cycles. Books are sorted by volume number (`Vol. 1`, `Vol. 2`), allowing you to visualize and complete your favorite sagas. Collapsible sections keep the interface clean and are collapsed by default.
- **Dynamic Views:** Choose between `Compact`, `Default`, or `Cozy` grid sizes to suit your aesthetic.

### 🤖 AI Librarian (Gemini API)
- **AI Magic:** Automatically fill missing metadata (summaries, genres, tags, publishers) using the Gemini Pro model.
- **Deep ISBN Scan:** If a standard database search fails, the AI performs a "Deep Scan" to identify rare or local editions.
- **Interactive AI Librarian:** Chat with your library. Ask for recommendations based on what you own or get quick summaries of your books.

### 🛠️ Professional Command Center
- **Bulk Operations:** Select multiple books to update their language, format, shelf, or price simultaneously.
- **Database Cleanup:** Manage all your genres and tags from a central hub. Merge duplicates or remove obsolete entries in bulk.
- **Table View:** A powerful, sortable, and resizable data table for power users who prefer a spreadsheet-like experience.

### 📊 Advanced Analytics
- **Reading Journey:** Track your annual progress with a visual goal banner.
- **Financial Stats:** Monitor your library's economy with "Average Book Value" and "Estimated Total Library Value".
- **Visual Distributions:** High-quality charts showing genre, rating, and language distributions.

### 🔄 Data Integrity & Portability
- **CSV Export/Import:** Move your data anywhere. **NEW:** Support for UTF-8 with BOM ensures that Polish and other special characters display perfectly in Microsoft Excel.
- **Full JSON Backups:** Export your entire library, including book covers, into a single backup file for easy migration or restoration.
- **Persistent Storage:** Fully dockerized with PostgreSQL and local volumes for images.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Tailwind CSS, TypeScript, Vite.
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL 14.
- **AI:** Google Gemini API (@google/genai).
- **Deployment:** Docker & Docker Compose.

---

## ⚙️ Installation

1. **Clone the Repo:**
   ```bash
   git clone https://github.com/19orzeszek90/Home-Book-Library-v1.git
   cd Home-Book-Library-v1
   ```

2. **Prepare Environment:**
   - Rename `APP_BUILD_INSTRUCTIONS.txt` to `Dockerfile`.
   - Rename `BUILD_CONTEXT_EXCLUSIONS_LIST.txt` to `.dockerignore`.
   - **Gemini API Key:** You must generate your own API key to use AI features.
     - Get it here: [Google AI Studio API Key](https://ai.google.dev/gemini-api/docs/api-key)
     - In `docker-compose.yml`, replace `WKLEJ_TU_SWOJ_KLUCZ` with your key.

3. **Launch:**
   ```bash
   docker-compose up -d --build
   ```
   Access your library at `http://localhost:3001`.

---

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.

*Developed with passion for books and clean code.*
