'use strict';
(async () => {
 const $ = id => document.getElementById(id);
 const state = { basemap:'aerial', selected:null, layers:{research:true,proposed:true,wells:true,vms:true,sensors:false,facilities:true,contours:true,access:true} };
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 const map = L.map('map',{attributionControl:false,zoomControl:false,minZoom:14,maxZoom:24,zoomSnap:.25,zoomDelta:1,preferCanvas:true,maxBoundsViscosity:.9});
 L.control.zoom({position:'bottomright'}).addTo(map);
 const load = $('load-status');
 try {
  const response = await fetch('data/map-data.json');
  if (!response.ok) throw new Error('Map data could not be loaded.');
  const data = await response.json();
  const contactResponse=await fetch('data/contacts.json');
  if(!contactResponse.ok)throw new Error('Contact directory could not be loaded.');
  const registry=await contactResponse.json();data.contacts=registry.directory;
  const collections = data.features;
  for(const [name,collection] of Object.entries(collections))for(const feature of collection.features){const p=feature.properties;p.contact=registry.assignments[p.id] || registry.layerContacts[name] || p.contact;}
  const allFeatures = [];
  const featuresById = new Map();
  const markers = new Map();
  const imageGroup = L.layerGroup().addTo(map);
  const accessGroup = L.layerGroup().addTo(map);
  const contourGroup = L.layerGroup().addTo(map);
  const vmsLineGroup = L.layerGroup().addTo(map);
  const selectionGroup = L.layerGroup().addTo(map);
  const featureGroup = L.layerGroup().addTo(map);
  map.createPane('siteBoundary'); map.getPane('siteBoundary').style.zIndex = 445;
  const clusters = L.markerClusterGroup({maxClusterRadius:33,showCoverageOnHover:false,spiderfyOnMaxZoom:true,zoomToBoundsOnClick:true,animate:!reduced,spiderfyDistanceMultiplier:1.6,iconCreateFunction: cluster => L.divIcon({html:`<span class="sr-only">Explore ${cluster.getChildCount()} installations</span><span class="cluster-count" aria-hidden="true">${cluster.getChildCount()}</span>`,className:'marker-cluster',iconSize:[40,40]}),polygonOptions:{weight:1,fillOpacity:.05}}).addTo(map);
  function announce(message){$('announce').textContent=message;}
  function isProposed(f){return /proposed/i.test(f.properties.status||'') || /proposed/i.test(f.properties.name);}
  function kind(f){const l=f.properties.layer;if(isProposed(f))return 'proposed';return l==='np_wells' || (l==='property_features' && /Well/i.test(f.properties.name)) ? 'well' : l==='vms_borehole_heads' ? 'vms' : l.startsWith('vms_') ? 'sensor' : l==='property_features' ? 'facility' : f.properties.status==='Proposed' ? 'proposed' : 'research';}
  function category(f){const l=f.properties.layer;if(isProposed(f))return 'proposed';return l==='research_installations'?'research':l==='np_wells'?'wells':l==='vms_borehole_heads'?'vms':l.startsWith('vms_')?'sensors':l==='property_features' && /Well/i.test(f.properties.name)?'wells':'facilities';}
  function makeIcon(f){return L.divIcon({html:`<span class="asset-glyph ${kind(f)}"></span>`,className:'asset-marker',iconSize:[32,32],iconAnchor:[16,16]});}
  function center(f){const g=f.geometry;if(g.type==='Point')return L.latLng(g.coordinates[1],g.coordinates[0]);return L.geoJSON(f).getBounds().getCenter();}
  function fit(view){map.stop();$('view-select').value=view;map.fitBounds(data.views[view],{padding:[35,35],maxZoom:view==='vms'?22:view==='wells'?21.5:20,animate:!reduced,duration:.5});}
  function showImages(){
   imageGroup.clearLayers();
   if(data.overview)L.imageOverlay(data.overview.file,data.overview.bounds,{interactive:false,zIndex:0}).addTo(imageGroup);
   const names=state.basemap==='terrain'?['terrain']:['aerial','detail'];
   names.forEach((name,i)=>L.imageOverlay(data[name].file,data[name].bounds,{interactive:false,zIndex:i+1}).addTo(imageGroup));
   contourGroup.eachLayer(layer=>layer.setStyle(f=>({color:state.basemap==='terrain'?(f.properties.index?'#79684b':'#9c8b6b'):(f.properties.index?'#f7dd91':'#fff4d4'),weight:f.properties.index?1.1:.5,opacity:state.basemap==='terrain'?.8:.75,interactive:false})));
  }
  function closeEquipment(){
   $('equipment-panel').hidden=true;document.body.classList.remove('equipment-open');
   const old=state.selected && markers.get(state.selected.properties.id);if(old?.getElement())old.getElement().classList.remove('selected');
   state.selected=null;selectionGroup.clearLayers();history.replaceState(null,'',location.pathname+location.search);
  }
  function closeLayers(){$('layers-panel').hidden=true;$('layers-button').setAttribute('aria-expanded','false');}
  function updateLayers(){
   clusters.clearLayers();
   allFeatures.filter(f=>f.geometry.type==='Point' && category(f)!=='facilities' && state.layers[category(f)]).forEach(f=>clusters.addLayer(markers.get(f.properties.id)));
   featureGroup.clearLayers();
   if(state.layers.facilities)allFeatures.filter(f=>f.geometry.type==='Point' && category(f)==='facilities').forEach(f=>featureGroup.addLayer(markers.get(f.properties.id)));
   updateFeatureLabels();
   state.layers.contours ? map.addLayer(contourGroup) : map.removeLayer(contourGroup);
   state.layers.access ? map.addLayer(accessGroup) : map.removeLayer(accessGroup);
   vmsLineGroup.clearLayers();
   if(state.layers.vms && map.getZoom()>=19) L.geoJSON(collections.vms_sleeves,{style:{color:'#744884',weight:3,opacity:.95},onEachFeature:bindLine}).addTo(vmsLineGroup);
   if(state.layers.sensors && map.getZoom()>=19) L.geoJSON(collections.vms_fracture_samplers,{style:{color:'#33869b',weight:6,opacity:.95},onEachFeature:bindLine}).addTo(vmsLineGroup);
  }
  function bindLine(f,layer){layer.bindTooltip(f.properties.name);layer.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e.originalEvent);selectFeature(f);});}
  function addSpec(label,value){const dt=document.createElement('dt');const dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;$('equipment-specs').append(dt,dd);}
  function selectFeature(f,{focus=false}={}){
   const old=state.selected && markers.get(state.selected.properties.id);old?.getElement()?.classList.remove('selected');
   state.selected=f;const p=f.properties;closeLayers();$('search-results').hidden=true;
   $('equipment-title').textContent=p.name.replace(/^R\d\d\s+/,'');
   const isSiteFeature=category(f)==='facilities';
   $('contact-section').hidden=isSiteFeature;
   $('zoom-equipment').textContent=isSiteFeature?'Zoom to feature':'Zoom to equipment';
   $('equipment-ref').textContent=isSiteFeature?'Site feature':p.ref || (p.layer==='np_wells'?p.id:p.bore_id?'VMS '+p.bore_id:p.layer==='property_features'?'Site infrastructure':p.id.replaceAll('_',' '));
   $('equipment-status').hidden=isSiteFeature;
   $('equipment-status').textContent=isProposed(f)?'Proposed research infrastructure':'Active research infrastructure';
   $('contact-role').textContent=p.contact?(p.role||'Contact / project lead'):'Contact / project lead';
   $('contact-name').textContent=p.contact||'Not yet listed';
   const contact=data.contacts[p.contact];const email=$('contact-email');email.hidden=!contact?.email;
   if(contact?.email){email.textContent=contact.email;email.href=`mailto:${contact.email}?subject=${encodeURIComponent('WFOLC: '+p.name)}`;}else{email.removeAttribute('href');email.textContent='';}
   const specs=$('equipment-specs');specs.replaceChildren();
   if(p.sensor_type)addSpec('Instrument',p.sensor_type);
   if(p.depth_m!=null)addSpec('Vertical depth',`${Number(p.depth_m.toFixed(2))} m`);
   if(p.depth_start_m!=null)addSpec('Vertical depth',`${Number(p.depth_start_m.toFixed(2))}–${Number(p.depth_end_m.toFixed(2))} m`);
   specs.hidden=!specs.childElementCount;
   $('equipment-panel').hidden=false;document.body.classList.add('equipment-open');
   selectionGroup.clearLayers();L.circleMarker(center(f),{radius:17,color:'#fffefa',weight:2,fillColor:'#e0bd55',fillOpacity:.22,interactive:false}).addTo(selectionGroup);
   markers.get(p.id)?.getElement()?.classList.add('selected');
   history.replaceState(null,'',`#asset=${encodeURIComponent(p.id)}`);
   announce(`${p.name}.${isSiteFeature?'':p.contact?' Contact: '+p.contact:' Contact not yet listed.'}`);
   if(focus)zoomEquipment(f);
  }
  function zoomEquipment(f){
   if(!f)return;
   const p=f.properties;const cat=category(f);
   if(cat in state.layers && !state.layers[cat]){state.layers[cat]=true;const input=document.querySelector(`[data-layer="${cat}"]`);if(input)input.checked=true;updateLayers();}
   const zoom=p.name==='Lake Dianne'?18.5:p.layer.startsWith('vms_')||p.layer==='np_wells'?22.5:20;
   const target=center(f);
   // Keep the selected marker above the contact card on compact screens.
   map.stop();map.setView(target,zoom,{animate:!reduced});
   if(innerWidth<=850){const shift=map.getSize().y*.20;map.panBy([0,shift],{animate:false});}
   else if(innerWidth>1000)map.panBy([160,0],{animate:false});
   map.once('moveend',()=>markers.get(p.id)?.getElement()?.classList.add('selected'));
  }
  for(const name of ['research_installations','property_features','np_wells','vms_borehole_heads','vms_ftdt_sensors','vms_vsp_samplers']){
   for(const f of collections[name].features){
    allFeatures.push(f);featuresById.set(f.properties.id,f);
    const marker=L.marker(center(f),{icon:makeIcon(f),title:f.properties.name,alt:f.properties.name,keyboard:true,riseOnHover:true});
    marker.bindTooltip(f.properties.name,{direction:'top',offset:[0,-9],opacity:1});
    marker.on('click',()=>selectFeature(f));markers.set(f.properties.id,marker);
   }
  }
  function updateFeatureLabels(){
   const zoom=map.getZoom(), size=map.getSize();
   const occupied=[];
   const mapRect=$('map').getBoundingClientRect();
   for(const id of ['map-key','equipment-panel','layers-panel']){
    const element=$(id);if(!element.hidden && getComputedStyle(element).visibility!=='hidden'){
     const r=element.getBoundingClientRect();occupied.push([r.left-mapRect.left-8,r.top-mapRect.top-8,r.right-mapRect.left+8,r.bottom-mapRect.top+8]);
    }
   }
   const controls=document.querySelector('.explore-controls').getBoundingClientRect();
   occupied.push([controls.left-mapRect.left-8,controls.top-mapRect.top-8,controls.right-mapRect.left+8,controls.bottom-mapRect.top+8]);
   const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');ctx.font='18px "Times New Roman",Times,serif';
   const priority=f=>f.properties.name==='Lake Dianne'?0:/^(Main Gate|WFOLC Temporary Office)$/.test(f.properties.name)?1:2;
   const features=allFeatures.filter(f=>category(f)==='facilities').sort((a,b)=>priority(a)-priority(b));
   for(const f of features){
    const marker=markers.get(f.properties.id);if(!marker)continue;
    const p=f.properties, water=p.name==='Lake Dianne', point=map.latLngToContainerPoint(center(f));
    const width=ctx.measureText(p.name).width+12, height=26;
    let permanent=false, direction='top',offset=[0,-9];
    if(state.layers.facilities && (water || zoom>=(priority(f)===1?17:19))){
     const candidates=water?[['center',0,0,-width/2,-height/2]]:[['right',10,0,16,-height/2],['left',-10,0,-width-16,-height/2],['top',0,-10,-width/2,-height-16],['bottom',0,10,-width/2,16]];
     for(const [dir,ox,oy,dx,dy]of candidates){
      const box=[point.x+dx,point.y+dy,point.x+dx+width,point.y+dy+height];
      const fits=box[0]>8&&box[1]>8&&box[2]<size.x-8&&box[3]<size.y-8;
      const collision=occupied.some(r=>box[0]<r[2]&&box[2]>r[0]&&box[1]<r[3]&&box[3]>r[1]);
      if(fits&&!collision){permanent=true;direction=dir;offset=[ox,oy];occupied.push([box[0]-5,box[1]-4,box[2]+5,box[3]+4]);break;}
     }
    }
    marker.unbindTooltip();
    marker.bindTooltip(p.name,{permanent,direction,offset,opacity:1,className:permanent?'feature-label'+(water?' water-label':''):''});
   }
  }
  for(const name of ['vms_sleeves','vms_fracture_samplers'])for(const f of collections[name].features){allFeatures.push(f);featuresById.set(f.properties.id,f);}
  L.geoJSON(collections.site_boundaries,{pane:'siteBoundary',interactive:false,style:{color:'#e4bf62',weight:2.5,fill:false,opacity:.95}}).addTo(map);
  for(const name of ['ranch_roads','public_road','trails','fences','waterways']){
   L.geoJSON(collections[name],{interactive:false,style:{color:name==='waterways'?'#5fb0d0':name==='public_road'?'#e3e3d9':name==='fences'?'#bac0ac':'#d8a27b',weight:name==='fences'?1:name==='waterways'?2.3:2.2,opacity:.9,dashArray:name==='trails'||name==='fences'?'5 5':null}}).addTo(accessGroup);
  }
  L.geoJSON(collections.contours_1m,{interactive:false,style:f=>({color:f.properties.index?'#f7dd91':'#fff4d4',weight:f.properties.index?1.1:.5,opacity:.75})}).addTo(contourGroup);
  showImages();fit('site');
  if(data.overview)map.setMaxBounds(data.overview.bounds);
  updateLayers();
  map.on('zoomend',()=>{
   updateFeatureLabels();
   vmsLineGroup.clearLayers();
   if(state.layers.vms && map.getZoom()>=19)L.geoJSON(collections.vms_sleeves,{style:{color:'#744884',weight:3},onEachFeature:bindLine}).addTo(vmsLineGroup);
   if(state.layers.sensors && map.getZoom()>=19)L.geoJSON(collections.vms_fracture_samplers,{style:{color:'#33869b',weight:6},onEachFeature:bindLine}).addTo(vmsLineGroup);
  });
  map.on('moveend resize',updateFeatureLabels);
  map.on('click',()=>{closeEquipment();$('search-results').hidden=true;});
  $('view-select').addEventListener('change',e=>{closeEquipment();fit(e.target.value);});
  document.querySelector('.identity').addEventListener('click',e=>{e.preventDefault();closeEquipment();fit('site');});
  document.querySelectorAll('[data-basemap]').forEach(button=>button.addEventListener('click',()=>{
   state.basemap=button.dataset.basemap;document.body.classList.toggle('terrain-map',state.basemap==='terrain');document.querySelectorAll('[data-basemap]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));showImages();
  }));
  $('layers-button').addEventListener('click',()=>{const open=$('layers-panel').hidden;$('layers-panel').hidden=!open;$('layers-button').setAttribute('aria-expanded',String(open));if(open){$('equipment-panel').hidden=true;document.body.classList.remove('equipment-open');}});
  $('close-layers').addEventListener('click',closeLayers);
  document.querySelectorAll('[data-layer]').forEach(input=>input.addEventListener('change',()=>{state.layers[input.dataset.layer]=input.checked;updateLayers();}));
  $('close-equipment').addEventListener('click',closeEquipment);
  $('zoom-equipment').addEventListener('click',()=>zoomEquipment(state.selected));
  $('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);announce('Equipment link copied.');$('copy-link').title='Link copied';setTimeout(()=>{$('copy-link').title='Copy equipment link';},1800);}catch{announce('Copy this page address to share the equipment.');}});
  function search(){
   const query=$('equipment-search').value.trim().toLowerCase();$('clear-search').hidden=!query;
   const list=$('search-results');list.replaceChildren();list.hidden=!query;if(!query)return;
   const found=allFeatures.filter(f=>[f.properties.name,f.properties.id,f.properties.contact,isProposed(f)?'proposed research infrastructure':category(f)==='facilities'?'site feature':'active research infrastructure'].some(value=>value?.toLowerCase().includes(query))).sort((a,b)=>a.properties.name.localeCompare(b.properties.name)).slice(0,25);
   if(!found.length){const p=document.createElement('p');p.className='search-empty';p.textContent='No matching equipment, places or contacts';list.append(p);return;}
   found.forEach(f=>{const p=f.properties;const button=document.createElement('button');button.type='button';button.className='search-result';const dot=document.createElement('span');dot.className=`key ${kind(f)==='well'?'well':kind(f)==='vms'?'bore':kind(f)==='facility'?'facility':kind(f)==='proposed'?'proposed':'research'}`;const text=document.createElement('span');text.textContent=p.name;const person=document.createElement('span');person.className='result-contact';person.textContent=category(f)==='facilities'?'Site feature':isProposed(f)?'Proposed research infrastructure':p.contact||'Contact not yet listed';text.append(person);button.append(dot,text);button.addEventListener('click',()=>selectFeature(f,{focus:true}));list.append(button);});
  }
  $('equipment-search').addEventListener('input',search);
  $('equipment-search').addEventListener('focus',search);
  $('equipment-search').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();$('search-results').querySelector('button')?.focus();}if(e.key==='Enter'){$('search-results').querySelector('button')?.click();}});
  $('clear-search').addEventListener('click',()=>{$('equipment-search').value='';search();$('equipment-search').focus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLayers();closeEquipment();$('search-results').hidden=true;}});
  const asset=new URLSearchParams(location.hash.slice(1)).get('asset');if(asset && featuresById.has(asset))selectFeature(featuresById.get(asset),{focus:true});
  load.hidden=true;
 } catch(error) {load.classList.add('error');load.textContent='The map could not load. Please refresh to try again.';console.error(error);}
})();
