import React, { Component } from 'react'
import themes from '../../settings/themes'
import style from './style.css'

class ThresholdSelector extends Component {
  state = {
    threshold: undefined
  }

  render() {
    const { theme }  = this.props
    return (
      <div className="slider-box" style={themes[theme].thresholdSelector}>
        <h3>Choose sensitivity</h3>
        <span>high</span> <input
          type="range"
          min={this.props.min}
          max={this.props.max}
          step="any"
          defaultValue={this.props.defaultThreshold}
          onChange={::this.handleChange}
        /> <span>low</span>
      </div>
    )
  }

  handleChange(event) {
    const newThreshold = event.target.value
    this.setState({threshold: newThreshold})
    this.props.thresholdChanged(newThreshold)
  }

}

export default ThresholdSelector
