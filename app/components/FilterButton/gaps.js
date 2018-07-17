import React, { Component } from 'react'
import DropdownButton from '../DropdownButton'
import { gapsFilters } from '../../settings/options'


class GapsFilterButton extends Component {
  render() {
    var btn = <button className='filter' title='Select Gap Analysis'>{gapsFilters.find(filter => filter.name === this.props.enabledFilters[0]).title}&ensp;▾</button>
    return (
      <DropdownButton
        options={gapsFilters.map(layer => ({ id: layer.name, description: layer.title }))}
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
