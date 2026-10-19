import axios from "axios";
import https from "node:https";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";

// Use public DNS (Google/Cloudflare) to prevent ISP DNS poisoning/blocking of TMDB API
const resolver = new dnsPromises.Resolver();
try {
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Fall back to default
}

const httpsAgent = new https.Agent({
  lookup: (hostname, options, callback) => {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    resolver.resolve4(hostname).then((addresses) => {
      if (addresses && addresses.length > 0) {
        if (options.all) {
          return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
        }
        return callback(null, addresses[0], 4);
      }
      dns.lookup(hostname, options, callback);
    }).catch(() => {
      dns.lookup(hostname, options, callback);
    });
  }
});

export const tmdbClient = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  timeout: 10000,
  httpsAgent,
  headers: {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`
  }
});
