import { bboxPolygon, polygon, flip, simplify } from 'turf'
import * as request from 'superagent'
import superagentPromisePlugin from 'superagent-promise-plugin'
import 'promise'

export default function regionToCoords(region, latLngOrder) {
  var coords
  if (region.type === 'hot') {
    let projectId = region.id
    coords = request
    .get('https://tasks.hotosm.org/api/v1/project/'+projectId+'/aoi')
    .use(superagentPromisePlugin)
    .then(function(res) {
      let geometry = res.body
      if (geometry.type === 'MultiPolygon' && geometry.coordinates.length === 1) {
        return polygon(geometry.coordinates[0])
      } else {
        return {
          type: 'Feature',
          properties: {},
          geometry: geometry
        }
      }
    }).catch(function(err) {
      if (err.status == 404) {
        throw new Error('unknown hot project', projectId)
      } else {
        throw err
      }
    });
  } else if (region.type === 'bbox') {
    coords = bboxPolygon(region.coords)
  } else if (region.type === 'polygon') {
    coords = polygon([region.coords.concat([region.coords[0]])])
  } else {
    throw new Error('unknown region', region)
  }
  return Promise.resolve(coords).then(function(coords) {
    if (latLngOrder) {
      return flip(coords)
    } else {
      return coords
    }
  })
}
