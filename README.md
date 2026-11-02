# WFOLC Interactive Map

An interactive map of the White Family Outdoor Learning Center, with aerial imagery, terrain, contours, site features, research equipment, and contact details. All map assets are included in this repository; the site runs without a map-service API key or build step.

## Open locally

Serve the `dist` directory with any static web server. For example:

```sh
python3 -m http.server 8765 --directory dist
```

Then open `http://localhost:8765`.

## Publish on GitHub Pages

The included workflow publishes `dist` when changes reach `main`. In the repository, open **Settings → Pages** and select **GitHub Actions** as the source if it is not already configured. The repository's Pages settings show the live URL after deployment.

## Update contacts

Edit **`dist/data/contacts.json`**. `directory` stores names and email addresses, `assignments` connects individual asset IDs to contacts, and `layerContacts` assigns the VMS components and NP wells together.

- Daniella Rempe: VMS control panel, all VMS installation components, and NP wells.
- Marcus Gary: Longhole Well, the north-entrance non-potable well, and the mapped upstream creek gauge (R07).
- Michael Young: TxSON/NiSAR sites R01–R03.
- Ashley Matheny: flux tower R06 and sap-flow trees R10–R13.
- Tim Keitt: bird-listening station R09.

The first two assignments reflect Daniella Rempe's instructions. The other project leads come from the provided instrumentation inventory. Equipment without a listed contact remains marked **Not yet listed**. The proposed weir R08 is kept distinct from the existing stream gauge; a project lead has not been assigned to that proposal. The southern monitoring well R14 is kept distinct from the NP wells.

Public university contact pages are retained as `source` links in the directory. No email address is inferred. Mail links open the visitor's email application; this site does not send email itself.

## Map files

- `dist/data/map-data.json`: equipment geometry, boundaries, routes, facilities, and imagery extents.
- `dist/data/lidar-contours-2024.geojson`: 1 m contours with a 5 m index, derived from the 2024 ground model.
- `dist/data/topography-source.json`: lidar source, licence, dates, coordinate systems, download links, and processing details.
- `dist/assets`: bundled aerial, southern detail, terrain, and broader overview images.
- `dist/vendor/leaflet`: Leaflet 1.9.4 and Leaflet.markercluster 1.5.3, with original licenses.
- `dist/app.js` and `dist/styles.css`: map behavior and presentation.

Imagery and vectors are derived from the supplied WFOLC GIS package. NAIP aerial imagery was acquired on June 8, 2022; the broader overview is resampled for web display. Southern Google imagery comes from the supplied 0.30 m pixel clip; its acquisition date was not provided. Terrain and contours use the January 2024 TxGIO Hays & Williamson Counties lidar-derived bare-earth elevation model (1 m cells), clipped to the property plus a 100 m buffer. The earlier USGS 3DEP terrain and supplied contours have been replaced on the interactive map. Images are reprojected to Web Mercator for alignment in the browser. The 1 m contours retain a 5 m index.

All 14 NP well records are retained, including WP-01 and WP-14 at the same source coordinate. Clustering allows overlapping markers to be separated at maximum zoom; equipment search also selects either record directly. VMS geometry represents the plan-view projection of inclined subsurface equipment; vertical depths are retained in the equipment cards.

The website publishes only the map fields used by the interface. Original source descriptions, gate codes, instrument serials, costs, and administrative documents are not included.

Arial is the interface and map label font, with Helvetica and system sans-serif fallbacks. The page is responsive, supports keyboard navigation, and respects reduced-motion preferences.

## Branding and site features

The header uses the unmodified official RGB_formal_Jackson.png supplied by the Jackson School of Geosciences Office of Communications at https://utexas.box.com/v/jackson-school-logos (Digital JPEG and PNG / RGB folder). The mountain symbol is no longer used.

Active research infrastructure and proposed research infrastructure have separate layer controls and symbols. A record is proposed when its status or name identifies it as proposed; proposed records are excluded from the active research layer. The supplied inventory identifies R08 as the proposed weir. Contact assignments are unchanged.

Labeled site features are visible by default, including Lake Dianne and all other mapped facilities and landmarks. Labels appear as space and zoom permit; all feature names remain available by clicking, hovering, or searching. Label placement avoids overlaps and map controls.

A search of the public Texas imagery catalog on October 30, 2026 identified the 2018 CapArea & McLennan collection with 6-inch (0.1524 m) imagery across Hays County, CC0-1.0. The public catalog download server returned a CloudFront 403 error, and the original download host was unavailable. No replacement image could be retrieved and verified. Existing 2022 NAIP and supplied Google imagery are retained. Catalog: https://data.geographic.texas.gov/collection/22493b55-6c57-4840-aa86-d59c54b00880 .

## Equipment data links

`assetLinks` in `dist/data/contacts.json` stores optional public data links by asset ID. R04 (Meadow Weather Station) links to the LI-COR dashboard supplied by Daniella Rempe, preserving its live one-month filter. The link opens in a new tab from the equipment detail card.

## Added site infrastructure

`dist/data/site-additions.geojson` contains later additions to the original map layers. Features use the same IDs, layer names, and contact registry as the base map.

Deep Well (PROPERTY_FEATURES_0024) was added at Daniella Rempe’s direction, approximately 0.75 m east of the existing Electric Pole, Breaker Panel, Pump House point (PROPERTY_FEATURES_0007). This placement is derived from the described relative location, not a surveyed well coordinate. Its contact is Marcus Gary. Its equipment card links to the supplied YouTube video at 22 seconds. The close detail zoom keeps this well distinguishable from the adjacent pump-house feature.

## Lidar topography

The terrain background and contour lines come from the same 2024 ground-elevation model, acquired January 10–29, 2024 for the TxGIO Hays & Williamson Counties lidar project. Fugro collected and processed the data; AECOM provided independent quality assurance. The publicly released DEM has 1 m cells in NAD83(2011) / UTM zone 14N, with NAVD88 (Geoid18) elevations in metres. The collection has a CC0-1.0 licence. The collection’s 50 cm nominal lidar point spacing is distinct from the 1 m DEM grid actually used here.

Coverage follows the union of the two supplied property parcels buffered by 100 m. All requested ground cells have valid source elevation. The four original source tiles are stratmap24-1m_3098563c1, 3098563c3, 3098554d2, and 3098554d4. Each tile and its original metadata were downloaded from the public Texas S3 archive and checked using the ZIP member CRC.

The background is multidirectional hillshade with a restrained elevation tint. It is reprojected to Web Mercator for the browser, preserving approximately 1 m ground pixel spacing and transparency outside the buffered property. Contours use a 1 m vertical interval and 5 m index; a 0.25 m horizontal simplification and 3 m minimum line length reduce insignificant raster contour fragments. Web coordinates are rounded to six decimal places. No vertical datum shift is applied.

Source catalog: https://api.tnris.org/api/v1/collections/91943379-ef06-490e-ac08-66bc98fa1ce8

QA/QC report: https://gisweb.wilco.org/drop/LidarandContour2024Project/Docmentation/580-24-SOW-0004_Final_Report_20240830.pdf

Archive URLs and exact processing parameters are retained in dist/data/topography-source.json. All equipment locations, contact assignments, and data/video links are preserved.
