import React, { useState } from 'react';
import './App.css';

function App() {
    const [formData, setFormData] = useState({
        searchKey: '',
        location: '',
        limit: 10
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('Scraping in progress... This may take a while.');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Scraping failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads_${formData.searchKey}_${formData.location}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setMessage('Download started!');
        } catch (error) {
            console.error(error);
            setMessage('Error occurred during scraping.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h1>Google Maps Scraper</h1>
                <p className="subtitle">Find businesses with <strong>No Website</strong>.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Search Key (e.g., Plumbers)</label>
                        <input
                            type="text"
                            name="searchKey"
                            value={formData.searchKey}
                            onChange={handleChange}
                            required
                            placeholder="Enter business type"
                        />
                    </div>

                    <div className="form-group">
                        <label>Location (e.g., New York)</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            placeholder="Enter city or area"
                        />
                    </div>

                    <div className="form-group">
                        <label>Number of Records to Get</label>
                        <input
                            type="number"
                            name="limit"
                            value={formData.limit}
                            onChange={handleChange}
                            min="1"
                            max="100"
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Scraping...' : 'Start Scraping'}
                    </button>
                </form>

                {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
            </div>
        </div>
    );
}

export default App;
