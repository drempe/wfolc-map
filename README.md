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

- `dist/data/map-data.json`: equipment geometry, boundaries, routes, facilities, contours, and imagery extents.
- `dist/assets`: bundled aerial, southern detail, terrain, and broader overview images.
- `dist/vendor/leaflet`: Leaflet 1.9.4 and Leaflet.markercluster 1.5.3, with original licenses.
- `dist/app.js` and `dist/styles.css`: map behavior and presentation.

Imagery and vectors are derived from the supplied WFOLC GIS package. NAIP aerial imagery was acquired on June 8, 2022; the broader overview is resampled for web display. Southern Google imagery comes from the supplied 0.30 m pixel clip; its acquisition date was not provided. Terrain is derived from USGS 3DEP and contours from White_contours_bh.kmz. Images are reprojected to Web Mercator for alignment in the browser. The 1 m contours retain a 5 m index.

All 14 NP well records are retained, including WP-01 and WP-14 at the same source coordinate. Clustering allows overlapping markers to be separated at maximum zoom; equipment search also selects either record directly. VMS geometry represents the plan-view projection of inclined subsurface equipment; vertical depths are retained in the equipment cards.

The website publishes only the map fields used by the interface. Original source descriptions, gate codes, instrument serials, costs, and administrative documents are not included.

Times New Roman is the preferred interface font, with system serif fallbacks. The page is responsive, supports keyboard navigation, and respects reduced-motion preferences.
