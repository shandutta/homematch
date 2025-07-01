// HomeMatch Settings JS
const ALL_NEIGHBORHOODS = [
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
];

const FAV_NEIGHBORHOODS = [
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
];

// Load saved settings or use defaults
let settings = {
    priceMin: 1800000,
    priceMax: 2300000,
    sqftMin: 1800,
    sqftMax: 3000,
    bedsMin: 3,
    bathsMin: 2,
    lawnMin: 200,
    kitchenAge: 10,
    neighborhoods: [...FAV_NEIGHBORHOODS],
    weights: {
        lawn: 30,
        kitchen: 25,
        commute: 20,
        safety: 15,
        view: 10
    }
};

// Load from localStorage
const saved = localStorage.getItem('homematchSettings');
if (saved) {
    settings = JSON.parse(saved);
}

// Populate form fields
document.getElementById('minPrice').value = settings.priceMin;
document.getElementById('maxPrice').value = settings.priceMax;
document.getElementById('minSqft').value = settings.sqftMin;
document.getElementById('maxSqft').value = settings.sqftMax;
document.getElementById('minBeds').value = settings.bedsMin;
document.getElementById('minBaths').value = settings.bathsMin;
document.getElementById('minLawn').value = settings.lawnMin;
document.getElementById('kitchenAge').value = settings.kitchenAge;

// Create neighborhood checkboxes
const neighborhoodGrid = document.getElementById('neighborhoodGrid');
ALL_NEIGHBORHOODS.forEach(n => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = n;
    checkbox.checked = settings.neighborhoods.includes(n);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + n));
    neighborhoodGrid.appendChild(label);
});

// Setup weight sliders
const weights = { ...settings.weights };

function renderWeights() {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    document.getElementById('totalPct').textContent = total;
    
    for (const k in weights) {
        document.getElementById(`${k}Pct`).textContent = weights[k];
        document.getElementById(`${k}Slider`).value = weights[k];
    }
}

function rebalance(changedKey, newVal) {
    newVal = parseInt(newVal);
    const delta = newVal - weights[changedKey];
    weights[changedKey] = newVal;

    const others = Object.keys(weights).filter(k => k !== changedKey);
    let pool = others.reduce((s, k) => s + weights[k], 0);

    if (pool > 0) {
        others.forEach(k => {
            const share = weights[k] / pool;
            weights[k] = Math.max(0, Math.round(weights[k] - delta * share));
        });
    }

    // Adjust to make total = 100
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum !== 100 && others.length > 0) {
        weights[others[0]] += 100 - sum;
    }
    
    renderWeights();
}

// Wire up sliders
['lawn', 'kitchen', 'commute', 'safety', 'view'].forEach(k => {
    document.getElementById(`${k}Slider`).addEventListener('input', e => {
        rebalance(k, e.target.value);
    });
});

// Save button
document.getElementById('saveBtn').addEventListener('click', () => {
    // Gather form values
    settings.priceMin = parseInt(document.getElementById('minPrice').value) || 1800000;
    settings.priceMax = parseInt(document.getElementById('maxPrice').value) || 2300000;
    settings.sqftMin = parseInt(document.getElementById('minSqft').value) || 1800;
    settings.sqftMax = parseInt(document.getElementById('maxSqft').value) || 3000;
    settings.bedsMin = parseInt(document.getElementById('minBeds').value) || 3;
    settings.bathsMin = parseInt(document.getElementById('minBaths').value) || 2;
    settings.lawnMin = parseInt(document.getElementById('minLawn').value) || 200;
    settings.kitchenAge = parseInt(document.getElementById('kitchenAge').value) || 10;
    
    // Get selected neighborhoods
    settings.neighborhoods = [];
    neighborhoodGrid.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        settings.neighborhoods.push(cb.value);
    });
    
    // Save weights
    settings.weights = { ...weights };
    
    // Save to localStorage
    localStorage.setItem('homematchSettings', JSON.stringify(settings));
    
    alert('Settings saved!');
    window.location.href = 'index.html';
});

// Initialize weights display
renderWeights();