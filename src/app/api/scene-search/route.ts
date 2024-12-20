import { DateRange } from "react-day-picker";

export type SceneSearchResponse = {
  data: { results: any[] };
  errorCode: string;
  errorMessage: string;
};

enum WRSFilterID {
  WRSPathFilterId = "5e83d14fb9436d88",
  WRSRowFilterId = "5e83d14ff1eda1b8",
}

// We need to capture the request to the USGS Scene-Search as a POST request and then refetch it as GET
// Since routes in Next.js can't use json bodies outside of POST methods.
export async function POST(request: Request) {
  const { 
    path, 
    row, 
    acquisitionDate, 
    cloudCover,
  }: {
    path: number,
    row: number,
    acquisitionDate: DateRange | undefined,
    cloudCover: number,
  } = await request.json();

  const url = (process.env.M2M_API_URL || "") + "/scene-search";
  const loginToken = request.headers.get("X-Auth-Token") || "";
  const body = {
    datasetName: "landsat_ot_c2_l2",
    maxResults: 10,
    metadataType: "full",
    sceneFilter: {
      metadataFilter: {
        filterType: "and",
        childFilters: [
          {
            filterId: WRSFilterID.WRSPathFilterId,
            filterType: "between",
            firstValue: path,
            secondValue: path,
          },
          {
            filterId: WRSFilterID.WRSRowFilterId,
            filterType: "between",
            firstValue: row,
            secondValue: row,
          },
        ],
      },
      // TODO: remove if we're going to get 100 scenes, and then let users filter afterwards (to just reduce API calls for scenes)
      cloudCoverFilter: {
        max: cloudCover || 100,
      },
      ...(acquisitionDate && {acquisitionFilter: { start: acquisitionDate.from!, ...(acquisitionDate.to && { end: acquisitionDate.to})}})
    },
  }

  console.log(`body = ${JSON.stringify(body)}`)
  
  // TODO: Add error handling

  return await fetch(url, {
    method: "POST",
    headers: {
      "X-Auth-Token": loginToken,
    },
    body: JSON.stringify(body),
  });
}
