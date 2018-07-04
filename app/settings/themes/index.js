import defaultTheme from './default'
import odriTheme from './opendri'

const themePrototype = {
  getStyle: function(layer) {
    if (this.layerStyles[layer.name] !== undefined)
      return this.layerStyles[layer.name]
    else
      return layer.render.defaultStyle
  },
  getGlLayerStyle: function(layer, glLayer) {
    const style = this.getStyle(layer)
    var isHighlightLayer = glLayer.id.indexOf('-highlight') !== -1
    var isRawLayer = glLayer.id.indexOf('-raw') !== -1
    switch (true) {
      case !isHighlightLayer && isRawLayer:
        return style["raw"]
      case isHighlightLayer && isRawLayer:
        return style["raw-highlight"]
      case !isHighlightLayer && !isRawLayer:
        return style["aggregated"]
      case isHighlightLayer && !isRawLayer:
        return style["aggregated-highlight"]
    }
  }
}

Object.setPrototypeOf(defaultTheme, themePrototype)
Object.setPrototypeOf(odriTheme, themePrototype)

export default {
  default: defaultTheme,
  opendri: odriTheme
}
