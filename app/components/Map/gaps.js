import React, { Component } from 'react'
import style from './style.css'
import glStyles, { getGapsStyles } from './glstyles'
import Swiper from './swiper'
import GapsFilterButton from '../FilterButton/gaps.js'
import SearchBox from '../SearchBox'
import GapsLegend from '../Legend/gaps.js'
import DropdownButton from '../DropdownButton'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as MapActions from '../../actions/map'
import { bboxPolygon, area, erase } from 'turf'
import { debounce } from 'lodash'
import regionToCoords from './regionToCoords'
import themes from '../../settings/themes'
import settings from '../../settings/settings'
import { gapsFilters } from '../../settings/options'
import GapsLayer from './gapsLayer.js'

// leaflet plugins
import * as _leafletmapboxgljs from '../../libs/leaflet-mapbox-gl.js'
import * as _leafleteditable from '../../libs/Leaflet.Editable.js'

var map // Leaflet map object
var backgroundLayer
var gapsLayer
var glLayer // mapbox-gl layer
var glCompareLayers // mapbox-gl layers for before/after view
var boundsLayer = null // selected region layer
var moveDirectly = false

var backgrounds = [
  {
    id: 'default',
    description: 'plain base map',
    url: settings['map-background-tile-layer']
  },
  {
    id: 'mapbox-satellite',
    description: 'satellite imagery (mapbox)',
    url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiaG90IiwiYSI6ImNpbmx4bWN6ajAwYTd3OW0ycjh3bTZvc3QifQ.KtikS4sFO95Jm8nyiOR4gQ'
  },
  {
    id: 'esri-satellite',
    description: 'satellite imagery (esri)',
    url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  },
  {
    id: 'osm',
    description: 'openstreetmap.org',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  {
    id: 'worldpop',
    description: 'worldpop.org.uk',
    url: 'http://maps.worldpop.org.uk/tilesets/wp-global-100m-ppp-2010-adj/{z}/{x}/{y}.png'
  }
]



class GapsMap extends Component {
  state = {}

  changeBackground(newLayer) {
    backgroundLayer.setUrl(backgrounds.find(bg => bg.id === newLayer[0]).url)
  }

  render() {
    const { view, actions, embed, theme } = this.props
    const containerClassName = (embed === false) ? `${view}View` : '';

    var btn = <button className='background-selector' style={{position: 'absolute', top: '122px', right: '25px'}} title='Select Background Layer'>background map&ensp;▾</button>

    return (
      <div className={containerClassName}>
        <div id="map" style={embed ? { bottom: 30 } : {}}>
        </div>
        {false ? <Swiper onMoved={::this.swiperMoved} theme={themes[theme]} /> : ""}

        {embed === false && <div>
          <SearchBox className="searchbox" selectedRegion={this.props.map.region} {...actions}/>
          <span className="search-alternative">or</span>
          <button className="outline" onClick={::this.setViewportRegion}>Outline Custom Area</button>
          <GapsFilterButton enabledFilters={[gapsFilters[0].id]} {...actions}/>
          <DropdownButton
            options={backgrounds}
            btnElement={btn}
            multiple={false}
            selectedKeys={[]}
            onSelectionChange={::this.changeBackground}
          />
        </div>}

        <GapsLegend
          featureType={this.props.map.filters[0]}
          zoom={this.state.mapZoomLevel}
          showHighlighted={embed === false && !!this.props.stats.timeFilter}
          theme={theme}
        />
      </div>
    )
  }

  componentDidMount() {

    const { theme, embed } = this.props

    map = L.map(
      'map', {
      editable: true,
      minZoom: 2,
      scrollWheelZoom: !embed
    })
    .setView([2, 26], 4)
    map.zoomControl.setPosition('bottomright')
    map.on('editable:editing', debounce(::this.setCustomRegion, 200))
    map.on('zoomend', (e) => { this.setState({ mapZoomLevel:map.getZoom() }) })

    backgroundLayer = L.tileLayer(settings['map-background-tile-layer'], {
      attribution: settings['map-attribution'],
      zIndex: -1
    }).addTo(map)

    gapsLayer = (new GapsLayer({tileSize: 512, maxNativeZoom: 13})).addTo(map);

    if (!mapboxgl.supported()) {
      alert('This browser does not support WebGL which is required to run this application. Please check that you are using a supported browser and that WebGL is enabled.')
    }

    const glCompareLayerStyles = getGapsStyles(theme)
    glCompareLayers = {
      left: L.mapboxGL({
        updateInterval: 0,
        style: glCompareLayerStyles.osm,
        hash: false
      }),
      right: L.mapboxGL({
        updateInterval: 0,
        style: glCompareLayerStyles.reference,
        hash: false
      })
    }

    // add glLayers if map state is already initialized
    glCompareLayers.left//.addTo(map)
    glCompareLayers.right//.addTo(map)
    //this.swiperMoved(window.innerWidth/2)

    // init from route params
    if (this.props.view) {
      this.props.actions.setViewFromUrl(this.props.view)
    }
    if (this.props.region) {
      this.props.actions.setRegionFromUrl(this.props.region)
      moveDirectly = true
    }
    if (this.props.filters) {
      this.props.actions.setFiltersFromUrl(this.props.filters)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { theme } = this.props

    // ceck for changed url parameters
    if (nextProps.region !== this.props.region) {
      this.props.actions.setRegionFromUrl(nextProps.region)
    }
    if (nextProps.filters !== this.props.filters) {
      this.props.actions.setFiltersFromUrl(nextProps.filters)
    }
    if (nextProps.overlay !== this.props.overlay) {
      this.props.actions.setOverlayFromUrl(nextProps.overlay)
    }
    if (nextProps.overlay !== this.props.overlay) {
      this.props.actions.setOverlayFromUrl(nextProps.overlay)
    }
    if (nextProps.view !== this.props.view) {
      this.props.actions.setViewFromUrl(nextProps.view)
    }
    if (nextProps.times !== this.props.times) {
      this.props.actions.setTimesFromUrl(nextProps.times)
    }
    // check for changed map parameters
    if (nextProps.map.region !== this.props.map.region) {
      this.mapSetRegion(nextProps.map.region, nextProps.embed === false, nextProps.embed === false)
    }
    if (nextProps.map.filters.join() !== this.props.map.filters.join()) { // todo: handle this in reducer?
      glLayer.setStyle(glStyles(nextProps.map.filters, {
        timeFilter: nextProps.stats.timeFilter,
        experienceFilter: nextProps.stats.experienceFilter,
        theme
      }))
      let glCompareLayerStyles = getCompareStyles(nextProps.map.filters, nextProps.map.times, theme)
      glCompareLayers.before.setStyle(glCompareLayerStyles.before)
      glCompareLayers.after.setStyle(glCompareLayerStyles.after)
    }
    if (nextProps.map.times !== this.props.map.times) {
      let glCompareLayerStyles = getCompareStyles(nextProps.map.filters, nextProps.map.times, theme)
      if (nextProps.map.times[0] !== this.props.map.times[0]) {
        glCompareLayers.before.setStyle(glCompareLayerStyles.before)
      }
      if (nextProps.map.times[1] !== this.props.map.times[1]) {
        glCompareLayers.after.setStyle(glCompareLayerStyles.after)
      }
    }
    // check for changed time/experience filter
    if (nextProps.stats.timeFilter !== this.props.stats.timeFilter) {
      this.setTimeFilter(nextProps.stats.timeFilter)
    }
    if (nextProps.stats.experienceFilter !== this.props.stats.experienceFilter) {
      this.setExperienceFilter(nextProps.stats.experienceFilter)
    }
    // check for switched map views (country/compare)
    if (nextProps.map.view !== this.props.map.view) {
      if (!(this.props.map.view === 'country' || this.props.map.view === 'default')
        && (nextProps.map.view === 'country' || nextProps.map.view === 'default')) {
        glCompareLayers.before.removeFrom(map)
        glCompareLayers.after.removeFrom(map)
        glLayer.addTo(map)
      }
      if (nextProps.map.view === 'compare') {
        glLayer.removeFrom(map)
        glCompareLayers.before.addTo(map)
        glCompareLayers.after.addTo(map)
        this.swiperMoved(window.innerWidth/2)
      }
    }
  }

  setViewportRegion() {
    var pixelBounds = map.getPixelBounds()
    var paddedLatLngBounds = L.latLngBounds(
      map.unproject(
        pixelBounds.getBottomLeft().add([30,-(20+212)])
      ),
      map.unproject(
        pixelBounds.getTopRight().subtract([30,-(70+52)])
      )
    ).pad(-0.15)
    this.props.actions.setRegion({
      type: 'bbox',
      coords: paddedLatLngBounds
        .toBBoxString()
        .split(',')
        .map(Number)
    })
  }

  setCustomRegion() {
    if (!boundsLayer) return
    this.props.actions.setRegion({
      type: 'polygon',
      coords: L.polygon(boundsLayer.getLatLngs()[1]).toGeoJSON().geometry.coordinates[0].slice(0,-1)
    })
  }

  mapSetRegion(region, isEditable, fitBoundsWithBottomPadding) {
    const { swiper: { poly } } = themes[this.props.theme]

    if (boundsLayer !== null) {
      map.removeLayer(boundsLayer)
    }
    if (region === null) return
    regionToCoords(region, 'leaflet')
    .then(function(region) {
      let coords = region.geometry.coordinates

      boundsLayer = L[poly.shape](
        [[[-85.0511287798,-1E5],[85.0511287798,-1E5],[85.0511287798,2E5],[-85.0511287798,2E5],[-85.0511287798,-1E5]]]
        .concat(coords), {
        weight: poly.weight,
        color: poly.color,
        interactive: false
      }).addTo(map)

      if (isEditable) {
        boundsLayer.enableEdit()
      }

      // set map view to region
      try { // geometry calculcation are a bit hairy for invalid geometries (which may happen during polygon editing)
        let viewPort = bboxPolygon(map.getBounds().toBBoxString().split(',').map(Number))
        let xorAreaViewPort = erase(viewPort, L.polygon(boundsLayer.getLatLngs()[1]).toGeoJSON())
        let fitboundsFunc
        if (moveDirectly) {
          fitboundsFunc = ::map.fitBounds
          moveDirectly = false
        } else if (
          !xorAreaViewPort // new region fully includes viewport
          || area(xorAreaViewPort) > area(viewPort)*(1-0.01) // region is small compared to current viewport (<10% of the area covered) or feature is outside current viewport
        ) {
          fitboundsFunc = ::map.flyToBounds
        } else {
          fitboundsFunc = () => {}
        }
        fitboundsFunc(
          // zoom to inner ring!
          boundsLayer.getLatLngs().slice(1)
            .map(coords => L.polygon(coords).getBounds())
            .reduce((bounds1, bounds2) => bounds1.extend(bounds2)),
        {
          paddingTopLeft: [20, 10+52],
          paddingBottomRight: [20, 10+ ((fitBoundsWithBottomPadding) ? 212 : 52)]
        })
      } catch(e) {}
    });
  }

  swiperMoved(x) {
    if (!map) return
    const mapPanePos = map._getMapPanePos()
    const nw = map.containerPointToLayerPoint([0, 0])
    const se = map.containerPointToLayerPoint(map.getSize())
    const clipX = nw.x + (se.x - nw.x) * x / window.innerWidth
    glCompareLayers.left._glContainer.style.clip = 'rect(' + [nw.y+mapPanePos.y, clipX+mapPanePos.x, se.y+mapPanePos.y, nw.x+mapPanePos.x].join('px,') + 'px)'
    glCompareLayers.right._glContainer.style.clip = 'rect(' + [nw.y+mapPanePos.y, se.x+mapPanePos.x, se.y+mapPanePos.y, clipX+mapPanePos.x].join('px,') + 'px)'
  }

}



function mapStateToProps(state) {
  return {
    map: state.map,
    stats: state.stats
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(MapActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GapsMap)
