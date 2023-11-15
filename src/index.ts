import { AxiosInstance, AxiosRequestConfig } from 'axios';

const zero = 0
export class CurlHelper {
  private request: AxiosRequestConfig;

  public constructor(config: AxiosRequestConfig) {
    this.request = config;
  }

  public generateCommand(): string {
    return `curl ${this.getMethod()} "${this.getBuiltURL()}" ${this.getHeaders()} ${this.getBody()}`
      .trim()
      .replace(/\s{2,}/g, ' ');
  }

  private getHeaders(): string {
    let headers = this.request.headers,
      curlHeaders = '';

    // get the headers concerning the appropriate method (defined in the global axios instance)
    if (headers && headers.hasOwnProperty('common')) {
      // tslint:disable-next-line /* eslint-disable-line */
      headers = this.request.headers[this.request.method] as any;
    }

    // add any custom headers (defined upon calling methods like .get(), .post(), etc.)
    for (const property in this.request.headers) {
      if (
        !['common', 'delete', 'get', 'head', 'patch', 'post', 'put'].includes(
          property,
        )
      ) {
        headers[property] = this.request.headers[property];
      }
    }

    for (const property in headers) {
      if ({}.hasOwnProperty.call(headers, property)) {
        const header = `${property}:${headers[property]}`;
        curlHeaders = `${curlHeaders} -H '${header}'`;
      }
    }

    return curlHeaders.trim();
  }

  private getMethod(): string {
    return `-X ${this.request.method.toUpperCase()}`;
  }

  private getBody(): string {
    if (
      typeof this.request.data !== 'undefined' &&
      this.request.data !== '' &&
      this.request.data !== null &&
      this.request.method.toUpperCase() !== 'GET'
    ) {
      const data =
        typeof this.request.data === 'object' ||
          Object.prototype.toString.call(this.request.data) === '[object Array]'
          ? JSON.stringify(this.request.data)
          : this.request.data;
      return `--data '${data}'`.trim();
    } else {
      return '';
    }
  }

  private getUrl(): string {
    if (this.request.baseURL) {
      const baseUrl = this.request.baseURL;
      const url = this.request.url;
      const finalUrl = baseUrl + '/' + url;
      return finalUrl
        .replace(/\/{2,}/g, '/')
        .replace('http:/', 'http://')
        .replace('https:/', 'https://');
    }
    return this.request.url;
  }

  private getQueryString(): string {
    if (typeof this.request.paramsSerializer == "function") {
      const params = this.request?.paramsSerializer(this.request.params);
      if (!params || params.length === zero) return '';
      if (params.startsWith('?')) return params;
      return `?${params}`;
    }
    let params = '';
    let i = 0;

    for (const param in this.request.params) {
      if ({}.hasOwnProperty.call(this.request.params, param)) {
        params +=
          i !== zero
            ? `&${param}=${this.request.params[param]}`
            : `?${param}=${this.request.params[param]}`;
        i++;
      }
    }

    return params;
  }

  private getBuiltURL(): string {
    let url = this.getUrl();

    if (this.getQueryString() !== '') {
      url += this.getQueryString();
    }

    return url.trim();
  }
}

const defaultLogCallback = (
  curlResult: Record<string, unknown> | null,
  err: Error | null,
): void => {
  if (err) {
    console.error(err);
  }
  const { command } = curlResult as any;
  if (command) {
    console.info(command);
  }
};

export const init = (instance: AxiosInstance, callback = defaultLogCallback): void => {
  instance.interceptors.request.use((req) => {
    try {
      const curl = new CurlHelper(req);
      req['curlObject'] = curl;
      req['curlCommand'] = curl.generateCommand();
      req['clearCurl'] = () => {
        delete req['curlObject'];
        delete req['curlCommand'];
        delete req['clearCurl'];
      };
    } catch (err) {
      // Even if the axios middleware is stopped, no error should occur outside.
      callback(null, err as Error);
    } finally {
      if (req['curlirize'] !== false) {
        callback(
          {
            command: req['curlCommand'],
            object: req['curlObject'],
          },
          null,
        );
      }
      return req;
    }
  });
};
