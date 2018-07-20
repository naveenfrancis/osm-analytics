import { queue } from 'd3-queue'
import Sphericalmercator from 'sphericalmercator'
import { bboxPolygon, intersect, inside, centroid } from 'turf'
import loadTile from './loadVectorTile.js'
import settings from '../../settings/settings'
import colorbrewer from 'colorbrewer'

const merc = new Sphericalmercator({size: 512})
const gapsCoverageExtent = bboxPolygon([-17,-20,66,29])

const colorScheme = colorbrewer.PRGn[7]

export { colorScheme }
export default L.GridLayer.extend({
  threshold: 1000, // ~1000m² per building

  createTile: function(coords, done) {
    var tile = document.createElement('canvas')
    var tileSize = this.getTileSize()
    var cellSize = tileSize.x / 64
    tile.setAttribute('width', tileSize.x)
    tile.setAttribute('height', tileSize.y)

    const bboxPoly = bboxPolygon(merc.bbox(coords.x, coords.y, coords.z-1))
    if (!intersect(gapsCoverageExtent, bboxPoly)) {
      setTimeout(() => done(null, tile), 1)
      return tile
    }

    var ctx = tile.getContext('2d')

    var q = queue()
    var tileCoords = { x: coords.x, y: coords.y, z: coords.z-1 }
    q.defer(loadTile, settings['vt-gaps-source']+'/{z}/{x}/{y}.pbf', 'buildup', tileCoords)
    q.defer(loadTile, settings['vt-source']+'/buildings/{z}/{x}/{y}.pbf', 'osm', tileCoords)
    q.awaitAll((err, data) => {
      if (err) return done(err)
      var areas = {}
      data[0].features = data[0].features.filter(feature =>
        inside(centroid(feature), gapsCoverageExtent)
      ).forEach(feature => {
        var binX = feature.properties.binX
        var binY = feature.properties.binY
        var area = feature.properties.area
        areas[binX+'/'+binY] = area
      })
      var counts = {}
      data[1].features = data[1].features.filter(feature =>
        inside(centroid(feature), gapsCoverageExtent)
      ).forEach(feature => {
        var binX = feature.properties.binX
        var binY = feature.properties.binY
        var count = feature.properties._count
        counts[binX+'/'+binY] = count
      })
      ;(new Set(Object.keys(areas).concat(Object.keys(counts)))).forEach(bin => {
        var binX = +bin.split('/')[0]
        var binY = +bin.split('/')[1]
        var opacity = 0.4 + Math.min(0.4, Math.max((areas[bin] || 0), (counts[bin] * 1000 /*~1000m² per building*/ || 0)) / (5000 * Math.pow(2.9, 12-coords.z)))
        var ratio = (areas[bin] || 0) / (counts[bin] * this.threshold || 0)
        var color
        switch (true) {
          case ratio > 15:
            ctx.fillStyle = hexToRgbA(colorScheme[0], opacity)
            break
          case ratio > 5:
            ctx.fillStyle = hexToRgbA(colorScheme[1], opacity)
            break
          case ratio > 2:
            ctx.fillStyle = hexToRgbA(colorScheme[2], opacity)
            break
          case ratio > 1.25:
            ctx.fillStyle = hexToRgbA(colorScheme[3], opacity)
            break
          case ratio > 1:
            ctx.fillStyle = hexToRgbA(colorScheme[4], opacity)
            break
          case ratio > 0.8:
            ctx.fillStyle = hexToRgbA(colorScheme[5], opacity)
            break
          case ratio >= 0:
            ctx.fillStyle = hexToRgbA(colorScheme[6], opacity)
            break
          default:
            ctx.fillStyle = "#000000"
        }
        //ctx.fillStyle = "rgba(255,0,0,"+Math.log(feature.properties.area)/Math.log(1000000)+")"
        ctx.fillRect(binX*cellSize, tileSize.y-(binY+1)*cellSize, cellSize, cellSize)
      })
      done(null, tile)
    })
    return tile
  }
})

// from https://stackoverflow.com/a/21648508/1627467
function hexToRgbA (hex, opacity) {
  var c
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('')
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return 'rgba(' + [(c>>16)&255, (c>>8)&255, c&255].join(',') + ',' + (opacity || 1) + ')';
  }
  throw new Error('Bad Hex');
}
