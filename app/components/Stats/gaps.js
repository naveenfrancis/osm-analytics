import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Modal from 'react-modal'
import { polygon } from 'turf'
import { queue } from 'd3-queue'
import moment from 'moment'
import * as MapActions from '../../actions/map'
import * as StatsActions from '../../actions/stats'
import OverlayButton from '../OverlayButton'
import UnitSelector from '../UnitSelector'
import Histogram from './chart'
import ContributorsModal from './contributorsModal'
import HotProjectsModal from './hotProjectsModal'
import regionToCoords from '../Map/regionToCoords'
import searchHotProjectsInRegion from './searchHotProjects'
import searchFeatures from './searchFeatures'
import searchBuiltupAreas from './searchBuiltupAreas'
import { filters } from '../../settings/options'
import unitSystems from '../../settings/unitSystems'
import style from './style.css'

class GapsStats extends Component {
  state = {
    features: [],
    hotProjects: [],
    hotProjectsModalOpen: false,
    updating: false
  }

  render() {
    var features = this.state.features

    // todo: loading animation if region is not yet fully loaded
    return (
      <div id="gaps-stats" className={this.state.updating ? 'updating' : ''}>
        <ul className="metrics">
          <li><p>OSM</p></li>
        {features.map(filter => {
          return (<li key={filter.filter} title={filters.find(f => f.id === filter.filter).altText}>
            <span className="number">{
              numberWithCommas(Number((filter.filter === 'highways' || filter.filter === 'waterways'
                ? unitSystems[this.props.stats.unitSystem].distance.convert(
                  filter.features.reduce((prev, feature) => prev+(feature.properties._length || 0.0), 0.0)
                )
                : filter.features.reduce((prev, feature) => prev+(feature.properties._count || 1), 0))
              ).toFixed(0))
            }</span><br/>
            {filter.filter === 'highways' || filter.filter === 'waterways'
            ? <UnitSelector
                unitSystem={this.props.stats.unitSystem}
                unit='distance'
                suffix={' of '+filters.find(f => f.id === filter.filter).description}
                setUnitSystem={this.props.statsActions.setUnitSystem}
              />
            : <span className="descriptor">{filters.find(f => f.id === filter.filter).description}</span>
            }
          </li>)
        })}
          <li>
            <span className="number">{numberWithCommas(Math.round(this.state.builtupArea/10000))}</span><br/><span className="descriptor">hectare built-up area</span>
          </li>
          <li>
            <p><a href="http://ghsl.jrc.ec.europa.eu/ghs_bu.php">GHS</a></p>
          </li>
        </ul>

        <div className="buttons">
          <a href="#/gaps"><button className="close">Close</button></a>
        </div>

      </div>
    )
  }

  componentDidMount() {
    if (this.props.map.region) {
      ::this.update(this.props.map.region, this.props.map.filters)
    }
  }

  componentWillReceiveProps(nextProps) {
    // check for changed map parameters
    if (nextProps.map.region !== this.props.map.region
      || nextProps.map.filters !== this.props.map.filters) {
      ::this.update(nextProps.map.region, nextProps.map.filters)
    }
  }

  update(region, filters) {
    regionToCoords(region)
    .then((function(region) {
      this.setState({ updating: true, features: [] })
      var q = queue()
      filters.forEach(filter =>
        q.defer(searchFeatures, region, filter)
      )
      q.defer(searchBuiltupAreas, region)
      q.awaitAll(function(err, data) {
        if (err) throw err
        this.setState({
          features: data.slice(0, -1).map((d,index) => ({
            filter: filters[index],
            features: d.features
          })),
          builtupArea: data.slice(-1),
          updating: false
        })
      }.bind(this))
      const hotProjects = searchHotProjectsInRegion(region)
      this.setState({ hotProjects })
    }).bind(this));
  }
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function mapStateToProps(state) {
  return {
    map: state.map,
    stats: state.stats
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(MapActions, dispatch),
    statsActions: bindActionCreators(StatsActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GapsStats)
