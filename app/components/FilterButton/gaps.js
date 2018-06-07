import React, { Component } from 'react'
import DropdownButton from '../DropdownButton'
import { gapsFilters } from '../../settings/options'


class GapsFilterButton extends Component {
  render() {
    var btn = <button className='filter' title='Select Gap Analysis'>{gapsFilters.find(filter => filter.id === this.props.enabledFilters[0]).description}&ensp;▾</button>
    return (
      <DropdownButton
        options={gapsFilters.filter(f => !f.hidden)}
        btnElement={btn}
        multiple={false}
        selectedKeys={this.props.enabledFilters}
        onSelectionChange={::this.handleDropdownChanges}
      />
    )
  }

  handleDropdownChanges(selectedFilters) {
    var enabledFilters = this.props.enabledFilters
    selectedFilters.filter(filter => enabledFilters.indexOf(filter) === -1).map(this.props.enableFilter)
    enabledFilters.filter(filter => selectedFilters.indexOf(filter) === -1).map(this.props.disableFilter)
  }
}


export default GapsFilterButton
