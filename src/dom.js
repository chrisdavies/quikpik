/**
 * Determine if x is an object of html attributes. (e.g. { class: 'foo', onclick: () => {} })
 */
function isAttr(x) {
  return (
    x &&
    typeof x === 'object' &&
    !Array.isArray(x) &&
    !(x instanceof NodeList) &&
    !(x instanceof Node) &&
    !(x.el instanceof Node)
  );
}

/**
 * Determine if the node is iterable.
 */
function isIterable(x) {
  return !!x.forEach;
}

/**
 * Add an event listener to the element / event-source.
 * @param {*} el
 * @param {string} type
 * @param {function} fn
 * @param {*} opts
 * @returns {() => void} the dispose / removeEventListener function
 */
export function on(el, type, fn, opts) {
  el.addEventListener(type, fn, opts);
  return () => el.removeEventListener(type, fn, opts);
}

/**
 * Create an element from raw HTML.
 * @param {string} html
 */
export function raw(html) {
  return h('div', { innerHTML: html }).firstChild;
}

/**
 * Create an HTMLElement.
 * @param {string} tag the tag name
 * @param  {...any} args attributes, children, etc
 * @returns {HTMLElement}
 */
export function h(tag, ...args) {
  const pieces = tag.split('.');
  const tagName = pieces[0];
  const classes = pieces.slice(1);
  const el =
    tagName === 'svg'
      ? document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      : document.createElement(tagName || 'div');
  if (tagName === 'svg') {
    el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  const arg0 = args[0];
  const attrs = isAttr(arg0) && arg0;
  if (classes.length) {
    el.className = classes.join(' ');
  }
  assignAttrs(attrs, el);
  appendChildren(attrs ? args.slice(1) : args, el);
  return el;
}

/**
 * Assign the specified attributes to the element.
 * @param {object} attrs
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
export function assignAttrs(attrs, el) {
  if (el && attrs) {
    Object.keys(attrs).forEach((k) => {
      const val = attrs[k];
      if (k === 'class' || k === 'className') {
        const classes = val && val.split(' ');
        classes && classes.length && el.classList.add(...classes);
      } else if (
        k === 'innerHTML' ||
        k === 'textContent' ||
        typeof val === 'function' ||
        k.startsWith('$')
      ) {
        el[k] = val;
      } else if (val !== false && val !== undefined && val !== null) {
        el.setAttribute(k, val);
      }
    });
  }
  return el;
}

/**
 * Append the specified child / children to the specified element.
 * @param {*} children
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
export function appendChildren(children, el) {
  el.appendChild(toFragment(children));
  return el;
}

/**
 * Convert the children to a document fragment.
 * @param {*} children
 * @param {DocumentFragment | undefined} [frag]
 * @returns {DocumentFragment}
 */
export function toFragment(children, frag) {
  frag ||= document.createDocumentFragment();
  if (children instanceof Node || typeof children === 'string') {
    return appendChild(children, frag);
  } else if (isIterable(children)) {
    Array.from(children).forEach((n) => n && toFragment(n, frag));
  }
  return frag;
}

/**
 * Append the child to the element.
 * @param {*} child
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
function appendChild(child, el) {
  if (!child) {
    return el;
  }
  const node = typeof child === 'string' ? document.createTextNode(child) : child;
  if (el instanceof Range) {
    el.insertNode(node);
    el.collapse();
  } else if (el instanceof Node) {
    el.appendChild(node);
  }
  return el;
}
