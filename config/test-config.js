// export interface LokiDatasource {
//   id: string;
//   name: string;
//   url: string;
//   xOrgID?: string;
// }
const datasources = [
  { id: "default", name: "Direct", url: "http://localhost:3100/loki" },
  { id: "proxy", name: "Proxy", url: "https://localhost:3000/api/datasources/proxy/3/loki" },
];

export default datasources;
