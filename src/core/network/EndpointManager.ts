export interface NetworkEndpoint {
  id: string;
  name: string;
  url: string;
  region: string;
  type: 'dns' | 'cdn' | 'cloud';
}

export class EndpointManager {
  private static endpoints: NetworkEndpoint[] = [
    {
      id: 'cloudflare-dns',
      name: 'Cloudflare Edge (1.1.1.1)',
      url: 'https://1.1.1.1/cdn-cgi/trace',
      region: 'Global Anycast',
      type: 'dns'
    },
    {
      id: 'google-public',
      name: 'Google Services Gateway',
      url: 'https://www.google.com/generate_204',
      region: 'Global Anycast',
      type: 'cloud'
    },
    {
      id: 'fastly-cdn',
      name: 'Fastly CDN Edge',
      url: 'https://cdn.jsdelivr.net/favicon.ico',
      region: 'Global Edge',
      type: 'cdn'
    },
    {
      id: 'github-cdn',
      name: 'GitHub Static CDN',
      url: 'https://github.githubassets.com/favicons/favicon.png',
      region: 'Global Anycast',
      type: 'cdn'
    }
  ];

  public static getEndpoints(): NetworkEndpoint[] {
    return [...this.endpoints];
  }
}
