import React, { Component } from 'react'
import { Link } from 'react-router'
import style from './style.css'

class Header extends Component {
  render() {
    return (
      <header>
        <h1>OpenStreetMap Analytics <sup className="beta">beta</sup></h1>
        <ul>
          <li><Link to="/" className="link" activeClassName="active">Analysis Map</Link></li>
          <li><Link to="/gaps" className="link" activeClassName="active">Gap Detection</Link></li>
          <li><Link to="/about" className="link" activeClassName="active">About</Link></li>
        </ul>
      </header>
    )
  }
}

export default Header
