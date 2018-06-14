import React, { Component } from 'react'
import * as request from 'superagent'
import moment from 'moment'
import style from './style.css'
import { filters as featureTypeOptions } from '../../settings/options'
import settings from '../../settings/settings'
import themes from '../../settings/themes'

class Legend extends Component {
  state = {}

  render() {
    const { showHighlighted, featureType, theme }  = this.props
    const featureTypeDescription = featureTypeOptions.find(f => f.id === featureType).description
    const { aggregatedFill, highlightFill } = themes[theme]['styles'][featureType]

    const aggregatedStyle = { backgroundColor: aggregatedFill, borderColor: aggregatedFill }
    const builtupStyle =  { backgroundColor: "#666", borderColor: "#666" }

    var legendEntries = []
    if (true) {
      legendEntries.push(
        <li>
          <span
            style={{ backgroundColor: "green" }}
            className='legend-icon' />
          high osm building completeness
        </li>,
        <li>
          <span
            style={{ backgroundColor: "red" }}
            className='legend-icon' />
          low osm building completeness
        </li>,
      )
    } else {
      if (this.props.zoom > 13) {
        legendEntries.push(
          <li>
            <span
              style={aggregatedStyle}
              className={'legend-icon feature '+featureType} />
            {featureTypeDescription}
          </li>,
          <li>
            <span
              style={builtupStyle}
              className={'legend-icon feature '+featureType} />
            built-up area
          </li>
        )
      } else {
        legendEntries.push(
          <li>
            <span style={aggregatedStyle} className={'legend-icon high '+featureType}></span>
            High density of {featureTypeDescription.toLowerCase()}</li>,
          <li>
            <span style={aggregatedStyle} className={'legend-icon mid '+featureType}></span>
            Medium density of {featureTypeDescription.toLowerCase()}</li>,
          <li>
            <span style={aggregatedStyle} className={'legend-icon low '+featureType}></span>
            Low density of {featureTypeDescription.toLowerCase()}</li>
        )
        legendEntries.push(
          <li>
            <span style={builtupStyle} className={'legend-icon high '}></span>
            High percentage of buit-up area</li>,
          <li>
            <span style={builtupStyle} className={'legend-icon mid '}></span>
            Medium percentage of buit-up area</li>,
          <li>
            <span style={builtupStyle} className={'legend-icon low '}></span>
            Low percentage of buit-up area</li>
        )
      }
    }
    return (
      <ul id="legend" style={themes[theme].legend}>
        <li><h3>Map Legend</h3></li>
        {legendEntries}
        <li>Last Data Update: {this.state.lastModified
        ? <span title={this.state.lastModified}>{moment(this.state.lastModified).fromNow()}</span>
        : ''
        }</li>
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
