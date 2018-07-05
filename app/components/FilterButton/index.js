import React, { Component } from 'react'
import DropdownButton from '../DropdownButton'


class FilterButton extends Component {
  render() {
    var btn = <button className='filter' title='Select Map Features'>{this.props.layers.find(layer => layer.name === this.props.enabledFilters[0]).title}&ensp;▾</button>
    return (
      <DropdownButton
        options={this.props.layers.map(layer => ({ id: layer.name, description: layer.title }))}
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


export default FilterButton
