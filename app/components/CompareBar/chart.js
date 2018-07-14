import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import vg from 'vega'
import { debounce } from 'lodash'
import * as MapActions from '../../actions/map'
import { compareTimes as timeOptions } from '../../settings/options'

class Timegraph extends Component {
  state = {
    vis: null
  }

  componentDidMount() {
    const { before, after } = this.props

    this.initGraph(before, after)
  }

  initGraph(before, after) {
    const spec = this._spec(before, after)

    vg.parse.spec(spec, chart => {
      const vis = chart({
        el: this.refs.chartContainer,
        renderer: 'svg'
      })

      // initialize graph data
      this.props.layers.forEach(filter => {
        vis.data(filter.name+'_data').insert([])
      })
      vis.update()

      vis.onSignal('before_drag', debounce(::this.setBeforeAfter, 200));
      vis.onSignal('after_drag', debounce(::this.setBeforeAfter, 200));

      const _prevWindowOnresize = window.onresize
      window.onresize = function(...args) {
        _prevWindowOnresize && _prevWindowOnresize.apply(this, args)
        vis.width(window.innerWidth-90).update()
      }
      vis.width(window.innerWidth-90).update()

      this.setState({ vis })
    })
  }

  setBeforeAfter(signal, value) {
    // search nearest snapshot to dragged timestamp
    var nearestDist = Infinity
    var nearest
    timeOptions.forEach(timeOption => {
      let dist = Math.abs(timeOption.timestamp - value)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = timeOption.id
      }
    })
    var newTimes = this.props.map.times.slice()
    if (signal === 'before_drag') {
      newTimes[0] = nearest
    }
    if (signal === 'after_drag') {
      newTimes[1] = nearest
    }
    this.props.actions.setTimes(newTimes)
  }


  componentDidUpdate() {
    const { vis } = this.state
    const { data, before, after } = this.props

    if (vis) {
      // update data in case it changed
      this.props.layers.forEach(filter => {
        vis.data(filter.name+'_data').remove(() => true).insert(data[filter.name] && data[filter.name].filter(x => x) || [])
      })
      // update before/after drag markers
      let beforeTimestamp = +timeOptions.find(timeOption => timeOption.id === before).timestamp
      if (vis.signal('before_drag') !== beforeTimestamp) {
        vis.signal('before_drag', beforeTimestamp)
      }
      let afterTimestamp = +timeOptions.find(timeOption => timeOption.id === after).timestamp
      if (vis.signal('after_drag') !== afterTimestamp) {
        vis.signal('after_drag', afterTimestamp)
      }
      vis.update()
    }
  }

  render() {
    return (
      <div ref="chartContainer" className="chart"/>
    )
  }


  _spec(before, after) {
    const filters = this.props.layers.map(filter => filter.name)
    var styleSpec = {
      "width": 1e6,
      "height": 90,
      "padding": {"top": 20, "left": 40, "bottom": 30, "right": 5},

      "signals": [{
        "name": "before_drag",
        "init": +timeOptions.find(timeOption => timeOption.id === before).timestamp,
        "streams": [{
          "type": "@before:mousedown, [@before:mousedown, window:mouseup] > window:mousemove",
          "expr": "iscale('x', clamp(eventX(), 0, width))"
        }]
      }, {
        "name": "after_drag",
        "init": +timeOptions.find(timeOption => timeOption.id === after).timestamp,
        "streams": [{
          "type": "@after:mousedown, [@after:mousedown, window:mouseup] > window:mousemove",
          "expr": "iscale('x', clamp(eventX(), 0, width))"
        }]
      }],

      "data": [],
      "scales": [
        {
          "name": "x",
          "type": "time",
          "range": "width",
          "domainMin": +(timeOptions[0].timestamp),
          "domainMax": +(timeOptions[timeOptions.length-1].timestamp)
        }
      ],
      "axes": [
        {
          "type": "x",
          "scale": "x",
          "tickSizeEnd": 0,
          "properties": {
             "axis": {
               "stroke": {"value": "#C2C2C2"},
               "strokeWidth": {"value": 1}
             },
             "ticks": {
               "stroke": {"value": "#C2C2C2"}
             },
             "majorTicks": {
               "strokeWidth": {"value": 2}
             },
            "labels": {
              "fontSize": {"value": 14},
              "fill": {"value": "#BCBCBC"}
            }
          }
        }
      ],
      "marks": [{
        "name": "before",
        "type": "rect",
        "properties": {
          "enter": {
            "fill": {"value": "#BCE3E9"},
            "fillOpacity": {"value": 1},
            "stroke": {"value": "#000"},
            "strokeWidth": {"value": 15},
            "strokeOpacity": {"value": 0.0},
            "cursor": {"value": "ew-resize"}
          },
          "update": {
            "x": {"scale": "x", "signal": "before_drag"},
            "width": {"value": 3},
            "y": {"value": 30-8},
            "height": {"value": 70+2*8}
          }
        }
      }, {
        "name": "after",
        "type": "rect",
        "properties": {
          "enter": {
            "fill": {"value": "#BCE3E9"},
            "fillOpacity": {"value": 1},
            "stroke": {"value": "#000"},
            "strokeWidth": {"value": 15},
            "strokeOpacity": {"value": 0.0},
            "cursor": {"value": "ew-resize"}
          },
          "update": {
            "x": {"scale": "x", "signal": "after_drag"},
            "width": {"value": 3},
            "y": {"value": 30-8},
            "height": {"value": 70+2*8}
          }
        }
      }]
    }

    styleSpec.data = filters.map(filter => ({
      "name": filter+"_data",
      "format": {"type": "json", "parse": {"day": "date"}}
    }))
    styleSpec.scales = styleSpec.scales.concat(
      filters.map(filter => ({
        "name": filter+"_y",
        "type": "linear",
        "range": "height",
        "domain": {"data": filter+"_data", "field": "value"}
      }))
    )
    styleSpec.marks = styleSpec.marks.concat(filters.map(filter => ({
      "type": "line",
      "from": {"data": filter+"_data"},
      "properties": {
        "enter": {
          "interpolate": {"value": "cardinal"},
          "tension": {"value": 0.8},
          "stroke": {"value": "#FDB863"},
          "strokeWidth": {"value": 2}
        },
        "update": {
          "x": {"scale": "x", "field": "day"},
          "y": {"scale": filter+"_y", "field": "value"}
        }
      }
    })),
    filters.map(filter => ({
      "name": filter,
      "type": "symbol",
      "from": {"data": filter+"_data"},
      "properties": {
        "enter": {
          "stroke": {"value": "#FDB863"},
          "fill": {"value": "#4B5A6A"},
          "size": {"value": 30}
        },
        "update": {
          "x": {"scale": "x", "field": "day"},
          "y": {"scale": filter+"_y", "field": "value"}
        }
      }
    })),
    filters.map(filter => ({
      "type": "text",
      "properties": {
        "enter": {
          "align": {"value": "right"},
          "fill": {"value": "#BCBCBC"}
        },
        "update": {
          "x": {"scale": "x", "signal": filter+"_tooltip.day", "offset": -8},
          "y": {"scale": filter+"_y", "signal": filter+"_tooltip.value", "offset": -5},
          "text": {"signal": filter+"_tooltipText"},
          "fillOpacity": [
            { "test": "!"+filter+"_tooltip._id",
              "value": 0
            },
            {"value": 1}
          ]
        }
      }
    })))

    styleSpec.signals = styleSpec.signals.concat(filters.map(filter => ({
      "name": filter+"_tooltip",
      "init": {},
      "streams": [
        {"type": "@"+filter+":mouseover", "expr": "datum"},
        {"type": "@"+filter+":mouseout", "expr": "{}"}
      ]
    })))
    styleSpec.signals = styleSpec.signals.concat(filters.map(filter => ({
      "name": filter+"_tooltipText",
      "init": {},
      "streams": [
        {"type": filter+"_tooltip", "expr": "round("+filter+"_tooltip.value)"}
      ]
    })))

    return styleSpec
  }

}


function mapStateToProps(state) {
  return {
    map: state.map,
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
)(Timegraph)
