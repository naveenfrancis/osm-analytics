import { queue } from 'd3-queue'
import Sphericalmercator from 'sphericalmercator'
import { bboxPolygon, intersect, inside, centroid } from 'turf'
import loadTile from './loadVectorTile.js'
import settings from '../../settings/settings'

const merc = new Sphericalmercator({size: 512})
const gapsCoverageExtent = bboxPolygon([-17,-20,66,29])

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
    q.defer(loadTile, 'http://129.206.7.145:7778/{z}/{x}/{y}.pbf', 'buildup', tileCoords)
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
            ctx.fillStyle = "rgba(215,48,39, "+opacity+")"
            break;
          case ratio > 5:
            ctx.fillStyle = "rgba(252,141,89, "+opacity+")"
            break;
          case ratio > 2:
            ctx.fillStyle = "rgba(254,224,139, "+opacity+")"
            break;
          case ratio > 1.25:
            ctx.fillStyle = "rgba(255,255,191, "+opacity+")"
            break;
          case ratio > 1:
            ctx.fillStyle = "rgba(217,239,139, "+opacity+")"
            break;
          case ratio > 0.8:
            ctx.fillStyle = "rgba(145,207,96, "+opacity+")"
            break;
          case ratio >= 0:
            ctx.fillStyle = "rgba(26,152,80, "+opacity+")"
            break;
          /*case ratio > 0.1:
            ctx.fillStyle = "rgba(26,152,80, "+opacity+")"
            break;
          case ratio > 0:
            ctx.fillStyle = "#770077"
            break;
          case ratio == 0:
            ctx.fillStyle = "#ff0077"
            break;*/
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
