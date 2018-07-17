import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as MapActions from '../../actions/map'
import Header from '../../components/Header'
import EmbedHeader from '../../components/Header/embedHeader.js'
import GapsMap from '../../components/Map/gaps.js'
import GapsStats from '../../components/Stats/gaps.js'
import { loadLayers } from '../../settings/options'
import themes from '../../settings/themes'
import style from '../App/style.css'

class Gaps extends Component {
  state = {
    layersLoaded: false
  }

  render() {
    const { actions, routeParams, route, embed } = this.props
    const theme = routeParams.theme || 'default'
    const header = (embed) ? <EmbedHeader {...actions} theme={theme}/> : <Header/>

    if (!this.state.layersLoaded) {
      return (
        <div className="main">
          {header}
          <p style={{ textAlign: "center", marginTop: "100px" }}>Loading…</p>
        </div>
      )
    }

    // update from route params
    if (route.view) {
      this.props.actions.setViewFromUrl(route.view)
    }
    if (routeParams.region) {
      this.props.actions.setRegionFromUrl(routeParams.region)
    }
    if (routeParams.filters) {
      this.props.actions.setFiltersFromUrl(routeParams.filters)
    }

    return (
      <div className="main">
        {header}
        <GapsMap
          region={routeParams.region}
          filters={routeParams.filters}
          view={route.view}
          defaultThreshold="1000"
          embed={embed}
          theme={theme}
        />
        {route.view === 'gaps-region' ? <GapsStats layers={this.state.layers} /> : ''}
        { embed ? <a className="external-link" target='_blank' rel='noreferrer noopener' style={themes[theme].externalLink} href='http://osm-analytics.org/'>View on osm-analytics.org</a> : '' }
      </div>
    )
  }

  componentDidMount() {
    this.props.actions.setEmbedFromUrl(this.props.routeParams.embed === 'embed')
    this.props.actions.setThemeFromUrl(this.props.routeParams.theme)
    loadLayers((err, layers) => {
      if (err) {
        return console.error('unable to load available osm-analytics layers: ', err)
      }
      this.setState({
        layersLoaded: true,
        layers
      })
    })
  }
}

function mapStateToProps(state) {
  return {
    embed: state.map.embed
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
)(Gaps)
