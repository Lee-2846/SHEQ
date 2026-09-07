import { useEffect, useState } from "react";
import { getReports } from "../services/reportService";

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getReports().then(data => {
      if (active) {
        setReports(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return { reports, setReports, loading };
}
