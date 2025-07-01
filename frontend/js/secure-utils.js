// frontend/js/secure-utils.js
// Security utilities for HomeMatch

// HTML escape function to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Generate session token (temporary auth solution)
function generateSessionToken() {
    const timestamp = Date.now().toString();
    // In production, this should come from your auth provider
    // For now, we'll create a simple signed token
    const secret = 'dev-secret'; // This should never be in frontend code!
    
    // This is just for demo - real auth should use proper JWT/OAuth
    const signature = btoa(timestamp + secret).replace(/[^a-zA-Z0-9]/g, '');
    return `${timestamp}.${signature}`;
}

// Sanitize property data from API
function sanitizeProperty(property) {
    return {
        id: escapeHtml(property.id || property.zpid),
        price: parseInt(property.price) || 0,
        address: escapeHtml(property.address || 'Unknown Address'),
        city: escapeHtml(property.city || 'Unknown City'),
        neighborhood: escapeHtml(property.neighborhood || ''),
        image: property.image || property.imgSrc || '/placeholder.jpg',
        beds: parseInt(property.beds || property.bedrooms) || 0,
        baths: parseFloat(property.baths || property.bathrooms) || 0,
        sqft: parseInt(property.sqft || property.livingArea) || 0,
        match: parseInt(property.match) || 0,
        daysOnMarket: parseInt(property.daysOnMarket) || 0
    };
}

// Safe DOM manipulation
function setTextContent(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

function setInnerHTML(selector, html) {
    const element = document.querySelector(selector);
    if (element) {
        // Use textContent for user data, innerHTML only for our templates
        element.innerHTML = html;
    }
}

// Create property card with safe rendering
function createPropertyCard(property) {
    const safe = sanitizeProperty(property);
    
    // Create elements safely
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Image
    const img = document.createElement('img');
    img.src = safe.image;
    img.alt = 'Property image';
    img.className = 'property-image';
    img.onerror = function() { this.src = '/placeholder.jpg'; };
    
    // Details container
    const details = document.createElement('div');
    details.className = 'property-details';
    
    // Price
    const price = document.createElement('div');
    price.className = 'property-price';
    price.textContent = `$${safe.price.toLocaleString()}`;
    
    // Address
    const address = document.createElement('div');
    address.className = 'property-address';
    address.textContent = `${safe.address}, ${safe.city}`;
    
    // Features
    const features = document.createElement('div');
    features.className = 'property-features';
    
    const bedFeature = document.createElement('div');
    bedFeature.className = 'feature';
    bedFeature.textContent = `🛏️ ${safe.beds} beds`;
    
    const bathFeature = document.createElement('div');
    bathFeature.className = 'feature';
    bathFeature.textContent = `🚿 ${safe.baths} baths`;
    
    const sqftFeature = document.createElement('div');
    sqftFeature.className = 'feature';
    sqftFeature.textContent = `📏 ${safe.sqft.toLocaleString()} sqft`;
    
    features.appendChild(bedFeature);
    features.appendChild(bathFeature);
    features.appendChild(sqftFeature);
    
    // Match score
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match-score';
    
    const matchText = document.createElement('strong');
    matchText.textContent = `Match Score: ${safe.match}%`;
    matchDiv.appendChild(matchText);
    
    if (safe.neighborhood) {
        const neighborhoodDiv = document.createElement('div');
        neighborhoodDiv.style.cssText = 'color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;';
        neighborhoodDiv.textContent = `📍 ${safe.neighborhood}`;
        matchDiv.appendChild(neighborhoodDiv);
    }
    
    // Assemble card
    details.appendChild(price);
    details.appendChild(address);
    details.appendChild(features);
    details.appendChild(matchDiv);
    
    card.appendChild(img);
    card.appendChild(details);
    
    return card;
}

// Export functions for use in main app
window.SecureUtils = {
    escapeHtml,
    generateSessionToken,
    sanitizeProperty,
    setTextContent,
    setInnerHTML,
    createPropertyCard
};