import { inside } from 'turf'
import hotProjects from '../../data/hotprojects.js'

export default function searchHotProjectsInRegion(region) {
  return hotProjects().features
    .filter(project => inside(project, region))
}
