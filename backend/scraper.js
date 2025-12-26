const chromium = require('@sparticuz/chromium');
const puppeteerCore = require('puppeteer-core');
const puppeteer = require('puppeteer');

async function scrapeMaps(searchKey, location, limit) {
    let browser;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

    if (isProduction) {
        browser = await puppeteerCore.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
    } else {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1366, height: 768 });

        // Navigate to Google Maps
        await page.goto('https://www.google.com/maps', { waitUntil: 'networkidle2' });

        // Search
        const query = `${searchKey} in ${location}`;
        const searchInput = await page.$('input#searchboxinput');
        if (!searchInput) {
            throw new Error('Search input not found');
        }
        await searchInput.type(query);
        await page.keyboard.press('Enter');

        // Wait for results to load
        await page.waitForSelector('div[role="feed"]', { timeout: 10000 }).catch(() => console.log('Feed not found immediately'));

        const results = [];
        let processedCount = 0; // Total items checked
        let lastProcessedIndex = 0;
        let consecutiveNoNewLinks = 0;

        console.log(`Target: Get ${limit} matching records.`);

        while (results.length < limit) {
            // Get current links
            const links = await page.$$('a[href^="https://www.google.com/maps/place"]');
            console.log(`Current loaded links: ${links.length}, Processed so far: ${lastProcessedIndex}, Matches found: ${results.length}`);

            // If no new links appeared after scrolling
            if (links.length === lastProcessedIndex) {
                consecutiveNoNewLinks++;
                if (consecutiveNoNewLinks > 3) {
                    console.log('No new links found after multiple scrolls. Stopping.');
                    break;
                }
                console.log('No new links yet, scrolling...');
                await scrollFeed(page);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            consecutiveNoNewLinks = 0;

            // Process new links
            for (let i = lastProcessedIndex; i < links.length && results.length < limit; i++) {
                const link = links[i];
                lastProcessedIndex++; // Mark as processed

                // Click to load details
                await link.click().catch(e => console.log('Click failed', e));
                await new Promise(r => setTimeout(r, 2000)); // Wait for details to slide in

                // Extract details
                const details = await page.evaluate(() => {
                    const getText = (selector) => {
                        const el = document.querySelector(selector);
                        return el ? el.innerText.trim() : '';
                    };

                    const getAttribute = (selector, attr) => {
                        const el = document.querySelector(selector);
                        return el ? el.getAttribute(attr) : '';
                    };

                    // Name
                    let name = getText('h1.DUwDvf') || getText('h1');

                    // Rating & Reviews
                    const ratingEl = document.querySelector('div.F7nice span[aria-hidden="true"]');
                    const rating = ratingEl ? ratingEl.innerText : '';

                    const reviewsEl = document.querySelector('div.F7nice span[aria-label*="reviews"]');
                    const reviews = reviewsEl ? reviewsEl.getAttribute('aria-label').replace(/\D+/g, '') : '';

                    // Category
                    const category = getText('button[jsaction="pane.rating.category"]');

                    // Address
                    let address = getText('button[data-item-id="address"] .fontBodyMedium');
                    if (!address) {
                        const addrBtn = document.querySelector('button[aria-label*="Address"]');
                        address = addrBtn ? addrBtn.innerText : '';
                    }

                    // Phone
                    let phone = getText('button[data-item-id^="phone"] .fontBodyMedium');
                    if (!phone) {
                        const phoneBtn = document.querySelector('button[aria-label*="Phone"]');
                        phone = phoneBtn ? phoneBtn.innerText : '';
                    }

                    // Website
                    let website = getText('a[data-item-id="authority"]');
                    if (!website) {
                        const webBtn = document.querySelector('a[aria-label*="Website"]');
                        website = webBtn ? webBtn.href : '';
                    }

                    // Plus Code
                    const plusCode = getText('button[data-item-id="oloc"] .fontBodyMedium');

                    // Operating Hours
                    const hours = getText('div[aria-label*="Open"] .fontBodyMedium') || getText('div[aria-label*="Closed"] .fontBodyMedium');

                    // Coordinates
                    const url = window.location.href;
                    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                    const latitude = coordsMatch ? coordsMatch[1] : '';
                    const longitude = coordsMatch ? coordsMatch[2] : '';

                    // Email
                    const panelText = document.querySelector('div[role="main"]')?.innerText || '';
                    const emailMatch = panelText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                    const email = emailMatch ? emailMatch[0] : '';

                    // Claim Status
                    const claimStatus = getText('a[aria-label*="Claim this business"]') ? 'Unclaimed' : 'Claimed';

                    return { name, rating, reviews, category, address, phone, website, email, plusCode, hours, latitude, longitude, claimStatus, url };
                });

                const hasWebsite = details.website && details.website.trim().length > 0;

                console.log(`Checked: ${details.name} | Website: ${hasWebsite ? 'Yes' : 'No'} | Match: ${!hasWebsite}`);

                if (!hasWebsite) {
                    results.push(details);
                }
            }

            // If we still need more results, scroll
            if (results.length < limit) {
                await scrollFeed(page);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        await browser.close();

        // Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leads');

        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Rating', key: 'rating', width: 10 },
            { header: 'Reviews', key: 'reviews', width: 10 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Website', key: 'website', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Hours', key: 'hours', width: 25 },
            { header: 'Plus Code', key: 'plusCode', width: 15 },
            { header: 'Latitude', key: 'latitude', width: 15 },
            { header: 'Longitude', key: 'longitude', width: 15 },
            { header: 'Claim Status', key: 'claimStatus', width: 15 },
            { header: 'Google Maps URL', key: 'url', width: 50 }
        ];

        if (results.length === 0) {
            worksheet.addRow({ name: 'No matches found with "No Website" criteria.', address: 'Try a different location or search term.' });
        } else {
            results.forEach(r => worksheet.addRow(r));
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;

    } catch (error) {
        await browser.close();
        throw error;
    }
}

async function scrollFeed(page) {
    await page.evaluate(async () => {
        const wrapper = document.querySelector('div[role="feed"]');
        if (!wrapper) return;
        wrapper.scrollBy(0, 2000);
    });
}

module.exports = { scrapeMaps };
