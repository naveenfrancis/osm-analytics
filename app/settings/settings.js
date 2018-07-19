const mapbox_token = 'pk.eyJ1IjoiaG90IiwiYSI6ImNpbmx4bWN6ajAwYTd3OW0ycjh3bTZvc3QifQ.KtikS4sFO95Jm8nyiOR4gQ'

export default {
  'vt-source': 'http://129.206.7.145', // source of current vector tiles
  'vt-hist-source': 'https://osm-analytics.vizzuality.com', // source of historic vector tiles for compare feature
  'map-background-tile-layer': 'https://api.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=' + mapbox_token,
  'map-attribution': '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
}
