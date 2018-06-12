import * as request from 'superagent'
import vt from 'vector-tile'
import Protobuf from 'pbf'
import turf from 'turf'
import { extent, intersect, bboxPolygon, featurecollection, centroid, lineDistance, within } from 'turf'
import Sphericalmercator from 'sphericalmercator'
import { queue } from 'd3-queue'
import settings from '../../settings/settings'

export default L.GridLayer.extend({
  createTile: function (coords, done) {
    var tile = document.createElement('canvas')

    var tileSize = this.getTileSize()
    var cellSize = tileSize.x / 64
    tile.setAttribute('width', tileSize.x)
    tile.setAttribute('height', tileSize.y)

    var ctx = tile.getContext('2d')

    // Draw whatever is needed in the canvas context
    // For example, circles which get bigger as we zoom in
    //
    var q = queue()
    q.defer(loadTile, 'http://osmanalytics:7778/{z}/{x}/{y}.pbf', 'buildup', coords)
    q.defer(loadTile, settings['vt-source']+'/buildings/{z}/{x}/{y}.pbf', 'osm', coords)
    q.awaitAll((err, data) => {
      if (err) return done(err);
      var areas = {}
      data[0].features.forEach(feature => {
        var binX = feature.properties.binX
        var binY = feature.properties.binY
        var area = feature.properties.area
        areas[binX+'/'+binY] = area
      })
      var counts = {}
      data[1].features.forEach(feature => {
        var binX = feature.properties.binX
        var binY = feature.properties.binY
        var count = feature.properties._count
        counts[binX+'/'+binY] = count
      })
      ;(new Set(Object.keys(areas).concat(Object.keys(counts)))).forEach(bin => {
        var binX = +bin.split('/')[0]
        var binY = +bin.split('/')[1]
        var opacity = 0.4 + Math.min(0.4, Math.max((areas[bin] || 0), (counts[bin] * 1000 /*~1000m² per building*/ || 0)) / (5000 * Math.pow(2.9, 12-coords.z)))
        var ratio = (areas[bin] || 0) / (counts[bin] * 1000 /*~1000m² per building*/ || 0)
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


function parseTile(data, layerName, tile, callback) {
  const layer = data.layers[layerName]
  var features = []
  if (layer) {
    for (let i=0; i<layer.length; i++) {
      let feature = layer.feature(i)
      features.push(feature.toGeoJSON(tile.x, tile.y, tile.z-1))
    }
  }
  callback(null, featurecollection(features))
}
function loadTile(url, layerName, tile, callback) {
  // based on https://github.com/mapbox/mapbox-gl-js/blob/master/js/source/worker.js
  //var url = 'http://129.206.7.145:7778/'+tile.z+'/'+tile.x+'/'+tile.y+'.pbf'
  url = url
    .replace('{z}', tile.z-1)
    .replace('{x}', tile.x)
    .replace('{y}', tile.y)

  getArrayBuffer(url, function done(err, data) {
    if (err) return callback(err)
    if (data === null) return callback(null, featurecollection([]))
    data = new vt.VectorTile(new Protobuf(new Uint8Array(data)))
    parseTile(data, layerName, tile, callback)
  })
}
function getArrayBuffer(url, callback) {
  // todo: global?
  request.parse['application/x-protobuf'] = obj => obj
  request.parse['application/octet-stream'] = obj => obj

  /* eslint-disable indent */
  request.get(url)
  .on('request', function () {
    // todo: needed?
    // todo: check browser compat?? xhr2??? see https://github.com/visionmedia/superagent/pull/393 + https://github.com/visionmedia/superagent/pull/566
    this.xhr.responseType = 'arraybuffer' // or blob
  })
  .end(function(err,res) {
    // now res.body is an arraybuffer or a blob
    if (!err && res.status >= 200 && res.status < 300) {
      callback(null, res.body)
    } else if (res && res.status === 404) {
      callback(null, null)
    } else {
      callback(err || new Error(res.status))
    }
  });
  /* eslint-enable indent */
};
