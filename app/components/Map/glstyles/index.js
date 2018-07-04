/* eslint quotes: "off" */

import settings from '../../../settings/settings'
import themes from '../../../settings/themes'

const applyTheme = (themeName, layer, glLayers) => {
  //if (!themes[themeName] || !themes[themeName][layerName]) return glLayers
  return glLayers.map(glLayer =>
    Object.assign(glLayer, {
      paint: Object.assign(glLayer.paint,
        themes[themeName].getGlLayerStyle(layer, glLayer)
      )
    })
  )
}

export default function getStyle(availableLayers, activeLayer, options) {
  if (!options) options = {}
  const currentTheme = options.theme || 'default'
  const timeFilter = options.timeFilter
  const experienceFilter = options.experienceFilter
  const server = options.source || settings['vt-source']

  var glSources = {}
  availableLayers.forEach(layer => {
    glSources[layer.name + '-raw'] = {
      "type": "vector",
      "tiles": [
        server+"/"+layer.name+"/{z}/{x}/{y}.pbf"
      ],
      "minzoom": 13,
      "maxzoom": 13
    }
    glSources[layer.name + '-aggregated'] = {
      "type": "vector",
      "tiles": [
        server+"/"+layer.name+"/{z}/{x}/{y}.pbf"
      ],
      "minzoom": 0,
      "maxzoom": 12
    }
  })

  var glLayers = []
  if (activeLayer !== undefined) {
    // raw layers
    glLayers.push({
      "id": activeLayer.name + "-raw",
      "source": activeLayer.name + "-raw",
      "source-layer": "osm",
      "type": activeLayer.render.type,
      "paint": activeLayer.render.type === "line" ? {
          "line-opacity": 1,
          "line-width": 1
        } : {
          "fill-opacity": 1
        }
    })
    glLayers.push({
      "id": activeLayer.name + "-raw-highlight",
      "source": activeLayer.name + "-raw",
      "source-layer": "osm",
      "filter": ["==", "_timestamp", -1],
      "type": activeLayer.render.type,
      "paint": activeLayer.render.type === "line" ? {
          "line-opacity": 1,
          "line-width": 2
        } : {
          "fill-opacity": 1
        }
    })

    // aggregated layers
    var zoomBreaks = [Infinity]
    // contains list of breaks for different zoom level layers
    // e.g. 0, 50, 200, 800, 3200, 12800, 51200
    var scaleFactor = activeLayer.render.scaleFactor
    for (var i=0; i<6; i++) {
      zoomBreaks.unshift(scaleFactor)
      scaleFactor /= activeLayer.render.scaleBasis
    }
    zoomBreaks.unshift(0)

    const opacityBreaks = [
      [[10, 0.1], [13, 1.0]],
      [[8, 0.1], [11, 1.0], [12, 1.0]],
      [[6, 0.1], [9, 1.0], [12, 1.0]],
      [[4, 0.1], [7, 1.0], [12, 1.0]],
      [[2, 0.1], [5, 1.0], [12, 1.0]],
      [[0, 0.1], [3, 1.0], [12, 1.0]],
      [[0, 1.0], [12, 1.0]]
    ]
    const filterField = activeLayer.filter.geometry === "LineString"
      ? "_lineDistance"
      : "_count"
    zoomBreaks.slice(0, -1).forEach((_, i) => {
      glLayers.push({
        "id": activeLayer.name + "-aggregated-"+i,
        "source": activeLayer.name + "-aggregated",
        "source-layer": "osm",
        "maxzoom": 12.01,
        "filter": ["all",
          [">=", filterField, zoomBreaks[i]],
          ["<", filterField, zoomBreaks[i+1]]
        ],
        "type": "fill",
        "paint": {
          "fill-antialias": false,
          "fill-opacity": {
            base: 1,
            stops: opacityBreaks[i]
          }
        }
      })
      glLayers.push({
        "id": activeLayer.name + "-aggregated-highlight-"+i,
        "source": activeLayer.name + "-aggregated",
        "source-layer": "osm",
        "maxzoom": 12.01,
        "filter": ["==", "_timestamp", -1],
        "densityFilter": ["all",
          [">=", filterField, zoomBreaks[i]],
          ["<", filterField, zoomBreaks[i+1]]
        ],
        "type": "fill",
        "paint": {
          "fill-antialias": false,
          "fill-opacity": {
            base: 1,
            stops: opacityBreaks[i]
          }
        }
      })
    })
  }

  return {
    "version": 8,
    "sources": glSources,
    "layers": applyTheme(currentTheme, activeLayer, glLayers).map(layer => {
        if (!layer.id.match(/highlight/)) return layer
        if (!timeFilter && !experienceFilter) {
          layer.filter = ["==", "_timestamp", -1]
        }
        if (timeFilter) {
          layer.filter = ["all",
            [">=", "_timestamp", timeFilter[0]],
            ["<=", "_timestamp", timeFilter[1]]
          ]
        }
        if (experienceFilter) {
          layer.filter = ["all",
            [">=", "_userExperience", experienceFilter[0]],
            ["<=", "_userExperience", experienceFilter[1]]
          ]
        }

        return layer
      })
      .reduce((prev, filterSources) => prev.concat(filterSources), [])
      .sort((a,b) => {
        if (a.id.match(/highlight/) && b.id.match(/highlight/)) return 0
        if (a.id.match(/highlight/)) return +1
        if (b.id.match(/highlight/)) return -1
        return 0
      })
  }
}

export function getCompareStyles(availableLayers, activeLayer, compareTimes, theme) {
  const beforeSource = (compareTimes[0] === 'now') ? settings['vt-source'] : settings['vt-hist-source']+'/'+compareTimes[0]
  const afterSource = (compareTimes[1] === 'now') ? settings['vt-source'] : settings['vt-hist-source']+'/'+compareTimes[1]
  var glCompareLayerStyles = {
    before: JSON.parse(JSON.stringify(getStyle(availableLayers, activeLayer, { source: beforeSource, theme }))),
    after: JSON.parse(JSON.stringify(getStyle(availableLayers, activeLayer, { source: afterSource, theme })))
  }
  // don't need highlight layers
  glCompareLayerStyles.before.layers = glCompareLayerStyles.before.layers.filter(layer => !layer.source.match(/highlight/))
  glCompareLayerStyles.after.layers = glCompareLayerStyles.before.layers.filter(layer => !layer.source.match(/highlight/))
  return glCompareLayerStyles
}
