
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import multer from 'multer';
import csv from 'fast-csv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;
const streamPipeline = promisify(pipeline);

// --- ES Module equivalent for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- PostgreSQL Client Setup ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Serve uploaded cover images
const COVERS_DIR = path.join(__dirname, 'storage', 'covers');
app.use('/storage/covers', express.static(COVERS_DIR));

// --- File Upload Setup (Multer) ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

const csvUpload = multer({ dest: UPLOADS_DIR });

const coverStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, COVERS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const coverUpload = multer({ storage: coverStorage });

// --- Helper Functions ---
const deleteCover = (iconPath) => {
    if (iconPath && iconPath.startsWith('/storage/covers/')) {
        const filename = path.basename(iconPath);
        const filepath = path.join(COVERS_DIR, filename);
        fs.unlink(filepath, (err) => {
            if (err) console.error(`Failed to delete cover: ${filepath}`, err);
        });
    }
};

const downloadImage = async (url) => {
    try {
        const response = await axios({ method: 'GET', url, responseType: 'stream' });
        const extension = path.extname(new URL(url).pathname) || '.jpg';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
        const filepath = path.join(COVERS_DIR, filename);
        await streamPipeline(response.data, fs.createWriteStream(filepath));
        return `/storage/covers/${filename}`;
    } catch (error) {
        console.error(`Failed to download image from ${url}:`, error.message);
        return null;
    }
};

const processCoverImage = async (imageUrl, oldIconPath) => {
    let newIconPath = oldIconPath;
    let needsUpdate = false;

    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        const downloadedPath = await downloadImage(imageUrl);
        if (downloadedPath) {
            newIconPath = downloadedPath;
            needsUpdate = true;
        }
    } else if (imageUrl && imageUrl.startsWith('/storage/covers/')) {
        if (imageUrl !== oldIconPath) {
            newIconPath = imageUrl;
            needsUpdate = true;
        }
    } else if (imageUrl === '') {
        newIconPath = null;
        needsUpdate = true;
    }

    if (needsUpdate && oldIconPath && oldIconPath !== newIconPath) {
        deleteCover(oldIconPath);
    }
    
    return newIconPath;
};

// --- Database Initialization ---
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT to_regclass('public.books')`);
        if (res.rows[0].to_regclass === null) {
            console.log("Table 'books' not found, creating it...");
            await client.query(`
                CREATE TABLE books (
                    "ID" SERIAL PRIMARY KEY, "Title" TEXT NOT NULL, "Author" TEXT NOT NULL, "Publisher" TEXT,
                    "Published Date" TEXT, "Format" TEXT, "Pages" INTEGER, "Series" TEXT, "Volume" INTEGER,
                    "Language" TEXT, "ISBN" TEXT, "Page Read" INTEGER, "Item Url" TEXT, "Icon Path" TEXT,
                    "Photo Path" TEXT, "Image Url" TEXT, "Summary" TEXT, "Location" TEXT, "Price" REAL,
                    "Genres" TEXT, "Rating" REAL, "Added Date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    "Copy Index" INTEGER, "Read" BOOLEAN DEFAULT false, "Started Reading Date" DATE,
                    "Finished Reading Date" DATE, "Favorite" BOOLEAN DEFAULT false, "Comments" TEXT,
                    "Tags" TEXT, "BookShelf" TEXT, "Settings" TEXT, "is_wishlist" BOOLEAN DEFAULT false
                );
            `);
            console.log("Table 'books' created successfully.");
        }
    } catch (err) {
        console.error('Error during database initialization:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

// --- API Routes ---

app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY "ID" ASC');
        const books = result.rows.map(book => {
            const numericFields = ['Pages', 'Volume', 'Page Read', 'Price', 'Rating', 'Copy Index'];
            for (const field of numericFields) {
                if (book[field] != null) {
                    const num = parseFloat(String(book[field]));
                    book[field] = isNaN(num) ? null : num;
                }
            }
            return book;
        });
        res.json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/books', async (req, res) => {
    const book = req.body;
    try {
        const newIconPath = await processCoverImage(book['Image Url'], null);
        book['Icon Path'] = newIconPath;
        book['Photo Path'] = newIconPath;
        
        const validColumns = Object.keys(book).filter(k => k !== 'ID' && book[k] !== undefined);
        const columns = validColumns.map(k => `"${k}"`).join(', ');
        const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
        const values = validColumns.map(k => book[k]);

        const query = `INSERT INTO books (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const book = req.body;
    try {
        const oldBookRes = await pool.query('SELECT "Icon Path" FROM books WHERE "ID" = $1', [id]);
        if (oldBookRes.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
        
        const oldIconPath = oldBookRes.rows[0]['Icon Path'];
        const newIconPath = await processCoverImage(book['Image Url'], oldIconPath);
        book['Icon Path'] = newIconPath;
        book['Photo Path'] = newIconPath;

        // Do not update 'Image Url' in the database, it's a transient field
        delete book['Image Url'];
        
        // Filter out keys that don't have a new value to avoid overwriting with null
        const validUpdateKeys = Object.keys(book).filter(key => book[key] !== undefined && key !== 'ID');

        const setClauses = validUpdateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const values = validUpdateKeys.map(k => book[k]);

        // If there are no valid fields to update, just return the existing book data
        if (values.length === 0) {
            const result = await pool.query('SELECT * FROM books WHERE "ID" = $1', [id]);
            return res.json(result.rows[0]);
        }

        const query = `UPDATE books SET ${setClauses} WHERE "ID" = $${values.length + 1} RETURNING *`;
        const result = await pool.query(query, [...values, id]);
        res.json(result.rows[0]);
    } catch (err)
 {
        console.error(err);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const bookRes = await client.query('SELECT "Icon Path" FROM books WHERE "ID" = $1', [id]);
        if (bookRes.rows.length > 0) deleteCover(bookRes.rows[0]['Icon Path']);
        await client.query('DELETE FROM books WHERE "ID" = $1', [id]);
        await client.query('COMMIT');
        res.status(204).send();
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete book' });
    } finally {
        client.release();
    }
});

app.delete('/api/books', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Book IDs must be provided as a non-empty array.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find books to get cover paths before deleting from DB
        const booksRes = await client.query('SELECT "Icon Path" FROM books WHERE "ID" = ANY($1::int[])', [ids]);
        for (const row of booksRes.rows) {
            deleteCover(row['Icon Path']);
        }

        // Delete books from the database
        const deleteResult = await client.query('DELETE FROM books WHERE "ID" = ANY($1::int[])', [ids]);
        
        await client.query('COMMIT');
        
        if (deleteResult.rowCount > 0) {
            res.status(200).json({ message: `${deleteResult.rowCount} book(s) deleted successfully.` });
        } else {
            res.status(404).json({ message: 'No matching books found to delete.' });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to bulk delete books:', err);
        res.status(500).json({ error: 'An error occurred during bulk deletion.' });
    } finally {
        client.release();
    }
});

app.post('/api/books/import', csvUpload.single('csvfile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const client = await pool.connect();
    let newBooksCount = 0;
    let skippedBooksCount = 0;
    const skippedBooks = [];

    try {
        await client.query('BEGIN');
        const stream = fs.createReadStream(req.file.path).pipe(csv.parse({ headers: true, bom: true, ignoreEmpty: true }));

        for await (const row of stream) {
            // --- Data Cleaning and Transformation ---

            // Handle 'Added Date' separately to allow for DB default
            if (row['Added Date'] && /^\d{2}-\d{2}-\d{4}$/.test(row['Added Date'])) {
                const [day, month, year] = row['Added Date'].split('-');
                row['Added Date'] = `${year}-${month}-${day}`;
            } else {
                delete row['Added Date']; // Remove to use DB default
            }

            // Handle other date formats
            ['Started Reading Date', 'Finished Reading Date'].forEach(col => {
                if (row[col] && /^\d{2}-\d{2}-\d{4}$/.test(row[col])) {
                    const [day, month, year] = row[col].split('-');
                    row[col] = `${year}-${month}-${day}`;
                } else {
                    row[col] = null; // Use null for invalid/empty dates
                }
            });

            // Handle Polish boolean 'Tak'
            ['Read', 'Favorite'].forEach(col => {
                if (row[col] && typeof row[col] === 'string' && row[col].toLowerCase() === 'tak') {
                    row[col] = 'true';
                }
            });

            // Set wishlist status based on BookShelf value
            if (row['BookShelf'] && row['BookShelf'].toLowerCase() === 'do kupienia') {
                row['is_wishlist'] = 'true';
            }

            // Handle numeric fields
            ['Pages', 'Volume', 'Page Read', 'Price', 'Rating', 'Copy Index'].forEach(field => {
                if (row[field] != null && row[field] !== '') {
                    const val = String(row[field]).replace(',', '.');
                    const num = parseFloat(val);
                    row[field] = isNaN(num) ? null : num;
                } else {
                    row[field] = null;
                }
            });

            // --- Duplicate Check ---
            const { ISBN, Title, Author } = row;
            let isDuplicate = false;
            if (ISBN && ISBN.trim() !== '') {
                const result = await client.query('SELECT "ID" FROM books WHERE "ISBN" = $1', [ISBN.trim()]);
                if (result.rows.length > 0) isDuplicate = true;
            }
            if (!isDuplicate && Title && Author) { // Fallback check
                const result = await client.query('SELECT "ID" FROM books WHERE "Title" = $1 AND "Author" = $2', [Title, Author]);
                if (result.rows.length > 0) isDuplicate = true;
            }

            if (isDuplicate) {
                skippedBooksCount++;
                skippedBooks.push({ Title, Author });
                continue;
            }

            // --- Insert New Book ---
            const iconPath = await processCoverImage(row['Image Url'], null);
            row['Icon Path'] = iconPath;
            row['Photo Path'] = iconPath;
            delete row['Image Url'];

            const validColumns = Object.keys(row).filter(k => k !== 'ID' && row[k] !== null && row[k] !== undefined && row[k] !== '');
            const values = validColumns.map(k => row[k]);
            
            if (values.length === 0 || !row['Title'] || !row['Author']) {
                continue;
            }

            const columns = validColumns.map(k => `"${k}"`).join(', ');
            const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO books (${columns}) VALUES (${placeholders})`;
            await client.query(query, values);
            newBooksCount++;
        }

        await client.query('COMMIT');
        
        if (newBooksCount === 0 && skippedBooksCount === 0) {
            return res.status(400).json({ message: 'No valid book data was found in the file. Please ensure the CSV has "Title" and "Author" columns with data, and that books are not already in your library.' });
        }
        
        const message = `Import complete. Added: ${newBooksCount} new books. Skipped: ${skippedBooksCount} duplicates.`;
        res.json({ message, newBooksCount, skippedBooksCount, skippedBooks });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('CSV import error:', error);
        res.status(500).json({ message: `Failed to import books: ${error.message}. All changes have been rolled back.` });
    } finally {
        client.release();
        fs.unlink(req.file.path, () => {});
    }
});


app.get('/api/books/export', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY "ID" ASC');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="library-export-${Date.now()}.csv"`);
        csv.write(result.rows, { headers: true }).pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

app.post('/api/upload-cover', coverUpload.single('cover'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    res.json({ path: `/storage/covers/${req.file.filename}` });
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required.' });

    const GOOGLE_API_URL = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40`;
    const OPENLIBRARY_API_URL = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`;

    try {
        const [googleResponse, openLibraryResponse] = await Promise.allSettled([
            axios.get(GOOGLE_API_URL),
            axios.get(OPENLIBRARY_API_URL)
        ]);

        let googleResults = [];
        if (googleResponse.status === 'fulfilled') {
            const getBestImageUrl = (imageLinks) => {
                if (!imageLinks) return undefined;
                const sizes = ['extraLarge', 'large', 'medium', 'small', 'thumbnail', 'smallThumbnail'];
                for (const size of sizes) {
                    if (imageLinks[size]) return imageLinks[size].replace(/^http:\/\//i, 'https://');
                }
                return undefined;
            };
            googleResults = (googleResponse.value.data.items || []).map(item => {
                const vi = item.volumeInfo;
                const isbn = vi.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || vi.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier;
                return {
                    title: vi.title, authors: vi.authors || [], publisher: vi.publisher,
                    publishedDate: vi.publishedDate, summary: vi.description, isbn, pages: vi.pageCount,
                    imageUrl: getBestImageUrl(vi.imageLinks),
                    rating: vi.averageRating,
                };
            });
        } else {
            console.error('Google Books API failed:', googleResponse.reason.message);
        }

        let openLibraryResults = [];
        if (openLibraryResponse.status === 'fulfilled') {
            openLibraryResults = (openLibraryResponse.value.data.docs || []).map(doc => ({
                title: doc.title,
                authors: doc.author_name || [],
                publisher: doc.publisher?.[0],
                publishedDate: doc.first_publish_year?.toString(),
                summary: doc.first_sentence_value,
                isbn: doc.isbn?.find(i => i.length === 13) || doc.isbn?.[0],
                pages: doc.number_of_pages_median,
                imageUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined
            }));
        } else {
            console.error('Open Library API failed:', openLibraryResponse.reason.message);
        }

        const combinedResults = [];
        const seenImageUrls = new Set();

        const addResult = (result) => {
            if (result.imageUrl && !seenImageUrls.has(result.imageUrl)) {
                combinedResults.push(result);
                seenImageUrls.add(result.imageUrl);
            }
        };

        googleResults.forEach(addResult);
        openLibraryResults.forEach(addResult);

        res.json(combinedResults);

    } catch (error) {
        console.error('Hybrid search failed:', error.message);
        res.status(500).json({ error: 'Failed to search for books.' });
    }
});


// --- Serve Frontend ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start Server ---
app.listen(port, () => {
    initializeDatabase();
    console.log(`Server is running on http://localhost:${port}`);
});