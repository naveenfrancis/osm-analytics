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
    const styles = themes[theme].getStyle(layer)

    function transformStyle(glStyle) {
      var cssStyle = {}
      if (glStyle["fill-color"])
        cssStyle.backgroundColor = glStyle["fill-color"]
      if (glStyle["fill-outline-color"])
        cssStyle.borderColor = glStyle["fill-outline-color"]
      if (glStyle["line-color"])
        cssStyle.borderColor = glStyle["line-color"]
      return cssStyle
    }


    const aggregatedStyle = transformStyle(styles["aggregated"])
    const rawStyle = transformStyle(styles["raw"])
    const highligthStyle =  transformStyle(styles["aggregated-highlight"])
    const rawHighligthStyle = transformStyle(styles["raw-highlight"])

    var legendEntries = []
    if (this.props.zoom > 13) {
      legendEntries.push(<li>
        <span
          style={rawStyle}
          className={'legend-icon feature '+layer.render.type} />
        {layer.title}
        </li>)
      if (showHighlighted === true) {
        legendEntries.push(<li>
          <span
            style={rawHighligthStyle}
            className={'legend-icon feature highlight '+layer.render.type}></span>
          Highlighted {layer.title.toLowerCase()}
        </li>)
      }
    } else {
      legendEntries.push(
        <li>
          <span style={aggregatedStyle} className={'legend-icon high '+layer.name}></span>
          High density of {layer.title.toLowerCase()}</li>,
        <li>
          <span style={aggregatedStyle} className={'legend-icon mid '+layer.name}></span>
          Medium density of {layer.title.toLowerCase()}</li>,
        <li>
          <span style={aggregatedStyle} className={'legend-icon low '+layer.name}></span>
          Low density of {layer.title.toLowerCase()}</li>
      )
      if (showHighlighted === true) {
        legendEntries.push(<li>
          <span style={highligthStyle} className={'legend-icon highlight '+layer.name}></span>
          Area with mostly highlighted {layer.title.toLowerCase()}</li>)
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
    this.updateLastModified(this.props.layer.name)
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.layer.name !== this.props.layer.name) {
      this.updateLastModified(nextProps.layer.name)
    }
  }

  updateLastModified(layerName) {
    request.head(settings['vt-source']+'/'+layerName+'/0/0/0.pbf').end((err, res) => {
      if (!err) this.setState({
        lastModified: res.headers['last-modified']
      })
    })
  }

}

export default Legend
