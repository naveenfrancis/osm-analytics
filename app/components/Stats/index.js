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
import HotOverlaySelector from '../HotOverlaySelector'
import Histogram from './chart'
import ContributorsModal from './contributorsModal'
import regionToCoords from '../Map/regionToCoords'
import searchHotProjectsInRegion from './searchHotProjects'
import searchFeatures from './searchFeatures'
import { filters } from '../../settings/options'
import unitSystems from '../../settings/unitSystems'
import style from './style.css'


const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(60,60,60, 0.5)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '350px',
    maxWidth: '512px',
    minWidth: '256px',
    borderRadius: '4px',
    paddingTop: '25px',
    paddingBottom: '35px',
    paddingLeft: '35px',
    paddingRight: '35px'
  }
}

class Stats extends Component {
  state = {
    features: [],
    hotProjects: [],
    hotProjectsModalOpen: false,
    updating: false
  }

  render() {
    var features = this.state.features

    // apply time and experience filters
    features.forEach(filter => {
      // do not override!
      filter.highlightedFeatures = filter.features.filter(feature =>
        this.props.stats.timeFilter === null
        || (
          feature.properties._timestamp >= this.props.stats.timeFilter[0]
          && feature.properties._timestamp <= this.props.stats.timeFilter[1]
        )
        || (
          feature.properties._timestampMax >= this.props.stats.timeFilter[0]
          && feature.properties._timestampMin <= this.props.stats.timeFilter[1]
        )
      ).filter(feature =>
        this.props.stats.experienceFilter === null
        || (
          feature.properties._userExperience >= this.props.stats.experienceFilter[0]
          && feature.properties._userExperience <= this.props.stats.experienceFilter[1]
        )
        || (
          feature.properties._userExperienceMax >= this.props.stats.experienceFilter[0]
          && feature.properties._userExperienceMin <= this.props.stats.experienceFilter[1]
        )
      )
    })

    // calculate number of contributors
    var contributors = {}
    features.forEach(filter => {
      filter.highlightedFeatures.forEach(f => {
        contributors[f.properties._uid] = (contributors[f.properties._uid] || 0) + 1
      })
    })
    contributors = Object.keys(contributors).map(uid => ({
      uid: uid,
      contributions: contributors[uid]
    })).sort((a,b) => b.contributions - a.contributions)
    var numContributors = contributors.length
    if (numContributors === 1 && contributors[0].uid === "undefined") {
      // on the low zoom levels we don't have complete data, and estimating this number from a sample is tricky. maybe Good-Turing estimation could be used here? see https://en.wikipedia.org/wiki/Good%E2%80%93Turing_frequency_estimation
      numContributors = null
    }

    var timeFilter = ''
    if (this.props.stats.timeFilter) {
      timeFilter = (
        <span className="descriptor">{moment.unix(this.props.stats.timeFilter[0]).format('YYYY MMMM D')} – {moment.unix(this.props.stats.timeFilter[1]).format('YYYY MMMM D')}</span>
      )
    }

    // todo: loading animation if region is not yet fully loaded
    return (
      <div id="stats" className={this.state.updating ? 'updating' : ''}>
        <ul className="metrics">
          <li>
            <OverlayButton enabledOverlay={this.props.map.overlay} {...this.props.actions} {...this.props.statsActions}/>
            {timeFilter}
          </li>
        {features.map(filter => {
          return (<li key={filter.filter} title={filters.find(f => f.id === filter.filter).altText}>
            <span className="number">{
              numberWithCommas(Number((filter.filter === 'highways' || filter.filter === 'waterways'
                ? unitSystems[this.props.stats.unitSystem].distance.convert(
                  filter.highlightedFeatures.reduce((prev, feature) => prev+(feature.properties._length || 0.0), 0.0)
                )
                : filter.highlightedFeatures.reduce((prev, feature) => prev+(feature.properties._count || 1), 0))
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
            <span className="number">{this.state.hotProjects.length > 0
            ? <a className="link" onClick={::this.openHotModal} target="_blank">{this.state.hotProjects.length}</a>
            : this.state.hotProjects.length
            }</span><br/>
            <HotOverlaySelector
              hotOverlayEnabled={this.props.map.hotOverlay}
              enableHotOverlay={this.props.actions.enableHotOverlay}
              disableHotOverlay={this.props.actions.disableHotOverlay}
            />
          </li>
          <li>
            <span className="number">{!numContributors
            ? numContributors === 0 ? '0' : <span title='select a smaller region (~city level) to see the exact number of contributors and get a list of the top contributors in that region'>many</span>
            : <a className="link" onClick={::this.openContributorsModal} target="_blank">{numberWithCommas(numContributors)}</a>
            }</span><br/><span className="descriptor">Contributors</span>
          </li>
        </ul>

	<div className="buttons">
          <button className="compare-toggle" onClick={::this.enableCompareView}>Compare Time Periods</button>
          <a href="#"><button className="close">Close</button></a>
        </div>

        <Modal
          isOpen={this.state.hotProjectsModalOpen}
          onRequestClose={::this.closeHotModal}
          style={modalStyles}>
          <h3>HOT Projects</h3>
          <a className="close-link" onClick={::this.closeHotModal}>x</a>
          <ul className="hot-projects">
          {this.state.hotProjects.map(p =>
            <li key={p.id}><a className="link" href={"http://tasks.hotosm.org/project/"+p.id}>{'#'+p.id+' '+p.properties.name}</a></li>
          )}
          </ul>
        </Modal>
        <ContributorsModal
          isOpen={this.state.contributorsModalOpen}
          onRequestClose={::this.closeContributorsModal}
          style={modalStyles}
          contributors={contributors}
        />

        <Histogram key={this.props.mode||'recency'} mode={this.props.mode||'recency'} data={
          features.reduce((prev, filter) => prev.concat(filter.features), [])
        }/>
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
    region = polygon(regionToCoords(region))
    this.setState({ updating: true, features: [] })
    var q = queue()
    filters.forEach(filter =>
      q.defer(searchFeatures, region, filter)
    )
    q.awaitAll(function(err, data) {
      if (err) throw err
      this.setState({
        features: data.map((d,index) => ({
          filter: filters[index],
          features: d.features
        })),
        updating: false
      })
    }.bind(this))
    const hotProjects = searchHotProjectsInRegion(region)
    this.setState({ hotProjects })
  }


  openHotModal() {
    this.setState({ hotProjectsModalOpen: true })
  }
  closeHotModal() {
    this.setState({ hotProjectsModalOpen: false })
  }
  openContributorsModal() {
    this.setState({ contributorsModalOpen: true })
  }
  closeContributorsModal() {
    this.setState({ contributorsModalOpen: false })
  }

  enableCompareView() {
    this.props.actions.setView('compare')
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
)(Stats)
