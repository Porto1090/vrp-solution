import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;

    map.setView(center, 14, {
      animate: true
    });

  }, [center, map]);

  return null;
}