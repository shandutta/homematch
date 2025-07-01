// HomeMatch Settings JS
const NEIGHBORHOODS = {
     favorites: [
        'Willow Glen, San Jose, CA',
        'Los Gatos, CA',
        'Cupertino, CA',
        'Palo Alto, CA',
        'Menlo Park, CA',
        'Mountain View, CA',
        'San Mateo, CA',
        'San Carlos, CA',
        'Belmont, CA',
        'Lafayette, CA',
        'Orinda, CA',
        'Moraga, CA',
        'Walnut Creek, CA',
        'Cole Valley, San Francisco, CA'
     ],
     all: [
        'Willow Glen, San Jose, CA',
        'Los Gatos, CA',
        'Cupertino, CA',
        'Palo Alto, CA',
        'Menlo Park, CA',
        'Mountain View, CA',
        'San Mateo, CA',
        'San Carlos, CA',
        'Belmont, CA',
        'Lafayette, CA',
        'Orinda, CA',
        'Moraga, CA',
        'Walnut Creek, CA',
        'Cole Valley, San Francisco, CA',
        'Almaden, San Jose, CA',
        'Cambrian, San Jose, CA',
        'Piedmont, CA',
        'Oakland Hills, CA',
        'Berkeley Hills, CA',
        'Noe Valley, San Francisco, CA',
        'Richmond District, San Francisco, CA',
        'Sunset District, San Francisco, CA'
     ]
};

// Default settings
const DEFAULT_SETTINGS = {
    priceMin: 1800000,
    priceMax: 2300000,
    sqftMin: 1800,
    sqftMax: 3000,
    bedsMin: 3,
    bathsMin: 2,
    lawnMin: 200,
    kitchenAge: 10,
    neighborhoods: [
        'Palo Alto, CA',
        'Menlo Park, CA',
        'Mountain View, CA',
        'Los Gatos, CA',
        'Cupertino, CA',
        'San Mateo, CA'
    ], // Default to multiple neighborhoods
    weights: {
        lawn: 30,
        kitchen: 25,
        commute: 20,
        safety: 15,
        view: 10
    }
};

// Load settings
let settings = { ...DEFAULT_SETTINGS };
const saved = localStorage.getItem('homematchSettings');
if (saved) {
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
}

// Populate form on load
document.addEventListener('DOMContentLoaded', () => {
    // Fill in form values
    Object.entries({
        minPrice: settings.priceMin,
        maxPrice: settings.priceMax,
        minSqft: settings.sqftMin,
        maxSqft: settings.sqftMax,
        minBeds: settings.bedsMin,
        minBaths: settings.bathsMin,
        minLawn: settings.lawnMin,
        kitchenAge: settings.kitchenAge
    }).forEach(([id, value]) => {
        document.getElementById(id).value = value;
    });

    // Create neighborhood checkboxes
    const grid = document.getElementById('neighborhoodGrid');
    NEIGHBORHOODS.all.forEach(n => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${n}" 
                   ${settings.neighborhoods.includes(n) ? 'checked' : ''}>
            ${n}
        `;
        grid.appendChild(label);
    });

    // Setup weights
    const weights = { ...settings.weights };
    
    function updateWeights() {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        document.getElementById('totalPct').textContent = total;
        Object.entries(weights).forEach(([k, v]) => {
            document.getElementById(`${k}Pct`).textContent = v;
            document.getElementById(`${k}Slider`).value = v;
        });
    }

    // Handle weight changes
    Object.keys(weights).forEach(key => {
        document.getElementById(`${key}Slider`).addEventListener('input', (e) => {
            weights[key] = parseInt(e.target.value);
            updateWeights();
        });
    });

    updateWeights();

    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => {
        // Collect all values
        const newSettings = {
            priceMin: parseInt(document.getElementById('minPrice').value),
            priceMax: parseInt(document.getElementById('maxPrice').value),
            sqftMin: parseInt(document.getElementById('minSqft').value),
            sqftMax: parseInt(document.getElementById('maxSqft').value),
            bedsMin: parseInt(document.getElementById('minBeds').value),
            bathsMin: parseInt(document.getElementById('minBaths').value),
            lawnMin: parseInt(document.getElementById('minLawn').value),
            kitchenAge: parseInt(document.getElementById('kitchenAge').value),
            neighborhoods: [...grid.querySelectorAll('input:checked')].map(cb => cb.value),
            weights: { ...weights }
        };

        localStorage.setItem('homematchSettings', JSON.stringify(newSettings));
        alert('Settings saved!');
        window.location.href = 'index.html';
    });
});