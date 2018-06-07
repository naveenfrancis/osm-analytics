export default ({ aggregatedFill, highlightFill, outline }) => [
  {
    id: 'builtup-raw',
    paint: {
      'fill-color': aggregatedFill,
      'fill-opacity': 1,
      'fill-outline-color': outline
    }
  },
  {
    id: 'builtup-aggregated-0',
    paint: {
      'fill-color': aggregatedFill,
      'fill-antialias': false,
      'fill-opacity': {
        base: 1,
        stops: [[10, 0.1], [13, 1.0]]
      }
    }
  },
  {
    id: 'builtup-aggregated-1',
    paint: {
      'fill-color': aggregatedFill,
      'fill-antialias': false,
      'fill-opacity': {
        base: 1,
        stops: [[8, 0.1], [11, 1.0], [13, 1.0]]
      }
    }
  },
  {
    id: 'builtup-aggregated-2',
    paint: {
      'fill-color': aggregatedFill,
      'fill-antialias': false,
      'fill-opacity': {
        base: 1,
        stops: [[6, 0.1], [9, 1.0], [13, 1.0]]
      }
    }
  },
  {
    id: 'builtup-aggregated-3',
    paint: {
      'fill-color': aggregatedFill,
      'fill-antialias': false,
      'fill-opacity': {
        base: 1,
        stops: [[4, 0.1], [7, 1.0], [13, 1.0]]
      }
    }
  },
  {
    id: 'builtup-aggregated-4',
    paint: {
      'fill-color': aggregatedFill,
      'fill-antialias': false,
      'fill-opacity': {
        base: 1,
        stops: [[2, 0.1], [5, 1.0], [13, 1.0]]
      }
    }
  },
  {
    id: 'builtup-aggregated-5',
    paint: {
      'fill-color': aggregatedFill,
      'fill-antialias': false,
      'fill-opacity': {
        base: 1,
        stops: [[0, 0.1], [3, 1.0], [13, 1.0]]
      }
    }
  },
  {
    id: 'builtup-aggregated-6',
    paint: {
      'fill-color': aggregatedFill,
      'fill-antialias': false,
      'fill-opacity': {
        base: 1,
        stops: [[0, 1.0], [13, 1.0]]
      }
    }
  }
]
