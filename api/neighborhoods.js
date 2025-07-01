export default function handler(req, res) {

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
    ]

    const ALL_NEIGHBORHOODS = [
    ...FAV_NEIGHBORHOODS,
    'Almaden, San Jose, CA',
    'Cambrian, San Jose, CA',
    'Piedmont, CA',
    'Oakland Hills, CA',
    'Berkeley Hills, CA',
    'Noe Valley, San Francisco, CA',
    'Richmond District, San Francisco, CA',
    'Sunset District, San Francisco, CA'
    ]

  res.setHeader('Access-Control-Allow-Origin', '*')     // for local HTML testing
  res.status(200).json({ all: ALL, fav: FAV })
}