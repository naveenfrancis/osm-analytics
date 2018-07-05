import React, { Component } from 'react'
import * as request from 'superagent'
import moment from 'moment'
import style from './style.css'
import settings from '../../settings/settings'
import themes from '../../settings/themes'

class Legend extends Component {
  state = {}

  render() {
    const { showHighlighted, layer, theme }  = this.props
    return (
      <ul id="legend" style={themes[theme].legend}>
        <li><h3>Map Legend</h3></li>
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
