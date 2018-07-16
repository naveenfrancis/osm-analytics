import React, { Component } from 'react'
import * as request from 'superagent'
import moment from 'moment'
import style from './style.css'
import settings from '../../settings/settings'
import themes from '../../settings/themes'

class Legend extends Component {
  state = {}

  render() {
    const { layer, theme }  = this.props
    return (
      <ul id="legend" style={themes[theme].legend}>
        <li><h3>Map Legend</h3></li>
        <li><span
          style={{backgroundColor: "green"}}
          className="legend-icon fill" />
          likely complete OSM data
        </li>
        <li><span
          style={{backgroundColor: "red"}}
          className="legend-icon fill" />
          probable gap in OSM data
        </li>
      </ul>
    )
  }

  componentDidMount() {
    this.updateLastModified(this.props.featureType)
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.featureType !== this.props.featureType) {
      this.updateLastModified(nextProps.featureType)
    }
  }

  updateLastModified(featureType) {
    request.head(settings['vt-source']+'/'+featureType+'/0/0/0.pbf').end((err, res) => {
      if (!err) this.setState({
        lastModified: res.headers['last-modified']
      })
    })
  }

}

export default Legend
