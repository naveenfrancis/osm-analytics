import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as MapActions from '../../actions/map'
import Header from '../../components/Header'
import EmbedHeader from '../../components/Header/embedHeader.js'
import GapsMap from '../../components/Map/gaps.js'
import GapsStats from '../../components/Stats/gaps.js'
import { load as loadHotProjects } from '../../data/hotprojects.js'
import themes from '../../settings/themes'
import style from '../App/style.css'

class Gaps extends Component {
  state = {
    hotProjectsLoaded: false
  }

  render() {
    const { actions, routeParams, route, embed } = this.props
    const theme = routeParams.theme || 'default'
    const header = (embed) ? <EmbedHeader {...actions} theme={theme}/> : <Header/>

    if (!this.state.hotProjectsLoaded) {
      return (
        <div className="main">
          {header}
        </div>
      )
      return <p style="text-align:center;">Loading…</p>
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
        {route.view === 'gaps-region' ? <GapsStats /> : ''}
        { embed ? <a className="external-link" target='_blank' rel='noreferrer noopener' style={themes[theme].externalLink} href='http://osm-analytics.org/'>View on osm-analytics.org</a> : '' }
      </div>
    )
  }

  componentDidMount() {
    this.props.actions.setEmbedFromUrl(this.props.routeParams.embed === 'embed')
    this.props.actions.setThemeFromUrl(this.props.routeParams.theme)
    loadHotProjects((err) => {
      if (err) {
        console.error('unable to load hot projects data: ', err)
      }
      this.setState({ hotProjectsLoaded: true })
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
