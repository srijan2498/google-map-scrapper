const express = require('express');
const cors = require('cors');
const { scrapeMaps } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/scrape', async (req, res) => {
    try {
        const { searchKey, location, limit } = req.body;

        if (!searchKey || !location) {
            return res.status(400).json({ error: 'Search key and location are required' });
        }

        console.log(`Starting scrape for: ${searchKey} in ${location}, limit: ${limit}`);

        const buffer = await scrapeMaps(searchKey, location, limit || 10);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=leads_${Date.now()}.xlsx`);

        res.send(buffer);

    } catch (error) {
        console.error('Scraping failed:', error);
        res.status(500).json({ error: 'Scraping failed', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running`);
});
