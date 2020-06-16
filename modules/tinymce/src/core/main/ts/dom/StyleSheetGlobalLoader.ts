import { Attr, DomEvent, Element, Insert, ShadowDom, Traverse } from '@ephox/sugar';
import { Document as DomDocument, document, ShadowRoot } from '@ephox/dom-globals';
import { Result, LazyValue, Obj, LazyValues, Arr, Option, Cell } from '@ephox/katamari';
import { ReferrerPolicy } from '../api/SettingsTypes';
import Tools from '../api/util/Tools';

type RootNode = ShadowDom.RootNode;

// Since this is intended to be global, it needs to be mutable
export interface StyleSheetGlobalLoader {
  readonly load: (rootNode: RootNode, url: string, contentCssCors: boolean) => LazyValue<Result<string, string>>;
  readonly loadAll: (root: RootNode, urls: string[], contentCssCors: boolean) => LazyValue<Array<Result<string, string>>>;
  readonly maxLoadTime: Cell<number>;
  readonly referrerPolicy: Cell<Option<ReferrerPolicy>>;
}

const createLinkTag = (doc: Element<DomDocument>, url: string, onload: () => void, onerror: () => void, referrerPolicy: Option<ReferrerPolicy>, contentCssCors: boolean) => {
  const link = Element.fromTag('link', doc.dom());
  Attr.setAll(link, {
    rel: 'stylesheet',
    type: 'text/css',
    href: url,
    async: false,
    defer: false
  });
  referrerPolicy.each((rp) => {
    // Note: Don't use link.referrerPolicy = ... here as it doesn't work on Safari
    Attr.set(link, 'referrerpolicy', rp);
  });
  if (contentCssCors) {
    Attr.set(link, 'crossOrigin', 'anonymous');
  }

  DomEvent.bind(link, 'load', onload);
  DomEvent.bind(link, 'error', onerror);
  return link;
};

const rawLoad = (
  root: RootNode,
  url: string,
  maxLoadTime: number,
  referrerPolicy: Option<ReferrerPolicy>,
  contentCssCors: boolean
): LazyValue<Result<string, string>> => {
  const lv: LazyValue<Option<Result<string, string>>> = LazyValues.withTimeout((completer) => {
    // TODO: would it be better to return errors, rather than the URL?
    const doc = Traverse.documentOrOwner(root);
    const onload = () => {
      completer(Result.value(url));
    };
    const onerror = () => {
      completer(Result.error(url));
    };
    const link = createLinkTag(doc, url, onload, onerror, referrerPolicy, contentCssCors);
    Insert.append(ShadowDom.getStyleContainer(root), link);
  }, maxLoadTime);
  return lv.map((or) => or.getOrThunk(() => Result.error(url)));
};

export const create = (): StyleSheetGlobalLoader => {

  const maxLoadTime = Cell<number>(5000);
  const referrerPolicy = Cell<Option<ReferrerPolicy>>(Option.none());

  type Rec = Record<string, LazyValue<Result<string, string>>>;
  const registry: WeakMap<DomDocument | ShadowRoot, Rec> = new WeakMap();
  registry.set(document, {});

  const load = (root: RootNode, url: string, contentCssCors: boolean): LazyValue<Result<string, string>> => {

    // TODO: would be nice if this could be a Cell
    const finalUrl = Tools._addCacheSuffix(url);

    const rec: Rec = Option.from(registry.get(root.dom())).getOrThunk(() => {
      const r: Rec = {};
      registry.set(root.dom(), r);
      return r;
    });

    return Obj.get(rec, finalUrl).getOrThunk(() => {
      const lv = rawLoad(root, finalUrl, maxLoadTime.get(), referrerPolicy.get(), contentCssCors);
      rec[finalUrl] = lv;
      return lv;
    });
  };

  // TODO: do we need to turn this into a LazyValue<Result<Array<string>, string>?
  const loadAll = (root: RootNode, urls: string[], contentCssCors: boolean): LazyValue<Array<Result<string, string>>> =>
    LazyValues.par(Arr.map(urls, (url) => load(root, url, contentCssCors)));

  return {
    load,
    loadAll,
    maxLoadTime,
    referrerPolicy
  };
};

export const instance = create();
