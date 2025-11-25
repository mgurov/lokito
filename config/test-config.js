const datasources = [
  { id: "default", alias: "Direct", url: "http://localhost:3100/loki" },
  { id: "proxy", url: "http://localhost:3000/api/datasources/proxy/3/loki" },
];

const features = {
  indexedDbAckPersistence: true
}

export default {datasources, features};
