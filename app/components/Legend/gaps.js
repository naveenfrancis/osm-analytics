import React, { Component } from 'react'
import { Link } from 'react-router'
import * as request from 'superagent'
import moment from 'moment'
import style from './style.css'
import settings from '../../settings/settings'
import themes from '../../settings/themes'
import { gapsFilters } from '../../settings/options'
import { colorScheme } from '../Map/gapsLayer'

class Legend extends Component {
  state = {}

  render() {
    const { featureType, theme }  = this.props
    const layer = gapsFilters.find(filter => filter.name === featureType)
    return (
      <ul id="legend" style={themes[theme].legend}>
        <li><h3>Map Legend</h3></li>
        <li>
          <p>{layer && layer.description} <Link to="/about">Read more.</Link></p>
        </li>
        <li><span
          style={{backgroundColor: colorScheme[colorScheme.length-1]}}
          className="legend-icon fill" />
          likely complete OSM data
        </li>
        <li><span
          style={{backgroundColor: colorScheme[0]}}
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
    const layer = gapsFilters.find(filter => filter.name === featureType)
    request.head(settings['vt-source']+'/'+layer.layers.osm+'/0/0/0.pbf').end((err, res) => {
      if (!err) this.setState({
        lastModified: res.headers['last-modified']
      })
    })
  }

}

export default Legend
