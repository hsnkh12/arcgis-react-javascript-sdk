import { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Locate from "@arcgis/core/widgets/Locate";
import Expand from "@arcgis/core/widgets/Expand";
import Legend from "@arcgis/core/widgets/Legend";
import LayerList from "@arcgis/core/widgets/LayerList";
import TimeSlider from "@arcgis/core/widgets/TimeSlider";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import TimeExtent from "@arcgis/core/TimeExtent";
import TimeIntereval from "@arcgis/core/TimeInterval";

const MapViewSection = (props: any) => {
  const { mapView, setMapView } = props;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [layerView, setLayerView] = useState<__esri.GeoJSONLayerView | null>(
    null
  );
  const [timeSlider, setTimeSlider] = useState<TimeSlider | null>(null);
  const [layer, setLayer] = useState<GeoJSONLayer | null>(null);

  const initMap = () => {
    if (!mapRef.current) return;

    const layer = new GeoJSONLayer({
      url: "https://bsvensson.github.io/various-tests/geojson/usgs-earthquakes-06182019.geojson",
      copyright: "USGS Earthquakes",
      title: "USGS Earthquakes",
      timeInfo: {
        startField: "time",
        interval: {
          unit: "days",
          value: 1,
        },
      },
      popupTemplate: {
        title: "{title}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "place",
                label: "Location",
                visible: true,
              },
              {
                fieldName: "mag",
                label: "Magnitude",
                visible: true,
              },
              {
                fieldName: "depth",
                label: "Depth",
                visible: true,
              },
            ],
          },
        ],
      },
    });

    const webMap = new Map({
      basemap: "dark-gray-vector",
      layers: [layer],
    });

    const viewInfo: __esri.MapViewProperties = {
      container: mapRef.current,
      map: webMap,
      center: [39, 34],
      zoom: 5,
      popup: {
        dockEnabled: true,
        dockOptions: {
          position: "top-right",
          breakpoint: false,
        },
      },
    };

    const view = new MapView(viewInfo);

    const timeSlider = new TimeSlider({
      container: "timeSlider",
      view: view,
      timeVisible: true,
      loop: true,
      playRate: 50,
      stops: {
        interval: new TimeIntereval({
          value: 1,
          unit: "hours",
        }),
      },
    });

    const locateWidget = new Locate({
      view,
      goToOverride: (view, options) => {
        options.target.scale = 1500;
        return view.goTo(options.target);
      },
    });
    const legend = new Legend({
      view,
    });
    const layerList = new LayerList({
      view,
    });

    view.ui.add(document.getElementById("custom-widget")!, "top-right");
    view.ui.add(timeSlider, "bottom-right");
    view.ui.add(locateWidget, "top-left");
    view.ui.add(
      new Expand({ view, content: legend, expandTooltip: "Expand Legend" }),
      "bottom-left"
    );
    view.ui.add(
      new Expand({
        view,
        content: layerList,
        expandTooltip: "Expand LayerList",
      }),
      "top-left"
    );

    view.when((v: MapView) => {
      setMapView(v);
      layer.when((l: GeoJSONLayer) => {
        setLayer(l);
      });
      v.whenLayerView(layer).then((layerView) => {
        setLayerView(layerView);
        setTimeSlider(timeSlider);
      });
    });
  };

  useEffect(() => {
    if (!timeSlider || !layer) return;
    const start = new Date(2019, 4, 25);
    timeSlider.fullTimeExtent = new TimeExtent({
      start,
      end: layer.timeInfo.fullTimeExtent.end,
    });
    let end = new Date(start);
    end.setDate(end.getDate() + 1);

    timeSlider.timeExtent = new TimeExtent({ start, end });

    timeSlider.watch("timeExtent", async (value) => {
      const date = new Date(timeSlider.timeExtent.end)
        .toISOString()
        .replace("T", " ")
        .replace("Z", "");
      layer.definitionExpression = "time <= Timestamp '" + date + "'";
    });
  }, [timeSlider]);

  useEffect(() => {
    initMap();

    return () => {
      mapView && mapView.destroy();
    };
  }, []);

  return (
    <div>
      <div
        className="mapDiv col-span-5"
        ref={mapRef}
        style={{ height: "100vh", width: "100%" }}
      ></div>
      <div id="custom-widget">{/* <CustomWidget mapView={mapView} /> */}</div>
    </div>
  );
};

export default MapViewSection;
