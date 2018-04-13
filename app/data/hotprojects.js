import * as request from 'superagent'

var hotprojects = null

export default function(callback) {
  if (hotprojects !== null) {
    return hotprojects
  } else {
    throw new Error('HotProjects data hasn\'t been loaded yet')
  }
}

export function load(callback) {
  if (hotprojects !== null) {
    return callback(null)
  }

  request
  .get('https://tasks.hotosm.org/api/v1/project/search')
  .end(function(err, res) {
    if (err) return callback(err)
    hotprojects = res.body.mapResults
    callback(null)
  })
}
