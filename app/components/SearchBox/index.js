import React, { Component } from 'react'
import * as request from 'superagent'
import superagentPromisePlugin from 'superagent-promise-plugin'
import osmtogeojson from 'osmtogeojson'
import { simplify, polygon } from 'turf'
import Fuse from 'fuse.js'
import Autosuggest from 'react-autosuggest'
import style from './style.css'

function fuse (data) {
  return new Fuse(data, {
    keys: ['name'],
    include: ['score'],
    threshold: 0.4,
    shouldSort: false
  });
}

class SearchBox extends Component {
  state = {
    active: true,
    currentValue: '',
    fuse: null
  }

  onClick() {
    this.setState({active: true})
  }
  onKeyPress(event) {
    if (this.state.errored) this.setState({ errored: false })
    // enter key or search icon clicked
    var regionName = this.state.currentValue
    if (regionName && (event.type === 'click' || event.which === 13)) {
      if (regionName.match(/^\d+$/)) {
        this.getSuggestions(regionName, (function(err, results) {
          let best = results[0]
          if (best && best.id == regionName) {
            this.go(best)
          }
        }).bind(this))
      } else {
        this.goOSM(regionName)
      }
    }
  }
  getSuggestions(input, callback) {
    request
    .get('https://tasks.hotosm.org/api/v1/project/search')
    .query({
      textSearch: input
    })
    .use(superagentPromisePlugin)
    .then(function(res) {
      var suggestions = res.body.results.map(function(result) {
        return {
          id: result.projectId,
          name: result.name
        }
      })
      callback(null, suggestions)
    })
    .catch(function(err) {
      if (err.status === 404)
        callback(null, [])
      else
        callback(err)
    });
  }

  go(where) {
    this.props.setRegion({
      type: 'hot',
      id: where.id
    })
  }
  goOSM(where) {
    var setState = ::this.setState
    setState({ loading: true })
    var setRegion = this.props.setRegion
    request
    .get('https://nominatim.openstreetmap.org/search')
    .query({
      format: 'json',
      q: where
    })
    .use(superagentPromisePlugin)
    .then(function(res) {
      var hits = res.body.filter(r => r.osm_type !== 'node')
      if (hits.length === 0) throw new Error('nothing found for place name '+where)
      return request
      .get('https://overpass-api.de/api/interpreter')
      .query({
        data: '[out:json][timeout:3];'+hits[0].osm_type+'('+hits[0].osm_id+');out geom;'
      })
      .use(superagentPromisePlugin)
    })
    .then(function(res) {
      var osmFeature = osmtogeojson(res.body).features[0]
      if (!(osmFeature.geometry.type === 'Polygon' || osmFeature.geometry.type === 'MultiPolygon')) throw new Error('invalid geometry')
      var coords = osmFeature.geometry.coordinates
      if (osmFeature.geometry.type === 'MultiPolygon') {
        coords = coords.sort((p1,p2) => p2[0].length - p1[0].length)[0] // choose polygon with the longest outer ring
      }
      coords = coords[0]
      const maxNodeCount = 40 // todo: setting
      if (coords.length > maxNodeCount) {
        for (let simpl = 0.00001; simpl<100; simpl*=1.4) {
          let simplifiedFeature = simplify(polygon([coords]), simpl)
          if (simplifiedFeature.geometry.coordinates[0].length <= maxNodeCount) {
            coords = simplifiedFeature.geometry.coordinates[0]
            break;
          }
        }
      }
      setState({ loading: false })
      setRegion({
        type: 'polygon',
        coords: coords.slice(0,-1)
      })
    })
    .catch(function(err) {
      console.error('error during osm region search:', err)
      setState({ loading: false, errored: true })
    })
  }

  render() {
    return (
      <div className="search">
        <Autosuggest
          suggestions={::this.getSuggestions}
          suggestionRenderer={s => ('#'+s.id+' '+s.name)}
          suggestionValue={s => s.id}
          onSuggestionSelected={s => this.go(s)}
          value={this.state.currentValue}
          scrollBar
          inputAttributes={{
            className: 'searchbox',
            placeholder: 'Search by region or HOT Project ID',
            type: 'search',
            onKeyPress: ::this.onKeyPress,
            onChange: value => ::this.setState({ currentValue: value })
          }}
        />
        <span
          className={'search-icon' + (this.state.loading ? ' loading' : '') + (this.state.errored ? ' errored' : '')}
          onClick={::this.onKeyPress}>
        </span>
      </div>
    )
  }

  componentDidMount() {
    if (this.props.selectedRegion) {
      if (this.props.selectedRegion.type === 'hot') {
        this.setState({
          currentValue: ""+this.props.selectedRegion.id
        })
      }
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedRegion) {
      if (nextProps.selectedRegion.type === 'hot') {
        this.setState({
          currentValue: ""+nextProps.selectedRegion.id
        })
      }
    }
  }
}

export default SearchBox
