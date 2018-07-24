osm-analytics: data analysis tool frontend
=========================================

[![Join the chat at https://gitter.im/hotosm/osm-analytics](https://badges.gitter.im/hotosm/osm-analytics.svg)](https://gitter.im/hotosm/osm-analytics?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

OSM-Analytics lets you analyse interactively how specific OpenStreetMap features are mapped in a specific region.

Say, you'd like to know when most of a specific feature type (e.g. buildings) in a specific country or city were added. This tool lets you select the geographical region of interest and shows a graph of the mapping activity in the region. You can even select a specific time interval to get the number of touched features in that period, and the map will highlight the matching features. Alternatively, one can view the distribution of features by their mapper's user experience. The tool also gives a side by side comparison of the map state at different points in time and lets you view which [HOT](https://hotosm.org/) projects may have included the mapping of a region.

Features
--------

* supported feature types: *buildings* (any closed osm way with a building tag), *roads* (any osm way with a highway tag), *rivers* (any osm way with a waterway tag)
* graphs of feature *recency* or *mapper experience*
* highlighting of features by custom date range or user experience interval
* calculated statistics: total number/length of features in selected region and date/experience range, number of contributors
* shows which hot projects influenced the mapping of the selected region
* compare map at different points in time
* data updated daily

Technical Overview
------------------

This is the OSM-Analytics user interface. See also the corresponding [backend](https://github.com/hotosm/osm-analytics-cruncher/) code.

The backend takes data from [osm-qa-tiles](http://osmlab.github.io/osm-qa-tiles/) and generates sets of vector tiles that contain only a specific set of features (e.g. builings). The vector tiles contain raw individual feature geometries at high zoom levels and an aggregated view at low zoom levels where features are aggregated into square bins.

The data from these vector tiles is used to display the features on the map and to generate the statistics (graphs, number of features, contributors, etc.) by intersecting the feature geometries with the user supplied area of interest using [turf](http://turfjs.org/).

Data Sampling
-------------

The aggregated bins contained in the lower zoom level vector tiles contain the absolute number (or total length for linear obejcts) of features in the respective cell which is used to display a basic *heatmap* style map. In addition to that, each cell contains a set of samples of the properties of the individual features that went into the respective cell (i.e. timestamp samples, user experience samples). This is necessary in order to limit the number of features to transfer to the browser.

These data samples represent the statistical distribution of the constituent data in each cell and allow one to reconstruct the distribution of the data in an arbitrary region. They also allow one to extrapolate the number of features that fall into an given property interval (e.g. a date range).

User Experience
---------------

Each feature is assigned a *user experience value* that estimates the contributor's experience in mapping the respective type of feature by looking at the total number (or length) of features that have currently been last edited by this user. For example, a user that has contributed many buildings but hardly any roads gets assigned a large score for buildings but a low one for buildings.

In the UI, this data is then displayed on a logarithmic scale histogram, displaying how many features have been added by users of different experience levels (beginners, intermediate users, experts).

Limitations
-----------

### OSM History

All data in this tool is based only derived from current OSM planet data (it doesn't incorporate the full history data), which means that deleted features as well as modifications of features are not incorporated in the analysis. This introduces an incalculable systematic error into any of the generated statistics (except totals such as the number of buildings in a region). This means that when interpreting the graphs and statistics one has to keep in mind that the data only represents the *latest modification* status of each object.

This issue could be fixed completely by taking the full history OSM planet data into account (which is [non-trivial](http://www.mdpi.com/2220-9964/5/3/37), unfortunately).

### Binning

The data binning at low zoom levels and it's inherent data sampling (see above) introduces both a geometric coarsening (a grid cell is either included as a whole in the selected region or not at all) and a statistical approximation of all generated values. The statistical error depends on the number of features in the affected region and time/experience interval, but for typical scenarios the relative error of totals should be below 1%.

### Multipolygons

The input data from [osm-qa-tiles](http://osmlab.github.io/osm-qa-tiles/) currently doesn't support multipolygon relations, which means that for example buildings that are mapped as a multipolygon relation are missing in the analysis and map view.

Installation and Usage
----------------------

The frontend is implemented in React/Redux and based on [tj/Frontend Boilerplate](https://github.com/tj/frontend-boilerplate).

Install dependencies:

```
$ npm install
```

Run in development mode:

```
$ npm start
```

Generate static build:

```
$ npm run build
```

Embedding
---------

This user interface supports a custom UI for embedding on 3rd party websites, using an HTML `iframe`. It allows generating a
time comparison between two points in time for the same region.

![Comparison map](https://github.com/GFDRR/osm-analytics/blob/master/documentation/embed-example-1.png?raw=true "Comparison map")


The above visualization can be generated using a specific URL structure:

`https://osm-analytics.org/#/compare/<region>/<default_start_year>...<default_end_year>/<default_feature_type>/embed/<theme_name>`

- __iframe_base_url__ (`http://osm-analytics.org`)
- __region__ the area of interest the embedded map is shown for. Can be a bounding box (`bbox:110.28050,-7.02687,110.48513,-6.94219`), an [encoded polyline](https://www.npmjs.com/package/@mapbox/polyline) of a polygon (e.g. `polygon:ifv%7BDndwkBx%60%40aYwQev%40sHkPuf%40ss%40%7BfA_%40uq%40xdCn%7D%40%5E`)), or a hot project id (e.g. `hot:4053`)
- __default_start_year__ (`2016`) represents the start year of an OpenDRI project
- __default_end_year__ (`now`) represents the end year of an OpenDRI project. `now` can also be provided to compare with latest OSM data
- __default_feature_type__ (`buildings`) compare `buildings`, `highways` or `waterways`
- __theme_name__ (`default`) use the `default` OSM Analytics visual style, or the `opendri` theme

The *gap detection* view can also be used as an embedded map in a very similar way:

`https://osm-analytics.org/#/gaps/<region>/buildings-vs-ghs/embed/<theme_name>`


See Also
--------

* [lukasmartinelli/osm-activity](https://github.com/lukasmartinelli/osm-activity) – similar to OSM-Analytics, but with a simpler, more basic user interface
* [OSMatrix](http://wiki.openstreetmap.org/wiki/OSMatrix) by GIScience Heidelberg – "precursor" of OSM-Analytics
* [joto/taginfo](https://github.com/joto/taginfo) – aggregate statistics for all OSM tags
* [tyrasd/taghistory](https://github.com/tyrasd/taghistory) – tagging history for all OSM tags
* [Crowdlens](http://stateofthemap.us/2016/learning-about-the-crowd/) by Sterling Quinn – prototype of interactive mapping history visualization
* [mapbox/osm-analysis-collab](http://mapbox.github.io/osm-analysis-collab/osm-quality.html) – misc OSM contributor analyses based on osm-qa-tiles data
