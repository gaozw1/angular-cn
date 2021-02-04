/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {convertToParamMap, ParamMap, Params, PRIMARY_OUTLET} from './shared';
import {equalArraysOrString, forEach, shallowEqual} from './utils/collection';

export function createEmptyUrlTree() {
  return new UrlTree(new UrlSegmentGroup([], {}), {}, null);
}

export function containsTree(container: UrlTree, containee: UrlTree, exact: boolean): boolean {
  if (exact) {
    return equalQueryParams(container.queryParams, containee.queryParams) &&
        equalSegmentGroups(container.root, containee.root);
  }

  return containsQueryParams(container.queryParams, containee.queryParams) &&
      containsSegmentGroup(container.root, containee.root);
}

function equalQueryParams(container: Params, containee: Params): boolean {
  // TODO: This does not handle array params correctly.
  return shallowEqual(container, containee);
}

function equalSegmentGroups(container: UrlSegmentGroup, containee: UrlSegmentGroup): boolean {
  if (!equalPath(container.segments, containee.segments)) return false;
  if (container.numberOfChildren !== containee.numberOfChildren) return false;
  for (const c in containee.children) {
    if (!container.children[c]) return false;
    if (!equalSegmentGroups(container.children[c], containee.children[c])) return false;
  }
  return true;
}

function containsQueryParams(container: Params, containee: Params): boolean {
  return Object.keys(containee).length <= Object.keys(container).length &&
      Object.keys(containee).every(key => equalArraysOrString(container[key], containee[key]));
}

function containsSegmentGroup(container: UrlSegmentGroup, containee: UrlSegmentGroup): boolean {
  return containsSegmentGroupHelper(container, containee, containee.segments);
}

function containsSegmentGroupHelper(
    container: UrlSegmentGroup, containee: UrlSegmentGroup, containeePaths: UrlSegment[]): boolean {
  if (container.segments.length > containeePaths.length) {
    const current = container.segments.slice(0, containeePaths.length);
    if (!equalPath(current, containeePaths)) return false;
    if (containee.hasChildren()) return false;
    return true;

  } else if (container.segments.length === containeePaths.length) {
    if (!equalPath(container.segments, containeePaths)) return false;
    for (const c in containee.children) {
      if (!container.children[c]) return false;
      if (!containsSegmentGroup(container.children[c], containee.children[c])) return false;
    }
    return true;

  } else {
    const current = containeePaths.slice(0, container.segments.length);
    const next = containeePaths.slice(container.segments.length);
    if (!equalPath(container.segments, current)) return false;
    if (!container.children[PRIMARY_OUTLET]) return false;
    return containsSegmentGroupHelper(container.children[PRIMARY_OUTLET], containee, next);
  }
}

/**
 * @description
 *
 * Represents the parsed URL.
 *
 * 代表已解析的 URL。
 *
 * Since a router state is a tree, and the URL is nothing but a serialized state, the URL is a
 * serialized tree.
 * UrlTree is a data structure that provides a lot of affordances in dealing with URLs
 *
 * 由于路由器状态是一棵树，而 URL 只是序列化的状态，所以 URL 就是序列化的树。 UrlTree 是一种数据结构，在处理 URL 时提供了很多便利
 *
 * @usageNotes
 *
 * ### Example
 *
 * ### 例子
 *
 * ```
 *
 * ```
 * @Component ({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const tree: UrlTree =
 *       router.parseUrl('/team/33/(user/victor//support:help)?debug=true#fragment');
 *     const f = tree.fragment; // return 'fragment'
 *     const q = tree.queryParams; // returns {debug: 'true'}
 *     const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
 *     const s: UrlSegment[] = g.segments; // returns 2 segments 'team' and '33'
 *     g.children[PRIMARY_OUTLET].segments; // returns 2 segments 'user' and 'victor'
 *     g.children['support'].segments; // return 1 segment 'help'
 *   }
 * }
 * ```
 * @publicApi
 */
export class UrlTree {
  /** @internal */
  // TODO(issue/24571): remove '!'.
  _queryParamMap!: ParamMap;

  /** @internal */
  constructor(
      /** The root segment group of the URL tree */
      public root: UrlSegmentGroup,
      /** The query params of the URL */
      public queryParams: Params,
      /** The fragment of the URL */
      public fragment: string|null) {}

  get queryParamMap(): ParamMap {
    if (!this._queryParamMap) {
      this._queryParamMap = convertToParamMap(this.queryParams);
    }
    return this._queryParamMap;
  }

  /** @docsNotRequired */
  toString(): string {
    return DEFAULT_SERIALIZER.serialize(this);
  }
}

/**
 * @description
 *
 * Represents the parsed URL segment group.
 *
 * 表示已解析的 URL 段组。
 *
 * See `UrlTree` for more information.
 *
 * 有关更多信息，请参见 `UrlTree`
 *
 * @publicApi
 */
export class UrlSegmentGroup {
  /** @internal */
  // TODO(issue/24571): remove '!'.
  _sourceSegment!: UrlSegmentGroup;
  /** @internal */
  // TODO(issue/24571): remove '!'.
  _segmentIndexShift!: number;
  /**
   * The parent node in the url tree
   *
   * 网址树中的父节点
   *
   */
  parent: UrlSegmentGroup|null = null;

  constructor(
      /** The URL segments of this group. See `UrlSegment` for more information */
      public segments: UrlSegment[],
      /** The list of children of this group */
      public children: {[key: string]: UrlSegmentGroup}) {
    forEach(children, (v: any, k: any) => v.parent = this);
  }

  /**
   * Whether the segment has child segments
   *
   * 该网址段是否有子段
   *
   */
  hasChildren(): boolean {
    return this.numberOfChildren > 0;
  }

  /**
   * Number of child segments
   *
   * 子段数
   *
   */
  get numberOfChildren(): number {
    return Object.keys(this.children).length;
  }

  /** @docsNotRequired */
  toString(): string {
    return serializePaths(this);
  }
}


/**
 * @description
 *
 * Represents a single URL segment.
 *
 * 表示一个 URL 段。
 *
 * A UrlSegment is a part of a URL between the two slashes. It contains a path and the matrix
 * parameters associated with the segment.
 *
 * UrlSegment 是两个斜杠之间的 URL 的一部分。它包含路径和与该段关联的矩阵参数。
 * @usageNotes
 *
 * ### Example
 *
 * ### 例子
 *
 * ```
 *
 * ```
 * @Component ({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const tree: UrlTree = router.parseUrl('/team;id=33');
 *     const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
 *     const s: UrlSegment[] = g.segments;
 *     s[0].path; // returns 'team'
 *     s[0].parameters; // returns {id: 33}
 *   }
 * }
 * ```
 * @publicApi
 */
export class UrlSegment {
  /** @internal */
  // TODO(issue/24571): remove '!'.
  _parameterMap!: ParamMap;

  constructor(
      /** The path part of a URL segment */
      public path: string,

      /** The matrix parameters associated with a segment */
      public parameters: {[name: string]: string}) {}

  get parameterMap() {
    if (!this._parameterMap) {
      this._parameterMap = convertToParamMap(this.parameters);
    }
    return this._parameterMap;
  }

  /** @docsNotRequired */
  toString(): string {
    return serializePath(this);
  }
}

export function equalSegments(as: UrlSegment[], bs: UrlSegment[]): boolean {
  return equalPath(as, bs) && as.every((a, i) => shallowEqual(a.parameters, bs[i].parameters));
}

export function equalPath(as: UrlSegment[], bs: UrlSegment[]): boolean {
  if (as.length !== bs.length) return false;
  return as.every((a, i) => a.path === bs[i].path);
}

export function mapChildrenIntoArray<T>(
    segment: UrlSegmentGroup, fn: (v: UrlSegmentGroup, k: string) => T[]): T[] {
  let res: T[] = [];
  forEach(segment.children, (child: UrlSegmentGroup, childOutlet: string) => {
    if (childOutlet === PRIMARY_OUTLET) {
      res = res.concat(fn(child, childOutlet));
    }
  });
  forEach(segment.children, (child: UrlSegmentGroup, childOutlet: string) => {
    if (childOutlet !== PRIMARY_OUTLET) {
      res = res.concat(fn(child, childOutlet));
    }
  });
  return res;
}


/**
 * @description
 *
 * Serializes and deserializes a URL string into a URL tree.
 *
 * 将 URL 字符串序列化和反序列化为 URL 树。
 *
 * The url serialization strategy is customizable. You can
 * make all URLs case insensitive by providing a custom UrlSerializer.
 *
 * url 序列化策略是可定制的。通过提供自定义 UrlSerializer，可以使所有 URL 都不区分大小写。
 *
 * See `DefaultUrlSerializer` for an example of a URL serializer.
 *
 * 有关 URL 序列化程序的示例，请参见 `DefaultUrlSerializer`
 *
 * @publicApi
 */
export abstract class UrlSerializer {
  /**
   * Parse a url into a `UrlTree`
   *
   * 将网址解析为 `UrlTree`
   *
   */
  abstract parse(url: string): UrlTree;

  /**
   * Converts a `UrlTree` into a url
   *
   * 将 `UrlTree` 转换为 url
   *
   */
  abstract serialize(tree: UrlTree): string;
}

/**
 * @description
 *
 * A default implementation of the `UrlSerializer`.
 *
 * `UrlSerializer` 的默认实现。
 *
 * Example URLs:
 *
 * 范例网址：
 *
 * ```
 * /inbox/33(popup:compose)
 * /inbox/33;open=true/messages/44
 * ```
 *
 * DefaultUrlSerializer uses parentheses to serialize secondary segments (e.g., popup:compose), the
 * colon syntax to specify the outlet, and the ';parameter=value' syntax (e.g., open=true) to
 * specify route specific parameters.
 *
 * DefaultUrlSerializer 使用圆括号序列化辅助段（例如，popup:compose），使用冒号语法指定出口，并使用';parameter=value' 语法（例如 open=true）来指定路由的特有参数。
 *
 * @publicApi
 */
export class DefaultUrlSerializer implements UrlSerializer {
  /**
   * Parses a url into a `UrlTree`
   *
   * 将网址解析为 `UrlTree`
   *
   */
  parse(url: string): UrlTree {
    const p = new UrlParser(url);
    return new UrlTree(p.parseRootSegment(), p.parseQueryParams(), p.parseFragment());
  }

  /**
   * Converts a `UrlTree` into a url
   *
   * 将 `UrlTree` 转换为 url
   *
   */
  serialize(tree: UrlTree): string {
    const segment = `/${serializeSegment(tree.root, true)}`;
    const query = serializeQueryParams(tree.queryParams);
    const fragment =
        typeof tree.fragment === `string` ? `#${encodeUriFragment(tree.fragment!)}` : '';

    return `${segment}${query}${fragment}`;
  }
}

const DEFAULT_SERIALIZER = new DefaultUrlSerializer();

export function serializePaths(segment: UrlSegmentGroup): string {
  return segment.segments.map(p => serializePath(p)).join('/');
}

function serializeSegment(segment: UrlSegmentGroup, root: boolean): string {
  if (!segment.hasChildren()) {
    return serializePaths(segment);
  }

  if (root) {
    const primary = segment.children[PRIMARY_OUTLET] ?
        serializeSegment(segment.children[PRIMARY_OUTLET], false) :
        '';
    const children: string[] = [];

    forEach(segment.children, (v: UrlSegmentGroup, k: string) => {
      if (k !== PRIMARY_OUTLET) {
        children.push(`${k}:${serializeSegment(v, false)}`);
      }
    });

    return children.length > 0 ? `${primary}(${children.join('//')})` : primary;

  } else {
    const children = mapChildrenIntoArray(segment, (v: UrlSegmentGroup, k: string) => {
      if (k === PRIMARY_OUTLET) {
        return [serializeSegment(segment.children[PRIMARY_OUTLET], false)];
      }

      return [`${k}:${serializeSegment(v, false)}`];
    });

    // use no parenthesis if the only child is a primary outlet route
    if (Object.keys(segment.children).length === 1 && segment.children[PRIMARY_OUTLET] != null) {
      return `${serializePaths(segment)}/${children[0]}`;
    }

    return `${serializePaths(segment)}/(${children.join('//')})`;
  }
}

/**
 * Encodes a URI string with the default encoding. This function will only ever be called from
 * `encodeUriQuery` or `encodeUriSegment` as it's the base set of encodings to be used. We need
 * a custom encoding because encodeURIComponent is too aggressive and encodes stuff that doesn't
 * have to be encoded per https://url.spec.whatwg.org.
 */
function encodeUriString(s: string): string {
  return encodeURIComponent(s)
      .replace(/%40/g, '@')
      .replace(/%3A/gi, ':')
      .replace(/%24/g, '$')
      .replace(/%2C/gi, ',');
}

/**
 * This function should be used to encode both keys and values in a query string key/value. In
 * the following URL, you need to call encodeUriQuery on "k" and "v":
 *
 * http://www.site.org/html;mk=mv?k=v#f
 */
export function encodeUriQuery(s: string): string {
  return encodeUriString(s).replace(/%3B/gi, ';');
}

/**
 * This function should be used to encode a URL fragment. In the following URL, you need to call
 * encodeUriFragment on "f":
 *
 * http://www.site.org/html;mk=mv?k=v#f
 */
export function encodeUriFragment(s: string): string {
  return encodeURI(s);
}

/**
 * This function should be run on any URI segment as well as the key and value in a key/value
 * pair for matrix params. In the following URL, you need to call encodeUriSegment on "html",
 * "mk", and "mv":
 *
 * http://www.site.org/html;mk=mv?k=v#f
 */
export function encodeUriSegment(s: string): string {
  return encodeUriString(s).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/%26/gi, '&');
}

export function decode(s: string): string {
  return decodeURIComponent(s);
}

// Query keys/values should have the "+" replaced first, as "+" in a query string is " ".
// decodeURIComponent function will not decode "+" as a space.
export function decodeQuery(s: string): string {
  return decode(s.replace(/\+/g, '%20'));
}

export function serializePath(path: UrlSegment): string {
  return `${encodeUriSegment(path.path)}${serializeMatrixParams(path.parameters)}`;
}

function serializeMatrixParams(params: {[key: string]: string}): string {
  return Object.keys(params)
      .map(key => `;${encodeUriSegment(key)}=${encodeUriSegment(params[key])}`)
      .join('');
}

function serializeQueryParams(params: {[key: string]: any}): string {
  const strParams: string[] = Object.keys(params).map((name) => {
    const value = params[name];
    return Array.isArray(value) ?
        value.map(v => `${encodeUriQuery(name)}=${encodeUriQuery(v)}`).join('&') :
        `${encodeUriQuery(name)}=${encodeUriQuery(value)}`;
  });

  return strParams.length ? `?${strParams.join('&')}` : '';
}

const SEGMENT_RE = /^[^\/()?;=#]+/;
function matchSegments(str: string): string {
  const match = str.match(SEGMENT_RE);
  return match ? match[0] : '';
}

const QUERY_PARAM_RE = /^[^=?&#]+/;
// Return the name of the query param at the start of the string or an empty string
function matchQueryParams(str: string): string {
  const match = str.match(QUERY_PARAM_RE);
  return match ? match[0] : '';
}

const QUERY_PARAM_VALUE_RE = /^[^?&#]+/;
// Return the value of the query param at the start of the string or an empty string
function matchUrlQueryParamValue(str: string): string {
  const match = str.match(QUERY_PARAM_VALUE_RE);
  return match ? match[0] : '';
}

class UrlParser {
  private remaining: string;

  constructor(private url: string) {
    this.remaining = url;
  }

  parseRootSegment(): UrlSegmentGroup {
    this.consumeOptional('/');

    if (this.remaining === '' || this.peekStartsWith('?') || this.peekStartsWith('#')) {
      return new UrlSegmentGroup([], {});
    }

    // The root segment group never has segments
    return new UrlSegmentGroup([], this.parseChildren());
  }

  parseQueryParams(): Params {
    const params: Params = {};
    if (this.consumeOptional('?')) {
      do {
        this.parseQueryParam(params);
      } while (this.consumeOptional('&'));
    }
    return params;
  }

  parseFragment(): string|null {
    return this.consumeOptional('#') ? decodeURIComponent(this.remaining) : null;
  }

  private parseChildren(): {[outlet: string]: UrlSegmentGroup} {
    if (this.remaining === '') {
      return {};
    }

    this.consumeOptional('/');

    const segments: UrlSegment[] = [];
    if (!this.peekStartsWith('(')) {
      segments.push(this.parseSegment());
    }

    while (this.peekStartsWith('/') && !this.peekStartsWith('//') && !this.peekStartsWith('/(')) {
      this.capture('/');
      segments.push(this.parseSegment());
    }

    let children: {[outlet: string]: UrlSegmentGroup} = {};
    if (this.peekStartsWith('/(')) {
      this.capture('/');
      children = this.parseParens(true);
    }

    let res: {[outlet: string]: UrlSegmentGroup} = {};
    if (this.peekStartsWith('(')) {
      res = this.parseParens(false);
    }

    if (segments.length > 0 || Object.keys(children).length > 0) {
      res[PRIMARY_OUTLET] = new UrlSegmentGroup(segments, children);
    }

    return res;
  }

  // parse a segment with its matrix parameters
  // ie `name;k1=v1;k2`
  private parseSegment(): UrlSegment {
    const path = matchSegments(this.remaining);
    if (path === '' && this.peekStartsWith(';')) {
      throw new Error(`Empty path url segment cannot have parameters: '${this.remaining}'.`);
    }

    this.capture(path);
    return new UrlSegment(decode(path), this.parseMatrixParams());
  }

  private parseMatrixParams(): {[key: string]: any} {
    const params: {[key: string]: any} = {};
    while (this.consumeOptional(';')) {
      this.parseParam(params);
    }
    return params;
  }

  private parseParam(params: {[key: string]: any}): void {
    const key = matchSegments(this.remaining);
    if (!key) {
      return;
    }
    this.capture(key);
    let value: any = '';
    if (this.consumeOptional('=')) {
      const valueMatch = matchSegments(this.remaining);
      if (valueMatch) {
        value = valueMatch;
        this.capture(value);
      }
    }

    params[decode(key)] = decode(value);
  }

  // Parse a single query parameter `name[=value]`
  private parseQueryParam(params: Params): void {
    const key = matchQueryParams(this.remaining);
    if (!key) {
      return;
    }
    this.capture(key);
    let value: any = '';
    if (this.consumeOptional('=')) {
      const valueMatch = matchUrlQueryParamValue(this.remaining);
      if (valueMatch) {
        value = valueMatch;
        this.capture(value);
      }
    }

    const decodedKey = decodeQuery(key);
    const decodedVal = decodeQuery(value);

    if (params.hasOwnProperty(decodedKey)) {
      // Append to existing values
      let currentVal = params[decodedKey];
      if (!Array.isArray(currentVal)) {
        currentVal = [currentVal];
        params[decodedKey] = currentVal;
      }
      currentVal.push(decodedVal);
    } else {
      // Create a new value
      params[decodedKey] = decodedVal;
    }
  }

  // parse `(a/b//outlet_name:c/d)`
  private parseParens(allowPrimary: boolean): {[outlet: string]: UrlSegmentGroup} {
    const segments: {[key: string]: UrlSegmentGroup} = {};
    this.capture('(');

    while (!this.consumeOptional(')') && this.remaining.length > 0) {
      const path = matchSegments(this.remaining);

      const next = this.remaining[path.length];

      // if is is not one of these characters, then the segment was unescaped
      // or the group was not closed
      if (next !== '/' && next !== ')' && next !== ';') {
        throw new Error(`Cannot parse url '${this.url}'`);
      }

      let outletName: string = undefined!;
      if (path.indexOf(':') > -1) {
        outletName = path.substr(0, path.indexOf(':'));
        this.capture(outletName);
        this.capture(':');
      } else if (allowPrimary) {
        outletName = PRIMARY_OUTLET;
      }

      const children = this.parseChildren();
      segments[outletName] = Object.keys(children).length === 1 ? children[PRIMARY_OUTLET] :
                                                                  new UrlSegmentGroup([], children);
      this.consumeOptional('//');
    }

    return segments;
  }

  private peekStartsWith(str: string): boolean {
    return this.remaining.startsWith(str);
  }

  // Consumes the prefix when it is present and returns whether it has been consumed
  private consumeOptional(str: string): boolean {
    if (this.peekStartsWith(str)) {
      this.remaining = this.remaining.substring(str.length);
      return true;
    }
    return false;
  }

  private capture(str: string): void {
    if (!this.consumeOptional(str)) {
      throw new Error(`Expected "${str}".`);
    }
  }
}
